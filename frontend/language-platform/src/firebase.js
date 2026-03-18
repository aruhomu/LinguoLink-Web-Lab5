import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Замініть цей об'єкт на ВАШІ реальні ключі з Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCEyuUbskAvwd5vIT0sjc7_k6ywjoQFJRY",
  authDomain: "lingua-learn-db.firebaseapp.com",
  projectId: "lingua-learn-db",
  storageBucket: "lingua-learn-db.firebasestorage.app",
  messagingSenderId: "383343507937",
  appId: "1:383343507937:web:3b86b4de4d643de633baa0"
};

// Ініціалізація Firebase
const app = initializeApp(firebaseConfig);

// Експортуємо auth, щоб використовувати його в інших компонентах
export const auth = getAuth(app);