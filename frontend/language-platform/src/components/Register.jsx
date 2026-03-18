import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setMessage(`Успіх! Користувач ${userCredential.user.email} успішно створений.`);
    } catch (error) {
      setMessage(`Помилка реєстрації: ${error.message}`);
    }
  };

  return (
    <div className="auth-card-inner">
      <h2>Реєстрація</h2>
      <form onSubmit={handleRegister} className="auth-form">
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
          placeholder="Введіть пароль (мін. 6 символів)" 
          className="auth-input"
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <button type="submit" className="auth-submit-btn">Зареєструватися</button>
      </form>
      {message && <p style={{ marginTop: '15px', color: message.includes('Успіх') ? '#27ae60' : '#e74c3c', fontWeight: 'bold' }}>{message}</p>}
    </div>
  );
}
