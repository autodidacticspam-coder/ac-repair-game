import { useState, useEffect, useCallback, useRef } from 'react';
import StartScreen from './components/StartScreen';
import CharacterSelectScreen from './components/CharacterSelectScreen';
import GameScreen from './components/GameScreen';
import GameComplete from './components/GameComplete';
import StatsScreen from './components/StatsScreen';
import { loadGameState, saveGameState, defaultSettings } from './utils/gameState';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useGameSync } from './hooks/useGameSync';
import './App.css';

function AppContent() {
  const [screen, setScreen] = useState('start'); // 'start', 'characters', 'game', 'complete'
  const [gameState, setGameState] = useState(() => loadGameState());
  const [starsEarnedThisGame, setStarsEarnedThisGame] = useState(0);
  const [savedGameData, setSavedGameData] = useState(null);
  const [gameKey, setGameKey] = useState(0); // Used to force remount GameScreen

  const { user } = useAuth();
  const { syncStatus, syncOnLogin, debouncedSaveRemote, recordGameSession, userStats } = useGameSync(user);
  const prevUserRef = useRef(null);
  const [lastGameStats, setLastGameStats] = useState({ problemsCorrect: 0, problemsTotal: 0 });

  // Load saved game data on mount
  useEffect(() => {
    const state = loadGameState();
    setGameState(state);
    if (state.currentGame) {
      setSavedGameData(state.currentGame);
    }
  }, []);

  // Sync when user logs in
  useEffect(() => {
    if (user && prevUserRef.current !== user.username) {
      prevUserRef.current = user.username;
      syncOnLogin().then((mergedState) => {
        if (mergedState) {
          setGameState(mergedState);
        }
      });
    } else if (!user) {
      prevUserRef.current = null;
    }
  }, [user, syncOnLogin]);

  // Save state whenever it changes
  useEffect(() => {
    saveGameState(gameState);
    // Also sync to remote if user is logged in
    if (user) {
      debouncedSaveRemote(gameState);
    }
  }, [gameState, user, debouncedSaveRemote]);

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

  const handleGameEnd = (stars, problemsCorrect = 0, problemsTotal = 0) => {
    setStarsEarnedThisGame(stars);
    setLastGameStats({ problemsCorrect, problemsTotal });
    setSavedGameData(null);
    setGameState(prev => ({
      ...prev,
      currentGame: null,
    }));

    // Record the game session if user is logged in (include settings)
    if (user) {
      recordGameSession(stars, problemsCorrect, problemsTotal, gameState.settings);
    }

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

  const handleCharacterScreen = () => {
    setScreen('characters');
  };

  const handleStatsScreen = () => {
    setScreen('stats');
  };

  const handleSelectCharacter = (characterId) => {
    setGameState(prev => ({
      ...prev,
      selectedCharacter: characterId,
    }));
  };

  const handleUnlockCharacter = (characterId, cost) => {
    setGameState(prev => ({
      ...prev,
      totalStars: prev.totalStars - cost,
      unlockedCharacters: [...prev.unlockedCharacters, characterId],
      selectedCharacter: characterId, // Auto-select after unlock
    }));
  };

  return (
    <div className="app">
      {screen === 'start' && (
        <StartScreen
          settings={gameState.settings}
          totalStars={gameState.totalStars}
          selectedCharacter={gameState.selectedCharacter}
          onStartGame={handleStartGame}
          onSettingsChange={handleSettingsChange}
          hasSavedGame={!!savedGameData}
          onResume={handleResumeGame}
          onCharacterSelect={handleCharacterScreen}
          onStatsScreen={handleStatsScreen}
          syncStatus={syncStatus}
        />
      )}

      {screen === 'stats' && (
        <StatsScreen
          userStats={userStats}
          onBack={handleMainMenu}
        />
      )}

      {screen === 'characters' && (
        <CharacterSelectScreen
          totalStars={gameState.totalStars}
          unlockedCharacters={gameState.unlockedCharacters}
          selectedCharacter={gameState.selectedCharacter}
          onSelectCharacter={handleSelectCharacter}
          onUnlockCharacter={handleUnlockCharacter}
          onBack={handleMainMenu}
        />
      )}

      {screen === 'game' && (
        <GameScreen
          key={gameKey}
          settings={gameState.settings}
          selectedCharacter={gameState.selectedCharacter}
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
