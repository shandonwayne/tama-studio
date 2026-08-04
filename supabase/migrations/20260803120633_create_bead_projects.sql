/*
# Create bead_projects table

1. New Tables
- `bead_projects` — stores saved bead pixel-art projects.
  - `id` (uuid, primary key)
  - `name` (text, not null) — user-given project name
  - `project_type` (text, not null) — 'loom' or 'freehand'
  - `brand` (text, not null) — 'miyuki', 'toho', or 'other'
  - `width` (int, not null) — grid columns
  - `height` (int, not null) — grid rows
  - `grid_data` (jsonb, not null default '[]') — 2D array of bead color codes or null for empty cells
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

2. Security
- Enable RLS on `bead_projects`.
- Single-tenant app (no sign-in): allow anon + authenticated full CRUD because projects are intentionally shared/public (community gallery).
*/

CREATE TABLE IF NOT EXISTS bead_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  project_type text NOT NULL CHECK (project_type IN ('loom', 'freehand')),
  brand text NOT NULL CHECK (brand IN ('miyuki', 'toho', 'other')),
  width int NOT NULL CHECK (width > 0 AND width <= 200),
  height int NOT NULL CHECK (height > 0 AND height <= 200),
  grid_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bead_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_bead_projects" ON bead_projects;
CREATE POLICY "anon_select_bead_projects" ON bead_projects FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_bead_projects" ON bead_projects;
CREATE POLICY "anon_insert_bead_projects" ON bead_projects FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_bead_projects" ON bead_projects;
CREATE POLICY "anon_update_bead_projects" ON bead_projects FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_bead_projects" ON bead_projects;
CREATE POLICY "anon_delete_bead_projects" ON bead_projects FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS bead_projects_created_at_idx ON bead_projects (created_at DESC);
