import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import './Tests.css';

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api' 
  : 'https://linguolink-web-lab5.onrender.com/api';

const QUESTIONS = [
  {
    question: "I like to eat _______ for breakfast.",
    options: ["Apples", "Water", "Books"],
    correct: "Apples"
  },
  {
    question: "She _______ to the store yesterday.",
    options: ["go", "goes", "went"],
    correct: "went"
  },
  {
    question: "How _______ you today?",
    options: ["is", "are", "am"],
    correct: "are"
  }
];

const Tests = () => {
  const [currentStep, setCurrentStep] = useState(0); // 0: start, 1: quiz, 2: finished
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [lastSavedScore, setLastSavedScore] = useState(null);

  // Завантаження останнього результату через Backend
  useEffect(() => {
    const fetchLastScore = async () => {
      if (auth.currentUser) {
        try {
          const response = await fetch(`${API_BASE_URL}/user-stats/${auth.currentUser.uid}`);
          const data = await response.json();
          if (data && data.lastScore !== undefined) {
            setLastSavedScore(data.lastScore);
          }
        } catch (error) {
          console.error("Помилка завантаження статистики:", error);
        }
      }
    };
    fetchLastScore();
  }, []);

  const handleStart = () => {
    setCurrentStep(1);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedOption('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOption) return;

    const isCorrect = selectedOption === QUESTIONS[currentQuestion].correct;
    const newScore = isCorrect ? score + 1 : score;
    
    if (currentQuestion < QUESTIONS.length - 1) {
      setScore(newScore);
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption('');
    } else {
      // Фініш
      setScore(newScore);
      setCurrentStep(2);
      
      // Збереження результату через Backend
      if (auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          
          // 1. Збереження результатів тесту
          await fetch(`${API_BASE_URL}/user-stats`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              uid: auth.currentUser.uid,
              lastScore: newScore,
              totalQuestions: QUESTIONS.length
            })
          });

          setLastSavedScore(newScore);

          // 2. Логіка Варіанта 14: Якщо результат хороший, можна вважати "урок тестування" пройденим
          // Хоча у нас немає конкретного roomId для тесту, ми можемо додати його в базу пізніше.
          // Для демонстрації просто надішлемо POST на /api/lessons з фейковим ID, якщо потрібно за інструкцією.
          // console.log("Тест завершено, прогрес оновлено");

        } catch (error) {
          console.error("Помилка при збереженні результатів тесту: ", error);
        }
      }
    }
  };

  if (currentStep === 0) {
    return (
      <div className="tests-container">
        <h2 className="tests-title">Практичне тестування</h2>
        {lastSavedScore !== null && (
          <p className="last-score-info">Ваш попередній результат: <strong>{lastSavedScore} / {QUESTIONS.length}</strong></p>
        )}
        <p>Готові перевірити свої знання? Тест містить {QUESTIONS.length} питань.</p>
        <button className="submit-test-btn" onClick={handleStart}>Почати тест</button>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="tests-container">
        <h2 className="tests-title">Тест завершено!</h2>
        <div className="result-summary">
          <p>Ваш результат: <strong>{score}</strong> з <strong>{QUESTIONS.length}</strong></p>
          <div className="score-percentage">
            {Math.round((score / QUESTIONS.length) * 100)}%
          </div>
        </div>
        <button className="submit-test-btn" onClick={handleStart}>Спробувати ще раз</button>
      </div>
    );
  }

  return (
    <div className="tests-container">
      <div className="test-header">
        <h2 className="tests-title">Питання {currentQuestion + 1} / {QUESTIONS.length}</h2>
        <div className="progress-mini">
          <div className="progress-mini-inner" style={{ width: `${((currentQuestion + 1) / QUESTIONS.length) * 100}%` }}></div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <p className="question-text">{QUESTIONS[currentQuestion].question}</p>
        
        <div className="radio-group">
          {QUESTIONS[currentQuestion].options.map((option, idx) => (
            <label key={idx} className={`radio-option ${selectedOption === option ? 'selected' : ''}`}>
              <input 
                type="radio" 
                name="answer" 
                value={option} 
                checked={selectedOption === option}
                onChange={(e) => setSelectedOption(e.target.value)} 
              />
              {option}
            </label>
          ))}
        </div>

        <button type="submit" className="submit-test-btn" disabled={!selectedOption}>
          {currentQuestion === QUESTIONS.length - 1 ? 'Завершити' : 'Наступне питання'}
        </button>
      </form>
    </div>
  );
};

export default Tests;
