/*
# Add miyuki_shape column to bead_projects

1. Modified Tables
- `bead_projects` — adds `miyuki_shape` column to track whether a Miyuki
  project uses Delica (cylinder) or Round beads. Stores 'delica' or 'round'
  for Miyuki projects, NULL for Toho/other brands.
  - `miyuki_shape` (text, nullable) — CHECK constraint limits to
    'delica', 'round', or NULL.

2. Security
- No policy changes. Existing anon/authenticated CRUD policies still apply.
*/

ALTER TABLE bead_projects
  ADD COLUMN IF NOT EXISTS miyuki_shape text
  CHECK (miyuki_shape IS NULL OR miyuki_shape IN ('delica', 'round'));
