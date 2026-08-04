ALTER TABLE bead_projects
  ADD COLUMN IF NOT EXISTS rotations_data jsonb NOT NULL DEFAULT '[]'::jsonb;
