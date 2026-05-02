import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

declare const process: {
  env: Record<string, string | undefined>;
};

export function getHostedBackendMode() {
  return process.env.EXPO_PUBLIC_APP_DATA_BACKEND?.trim().toLowerCase() === "hosted";
}

export function getSupabaseEnv() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey)
  };
}

export function buildHostedRedirectUrl(path: string) {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return undefined;
  }

  const basePath = process.env.EXPO_PUBLIC_BASE_URL?.trim()?.replace(/\/$/, "") || "";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${window.location.origin}${basePath}${normalizedPath}`;
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
