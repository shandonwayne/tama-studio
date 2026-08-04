/*
# Rename miyuki_shape value 'round' to 'rocailles'

Updates existing data so Miyuki round-bead projects are labeled
'rocailles' instead of 'round'. The CHECK constraint is replaced
to only allow 'delica', 'rocailles', or NULL.
*/

UPDATE bead_projects SET miyuki_shape = 'rocailles'
  WHERE miyuki_shape = 'round';

ALTER TABLE bead_projects DROP CONSTRAINT IF EXISTS bead_projects_miyuki_shape_check;

ALTER TABLE bead_projects
  ADD CONSTRAINT bead_projects_miyuki_shape_check
  CHECK (miyuki_shape IS NULL OR miyuki_shape IN ('delica', 'rocailles'));
