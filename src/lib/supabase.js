import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const PUBLIC_ARTISAN_FIELDS = `
  id, full_name, phone, whatsapp_number, years_experience, bio,
  profile_photo_url, status, is_verified, is_featured, is_available,
  completed_jobs, average_rating, review_count, created_at,
  city_id, area_id, category_id,
  cities ( id, name, state, slug ),
  areas ( id, name ),
  categories ( id, name, slug, icon )
`;
