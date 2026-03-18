Щоб Gemini міг ефективно перевірити твою роботу, тобі потрібно додати у файл gemini.md розділ "VERIFICATION SUITE" (Набір перевірок). Це дозволить ШІ проаналізувати твій код на відповідність кожному пункту методички.

Ось блок завдань, який тобі потрібно скопіювати та вставити у твій файл інструкцій:
🔍 LAB 5 VERIFICATION SUITE (Variant 14)

TASK 1: Backend Infrastructure Audit 

    Dependencies: Check if package.json includes express, cors, and firebase-admin .

    Server Init: Verify that server.js initializes the Express app on port 5000 .

    Firebase Connection: Confirm that firebase-admin is initialized using serviceAccountKey.json .

    Static Files: Check for the implementation of express.static() to serve local assets.

TASK 2: Variant 14 Business Logic Check 

    Date Filtering (GET): In GET /api/lessons, verify that the code handles req.query.date to filter records from Firestore .

    Server-Side Date (POST): In POST /api/lessons, ensure the server generates the completionDate in YYYY-MM-DD format and uses admin.firestore.FieldValue.serverTimestamp() .

    UID Association: Verify that every completed lesson is stored in a way that links it to the specific user's uid.

TASK 3: Security & Middleware Validation 

    Token Verification: Check for a verifyToken middleware that extracts the Bearer token from headers .

    Auth Guard: Ensure admin.auth().verifyIdToken(token) is used to decode and validate the user session.

    Protected Routes: Confirm that POST /api/lessons and POST /api/feedbacks are protected by this middleware .

TASK 4: Frontend Integration (Client-Server Architecture) 

    SDK Removal: Audit React components (e.g., App.js, Tests.js) to ensure there are NO direct imports of db from Firebase .

    Fetch Implementation: Confirm that all data operations use fetch() or axios pointing to http://localhost:5000 .

    Auth Headers: Verify that the frontend correctly attaches the ID token to the Authorization header for POST requests .