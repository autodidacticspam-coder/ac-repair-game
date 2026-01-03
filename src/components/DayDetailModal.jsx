import './DayDetailModal.css';

export default function DayDetailModal({ date, sessions, onClose }) {
  if (!sessions || sessions.length === 0) {
    return null;
  }

  const dateObj = new Date(date + 'T12:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Calculate totals for the day
  const totalStars = sessions.reduce((sum, s) => sum + s.stars_earned, 0);
  const totalCorrect = sessions.reduce((sum, s) => sum + s.problems_correct, 0);
  const totalAttempted = sessions.reduce((sum, s) => sum + s.problems_total, 0);
  const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  // Group sessions by full settings combination (mode + ranges)
  const settingsBreakdown = {};
  sessions.forEach(session => {
    if (!session.settings) return;

    const s = session.settings;
    const key = `${s.mathMode || 'both'}-${s.blankMode ? 'blank' : 'standard'}-${s.minValue1}-${s.maxValue1}-${s.minValue2}-${s.maxValue2}`;

    if (!settingsBreakdown[key]) {
      settingsBreakdown[key] = {
        mathMode: s.mathMode || 'both',
        blankMode: s.blankMode || false,
        range1: { min: s.minValue1, max: s.maxValue1 },
        range2: { min: s.minValue2, max: s.maxValue2 },
        stars: 0,
        correct: 0,
        total: 0,
        sessions: 0,
      };
    }
    settingsBreakdown[key].stars += session.stars_earned;
    settingsBreakdown[key].correct += session.problems_correct;
    settingsBreakdown[key].total += session.problems_total;
    settingsBreakdown[key].sessions += 1;
  });

  const getMathModeLabel = (mode) => {
    switch (mode) {
      case 'addition': return 'Addition (+)';
      case 'subtraction': return 'Subtraction (-)';
      case 'both': return 'Both (+/-)';
      default: return mode;
    }
  };

  const getAccuracyColor = (acc) => {
    if (acc >= 80) return 'accuracy-high';
    if (acc >= 60) return 'accuracy-medium';
    return 'accuracy-low';
  };

  const getAccuracyLabel = (acc) => {
    if (acc >= 90) return 'Excellent!';
    if (acc >= 80) return 'Great!';
    if (acc >= 70) return 'Good';
    if (acc >= 60) return 'OK';
    if (acc >= 50) return 'Needs practice';
    return 'Struggling';
  };

  return (
    <div className="day-detail-overlay" onClick={onClose}>
      <div className="day-detail-modal" onClick={e => e.stopPropagation()}>
        <button className="day-detail-close" onClick={onClose}>&times;</button>

        <h2>{formattedDate}</h2>

        <div className="day-summary">
          <div className="day-stat">
            <span className="day-stat-value">{totalStars}</span>
            <span className="day-stat-label">Stars</span>
          </div>
          <div className="day-stat">
            <span className="day-stat-value">{totalCorrect}/{totalAttempted}</span>
            <span className="day-stat-label">Correct</span>
          </div>
          <div className="day-stat">
            <span className={`day-stat-value ${getAccuracyColor(accuracy)}`}>{accuracy}%</span>
            <span className="day-stat-label">Accuracy</span>
          </div>
        </div>

        {Object.keys(settingsBreakdown).length > 0 && (
          <div className="settings-breakdown">
            <h3>Performance by Settings</h3>
            {Object.values(settingsBreakdown).map((item, index) => {
              const itemAccuracy = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
              return (
                <div key={index} className="breakdown-card">
                  <div className="breakdown-header">
                    <span className="mode-name">{getMathModeLabel(item.mathMode)}</span>
                    <span className="mode-style">{item.blankMode ? 'Find Missing' : 'Standard'}</span>
                  </div>
                  <div className="breakdown-ranges">
                    <span>1st: {item.range1.min}-{item.range1.max}</span>
                    <span>2nd: {item.range2.min}-{item.range2.max}</span>
                  </div>
                  <div className="breakdown-results">
                    <div className="result-item">
                      <span className="result-value">{item.stars}</span>
                      <span className="result-label">Stars</span>
                    </div>
                    <div className="result-item">
                      <span className="result-value">{item.correct}/{item.total}</span>
                      <span className="result-label">Correct</span>
                    </div>
                    <div className="result-item">
                      <span className={`result-value ${getAccuracyColor(itemAccuracy)}`}>{itemAccuracy}%</span>
                      <span className="result-label">{getAccuracyLabel(itemAccuracy)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="session-list">
          <h3>Sessions ({sessions.length})</h3>
          {sessions.map((session, index) => {
            const sessionAccuracy = session.problems_total > 0
              ? Math.round((session.problems_correct / session.problems_total) * 100)
              : 0;
            const time = new Date(session.played_at).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            });

            return (
              <div key={session.id || index} className="session-item">
                <div className="session-time">{time}</div>
                <div className="session-details">
                  {session.settings && (
                    <span className="session-mode">
                      {getMathModeLabel(session.settings.mathMode)}
                      {session.settings.blankMode && ' (Find Missing)'}
                    </span>
                  )}
                  {session.settings && (
                    <span className="session-range">
                      Range: {session.settings.minValue1}-{session.settings.maxValue1} & {session.settings.minValue2}-{session.settings.maxValue2}
                    </span>
                  )}
                </div>
                <div className="session-results">
                  <span className="session-stars">{session.stars_earned}⭐</span>
                  <span className={`session-accuracy ${getAccuracyColor(sessionAccuracy)}`}>
                    {sessionAccuracy}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
