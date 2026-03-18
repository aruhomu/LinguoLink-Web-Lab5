const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Firebase Admin Setup - Universal (Environment Variable or Local File)
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log("Firebase initialized via Environment Variable.");
  } catch (err) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT env var:", err);
  }
}

if (!serviceAccount) {
  try {
    serviceAccount = require('./serviceAccountKey.json');
    console.log("Firebase initialized via local serviceAccountKey.json.");
  } catch (err) {
    console.error("Local serviceAccountKey.json not found or invalid. Firebase may fail to initialize if env var is also missing.");
  }
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  console.error("Critical: No Firebase service account credentials found. Server will not function correctly.");
}

const db = admin.firestore();

// Middleware to verify Firebase ID Token
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Routes

/**
 * GET /api/user-stats/:uid
 * Fetches user statistics from Firestore.
 */
app.get('/api/user-stats/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const statsRef = db.collection('user_stats').doc(uid);
    const doc = await statsRef.get();
    
    if (!doc.exists) {
      return res.json({ lastScore: null, totalQuestions: 0 });
    }
    
    res.json(doc.data());
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

/**
 * POST /api/user-stats
 * Saves user test results.
 */
app.post('/api/user-stats', verifyToken, async (req, res) => {
  try {
    const { uid, lastScore, totalQuestions } = req.body;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });

    // Security check: ensure uid matches token
    if (req.user.uid !== uid) {
      return res.status(403).json({ error: 'Forbidden: UID mismatch' });
    }

    const statsRef = db.collection('user_stats').doc(uid);
    await statsRef.set({
      lastScore,
      totalQuestions,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving user stats:', error);
    res.status(500).json({ error: 'Failed to save user stats' });
  }
});

/**
 * GET /api/user-progress/:uid
 * Fetches user progress and timer from Firestore.
 */
app.get('/api/user-progress/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const userProgressRef = db.collection('user_progress').doc(uid);
    const doc = await userProgressRef.get();
    
    if (!doc.exists) {
      return res.json({ viewedRooms: [], studyTimer: 0 });
    }
    
    res.json(doc.data());
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ error: 'Failed to fetch user progress' });
  }
});

/**
 * GET /api/lessons
 * Fetches rooms from Firestore. If date is provided, filters lessons completed on that date.
 * Query params: date (YYYY-MM-DD), uid (optional)
 */
