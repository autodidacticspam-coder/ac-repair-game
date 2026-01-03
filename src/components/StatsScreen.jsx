import { useAuth } from '../contexts/AuthContext';
import { useStats } from '../hooks/useStats';
import StreakCounter from './StreakCounter';
import StatCard from './StatCard';
import CalendarHeatmap from './CalendarHeatmap';
import PeriodStats from './PeriodStats';
import './StatsScreen.css';

export default function StatsScreen({ userStats, onBack }) {
  const { user } = useAuth();
  const {
    loading,
    getTodayStats,
    getWeekStats,
    getMonthStats,
    get90DayStats,
    getYearStats,
    getAllTimeStats,
    getDailyData,
  } = useStats(user?.username);

  const allTime = getAllTimeStats();
  const dailyData = getDailyData(60); // Get 60 days for calendar

  const periodStats = {
    today: getTodayStats(),
    week: getWeekStats(),
    month: getMonthStats(),
    '90days': get90DayStats(),
    year: getYearStats(),
    alltime: allTime,
  };

  if (!user) {
    return (
      <div className="stats-screen">
        <div className="stats-header">
          <button className="back-button" onClick={onBack}>&larr; Back</button>
          <h1>My Progress</h1>
        </div>
        <div className="stats-login-prompt">
          <p>Sign in to track your progress!</p>
          <p className="stats-hint">Your stats will be saved and synced across devices.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="stats-screen">
        <div className="stats-header">
          <button className="back-button" onClick={onBack}>&larr; Back</button>
          <h1>My Progress</h1>
        </div>
        <div className="stats-loading">Loading stats...</div>
      </div>
    );
  }

  return (
    <div className="stats-screen">
      <div className="stats-header">
        <button className="back-button" onClick={onBack}>&larr; Back</button>
        <h1>My Progress</h1>
      </div>

      <div className="stats-content">
        <StreakCounter
          currentStreak={userStats.currentStreak || 0}
          longestStreak={userStats.longestStreak || 0}
        />

        <div className="stats-grid">
          <StatCard
            icon="⭐"
            label="Total Stars"
            value={userStats.totalStars || 0}
          />
          <StatCard
            icon="✓"
            label="Problems Solved"
            value={userStats.totalProblemsCorrect || 0}
          />
          <StatCard
            icon="🎯"
            label="Accuracy"
            value={`${userStats.totalProblemsAttempted > 0
              ? Math.round((userStats.totalProblemsCorrect / userStats.totalProblemsAttempted) * 100)
              : 0}%`}
          />
        </div>

        <PeriodStats stats={periodStats} />

        <CalendarHeatmap dailyData={dailyData} />
      </div>
    </div>
  );
}
