import './StreakCounter.css';

export default function StreakCounter({ currentStreak, longestStreak }) {
  return (
    <div className="streak-counter">
      <div className="streak-current">
        <span className="streak-fire">🔥</span>
        <span className="streak-number">{currentStreak}</span>
        <span className="streak-text">day streak!</span>
      </div>
      {longestStreak > 0 && (
        <div className="streak-best">
          Personal best: {longestStreak} days
        </div>
      )}
    </div>
  );
}
