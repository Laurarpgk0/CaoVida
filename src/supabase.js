import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

// Storage seguro compatível com Web e Mobile para evitar erros de 'window is not defined'
const customStorage = {
  getItem: (key) => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return Promise.resolve(null);
      return Promise.resolve(localStorage.getItem(key));
    }
    return AsyncStorage.getItem(key);
  },
  setItem: (key, value) => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return Promise.resolve();
      localStorage.setItem(key, value);
      return Promise.resolve();
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key) => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return Promise.resolve();
      localStorage.removeItem(key);
      return Promise.resolve();
    }
    return AsyncStorage.removeItem(key);
  },
};

const SUPABASE_URL = "https://xjggzfxupoqtaoqsbldt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_aLnPRB6ZyGxM5qgnqWeFAg_urn44JF5";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
