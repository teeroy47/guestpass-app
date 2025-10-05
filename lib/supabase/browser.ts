import { createClient } from "@supabase/supabase-js"
import { getSupabaseBrowserConfig } from "./env"

let cachedBrowserClient: ReturnType<typeof createClient> | null = null

export function createBrowserSupabaseClient() {
  if (cachedBrowserClient) {
    return cachedBrowserClient
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseBrowserConfig()

  cachedBrowserClient = createClient(supabaseUrl, supabaseAnonKey)
  return cachedBrowserClient
}