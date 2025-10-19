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

    // Fetch guest counts for all events
    const eventIds = (data ?? []).map((event) => event.id)
    const guestCounts = await this.getGuestCounts(eventIds)

    return (data ?? []).map((row) => {
      const counts = guestCounts[row.id] || { total: 0, checkedIn: 0 }
      return serializeEvent({
        ...row,
        total_guests: counts.total,
        checked_in_guests: counts.checkedIn,
      } as SupabaseEventRow)
    })
  }

  private static async getGuestCounts(eventIds: string[]): Promise<Record<string, { total: number; checkedIn: number }>> {
    if (eventIds.length === 0) {
      return {}
    }

    const client = await this.getClient()
    const { data, error } = await client
      .from("guests")
      .select("event_id, checked_in")
      .in("event_id", eventIds)

    if (error) {
      console.error("Failed to fetch guest counts:", error)
      return {}
    }

    const counts: Record<string, { total: number; checkedIn: number }> = {}
    
    for (const guest of data ?? []) {
      if (!counts[guest.event_id]) {
        counts[guest.event_id] = { total: 0, checkedIn: 0 }
      }
      counts[guest.event_id].total++
      if (guest.checked_in) {
        counts[guest.event_id].checkedIn++
      }
    }

    return counts
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

    // Fetch guest counts for this event
    const guestCounts = await this.getGuestCounts([id])
    const counts = guestCounts[id] || { total: 0, checkedIn: 0 }

    return serializeEvent({
      ...data,
      total_guests: counts.total,
      checked_in_guests: counts.checkedIn,
    } as SupabaseEventRow)
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

    // New events have no guests yet
    return serializeEvent({
      ...data,
      total_guests: 0,
      checked_in_guests: 0,
    } as SupabaseEventRow)
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

    // Fetch guest counts for this event
    const guestCounts = await this.getGuestCounts([id])
    const counts = guestCounts[id] || { total: 0, checkedIn: 0 }

    return serializeEvent({
      ...data,
      total_guests: counts.total,
      checked_in_guests: counts.checkedIn,
    } as SupabaseEventRow)
  }

  static async deleteEvent(id: string) {
    const client = await this.getClient()
    
    // Step 1: Fetch all guest photo URLs for this event before deletion
    const { data: guests, error: fetchError } = await client
      .from("guests")
      .select("photo_url")
      .eq("event_id", id)
      .not("photo_url", "is", null)

    if (fetchError) {
      console.error("Failed to fetch guest photos for cleanup:", fetchError)
      // Continue with deletion even if photo fetch fails
    }

    // Step 2: Delete photos from storage
    if (guests && guests.length > 0) {
      const photoUrls = guests
        .map((guest) => guest.photo_url)
        .filter((url): url is string => url !== null)

      if (photoUrls.length > 0) {
        // Extract file paths from full URLs
        // URL format: https://{project}.supabase.co/storage/v1/object/public/guestpass/{path}
        const filePaths = photoUrls.map((url) => {
          const match = url.match(/\/guestpass\/(.+)$/)
          return match ? match[1] : null
        }).filter((path): path is string => path !== null)

        if (filePaths.length > 0) {
          const { error: storageError } = await client.storage
            .from("guestpass")
            .remove(filePaths)

          if (storageError) {
            console.error("Failed to delete photos from storage:", storageError)
            // Continue with event deletion even if storage cleanup fails
          } else {
            console.log(`✅ Deleted ${filePaths.length} photo(s) from storage for event ${id}`)
          }
        }
      }
    }

    // Step 3: Delete the event (CASCADE will delete guest records)
    const { error } = await client.from("events").delete().eq("id", id)

    if (error) {
      throw error
    }
  }
}