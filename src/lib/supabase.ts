import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface BeadProject {
  id: string;
  name: string;
  project_type: 'loom' | 'freehand';
  brand: 'miyuki' | 'toho' | 'other';
  miyuki_shape: 'delica' | 'rocailles' | null;
  stitch: 'brick' | 'peyote' | null;
  width: number;
  height: number;
  grid_data: (string | null)[][];
  rotations_data: number[][] | null;
  created_at: string;
  updated_at: string;
}
