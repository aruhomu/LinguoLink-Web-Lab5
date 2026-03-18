import React, { useState } from 'react';
import LessonCard from './LessonCard';
import './LessonsPage.css';

const TEST_LESSONS = [
  {
    id: 1,
    title: "English Basics",
    description: "Вивчення алфавіту та найпростіших фраз для повсякденного спілкування.",
    level: "A1"
  },
  {
    id: 2,
    title: "Past Tense Mastery",
    description: "Як правильно розповідати про минулі події. Правильні та неправильні дієслова.",
    level: "A2"
  },
  {
    id: 3,
    title: "Business Communication",
    description: "Ділова лексика, написання імейлів та проведення переговорів.",
    level: "B1"
  },
  {
    id: 4,
    title: "Advanced Grammar Concepts",
    description: "Глибоке вивчення Conditionals, Passive Voice та складних структур речень.",
    level: "B2"
  },
  {
    id: 5,
    title: "Present Continuous",
    description: "Опис подій, що відбуваються прямо зараз. Практичні вправи.",
    level: "A1"
  }
];

const LessonsPage = () => {
  const [filterLevel, setFilterLevel] = useState('Всі');

  // Фільтрація масиву уроків
  const filteredLessons = filterLevel === 'Всі' 
    ? TEST_LESSONS 
    : TEST_LESSONS.filter(lesson => lesson.level === filterLevel);

  return (
    <div className="lessons-page">
      <header className="page-header">
        <h1>Бібліотека уроків</h1>
        
        <div className="filter-section">
          <label htmlFor="level-filter">Рівень:</label>
          <select 
            id="level-filter" 
            className="filter-select"
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
          >
            <option value="Всі">Всі</option>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
          </select>
        </div>
      </header>

      <div className="lessons-list">
        {filteredLessons.length > 0 ? (
          filteredLessons.map(lesson => (
            <LessonCard 
              key={lesson.id}
              title={lesson.title}
              description={lesson.description}
              level={lesson.level}
            />
          ))
        ) : (
          <p className="no-results">На жаль, уроків для цього рівня поки що немає.</p>
        )}
      </div>
    </div>
  );
};

export default LessonsPage;
