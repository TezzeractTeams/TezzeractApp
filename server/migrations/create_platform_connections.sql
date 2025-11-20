-- Create platform_connections table to store OAuth tokens and connection status
CREATE TABLE IF NOT EXISTS platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_id TEXT NOT NULL,
  platform_name TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_platform_connections_user_id ON platform_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_connections_platform_id ON platform_connections(platform_id);

-- Enable Row Level Security
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own connections
CREATE POLICY "Users can view their own platform connections"
  ON platform_connections FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own connections
CREATE POLICY "Users can insert their own platform connections"
  ON platform_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own connections
CREATE POLICY "Users can update their own platform connections"
  ON platform_connections FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own connections
CREATE POLICY "Users can delete their own platform connections"
  ON platform_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_platform_connections_updated_at
  BEFORE UPDATE ON platform_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

