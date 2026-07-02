-- Add magic link fields to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS magic_link_token uuid UNIQUE,
ADD COLUMN IF NOT EXISTS magic_link_expires_at timestamp with time zone;

-- Add staging URL to works table
ALTER TABLE works 
ADD COLUMN IF NOT EXISTS staging_url text;
