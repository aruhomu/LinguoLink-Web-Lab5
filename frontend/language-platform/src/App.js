import React, { useState, useEffect } from 'react';
import './App.css';
import Register from './components/Register'; 
import Login from './components/Login'; 

// Імпорт сервісів Firebase
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import ProgressChart from './components/ProgressChart';
import Tests from './components/Tests';
import LessonsPage from './components/LessonsPage';

// Security Reminder: Always include Authorization: Bearer <token> header for protected routes.
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api' 
  : 'https://linguolink-web-lab5.onrender.com/api';

function App() {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [viewedRooms, setViewedRooms] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  const [fbName, setFbName] = useState('');
  const [fbMessage, setFbMessage] = useState('');
  const [fbError, setFbError] = useState(false);

  // 1. Відстеження авторизації та завантаження прогресу користувача через Backend
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const response = await fetch(`${API_BASE_URL}/user-progress/${currentUser.uid}`);
          const data = await response.json();
          setViewedRooms(data.viewedRooms || []);
          setSeconds(data.studyTimer || 0);
        } catch (error) {
          console.error("Помилка завантаження прогресу:", error);
        }
      } else {
        setViewedRooms([]);
        setSeconds(0);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Завантаження кімнат з Backend
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        let url = `${API_BASE_URL}/lessons`;
        if (filterDate && user) {
          url += `?date=${filterDate}&uid=${user.uid}`;
        }
        const response = await fetch(url);
        const data = await response.json();
        setRooms(data);
      } catch (error) {
        console.error("Помилка при завантаженні кімнат: ", error);
      }
    };
    fetchRooms();
  }, [filterDate, user]);

  // 3. Завантаження відгуків через Backend
  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/feedbacks`);
        const data = await response.json();
        setFeedbacks(data);
      } catch (error) {
        console.error("Помилка завантаження відгуків:", error);
      }
    };
    fetchFeedbacks();
    const interval = setInterval(fetchFeedbacks, 30000); 
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => signOut(auth);

  // Функція для разового заповнення бази через Backend
  const uploadInitialData = async () => {
    if (rooms.length > 0) {
      alert("База вже містить дані!");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/init`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        alert("Дані успішно додано! Перезавантажте сторінку.");
        window.location.reload();
      } else {
        alert("Помилка: " + (data.error || "невідома помилка"));
      }
    } catch (e) {
      console.error("Помилка завантаження: ", e);
    }
  };

  // Таймер — зберігаємо через Backend
  useEffect(() => {
    const interval = setInterval(async () => {
      if (user) {
        setSeconds(prev => {
          const next = prev + 1;
          if (next % 10 === 0) {
            user.getIdToken().then(token => {
              fetch(`${API_BASE_URL}/update-timer`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ uid: user.uid, studyTimer: next })
              }).catch(err => console.error("Timer update failed", err));
            });
          }
          return next;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [user]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = async () => {
    if (user) {
      try {
        const token = await user.getIdToken();
        await fetch(`${API_BASE_URL}/update-timer`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ uid: user.uid, studyTimer: 0 })
        });
      } catch (e) {
        console.error(e);
      }
    }
    setSeconds(0);
    setViewedRooms([]);
  };

  const toggleRoom = async (id) => {
    if (!user) {
      alert("Тільки авторизовані користувачі можуть відзначати кімнати!");
      return;
    }
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/lessons`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ uid: user.uid, roomId: id })
      });
      const data = await response.json();
      if (data.success) {
        setViewedRooms(data.viewedRooms);
      }
    } catch (error) {
      console.error("Помилка при оновленні прогресу: ", error);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Тільки авторизовані користувачі можуть залишати відгуки!");
      return;
    }
    if (!fbName.trim() || !fbMessage.trim()) {
      setFbError(true);
      return;
    }
    setFbError(false);
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/feedbacks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: fbName,
          message: fbMessage,
          userId: user.uid
        })
      });
      if (response.ok) {
        const newFb = await response.json();
        setFeedbacks([newFb, ...feedbacks]);
        setFbName('');
        setFbMessage('');
      }
    } catch (error) {
      console.error("Помилка при додаванні відгуку: ", error);
    }
  };

  return (
    <div className="App">
      <header>
        <div className="container">
          <h1>LinguoLink</h1>
          <nav>
            <ul>
              <li><a href="#lessons">Бібліотека</a></li>
              {user && <li><a href="#practice">Практика</a></li>}
              <li><a href="#rooms">Кімнати</a></li>
              <li><a href="#feedback">Відгуки</a></li>
            </ul>
          </nav>
          <div id="session-timer">
            {user ? (
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <span style={{fontSize: '0.8rem'}}>{user.email}</span>
                <button onClick={handleLogout} className="logout-btn">Вийти</button>
              </div>
            ) : (
              <span>Гість</span>
            )}
            <div style={{marginTop: '5px'}}>
              Час: <span>{formatTime(seconds)}</span>
              <button onClick={handleReset} style={{ marginLeft: '10px', padding: '2px 8px', fontSize: '0.6rem', background: 'rgba(255,255,255,0.2)', border: '1px solid white' }}>
                Скинути
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container">
        
        {/* Показуємо форму входу/реєстрації тільки якщо користувач не залогінений */}
        {!user && (
          <section className="auth-card">
            {isLoginView ? <Login /> : <Register />}
            <button 
              onClick={() => setIsLoginView(!isLoginView)} 
              className="auth-switch-btn"
            >
              {isLoginView ? "Немає акаунту? Зареєструватися" : "Вже є акаунт? Увійти"}
            </button>
          </section>
        )}

        {/* ПРАКТИКА ТА ПРОГРЕС — Тільки для авторизованих (Варіант 14) */}
        {user ? (
          <section id="practice" className="lessons-section">
            <h2>Мій кабінет та Практика</h2>
            <div className="dashboard-header">
              <ProgressChart 
                percentage={rooms.length > 0 ? Math.round((viewedRooms.length / rooms.length) * 100) : 0} 
              />
              <Tests />
            </div>
          </section>
        ) : (
          <section className="lessons-section" style={{textAlign: 'center', opacity: 0.6}}>
            <p>🔒 Розділ «Практика» доступний лише після входу в систему.</p>
          </section>
        )}

        <section id="lessons">
          <LessonsPage />
        </section>

        {/* КІМНАТИ — Дані тепер з Firestore */}
        <section id="rooms" className="lessons-section">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h2>Кімнати навчання (Cloud Firestore)</h2>
            <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
              <label htmlFor="date-filter" style={{fontSize: '0.9rem'}}>Фільтр за датою (Variant 14):</label>
              <input 
                type="date" 
                id="date-filter" 
                value={filterDate} 
                onChange={(e) => setFilterDate(e.target.value)}
                style={{padding: '5px', borderRadius: '4px', border: '1px solid #ccc'}}
              />
              <button onClick={() => setFilterDate('')} style={{fontSize: '0.7rem'}}>Скинути</button>
            </div>
            {user && rooms.length === 0 && !filterDate && (
              <button onClick={uploadInitialData} style={{fontSize: '0.7rem'}}>Заповнити базу</button>
            )}
          </div>
          <div className="lessons-grid">
            {rooms.length > 0 ? (
              rooms.map((room) => {
                const isViewed = viewedRooms.includes(room.id);
                return (
                  <article key={room.id} className="lesson-card" style={{ backgroundColor: isViewed ? "#f0f0f0" : "#ffffff" }}>
                    <h3>{room.name}</h3>
                    <div className="media-placeholder">
                      <img src={room.image} alt={room.name} style={{ filter: isViewed ? 'grayscale(100%)' : 'none', opacity: isViewed ? 0.7 : 1 }} />
                    </div>
                    <p><strong>Опис:</strong> {room.description}</p>
                    <p><strong>Статус:</strong> <span className="room-status">{isViewed ? 'переглянуто' : room.status}</span></p>
                    <button className="view-btn" disabled={isViewed} onClick={() => toggleRoom(room.id)}>
                      {isViewed ? 'Переглянуто' : 'Відзначити як переглянутий'}
                    </button>
                  </article>
                );
              })
            ) : (
              <p>Завантаження кімнат або база порожня...</p>
            )}
          </div>
        </section>

        {/* ВІДГУКИ */}
        <section id="feedback" className="lessons-section">
          <h2>Зворотний зв'язок</h2>
          {user ? (
            <form id="feedback-form" onSubmit={handleFeedbackSubmit}>
              <div className="form-group">
                <label htmlFor="fb-name">Ваше ім'я:</label>
                <input type="text" id="fb-name" placeholder="Введіть ім'я" value={fbName} onChange={(e) => setFbName(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="fb-message">Ваш відгук:</label>
                <textarea id="fb-message" rows="3" placeholder="Ваші враження..." value={fbMessage} onChange={(e) => setFbMessage(e.target.value)}></textarea>
              </div>
              {fbError && <p id="fb-error">Будь ласка, заповніть усі поля форми!</p>}
              <button type="submit">Надіслати відгук</button>
            </form>
          ) : (
            <div style={{ backgroundColor: '#fff3cd', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px solid #ffeeba' }}>
              <p>Тільки авторизовані користувачі можуть залишати відгуки.</p>
              <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo(0,0); }} style={{ color: '#856404', fontWeight: 'bold' }}>
                Будь ласка, увійдіть у систему, щоб написати відгук.
              </a>
            </div>
          )}
          
          <h3>Останні відгуки:</h3>
          <div id="feedback-list" className="lessons-grid">
            {feedbacks.length > 0 ? (
              feedbacks.map((fb) => (
                <article key={fb.id} className="lesson-card feedback-item">
                  <h3>{fb.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: '#777', marginTop: '-10px' }}><em>{fb.date}</em></p>
                  <p>{fb.message}</p>
                  <img src={fb.avatar} alt={fb.name} className="feedback-avatar" />
                </article>
              ))
            ) : (
              <p>Відгуків поки немає. Будьте першим!</p>
            )}
          </div>
        </section>
      </main>

      <footer>
        <div className="container">
          <p>Контакти: <a href="mailto:support@linguolink.ua">support@linguolink.ua</a></p>
          <p>&copy; 2026 LinguoLink Interactive. Лабораторна робота №4 (React + Firebase Cloud).</p>
        </div>
      </footer>
    </div>
  );
}

export default App;