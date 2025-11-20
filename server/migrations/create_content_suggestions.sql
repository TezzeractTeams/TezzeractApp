-- Create content_suggestions table to store AI-generated content suggestions
CREATE TABLE IF NOT EXISTS content_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL,
  engagement_score NUMERIC(3,1) NOT NULL,
  suggested_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_content_suggestions_organization_id ON content_suggestions(organization_id);
CREATE INDEX IF NOT EXISTS idx_content_suggestions_created_at ON content_suggestions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_suggestions_platform ON content_suggestions(platform);

-- Enable Row Level Security
ALTER TABLE content_suggestions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own content suggestions" ON content_suggestions;
DROP POLICY IF EXISTS "Users can insert their own content suggestions" ON content_suggestions;
DROP POLICY IF EXISTS "Users can update their own content suggestions" ON content_suggestions;
DROP POLICY IF EXISTS "Users can delete their own content suggestions" ON content_suggestions;

-- Create policy to allow users to read their own content suggestions
CREATE POLICY "Users can view their own content suggestions"
  ON content_suggestions FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  );

-- Create policy to allow users to insert their own content suggestions
CREATE POLICY "Users can insert their own content suggestions"
  ON content_suggestions FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  );

-- Create policy to allow users to update their own content suggestions
CREATE POLICY "Users can update their own content suggestions"
  ON content_suggestions FOR UPDATE
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  );

-- Create policy to allow users to delete their own content suggestions
CREATE POLICY "Users can delete their own content suggestions"
  ON content_suggestions FOR DELETE
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  );

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_content_suggestions_updated_at
  BEFORE UPDATE ON content_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

