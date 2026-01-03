import { useState } from 'react';
import './PeriodStats.css';

const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: '90days', label: '90 Days' },
  { id: 'year', label: 'Year' },
  { id: 'alltime', label: 'All Time' },
];

export default function PeriodStats({ stats }) {
  const [activePeriod, setActivePeriod] = useState('week');

  const currentStats = stats[activePeriod] || { gamesPlayed: 0, starsEarned: 0, accuracy: 0 };

  return (
    <div className="period-stats">
      <div className="period-tabs">
        {PERIODS.map(period => (
          <button
            key={period.id}
            className={`period-tab ${activePeriod === period.id ? 'active' : ''}`}
            onClick={() => setActivePeriod(period.id)}
          >
            {period.label}
          </button>
        ))}
      </div>
      <div className="period-content">
        <div className="period-stat">
          <span className="period-value">{currentStats.starsEarned}</span>
          <span className="period-label">Stars</span>
        </div>
        <div className="period-stat">
          <span className="period-value">{currentStats.problemsCorrect || 0}</span>
          <span className="period-label">Correct</span>
        </div>
        <div className="period-stat">
          <span className="period-value">{currentStats.accuracy}%</span>
          <span className="period-label">Accuracy</span>
        </div>
      </div>
    </div>
  );
}
