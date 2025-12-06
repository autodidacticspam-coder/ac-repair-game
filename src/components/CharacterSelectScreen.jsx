import { useState, useEffect } from 'react';
import { characters } from '../utils/gameState';
import './CharacterSelectScreen.css';

export default function CharacterSelectScreen({
  totalStars,
  unlockedCharacters,
  selectedCharacter,
  onSelectCharacter,
  onUnlockCharacter,
  onBack,
}) {
  const [characterImages, setCharacterImages] = useState({});
  const [previewCharacter, setPreviewCharacter] = useState(null);

  // Load character images
  useEffect(() => {
    characters.forEach((char) => {
      const img = new Image();
      img.onload = () => {
        setCharacterImages((prev) => ({ ...prev, [char.id]: true }));
      };
      img.onerror = () => {
        setCharacterImages((prev) => ({ ...prev, [char.id]: false }));
      };
      img.src = char.image;
    });
  }, []);

  const handleCharacterClick = (char) => {
    const isUnlocked = unlockedCharacters.includes(char.id);
    if (isUnlocked) {
      onSelectCharacter(char.id);
    } else {
      // Show preview modal for locked characters
      setPreviewCharacter(char);
    }
  };

  const handleUnlock = (char) => {
    if (totalStars >= char.cost) {
      onUnlockCharacter(char.id, char.cost);
      setPreviewCharacter(null);
    }
  };

  const closePreview = () => {
    setPreviewCharacter(null);
  };

  const renderCharacterSprite = (char, size = 'normal') => {
    const hasImage = characterImages[char.id];
    const dimensions = size === 'large' ? { width: 128, height: 192 } : { width: 64, height: 96 };

    if (hasImage) {
      return (
        <img
          src={char.image}
          alt={char.name}
          className="character-image"
          style={{ width: dimensions.width, height: dimensions.height }}
        />
      );
    }

    // CSS fallback
    return (
      <div className="character-fallback" style={{ width: dimensions.width, height: dimensions.height }}>
        <div className="char-head" style={{ background: '#ffd699' }} />
        <div className="char-torso" style={{ background: char.color }} />
        <div className="char-legs" />
      </div>
    );
  };

  return (
    <div className="character-select-screen">
      <div className="character-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>Choose Your Character</h1>
        <div className="star-display">
          <span className="star-icon">⭐</span>
          <span className="star-count">{totalStars}</span>
        </div>
      </div>

      <div className="character-grid">
        {characters.map((char) => {
          const isUnlocked = unlockedCharacters.includes(char.id);
          const isSelected = selectedCharacter === char.id;

          return (
            <div
              key={char.id}
              className={`character-card ${isUnlocked ? 'unlocked' : 'locked'} ${isSelected ? 'selected' : ''}`}
              onClick={() => handleCharacterClick(char)}
            >
              <div className="character-sprite-container">
                {renderCharacterSprite(char)}
                {!isUnlocked && (
                  <div className="lock-overlay">
                    <span className="lock-icon">🔒</span>
                    <span className="cost">⭐ {char.cost}</span>
                  </div>
                )}
                {isSelected && <div className="selected-badge">✓</div>}
              </div>
              <div className="character-name">{char.name}</div>
            </div>
          );
        })}
      </div>

      {/* Preview Modal for locked characters */}
      {previewCharacter && (
        <div className="preview-modal" onClick={closePreview}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="preview-character">
              {renderCharacterSprite(previewCharacter, 'large')}
            </div>
            <h2>{previewCharacter.name}</h2>
            <div className="preview-cost">
              <span className="star-icon">⭐</span>
              <span>{previewCharacter.cost}</span>
            </div>

            {/* Color swatches */}
            <div className="color-preview">
              <div
                className="color-swatch"
                style={{ background: previewCharacter.color }}
                title="Character color"
              />
            </div>

            {totalStars >= previewCharacter.cost ? (
              <button className="unlock-button" onClick={() => handleUnlock(previewCharacter)}>
                Unlock for ⭐ {previewCharacter.cost}
              </button>
            ) : (
              <div className="need-more-stars">
                Need {previewCharacter.cost - totalStars} more stars
              </div>
            )}
            <button className="close-button" onClick={closePreview}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
