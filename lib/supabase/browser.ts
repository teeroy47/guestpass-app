import { createClient } from "@supabase/supabase-js"

function readEnv(key: string) {
  if (typeof process !== "undefined" && process.env?.[key]) {
    return process.env[key]
  }

  if (typeof import.meta !== "undefined") {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    if (env?.[key]) {
      return env[key]
    }
  }

  return undefined
}

function resolveEnv(keys: string[]) {
  for (const key of keys) {
    const value = readEnv(key)
    if (value) {
      return value
    }
  }

  return undefined
}

let cachedBrowserClient: ReturnType<typeof createClient> | null = null

export function createBrowserSupabaseClient() {
  if (cachedBrowserClient) {
    return cachedBrowserClient
  }

  const supabaseUrl = resolveEnv(["NEXT_PUBLIC_SUPABASE_URL", "VITE_SUPABASE_URL"])
  const supabaseAnonKey = resolveEnv(["NEXT_PUBLIC_SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"])

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
  }

  if (!supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
  }

  cachedBrowserClient = createClient(supabaseUrl, supabaseAnonKey)
  return cachedBrowserClient
}