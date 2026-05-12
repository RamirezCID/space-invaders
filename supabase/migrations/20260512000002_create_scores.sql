-- Create scores table
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  wave INTEGER NOT NULL,
  played_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for leaderboard queries
CREATE INDEX idx_scores_score_desc ON scores (score DESC);
CREATE INDEX idx_scores_played_at ON scores (played_at DESC);
CREATE INDEX idx_scores_player_id ON scores (player_id);

-- RLS
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Anyone can read scores (leaderboard is public)
CREATE POLICY "Scores are publicly readable"
  ON scores FOR SELECT
  USING (true);

-- Authenticated users can insert their own scores
CREATE POLICY "Players can insert their own scores"
  ON scores FOR INSERT
  WITH CHECK (auth.uid() = player_id);
