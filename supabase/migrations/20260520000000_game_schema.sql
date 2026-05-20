-- Supabase Schema for Panda Game

-- Users (extended with game metadata)
CREATE TABLE IF NOT EXISTS game_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centralbank_user_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game Sessions (track active games and their state)
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES game_users(id) ON DELETE CASCADE,
  identity_token TEXT UNIQUE NOT NULL,
  tivoli_transaction_id INTEGER,
  game_state TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, failed
  player_blendshapes JSONB,
  target_blendshapes JSONB,
  score_submitted NUMERIC,
  score_validated NUMERIC,
  payout_requested NUMERIC,
  payout_completed NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_game_state CHECK (game_state IN ('pending', 'in_progress', 'completed', 'failed'))
);

-- Rate Limiting (prevent abuse)
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES game_users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL, -- 'create_transaction', 'submit_score', 'request_payout'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_request_type CHECK (request_type IN ('create_transaction', 'submit_score', 'request_payout'))
);

-- Payout History (audit trail for all payouts)
CREATE TABLE IF NOT EXISTS payout_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES game_users(id) ON DELETE CASCADE,
  tivoli_transaction_id INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_payout_status CHECK (status IN ('pending', 'success', 'failed'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_identity_token ON game_sessions(identity_token);
CREATE INDEX IF NOT EXISTS idx_game_sessions_tivoli_transaction_id ON game_sessions(tivoli_transaction_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_log_user_id ON rate_limit_log(user_id, request_type, created_at);
CREATE INDEX IF NOT EXISTS idx_payout_history_user_id ON payout_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_history_status ON payout_history(status);

-- RLS Policies (Row Level Security)
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_history ENABLE ROW LEVEL SECURITY;

-- Allow service role (Edge Functions) full access
CREATE POLICY "Service role access" ON game_sessions USING (true) WITH CHECK (true);
CREATE POLICY "Service role access" ON game_users USING (true) WITH CHECK (true);
CREATE POLICY "Service role access" ON rate_limit_log USING (true) WITH CHECK (true);
CREATE POLICY "Service role access" ON payout_history USING (true) WITH CHECK (true);
