import type { SupabaseClient } from "@supabase/supabase-js"
import { createBrowserSupabaseClient } from "./browser"
import type { SupabaseGuestRow } from "./types"

export interface SupabaseCreateGuestInput {
  eventId: string
  name: string
  email?: string
  phone?: string
  seatingArea?: 'Reserved' | 'Free Seating'
  cuisineChoice?: 'Traditional' | 'Western'
  checkedInBy?: string
  usherName?: string
  usherEmail?: string
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
      this.browserClientPromise = Promise.resolve(createBrowserSupabaseClient())
    }

    return this.browserClientPromise
  }

  private static serializeGuest(row: SupabaseGuestRow) {
    return {
      id: row.id,
      eventId: row.event_id,
      name: row.name,
      email: row.email ?? undefined,
      phone: row.phone ?? undefined,
      seatingArea: row.seating_area,
      cuisineChoice: row.cuisine_choice,
      uniqueCode: row.unique_code,
      checkedIn: row.checked_in,
      checkedInAt: row.checked_in_at ?? undefined,
      checkedInBy: row.checked_in_by ?? undefined,
      usherName: row.usher_name ?? undefined,
      usherEmail: row.usher_email ?? undefined,
      attended: row.attended ?? false,
      invitationSent: row.invitation_sent ?? false,
      invitationSentAt: row.invitation_sent_at ?? undefined,
      photoUrl: row.photo_url ?? undefined,
      firstCheckinAt: row.first_checkin_at ?? undefined,
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
          phone,
          seating_area,
          cuisine_choice,
          unique_code,
          checked_in,
          checked_in_at,
          checked_in_by,
          usher_name,
          usher_email,
          attended,
          invitation_sent,
          invitation_sent_at,
          photo_url,
          first_checkin_at,
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
        phone: data.phone ?? null,
        seating_area: data.seatingArea ?? 'Free Seating',
        cuisine_choice: data.cuisineChoice ?? 'Traditional',
        checked_in_by: data.checkedInBy ?? null,
      })
      .select(
        `
          id,
          event_id,
          name,
          email,
          phone,
          seating_area,
          cuisine_choice,
          unique_code,
          checked_in,
          checked_in_at,
          checked_in_by,
          usher_name,
          usher_email,
          attended,
          invitation_sent,
          invitation_sent_at,
          photo_url,
          first_checkin_at,
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
      phone: guest.phone ?? null,
      seating_area: guest.seatingArea ?? 'Free Seating',
      cuisine_choice: guest.cuisineChoice ?? 'Traditional',
      checked_in_by: guest.checkedInBy ?? null,
    }))

    const { data, error } = await client
      .from("guests")
      .insert(payload)
      .select("id, unique_code, name, email, phone, seating_area, cuisine_choice")

    if (error) {
      throw error
    }

    return (data ?? []).map((row) => ({
      id: row.id as string,
      uniqueCode: (row as { unique_code: string }).unique_code,
      name: row.name as string,
      email: (row as { email: string | null }).email ?? undefined,
      phone: (row as { phone: string | null }).phone ?? undefined,
      seatingArea: (row as { seating_area: 'Reserved' | 'Free Seating' }).seating_area,
      cuisineChoice: (row as { cuisine_choice: 'Traditional' | 'Western' }).cuisine_choice,
    }))
  }

  static async updateGuest(id: string, updates: Partial<SupabaseCreateGuestInput> & { checkedIn?: boolean; checkedInAt?: string; attended?: boolean }) {
    const client = await this.getClient()
    const payload: Record<string, unknown> = {}

    if (updates.name !== undefined) {
      payload.name = updates.name
    }
    if (updates.email !== undefined) {
      payload.email = updates.email ?? null
    }
    if (updates.phone !== undefined) {
      payload.phone = updates.phone ?? null
    }
    if (updates.seatingArea !== undefined) {
      payload.seating_area = updates.seatingArea
    }
    if (updates.cuisineChoice !== undefined) {
      payload.cuisine_choice = updates.cuisineChoice
    }
    if (updates.checkedInBy !== undefined) {
      payload.checked_in_by = updates.checkedInBy ?? null
    }
    if (updates.usherName !== undefined) {
      payload.usher_name = updates.usherName ?? null
    }
    if (updates.usherEmail !== undefined) {
      payload.usher_email = updates.usherEmail ?? null
    }
    if (updates.checkedIn !== undefined) {
      payload.checked_in = updates.checkedIn
    }
    if (updates.checkedInAt !== undefined) {
      payload.checked_in_at = updates.checkedInAt ?? null
    }
    if (updates.attended !== undefined) {
      payload.attended = updates.attended
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
          phone,
          seating_area,
          cuisine_choice,
          unique_code,
          checked_in,
          checked_in_at,
          checked_in_by,
          usher_name,
          usher_email,
          attended,
          invitation_sent,
          invitation_sent_at,
          photo_url,
          first_checkin_at,
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

  static async uploadGuestPhoto(guestId: string, eventId: string, photoBlob: Blob): Promise<string> {
    const client = await this.getClient()
    const timestamp = Date.now()
    const filename = `guest-photos/${eventId}/${guestId}_${timestamp}.jpg`

    console.log("Uploading photo to Supabase Storage:", { 
      filename, 
      size: photoBlob.size, 
      type: photoBlob.type 
    })

    const { data, error } = await client.storage
      .from("guestpass")
      .upload(filename, photoBlob, {
        contentType: "image/jpeg",
        cacheControl: "3600",
        upsert: false,
      })

    if (error) {
      console.error("Supabase Storage upload error:", error)
      throw new Error(`Storage upload failed: ${error.message}`)
    }

    console.log("Photo uploaded successfully:", data)

    // Get public URL
    const { data: urlData } = client.storage.from("guestpass").getPublicUrl(filename)

    console.log("Generated public URL:", urlData.publicUrl)

    // Verify the file exists by checking if we can get its metadata
    const { data: fileData, error: fileError } = await client.storage
      .from("guestpass")
      .list(filename.split('/').slice(0, -1).join('/'), {
        search: filename.split('/').pop()
      })

    if (fileError || !fileData || fileData.length === 0) {
      console.error("Photo verification failed - file not found in storage:", {
        filename,
        error: fileError,
        filesFound: fileData?.length || 0
      })
    } else {
      console.log("Photo verified in storage:", fileData[0])
    }

    return urlData.publicUrl
  }

  static async checkInGuest(eventId: string, uniqueCode: string, checkedInBy: string, usherName?: string, usherEmail?: string, photoUrl?: string) {
    const client = await this.getClient()
    const checkedInAt = new Date().toISOString()

    // Build update payload
    const updatePayload: Record<string, any> = {
      checked_in: true,
      checked_in_at: checkedInAt,
      checked_in_by: checkedInBy,
      usher_name: usherName ?? null,
      usher_email: usherEmail ?? null,
    }

    // Only set first_checkin_at and photo_url if this is the first check-in
    // Check if guest has been checked in before
    const { data: existingGuest } = await client
      .from("guests")
      .select("first_checkin_at")
      .eq("event_id", eventId)
      .eq("unique_code", uniqueCode)
      .maybeSingle()

    if (existingGuest && !existingGuest.first_checkin_at) {
      // First check-in
      updatePayload.first_checkin_at = checkedInAt
      if (photoUrl) {
        updatePayload.photo_url = photoUrl
      }
    }

    const { data, error } = await client
      .from("guests")
      .update(updatePayload)
      .eq("event_id", eventId)
      .eq("unique_code", uniqueCode)
      .eq("checked_in", false)
      .select(
        `
          id,
          event_id,
          name,
          email,
          phone,
          seating_area,
          cuisine_choice,
          unique_code,
          checked_in,
          checked_in_at,
          checked_in_by,
          usher_name,
          usher_email,
          attended,
          invitation_sent,
          invitation_sent_at,
          photo_url,
          first_checkin_at,
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
            phone,
            seating_area,
            cuisine_choice,
            unique_code,
            checked_in,
            checked_in_at,
            checked_in_by,
            usher_name,
            usher_email,
            attended,
            invitation_sent,
            invitation_sent_at,
            photo_url,
            first_checkin_at,
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

  static async getUsherStatistics(eventId: string) {
    const client = await this.getClient()
    
    const { data, error } = await client
      .from("guests")
      .select("usher_name, usher_email, checked_in_at")
      .eq("event_id", eventId)
      .eq("checked_in", true)
      .not("usher_email", "is", null)

    if (error) {
      throw error
    }

    // Aggregate statistics by usher
    const statsMap = new Map<string, {
      usher_name: string | null
      usher_email: string
      total_scans: number
      first_scan_at: string | null
      last_scan_at: string | null
    }>()

    data.forEach((row: any) => {
      const email = row.usher_email
      if (!email) return

      if (!statsMap.has(email)) {
        statsMap.set(email, {
          usher_name: row.usher_name,
          usher_email: email,
          total_scans: 0,
          first_scan_at: row.checked_in_at,
          last_scan_at: row.checked_in_at,
        })
      }

      const stats = statsMap.get(email)!
      stats.total_scans++
      
      if (row.checked_in_at) {
        if (!stats.first_scan_at || row.checked_in_at < stats.first_scan_at) {
          stats.first_scan_at = row.checked_in_at
        }
        if (!stats.last_scan_at || row.checked_in_at > stats.last_scan_at) {
          stats.last_scan_at = row.checked_in_at
        }
      }
    })

    return Array.from(statsMap.values()).sort((a, b) => b.total_scans - a.total_scans)
  }

  static async markInvitationSent(guestIds: string[]) {
    if (guestIds.length === 0) {
      return []
    }

    const client = await this.getClient()
    const invitationSentAt = new Date().toISOString()

    const { data, error } = await client
      .from("guests")
      .update({
        invitation_sent: true,
        invitation_sent_at: invitationSentAt,
      })
      .in("id", guestIds)
      .select(
        `
          id,
          event_id,
          name,
          email,
          phone,
          unique_code,
          checked_in,
          checked_in_at,
          checked_in_by,
          usher_name,
          usher_email,
          attended,
          invitation_sent,
          invitation_sent_at,
          photo_url,
          first_checkin_at,
          created_at,
          updated_at
        `,
      )

    if (error) {
      throw error
    }

    return (data ?? []).map((row) => this.serializeGuest(row as SupabaseGuestRow))
  }

  static async markGuestsAsAttended(eventId: string) {
    const client = await this.getClient()

    const { data, error } = await client
      .from("guests")
      .update({
        attended: true,
      })
      .eq("event_id", eventId)
      .eq("checked_in", true)
      .select(
        `
          id,
          event_id,
          name,
          email,
          phone,
          unique_code,
          checked_in,
          checked_in_at,
          checked_in_by,
          usher_name,
          usher_email,
          attended,
          invitation_sent,
          invitation_sent_at,
          photo_url,
          first_checkin_at,
          created_at,
          updated_at
        `,
      )

    if (error) {
      throw error
    }

    return (data ?? []).map((row) => this.serializeGuest(row as SupabaseGuestRow))
  }
}