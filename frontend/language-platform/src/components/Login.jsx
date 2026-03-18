import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setMessage(`Успіх! Вітаємо, ${userCredential.user.email}`);
    } catch (error) {
      let errorMsg = "Помилка входу";
      if (error.code === 'auth/user-not-found') errorMsg = "Користувача не знайдено";
      else if (error.code === 'auth/wrong-password') errorMsg = "Невірний пароль";
      else errorMsg = error.message;
      setMessage(errorMsg);
    }
  };

  return (
    <div className="auth-card-inner">
      <h2>Вхід до системи</h2>
      <form onSubmit={handleLogin} className="auth-form">
        <input 
          type="email" 
          placeholder="Введіть email" 
          className="auth-input"
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Введіть пароль" 
          className="auth-input"
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <button type="submit" className="auth-submit-btn">Увійти</button>
      </form>
      {message && <p style={{ marginTop: '15px', color: message.includes('Успіх') ? '#27ae60' : '#e74c3c', fontWeight: 'bold' }}>{message}</p>}
    </div>
  );
}
