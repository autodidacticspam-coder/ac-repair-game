import './CalendarHeatmap.css';

export default function CalendarHeatmap({ dailyData }) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Get first day of month and number of days
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const monthName = today.toLocaleString('default', { month: 'long' });

  // Build calendar grid
  const weeks = [];
  let currentWeek = [];

  // Add empty cells for days before the first of the month
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const data = dailyData[dateStr] || { games: 0, stars: 0 };

    currentWeek.push({
      day,
      date: dateStr,
      games: data.games,
      stars: data.stars,
      isToday: day === today.getDate(),
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Add remaining days to last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const getIntensity = (games) => {
    if (games === 0) return 'none';
    if (games === 1) return 'low';
    if (games <= 3) return 'medium';
    return 'high';
  };

  return (
    <div className="calendar-heatmap">
      <h3 className="calendar-title">{monthName} {currentYear}</h3>
      <div className="calendar-header">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className="calendar-day-label">{d}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="calendar-week">
            {week.map((cell, di) => (
              <div
                key={di}
                className={`calendar-cell ${cell ? `intensity-${getIntensity(cell.games)}` : 'empty'} ${cell?.isToday ? 'today' : ''}`}
                title={cell ? `${cell.date}: ${cell.games} games, ${cell.stars} stars` : ''}
              >
                {cell?.day}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="calendar-legend">
        <span>Less</span>
        <div className="legend-cell intensity-none"></div>
        <div className="legend-cell intensity-low"></div>
        <div className="legend-cell intensity-medium"></div>
        <div className="legend-cell intensity-high"></div>
        <span>More</span>
      </div>
    </div>
  );
}
