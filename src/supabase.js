import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
