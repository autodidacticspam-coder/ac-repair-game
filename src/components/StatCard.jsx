import './StatCard.css';

export default function StatCard({ icon, label, value, sublabel }) {
  return (
    <div className="stat-card">
      <span className="stat-icon">{icon}</span>
      <div className="stat-content">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
        {sublabel && <span className="stat-sublabel">{sublabel}</span>}
      </div>
    </div>
  );
}
