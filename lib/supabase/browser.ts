import { createClient } from "@supabase/supabase-js"
import { getSupabaseBrowserConfig } from "./env"

let cachedBrowserClient: ReturnType<typeof createClient> | null = null

export function createBrowserSupabaseClient() {
  if (cachedBrowserClient) {
    console.log("[supabase] Returning cached browser client")
    return cachedBrowserClient
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseBrowserConfig()

  console.log("[supabase] Creating new browser client with persistent session")
  
  cachedBrowserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'guestpass-auth-token',
      flowType: 'pkce',
    },
  })
  
  // Log storage key to help with debugging
  console.log("[supabase] Session will be stored in localStorage with key: guestpass-auth-token")
  
  return cachedBrowserClient
}