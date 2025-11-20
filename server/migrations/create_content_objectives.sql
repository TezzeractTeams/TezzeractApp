-- The table already exists with this schema:
-- id, organization_id, type, description, target_metrics (jsonb), start_date, end_date, created_at
-- Just ensure we have the necessary indexes and policies

-- Create index for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_user_objectives_organization_id ON user_objectives(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_objectives_created_at ON user_objectives(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_objectives ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own objectives" ON user_objectives;
DROP POLICY IF EXISTS "Users can insert their own objectives" ON user_objectives;
DROP POLICY IF EXISTS "Users can update their own objectives" ON user_objectives;
DROP POLICY IF EXISTS "Users can delete their own objectives" ON user_objectives;

-- Create policy to allow users to read their own objectives
-- Users can view objectives for their organization
CREATE POLICY "Users can view their own objectives"
  ON user_objectives FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  );

-- Create policy to allow users to insert their own objectives
CREATE POLICY "Users can insert their own objectives"
  ON user_objectives FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  );

-- Create policy to allow users to update their own objectives
CREATE POLICY "Users can update their own objectives"
  ON user_objectives FOR UPDATE
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  );

-- Create policy to allow users to delete their own objectives
CREATE POLICY "Users can delete their own objectives"
  ON user_objectives FOR DELETE
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  );
