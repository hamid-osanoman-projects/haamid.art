-- Add gamification tracking arrays to visitors
ALTER TABLE visitors 
ADD COLUMN IF NOT EXISTS commands_typed text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS easter_eggs_found text[] DEFAULT '{}';
