// Supabase client for the MoHEST public site (vanilla JS, CDN build)
// Loaded via <script type="module"> in each page.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://qixrbxgkfbclvbsylxfl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3DP6jRZzl0V82V7QtYv_aQ_voxWwpBv';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
