import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const SUPABASE_URL = "https://xjggzfxupoqtaoqsbldt.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_aLnPRB6ZyGxM5qgnqWeFAg_urn44JF5";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
