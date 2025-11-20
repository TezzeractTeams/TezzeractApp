-- Ensure the update_updated_at_column function exists (if not already created)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create scheduled_posts table to store scheduled social media posts
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'failed')),
  content_type TEXT,
  engagement_score NUMERIC(3,1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_organization_id ON scheduled_posts(organization_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_platform ON scheduled_posts(platform);

-- Enable Row Level Security
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own scheduled posts" ON scheduled_posts;
DROP POLICY IF EXISTS "Users can insert their own scheduled posts" ON scheduled_posts;
DROP POLICY IF EXISTS "Users can update their own scheduled posts" ON scheduled_posts;
DROP POLICY IF EXISTS "Users can delete their own scheduled posts" ON scheduled_posts;

-- Create policy to allow users to read their own scheduled posts
CREATE POLICY "Users can view their own scheduled posts"
  ON scheduled_posts FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  );

-- Create policy to allow users to insert their own scheduled posts
CREATE POLICY "Users can insert their own scheduled posts"
  ON scheduled_posts FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  );

-- Create policy to allow users to update their own scheduled posts
CREATE POLICY "Users can update their own scheduled posts"
  ON scheduled_posts FOR UPDATE
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  );

-- Create policy to allow users to delete their own scheduled posts
CREATE POLICY "Users can delete their own scheduled posts"
  ON scheduled_posts FOR DELETE
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  );

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_scheduled_posts_updated_at
  BEFORE UPDATE ON scheduled_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

