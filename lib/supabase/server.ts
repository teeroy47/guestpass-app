import { createClient } from "@supabase/supabase-js"
import { getSupabaseServerUrl, getSupabaseServiceRoleKey } from "./env"

const supabaseUrl = getSupabaseServerUrl()
const serviceRoleKey = getSupabaseServiceRoleKey()

export function createSupabaseServerClient() {
  // Service-role key is safe on the server only; do not use this helper in the browser.
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  })
}