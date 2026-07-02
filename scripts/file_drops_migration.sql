-- Create the file_drops tracking table
CREATE TABLE IF NOT EXISTS file_drops (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name text NOT NULL,
  file_size_bytes bigint NOT NULL,
  file_path text NOT NULL,
  mime_type text,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Note: You also need to create a private Storage bucket named 'client_drops'
-- in your Supabase Dashboard -> Storage.
