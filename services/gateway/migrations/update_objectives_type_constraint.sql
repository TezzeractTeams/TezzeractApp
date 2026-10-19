-- Update the type constraint on user_objectives table
-- The constraint currently allows: monthly, quarterly, yearly (time periods)
-- But the application needs: objective types (brand_awareness, sales, etc.)

-- Drop the existing constraint
ALTER TABLE user_objectives DROP CONSTRAINT IF EXISTS user_objectives_type_check;

-- Add new constraint with the correct objective type values
ALTER TABLE user_objectives 
ADD CONSTRAINT user_objectives_type_check 
CHECK (type IN (
  'brand_awareness',
  'lead_generation',
  'engagement',
  'sales',
  'education',
  'community_building',
  'product_launch',
  'event_promotion'
));

