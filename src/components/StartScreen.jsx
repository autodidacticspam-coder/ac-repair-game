import { useState } from 'react';
import './StartScreen.css';

export default function StartScreen({ settings, totalStars, onStartGame, onSettingsChange, hasSavedGame, onResume }) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <div className="start-screen">
      <div className="title-section">
        <h1>AC Repair Game</h1>
        <div className="star-display">
          <span className="star-icon">⭐</span>
          <span className="star-count">{totalStars}</span>
        </div>
      </div>

      <div className="settings-panel">
        <h2>Game Settings</h2>

        <div className="setting-group">
          <label>Air Conditioners per Round</label>
          <div className="number-input">
            <button onClick={() => handleChange('numACs', Math.max(1, localSettings.numACs - 1))}>-</button>
            <span>{localSettings.numACs}</span>
            <button onClick={() => handleChange('numACs', Math.min(10, localSettings.numACs + 1))}>+</button>
          </div>
        </div>

        <div className="setting-group">
          <label>Number of Rounds</label>
          <div className="number-input">
            <button onClick={() => handleChange('numRounds', Math.max(1, localSettings.numRounds - 1))}>-</button>
            <span>{localSettings.numRounds}</span>
            <button onClick={() => handleChange('numRounds', Math.min(20, localSettings.numRounds + 1))}>+</button>
          </div>
        </div>

        <div className="setting-group">
          <label>Math Mode</label>
          <div className="button-group">
            <button
              className={localSettings.mathMode === 'addition' ? 'active' : ''}
              onClick={() => handleChange('mathMode', 'addition')}
            >
              Addition (+)
            </button>
            <button
              className={localSettings.mathMode === 'subtraction' ? 'active' : ''}
              onClick={() => handleChange('mathMode', 'subtraction')}
            >
              Subtraction (-)
            </button>
            <button
              className={localSettings.mathMode === 'both' ? 'active' : ''}
              onClick={() => handleChange('mathMode', 'both')}
            >
              Both
            </button>
          </div>
        </div>

        <div className="setting-group">
          <label>Question Style</label>
          <div className="toggle-container">
            <button
              className={`toggle-btn ${!localSettings.blankMode ? 'active' : ''}`}
              onClick={() => handleChange('blankMode', false)}
            >
              Standard
              <span className="mode-example">2 + 3 = ?</span>
            </button>
            <button
              className={`toggle-btn ${localSettings.blankMode ? 'active' : ''}`}
              onClick={() => handleChange('blankMode', true)}
            >
              Find Missing
              <span className="mode-example">2 + ? = 5</span>
            </button>
          </div>
        </div>

        <div className="setting-group">
          <label>Number Range</label>
          <div className="range-inputs">
            <div className="range-input">
              <span>Min:</span>
              <div className="number-input small">
                <button onClick={() => handleChange('minValue', Math.max(0, localSettings.minValue - 1))}>-</button>
                <span>{localSettings.minValue}</span>
                <button onClick={() => handleChange('minValue', Math.min(localSettings.maxValue - 1, localSettings.minValue + 1))}>+</button>
              </div>
            </div>
            <div className="range-input">
              <span>Max:</span>
              <div className="number-input small">
                <button onClick={() => handleChange('maxValue', Math.max(localSettings.minValue + 1, localSettings.maxValue - 1))}>-</button>
                <span>{localSettings.maxValue}</span>
                <button onClick={() => handleChange('maxValue', Math.min(99, localSettings.maxValue + 1))}>+</button>
              </div>
            </div>
          </div>
        </div>

        <div className="setting-group">
          <label>Music</label>
          <div className="toggle-container">
            <button
              className={`toggle-btn ${localSettings.musicEnabled ? 'active' : ''}`}
              onClick={() => handleChange('musicEnabled', true)}
            >
              🔊 On
            </button>
            <button
              className={`toggle-btn ${!localSettings.musicEnabled ? 'active' : ''}`}
              onClick={() => handleChange('musicEnabled', false)}
            >
              🔇 Off
            </button>
          </div>
        </div>
      </div>

      <div className="button-section">
        <button className="start-button" onClick={onStartGame}>
          Start New Game
        </button>
        {hasSavedGame && (
          <button className="resume-button" onClick={onResume}>
            Resume Game
          </button>
        )}
      </div>
    </div>
  );
}
