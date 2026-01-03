import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { loadGameState, saveGameState } from '../utils/gameState';

// Calculate new streak based on last played date
function calculateStreak(lastPlayedDate, currentStreak) {
  if (!lastPlayedDate) return 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastPlayed = new Date(lastPlayedDate);
  lastPlayed.setHours(0, 0, 0, 0);

  if (lastPlayed.getTime() === today.getTime()) {
    // Already played today, streak unchanged
    return currentStreak;
  } else if (lastPlayed.getTime() === yesterday.getTime()) {
    // Played yesterday, increment streak
    return currentStreak + 1;
  } else {
    // Streak broken, start new streak
    return 1;
  }
}

export function useGameSync(user) {
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const [lastSynced, setLastSynced] = useState(null);
  const [userStats, setUserStats] = useState({
    totalStars: 0,
    totalGames: 0,
    totalProblemsCorrect: 0,
    totalProblemsAttempted: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastPlayedDate: null,
  });
  const saveTimeoutRef = useRef(null);

  const username = user?.username;

  // Fetch remote state from Supabase
  const fetchRemoteState = useCallback(async () => {
    if (!username || !isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('user_game_state')
      .select('*')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }
    return data;
  }, [username]);

  // Save state to Supabase
  const saveRemoteState = useCallback(async (state, stats = null) => {
    if (!username || !isSupabaseConfigured()) return;

    const statsToSave = stats || userStats;

    const { error } = await supabase
      .from('user_game_state')
      .upsert({
        username: username,
        settings: state.settings,
        total_stars: state.totalStars,
        total_games: statsToSave.totalGames,
        total_problems_correct: statsToSave.totalProblemsCorrect,
        total_problems_attempted: statsToSave.totalProblemsAttempted,
        current_streak: statsToSave.currentStreak,
        longest_streak: statsToSave.longestStreak,
        last_played_date: statsToSave.lastPlayedDate,
        unlocked_characters: state.unlockedCharacters,
        selected_character: state.selectedCharacter,
        current_game: state.currentGame,
        last_modified: new Date().toISOString(),
      }, {
        onConflict: 'username'
      });

    if (error) throw error;
    setLastSynced(new Date());
  }, [username, userStats]);

  // Record a game session
  const recordGameSession = useCallback(async (starsEarned, problemsCorrect, problemsTotal, gameSettings = null) => {
    if (!username || !isSupabaseConfigured()) return null;

    const today = new Date().toISOString().split('T')[0];

    // Calculate new streak
    const newStreak = calculateStreak(userStats.lastPlayedDate, userStats.currentStreak);
    const newLongestStreak = Math.max(newStreak, userStats.longestStreak);

    // Update local stats
    const newStats = {
      totalStars: userStats.totalStars + starsEarned,
      totalGames: userStats.totalGames + 1,
      totalProblemsCorrect: userStats.totalProblemsCorrect + problemsCorrect,
      totalProblemsAttempted: userStats.totalProblemsAttempted + problemsTotal,
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastPlayedDate: today,
    };

    setUserStats(newStats);

    try {
      // Insert game session with settings
      const { error: sessionError } = await supabase
        .from('game_sessions')
        .insert({
          username: username,
          stars_earned: starsEarned,
          problems_correct: problemsCorrect,
          problems_total: problemsTotal,
          settings: gameSettings,
        });

      if (sessionError) throw sessionError;

      // Also update user_game_state with new streak values immediately
      const { error: stateError } = await supabase
        .from('user_game_state')
        .upsert({
          username: username,
          total_games: newStats.totalGames,
          total_problems_correct: newStats.totalProblemsCorrect,
          total_problems_attempted: newStats.totalProblemsAttempted,
          current_streak: newStats.currentStreak,
          longest_streak: newStats.longestStreak,
          last_played_date: newStats.lastPlayedDate,
          last_modified: new Date().toISOString(),
        }, {
          onConflict: 'username'
        });

      if (stateError) console.error('Failed to update streak:', stateError);

      return newStats;
    } catch (error) {
      console.error('Failed to record session:', error);
      return newStats; // Still return local stats even if remote fails
    }
  }, [username, userStats]);

  // Merge local and remote state
  const mergeStates = useCallback((local, remote) => {
    if (!remote) return local;

    // Convert remote format to local format
    const remoteAsLocal = {
      settings: remote.settings || local.settings,
      totalStars: remote.total_stars ?? local.totalStars,
      unlockedCharacters: remote.unlocked_characters || local.unlockedCharacters,
      selectedCharacter: remote.selected_character || local.selectedCharacter,
      currentGame: local.currentGame, // Keep local in-progress game
      lastModified: remote.last_modified,
    };

    // Update user stats from remote
    setUserStats({
      totalStars: remote.total_stars || 0,
      totalGames: remote.total_games || 0,
      totalProblemsCorrect: remote.total_problems_correct || 0,
      totalProblemsAttempted: remote.total_problems_attempted || 0,
      currentStreak: remote.current_streak || 0,
      longestStreak: remote.longest_streak || 0,
      lastPlayedDate: remote.last_played_date,
    });

    // Merge strategy:
    // - totalStars: take higher value
    // - unlockedCharacters: union of both
    // - selectedCharacter: take remote
    // - settings: take remote
    // - currentGame: keep local if exists
    return {
      settings: remoteAsLocal.settings,
      totalStars: Math.max(local.totalStars || 0, remoteAsLocal.totalStars || 0),
      unlockedCharacters: [...new Set([
        ...(local.unlockedCharacters || []),
        ...(remoteAsLocal.unlockedCharacters || [])
      ])],
      selectedCharacter: remoteAsLocal.selectedCharacter,
      currentGame: local.currentGame,
      lastModified: new Date().toISOString(),
    };
  }, []);

  // Sync on login
  const syncOnLogin = useCallback(async () => {
    if (!username || !isSupabaseConfigured()) return null;

    setSyncStatus('syncing');
    try {
      const remote = await fetchRemoteState();
      const local = loadGameState();
      const merged = mergeStates(local, remote);

      // Save merged state locally
      saveGameState(merged);

      // Upload to remote
      await saveRemoteState(merged, remote ? {
        totalStars: remote.total_stars || 0,
        totalGames: remote.total_games || 0,
        totalProblemsCorrect: remote.total_problems_correct || 0,
        totalProblemsAttempted: remote.total_problems_attempted || 0,
        currentStreak: remote.current_streak || 0,
        longestStreak: remote.longest_streak || 0,
        lastPlayedDate: remote.last_played_date,
      } : userStats);

      setSyncStatus('synced');
      setLastSynced(new Date());

      return merged;
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      return null;
    }
  }, [username, fetchRemoteState, mergeStates, saveRemoteState, userStats]);

  // Debounced save to remote
  const debouncedSaveRemote = useCallback((state) => {
    if (!username || !isSupabaseConfigured()) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveRemoteState(state);
        setSyncStatus('synced');
      } catch (error) {
        console.error('Remote save failed:', error);
        setSyncStatus('error');
      }
    }, 2000); // 2 second debounce
  }, [username, saveRemoteState]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    syncStatus,
    lastSynced,
    userStats,
    syncOnLogin,
    debouncedSaveRemote,
    recordGameSession,
  };
}
