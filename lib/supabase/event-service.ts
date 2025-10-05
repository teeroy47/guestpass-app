import type { SupabaseClient } from "@supabase/supabase-js"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"
import type { SupabaseEventRow } from "./types"

export type ListEventsFilters = {
  ownerId?: string
  status?: string
  startsAfter?: string
}

export type CreateEventInput = {
  title: string
  description?: string | null
  startsAt: string
  venue?: string | null
  status: string
  ownerId: string
}

type EventRecord = {
  id: string
  title: string
  description: string | null
  startsAt: string
  venue: string | null
  ownerId: string
  createdAt: string
  totalGuests: number
  checkedInGuests: number
  status: string
}

function serializeEvent(row: SupabaseEventRow): EventRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startsAt: new Date(row.starts_at).toISOString(),
    venue: row.venue,
    ownerId: row.owner_id,
    createdAt: new Date(row.created_at).toISOString(),
    totalGuests: row.total_guests ?? 0,
    checkedInGuests: row.checked_in_guests ?? 0,
    status: row.status,
  }
}

export class EventService {
  private static browserClientPromise: Promise<SupabaseClient> | null = null
  private static serverClient: SupabaseClient | null = null

  private static async getClient(): Promise<SupabaseClient> {
    if (typeof window === "undefined") {
      if (!this.serverClient) {
        const { createSupabaseServerClient } = await import("./server")
        this.serverClient = createSupabaseServerClient()
      }
      return this.serverClient
    }

    if (!this.browserClientPromise) {
      this.browserClientPromise = Promise.resolve(createBrowserSupabaseClient())
    }

    return this.browserClientPromise
  }

  static async listEvents(filters: ListEventsFilters = {}) {
    const client = await this.getClient()
    const { ownerId, status, startsAfter } = filters

    let query = client
      .from("events")
      .select(
        `
          id,
          title,
          description,
          starts_at,
          venue,
          owner_id,
          created_at,
          total_guests,
          checked_in_guests,
          status
        `,
      )
      .order("starts_at", { ascending: true })

    if (ownerId) {
      query = query.eq("owner_id", ownerId)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (startsAfter) {
      query = query.gte("starts_at", startsAfter)
    }

    const { data, error } = await query
    if (error) {
      throw error
    }

    return (data ?? []).map((row) => serializeEvent(row as SupabaseEventRow))
  }

  static async getEvent(id: string) {
    const client = await this.getClient()
    const { data, error } = await client
      .from("events")
      .select(
        `
          id,
          title,
          description,
          starts_at,
          venue,
          owner_id,
          created_at,
          total_guests,
          checked_in_guests,
          status
        `,
      )
      .eq("id", id)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      return null
    }

    return serializeEvent(data as SupabaseEventRow)
  }

  static async createEvent(input: CreateEventInput) {
    const client = await this.getClient()
    const { data, error } = await client
      .from("events")
      .insert({
        title: input.title,
        description: input.description ?? null,
        starts_at: input.startsAt,
        venue: input.venue ?? null,
        owner_id: input.ownerId,
        status: input.status,
      })
      .select(
        `
          id,
          title,
          description,
          starts_at,
          venue,
          owner_id,
          created_at,
          total_guests,
          checked_in_guests,
          status
        `,
      )
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error("Failed to create event: Supabase returned no data.")
    }

    return serializeEvent(data as SupabaseEventRow)
  }

  static async updateEvent(id: string, updates: Partial<CreateEventInput>) {
    const client = await this.getClient()
    const payload: Record<string, unknown> = {}

    if (updates.title !== undefined) {
      payload.title = updates.title
    }
    if (updates.description !== undefined) {
      payload.description = updates.description ?? null
    }
    if (updates.startsAt !== undefined) {
      payload.starts_at = updates.startsAt
    }
    if (updates.venue !== undefined) {
      payload.venue = updates.venue ?? null
    }
    if (updates.ownerId !== undefined) {
      payload.owner_id = updates.ownerId
    }
    if (updates.status !== undefined) {
      payload.status = updates.status
    }

    const { data, error } = await client
      .from("events")
      .update(payload)
      .eq("id", id)
      .select(
        `
          id,
          title,
          description,
          starts_at,
          venue,
          owner_id,
          created_at,
          total_guests,
          checked_in_guests,
          status
        `,
      )
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      return null
    }

    return serializeEvent(data as SupabaseEventRow)
  }

  static async deleteEvent(id: string) {
    const client = await this.getClient()
    const { error } = await client.from("events").delete().eq("id", id)

    if (error) {
      throw error
    }
  }
}