import type { SupabaseClient } from "@supabase/supabase-js"
import type { SupabaseGuestRow } from "./types"

export interface SupabaseCreateGuestInput {
  eventId: string
  name: string
  email?: string
  checkedInBy?: string
}

export class SupabaseGuestService {
  private static browserClientPromise: Promise<SupabaseClient> | null = null
  private static serverClient: SupabaseClient | null = null

  private static async getClient() {
    if (typeof window === "undefined") {
      if (!this.serverClient) {
        const { createSupabaseServerClient } = await import("./server")
        this.serverClient = createSupabaseServerClient()
      }
      return this.serverClient
    }

    if (!this.browserClientPromise) {
      this.browserClientPromise = import("@supabase/supabase-js").then(({ createClient }) => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl) {
          throw new Error("Missing VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable")
        }

        if (!supabaseAnonKey) {
          throw new Error("Missing VITE_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
        }

        return createClient(supabaseUrl, supabaseAnonKey)
      })
    }

    return this.browserClientPromise
  }

  private static serializeGuest(row: SupabaseGuestRow) {
    return {
      id: row.id,
      eventId: row.event_id,
      name: row.name,
      email: row.email ?? undefined,
      uniqueCode: row.unique_code,
      checkedIn: row.checked_in,
      checkedInAt: row.checked_in_at ?? undefined,
      checkedInBy: row.checked_in_by ?? undefined,
      createdAt: new Date(row.created_at).toISOString(),
    }
  }

  static async listGuestsByEvent(eventId: string) {
    const client = await this.getClient()
    const { data, error } = await client
      .from("guests")
      .select(
        `
          id,
          event_id,
          name,
          email,
          unique_code,
          checked_in,
          checked_in_at,
          checked_in_by,
          created_at,
          updated_at
        `,
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: true })

    if (error) {
      throw error
    }

    return (data ?? []).map((row) => this.serializeGuest(row as SupabaseGuestRow))
  }

  static async createGuest(data: SupabaseCreateGuestInput) {
    const client = await this.getClient()
    const { data: created, error } = await client
      .from("guests")
      .insert({
        event_id: data.eventId,
        name: data.name,
        email: data.email ?? null,
        checked_in_by: data.checkedInBy ?? null,
      })
      .select(
        `
          id,
          event_id,
          name,
          email,
          unique_code,
          checked_in,
          checked_in_at,
          checked_in_by,
          created_at,
          updated_at
        `,
      )
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!created) {
      return null
    }

    return this.serializeGuest(created as SupabaseGuestRow)
  }

  static async createGuestsBulk(eventId: string, guests: SupabaseCreateGuestInput[]) {
    if (guests.length === 0) {
      return []
    }

    const client = await this.getClient()
    const payload = guests.map((guest) => ({
      event_id: eventId,
      name: guest.name,
      email: guest.email ?? null,
      checked_in_by: guest.checkedInBy ?? null,
    }))

    const { data, error } = await client
      .from("guests")
      .insert(payload)
      .select("id, unique_code, name, email")

    if (error) {
      throw error
    }

    return (data ?? []).map((row) => ({
      id: row.id as string,
      uniqueCode: (row as { unique_code: string }).unique_code,
      name: row.name as string,
      email: (row as { email: string | null }).email ?? undefined,
    }))
  }

  static async updateGuest(id: string, updates: Partial<SupabaseCreateGuestInput> & { checkedIn?: boolean; checkedInAt?: string }) {
    const client = await this.getClient()
    const payload: Record<string, unknown> = {}

    if (updates.name !== undefined) {
      payload.name = updates.name
    }
    if (updates.email !== undefined) {
      payload.email = updates.email ?? null
    }
    if (updates.checkedInBy !== undefined) {
      payload.checked_in_by = updates.checkedInBy ?? null
    }
    if (updates.checkedIn !== undefined) {
      payload.checked_in = updates.checkedIn
    }
    if (updates.checkedInAt !== undefined) {
      payload.checked_in_at = updates.checkedInAt ?? null
    }

    const { data, error } = await client
      .from("guests")
      .update(payload)
      .eq("id", id)
      .select(
        `
          id,
          event_id,
          name,
          email,
          unique_code,
          checked_in,
          checked_in_at,
          checked_in_by,
          created_at,
          updated_at
        `,
      )
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      return null
    }

    return this.serializeGuest(data as SupabaseGuestRow)
  }

  static async deleteGuest(id: string) {
    const client = await this.getClient()
    const { error } = await client.from("guests").delete().eq("id", id)

    if (error) {
      throw error
    }
  }

  static async checkInGuest(eventId: string, uniqueCode: string, checkedInBy: string) {
    const client = await this.getClient()
    const checkedInAt = new Date().toISOString()

    const { data, error } = await client
      .from("guests")
      .update({
        checked_in: true,
        checked_in_at: checkedInAt,
        checked_in_by: checkedInBy,
      })
      .eq("event_id", eventId)
      .eq("unique_code", uniqueCode)
      .eq("checked_in", false)
      .select(
        `
          id,
          event_id,
          name,
          email,
          unique_code,
          checked_in,
          checked_in_at,
          checked_in_by,
          created_at,
          updated_at
        `,
      )
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      const { data: existing } = await client
        .from("guests")
        .select(
          `
            id,
            event_id,
            name,
            email,
            unique_code,
            checked_in,
            checked_in_at,
            checked_in_by,
            created_at,
            updated_at
          `,
        )
        .eq("event_id", eventId)
        .eq("unique_code", uniqueCode)
        .maybeSingle()

      if (!existing) {
        return { status: "not_found" as const }
      }

      if ((existing as SupabaseGuestRow).checked_in) {
        return {
          status: "already" as const,
          guest: this.serializeGuest(existing as SupabaseGuestRow),
        }
      }

      return { status: "not_found" as const }
    }

    return {
      status: "ok" as const,
      guest: this.serializeGuest(data as SupabaseGuestRow),
    }
  }
}