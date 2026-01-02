import { useState, useCallback, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function useStats(username) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all sessions for the user
  const fetchSessions = useCallback(async () => {
    if (!username || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('username', username)
        .order('played_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Calculate stats for a given time period
  const getStatsForPeriod = useCallback((startDate, endDate = new Date()) => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filtered = sessions.filter(s => {
      const date = new Date(s.played_at);
      return date >= start && date <= end;
    });

    const gamesPlayed = filtered.length;
    const starsEarned = filtered.reduce((sum, s) => sum + s.stars_earned, 0);
    const problemsCorrect = filtered.reduce((sum, s) => sum + s.problems_correct, 0);
    const problemsTotal = filtered.reduce((sum, s) => sum + s.problems_total, 0);
    const accuracy = problemsTotal > 0 ? Math.round((problemsCorrect / problemsTotal) * 100) : 0;

    return {
      gamesPlayed,
      starsEarned,
      problemsCorrect,
      problemsTotal,
      accuracy,
    };
  }, [sessions]);

  // Get today's stats
  const getTodayStats = useCallback(() => {
    const today = new Date();
    return getStatsForPeriod(today);
  }, [getStatsForPeriod]);

  // Get this week's stats (Sunday to Saturday)
  const getWeekStats = useCallback(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    return getStatsForPeriod(startOfWeek);
  }, [getStatsForPeriod]);

  // Get this month's stats
  const getMonthStats = useCallback(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return getStatsForPeriod(startOfMonth);
  }, [getStatsForPeriod]);

  // Get last 90 days stats
  const get90DayStats = useCallback(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 89);
    return getStatsForPeriod(start);
  }, [getStatsForPeriod]);

  // Get this year's stats
  const getYearStats = useCallback(() => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    return getStatsForPeriod(startOfYear);
  }, [getStatsForPeriod]);

  // Get all-time stats
  const getAllTimeStats = useCallback(() => {
    const gamesPlayed = sessions.length;
    const starsEarned = sessions.reduce((sum, s) => sum + s.stars_earned, 0);
    const problemsCorrect = sessions.reduce((sum, s) => sum + s.problems_correct, 0);
    const problemsTotal = sessions.reduce((sum, s) => sum + s.problems_total, 0);
    const accuracy = problemsTotal > 0 ? Math.round((problemsCorrect / problemsTotal) * 100) : 0;

    return {
      gamesPlayed,
      starsEarned,
      problemsCorrect,
      problemsTotal,
      accuracy,
    };
  }, [sessions]);

  // Get daily data for calendar heatmap (last N days)
  const getDailyData = useCallback((days = 30) => {
    const result = {};
    const today = new Date();

    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = date.toISOString().split('T')[0];
      result[key] = { games: 0, stars: 0 };
    }

    // Fill in actual data
    sessions.forEach(session => {
      const key = new Date(session.played_at).toISOString().split('T')[0];
      if (result[key]) {
        result[key].games += 1;
        result[key].stars += session.stars_earned;
      }
    });

    return result;
  }, [sessions]);

  // Get weekly breakdown (for bar chart)
  const getWeeklyBreakdown = useCallback(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const result = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - dayOfWeek + i);
      const dateStr = date.toISOString().split('T')[0];

      const daySessions = sessions.filter(s =>
        new Date(s.played_at).toISOString().split('T')[0] === dateStr
      );

      result.push({
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
        date: dateStr,
        games: daySessions.length,
        stars: daySessions.reduce((sum, s) => sum + s.stars_earned, 0),
      });
    }

    return result;
  }, [sessions]);

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
    getTodayStats,
    getWeekStats,
    getMonthStats,
    get90DayStats,
    getYearStats,
    getAllTimeStats,
    getDailyData,
    getWeeklyBreakdown,
  };
}