app.get('/api/lessons', async (req, res) => {
  try {
    const { date, uid } = req.query;
    
    if (date && uid) {
      // Return lessons completed by this user on this date
      const completionsSnapshot = await db.collection('completions')
        .where('uid', '==', uid)
        .where('completionDate', '==', date)
        .get();
      
      const completedRoomIds = [];
      completionsSnapshot.forEach(doc => completedRoomIds.push(doc.data().roomId));
      
      if (completedRoomIds.length === 0) {
        return res.json([]);
      }

      const roomsSnapshot = await db.collection('rooms').get();
      const rooms = [];
      roomsSnapshot.forEach(doc => {
        if (completedRoomIds.includes(doc.id)) {
          rooms.push({ id: doc.id, ...doc.data() });
        }
      });
      return res.json(rooms);
    }

    // Default: return all rooms
    const snapshot = await db.collection('rooms').get();
    const rooms = [];
    snapshot.forEach(doc => {
      rooms.push({ id: doc.id, ...doc.data() });
    });

    res.json(rooms);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

/**
 * POST /api/lessons
 * Saves a "completed lesson" with a server-side timestamp and date string.
 * Body: { uid: string, roomId: string }
 */
app.post('/api/lessons', verifyToken, async (req, res) => {
  try {
    const { uid, roomId } = req.body;
    
    if (!uid || !roomId) {
      return res.status(400).json({ error: 'Missing uid or roomId' });
    }

    // Security check: ensure uid matches token
    if (req.user.uid !== uid) {
      return res.status(403).json({ error: 'Forbidden: UID mismatch' });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 1. Add to completions collection (for date filtering)
    await db.collection('completions').add({
      uid,
      roomId,
      completionDate: today,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Update user_progress
    const userProgressRef = db.collection('user_progress').doc(uid);
    const userProgressDoc = await userProgressRef.get();

    let viewedRooms = [];
    if (userProgressDoc.exists) {
      viewedRooms = userProgressDoc.data().viewedRooms || [];
    }

    if (!viewedRooms.includes(roomId)) {
      viewedRooms.push(roomId);
      await userProgressRef.set({
        viewedRooms: viewedRooms,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // 3. Update user_stats
      const roomsSnapshot = await db.collection('rooms').get();
      const totalRooms = roomsSnapshot.size;
      
      const statsRef = db.collection('user_stats').doc(uid);
      await statsRef.set({
        totalCompletionRate: totalRooms > 0 ? Math.round((viewedRooms.length / totalRooms) * 100) : 0,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    res.json({ success: true, viewedRooms });
  } catch (error) {
    console.error('Error saving completed lesson:', error);
    res.status(500).json({ error: 'Failed to save completed lesson' });
  }
});

/**
 * POST /api/update-timer
 * Updates the study timer for a user.
 */
app.post('/api/update-timer', verifyToken, async (req, res) => {
  try {
    const { uid, studyTimer } = req.body;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });

    // Security check: ensure uid matches token
    if (req.user.uid !== uid) {
      return res.status(403).json({ error: 'Forbidden: UID mismatch' });
    }

    const userProgressRef = db.collection('user_progress').doc(uid);
    await userProgressRef.set({ studyTimer }, { merge: true });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating timer:', error);
    res.status(500).json({ error: 'Failed to update timer' });
  }
});

/**
 * GET /api/feedbacks
 * Fetches all feedbacks from Firestore.
 */
app.get('/api/feedbacks', async (req, res) => {
  try {
    const snapshot = await db.collection('feedbacks').orderBy('timestamp', 'desc').get();
    const feedbacks = [];
    snapshot.forEach(doc => {
      feedbacks.push({ id: doc.id, ...doc.data() });
    });
    res.json(feedbacks);
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ error: 'Failed to fetch feedbacks' });
  }
});

/**
 * POST /api/feedbacks
 * Saves a new feedback.
 */
app.post('/api/feedbacks', verifyToken, async (req, res) => {
  try {
    const { name, message, userId } = req.body;
    if (!name || !message || !userId) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // Security check: ensure userId matches token
    if (req.user.uid !== userId) {
      return res.status(403).json({ error: 'Forbidden: UID mismatch' });
    }

    const feedback = {
      name,
      message,
      userId,
      date: new Date().toLocaleDateString(),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    };

    const docRef = await db.collection('feedbacks').add(feedback);
    res.json({ id: docRef.id, ...feedback });
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

/**
 * POST /api/init
 * Populates the 'rooms' collection with initial data if empty.
 */
app.post('/api/init', async (req, res) => {
  try {
    const roomsRef = db.collection('rooms');
    const snapshot = await roomsRef.limit(1).get();
    
    if (!snapshot.empty) {
      return res.status(400).json({ error: 'Database already initialized' });
    }

    const initialRooms = [
      {
        name: "Кімната 101 - Граматика",
        description: "Вивчення базової граматики та правил.",
        status: "не пройдено",
        image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&auto=format&fit=crop"
      },
      {
        name: "Кімната 102 - Спілкування",
        description: "Розмовний клуб для покращення вимови.",
        status: "вільний",
        image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500&auto=format&fit=crop"
      },
      {
        name: "Кімната 103 - Аудіювання",
        description: "Прослуховування текстів та подкастів.",
        status: "зайнятий",
        image: "https://images.unsplash.com/photo-1612222869049-d8ec83637a3c?w=500&auto=format&fit=crop"
      },
      {
        name: "Кімната 104 - Словник",
        description: "Розширення словникового запасу.",
        status: "пройдено",
        image: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=500&auto=format&fit=crop"
      }
    ];

    for (const room of initialRooms) {
      await roomsRef.add(room);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error initializing data:', error);
    res.status(500).json({ error: 'Failed to initialize data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
