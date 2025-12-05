import { useState, useEffect, useCallback } from 'react';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import GameComplete from './components/GameComplete';
import { loadGameState, saveGameState, defaultSettings } from './utils/gameState';
import './App.css';

function App() {
  const [screen, setScreen] = useState('start'); // 'start', 'game', 'complete'
  const [gameState, setGameState] = useState(() => loadGameState());
  const [starsEarnedThisGame, setStarsEarnedThisGame] = useState(0);
  const [savedGameData, setSavedGameData] = useState(null);
  const [gameKey, setGameKey] = useState(0); // Used to force remount GameScreen

  // Load saved game data on mount
  useEffect(() => {
    const state = loadGameState();
    setGameState(state);
    if (state.currentGame) {
      setSavedGameData(state.currentGame);
    }
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  const handleSettingsChange = (newSettings) => {
    setGameState(prev => ({
      ...prev,
      settings: newSettings,
    }));
  };

  const handleStartGame = () => {
    setSavedGameData(null);
    setGameState(prev => ({
      ...prev,
      currentGame: null,
    }));
    setGameKey(prev => prev + 1); // Force remount
    setScreen('game');
  };

  const handleResumeGame = () => {
    setScreen('game');
  };

  const handleSaveGame = useCallback((gameData) => {
    setSavedGameData(gameData);
    setGameState(prev => ({
      ...prev,
      currentGame: gameData,
    }));
  }, []);

  const handleGameEnd = (stars) => {
    setStarsEarnedThisGame(stars);
    setSavedGameData(null);
    setGameState(prev => ({
      ...prev,
      currentGame: null,
    }));
    setScreen('complete');
  };

  const handleStarsEarned = (stars) => {
    setGameState(prev => ({
      ...prev,
      totalStars: prev.totalStars + stars,
    }));
  };

  const handlePlayAgain = () => {
    setSavedGameData(null); // Clear saved game
    setGameKey(prev => prev + 1); // Force remount GameScreen
    setScreen('game');
  };

  const handleMainMenu = () => {
    setScreen('start');
  };

  return (
    <div className="app">
      {screen === 'start' && (
        <StartScreen
          settings={gameState.settings}
          totalStars={gameState.totalStars}
          onStartGame={handleStartGame}
          onSettingsChange={handleSettingsChange}
          hasSavedGame={!!savedGameData}
          onResume={handleResumeGame}
        />
      )}

      {screen === 'game' && (
        <GameScreen
          key={gameKey}
          settings={gameState.settings}
          onGameEnd={handleGameEnd}
          onStarsEarned={handleStarsEarned}
          savedGame={savedGameData}
          onSaveGame={handleSaveGame}
        />
      )}

      {screen === 'complete' && (
        <GameComplete
          starsEarned={starsEarnedThisGame}
          totalStars={gameState.totalStars}
          onPlayAgain={handlePlayAgain}
          onMainMenu={handleMainMenu}
        />
      )}
    </div>
  );
}

export default App;
