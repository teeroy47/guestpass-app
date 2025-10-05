import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Supabase sign out failed", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Sign out error", error)
    return NextResponse.json({ error: "Sign out failed" }, { status: 500 })
  }
}