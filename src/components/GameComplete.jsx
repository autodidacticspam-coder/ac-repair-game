import './GameComplete.css';

export default function GameComplete({ starsEarned, totalStars, onPlayAgain, onMainMenu }) {
  return (
    <div className="game-complete">
      <div className="complete-content">
        <h1>Great Job!</h1>

        <div className="stars-earned">
          <div className="stars-animation">
            {Array.from({ length: starsEarned }).map((_, i) => (
              <span key={i} className="earned-star" style={{ animationDelay: `${i * 0.2}s` }}>
                ⭐
              </span>
            ))}
          </div>
          <p>You earned {starsEarned} stars!</p>
        </div>

        <div className="total-stars">
          <span className="star-icon">⭐</span>
          <span>Total Stars: {totalStars}</span>
        </div>

        <div className="complete-buttons">
          <button className="play-again-btn" onClick={onPlayAgain}>
            Play Again
          </button>
          <button className="menu-btn" onClick={onMainMenu}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
