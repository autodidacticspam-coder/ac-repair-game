import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { loadGameState, saveGameState } from '../utils/gameState';

export function useGameSync(user) {
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const [lastSynced, setLastSynced] = useState(null);
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
  const saveRemoteState = useCallback(async (state) => {
    if (!username || !isSupabaseConfigured()) return;

    const { error } = await supabase
      .from('user_game_state')
      .upsert({
        username: username,
        settings: state.settings,
        total_stars: state.totalStars,
        unlocked_characters: state.unlockedCharacters,
        selected_character: state.selectedCharacter,
        current_game: state.currentGame,
        last_modified: new Date().toISOString(),
      }, {
        onConflict: 'username'
      });

    if (error) throw error;
    setLastSynced(new Date());
  }, [username]);

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
      await saveRemoteState(merged);

      setSyncStatus('synced');
      setLastSynced(new Date());

      return merged;
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      return null;
    }
  }, [username, fetchRemoteState, mergeStates, saveRemoteState]);

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
    syncOnLogin,
    debouncedSaveRemote,
  };
}
