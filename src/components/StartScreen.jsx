import { useState, useEffect } from 'react';
import { characters } from '../utils/gameState';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import './StartScreen.css';

export default function StartScreen({ settings, totalStars, selectedCharacter, onStartGame, onSettingsChange, hasSavedGame, onResume, onCharacterSelect, onStatsScreen, syncStatus }) {
  const [characterImage, setCharacterImage] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, signOut, isConfigured } = useAuth();

  const currentCharacter = characters.find(c => c.id === selectedCharacter) || characters[0];

  useEffect(() => {
    const img = new Image();
    img.onload = () => setCharacterImage(currentCharacter.image);
    img.onerror = () => setCharacterImage(null);
    img.src = currentCharacter.image;
  }, [currentCharacter]);
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSignOut = async () => {
    await signOut();
  };

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
        <div className="auth-section">
          {user ? (
            <div className="user-info">
              <span className="user-name">Playing as: {user.username}</span>
              {syncStatus === 'syncing' && <span className="sync-status syncing">Syncing...</span>}
              {syncStatus === 'synced' && <span className="sync-status synced">Synced</span>}
              {syncStatus === 'error' && <span className="sync-status error">Sync error</span>}
              <button className="auth-btn sign-out" onClick={handleSignOut}>Change Name</button>
            </div>
          ) : (
            <button className="auth-btn sign-in" onClick={() => setShowAuthModal(true)}>
              Save Progress
            </button>
          )}
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
          <label>First Number Range</label>
          <div className="range-inputs">
            <div className="range-input">
              <span>Min:</span>
              <div className="number-input small">
                <button onClick={() => handleChange('minValue1', Math.max(0, localSettings.minValue1 - 1))}>-</button>
                <span>{localSettings.minValue1}</span>
                <button onClick={() => handleChange('minValue1', Math.min(localSettings.maxValue1 - 1, localSettings.minValue1 + 1))}>+</button>
              </div>
            </div>
            <div className="range-input">
              <span>Max:</span>
              <div className="number-input small">
                <button onClick={() => handleChange('maxValue1', Math.max(localSettings.minValue1 + 1, localSettings.maxValue1 - 1))}>-</button>
                <span>{localSettings.maxValue1}</span>
                <button onClick={() => handleChange('maxValue1', Math.min(99, localSettings.maxValue1 + 1))}>+</button>
              </div>
            </div>
          </div>
        </div>

        <div className="setting-group">
          <label>Second Number Range</label>
          <div className="range-inputs">
            <div className="range-input">
              <span>Min:</span>
              <div className="number-input small">
                <button onClick={() => handleChange('minValue2', Math.max(0, localSettings.minValue2 - 1))}>-</button>
                <span>{localSettings.minValue2}</span>
                <button onClick={() => handleChange('minValue2', Math.min(localSettings.maxValue2 - 1, localSettings.minValue2 + 1))}>+</button>
              </div>
            </div>
            <div className="range-input">
              <span>Max:</span>
              <div className="number-input small">
                <button onClick={() => handleChange('maxValue2', Math.max(localSettings.minValue2 + 1, localSettings.maxValue2 - 1))}>-</button>
                <span>{localSettings.maxValue2}</span>
                <button onClick={() => handleChange('maxValue2', Math.min(99, localSettings.maxValue2 + 1))}>+</button>
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

      <div className="character-section" onClick={onCharacterSelect}>
        <div className="selected-character">
          {characterImage ? (
            <img src={characterImage} alt={currentCharacter.name} className="character-preview" />
          ) : (
            <div className="character-fallback-preview" style={{ '--char-color': currentCharacter.color }}>
              <div className="char-head" />
              <div className="char-torso" />
              <div className="char-legs" />
            </div>
          )}
        </div>
        <div className="character-info">
          <span className="character-name">{currentCharacter.name}</span>
          <span className="change-character">Tap to change</span>
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
        <button className="stats-button" onClick={onStatsScreen}>
          My Progress
        </button>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
