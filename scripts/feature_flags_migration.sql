CREATE TABLE IF NOT EXISTS global_settings (
  id integer PRIMARY KEY DEFAULT 1,
  easter_eggs_enabled boolean DEFAULT true,
  maintenance_mode boolean DEFAULT false,
  force_dark_mode boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now()
);

-- Ensure only one row exists for global settings
INSERT INTO global_settings (id, easter_eggs_enabled, maintenance_mode, force_dark_mode) 
VALUES (1, true, false, false) 
ON CONFLICT (id) DO NOTHING;
