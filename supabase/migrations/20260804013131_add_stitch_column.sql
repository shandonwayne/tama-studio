ALTER TABLE bead_projects
  ADD COLUMN IF NOT EXISTS stitch text DEFAULT 'brick' CHECK (stitch IN ('brick', 'peyote'));
