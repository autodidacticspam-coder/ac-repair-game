-- AC Repair Game - Full Database Schema
-- Run this in Supabase SQL Editor

-- Drop existing tables if they exist
DROP TABLE IF EXISTS game_sessions;
DROP TABLE IF EXISTS user_game_state;

-- Main user state table
CREATE TABLE user_game_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  settings JSONB NOT NULL DEFAULT '{}',
  total_stars INTEGER NOT NULL DEFAULT 0,
  total_games INTEGER NOT NULL DEFAULT 0,
  total_problems_correct INTEGER NOT NULL DEFAULT 0,
  total_problems_attempted INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_played_date DATE,
  unlocked_characters TEXT[] NOT NULL DEFAULT ARRAY['repairman'],
  selected_character TEXT NOT NULL DEFAULT 'repairman',
  current_game JSONB DEFAULT NULL,
  last_modified TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Game sessions table (stores each completed game)
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stars_earned INTEGER NOT NULL,
  problems_correct INTEGER NOT NULL,
  problems_total INTEGER NOT NULL
);

-- Create index for faster queries by username and date
CREATE INDEX idx_game_sessions_username ON game_sessions(username);
CREATE INDEX idx_game_sessions_played_at ON game_sessions(played_at);
CREATE INDEX idx_game_sessions_username_date ON game_sessions(username, played_at);

-- Enable Row Level Security
ALTER TABLE user_game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for user_game_state (anyone can read/write by username)
CREATE POLICY "Anyone can read user_game_state" ON user_game_state FOR SELECT USING (true);
CREATE POLICY "Anyone can insert user_game_state" ON user_game_state FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update user_game_state" ON user_game_state FOR UPDATE USING (true);

-- Policies for game_sessions (anyone can read/write)
CREATE POLICY "Anyone can read game_sessions" ON game_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert game_sessions" ON game_sessions FOR INSERT WITH CHECK (true);
