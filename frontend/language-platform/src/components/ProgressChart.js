import React from 'react';
import './ProgressChart.css';

/**
 * Компонент графіку прогресу
 * @param {number} percentage - Відсоток прогресу (0-100)
 */
const ProgressChart = ({ percentage = 65 }) => {
  return (
    <div className="progress-chart-container">
      <h3 className="chart-title">Ваш загальний прогрес</h3>
      <div className="progress-bar-outer">
        <div 
          className="progress-bar-inner" 
          style={{ width: `${percentage}%` }}
        >
          {percentage}%
        </div>
      </div>
      <div className="chart-legend">
        <span>Початок</span>
        <span>Мета: 100%</span>
      </div>
    </div>
  );
};

export default ProgressChart;
