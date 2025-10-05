import { createClient } from "@supabase/supabase-js"

const getServerEnv = (key: string) => {
  if (typeof process === "undefined" || !process.env) {
    throw new Error("Supabase server client can only be used in a server runtime")
  }

  return process.env[key]
}

const supabaseUrl = getServerEnv("NEXT_PUBLIC_SUPABASE_URL")
const serviceRoleKey = getServerEnv("SUPABASE_SERVICE_ROLE_KEY")

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable")
}

export function createSupabaseServerClient() {
  // Service-role key is safe on the server only; do not use this helper in the browser.
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  })
}