import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

function readEnv(name: keyof NodeJS.ProcessEnv) {
  return (globalThis as { process?: { env?: NodeJS.ProcessEnv } }).process?.env?.[name];
}

export function getHostedBackendMode() {
  return readEnv("EXPO_PUBLIC_APP_DATA_BACKEND")?.trim().toLowerCase() === "hosted";
}

export function getSupabaseEnv() {
  const url = readEnv("EXPO_PUBLIC_SUPABASE_URL")?.trim();
  const anonKey = readEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY")?.trim();

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey)
  };
}

const { url, anonKey, isConfigured } = getSupabaseEnv();

export const supabase = isConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: Platform.OS === "web",
        storage: Platform.OS === "web" ? undefined : AsyncStorage
      }
    })
  : null;
