import React from 'react';
import './LessonCard.css';

/**
 * Компонент картки уроку
 * @param {string} title - Назва уроку
 * @param {string} description - Опис уроку
 * @param {string} level - Рівень (A1, A2, B1, B2)
 */
const LessonCard = ({ title, description, level }) => {
  // Визначаємо клас стилю залежно від рівня
  const levelClass = `level-${level.toLowerCase()}`;

  return (
    <div className={`lesson-card-item ${levelClass}-border`}>
      <div className="lesson-card-header">
        <h3 className="lesson-card-title">{title}</h3>
        <span className={`lesson-card-level ${levelClass}`}>
          {level}
        </span>
      </div>
      <p className="lesson-card-description">{description}</p>
      <div className="lesson-card-footer">
        <button className="start-btn">Почати урок</button>
      </div>
    </div>
  );
};

export default LessonCard;
