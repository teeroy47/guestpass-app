import type { SupabaseClient } from "@supabase/supabase-js"
import { createBrowserSupabaseClient } from "./browser"

export interface ScannerSession {
  id: string
  userId: string
  eventId: string
  usherName: string
  usherEmail: string
  startedAt: string
  lastActivityAt: string
  endedAt?: string
  isActive: boolean
  scansCount: number
  createdAt: string
  updatedAt: string
}

export interface ScannerSessionRow {
  id: string
  user_id: string
  event_id: string
  usher_name: string
  usher_email: string
  started_at: string
  last_activity_at: string
  ended_at: string | null
  is_active: boolean
  scans_count: number
  created_at: string
  updated_at: string
}

export interface CreateScannerSessionInput {
  eventId: string
  usherName: string
  usherEmail: string
}

export class ScannerSessionService {
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

  private static serializeSession(row: ScannerSessionRow): ScannerSession {
    return {
      id: row.id,
      userId: row.user_id,
      eventId: row.event_id,
      usherName: row.usher_name,
      usherEmail: row.usher_email,
      startedAt: row.started_at,
      lastActivityAt: row.last_activity_at,
      endedAt: row.ended_at ?? undefined,
      isActive: row.is_active,
      scansCount: row.scans_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  /**
   * Start a new scanner session
   */
  static async startSession(input: CreateScannerSessionInput): Promise<ScannerSession> {
    const client = await this.getClient()
    
    // Get current user
    const { data: { user }, error: userError } = await client.auth.getUser()
    if (userError || !user) {
      throw new Error("User not authenticated")
    }

    // End any existing active sessions for this user and event
    await this.endUserEventSessions(user.id, input.eventId)

    // Create new session
    const { data, error } = await client
      .from("scanner_sessions")
      .insert({
        user_id: user.id,
        event_id: input.eventId,
        usher_name: input.usherName,
        usher_email: input.usherEmail,
        is_active: true,
        scans_count: 0,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return this.serializeSession(data as ScannerSessionRow)
  }

  /**
   * Update session activity (called on each scan)
   */
  static async updateActivity(sessionId: string): Promise<void> {
    const client = await this.getClient()

    const { error } = await client
      .from("scanner_sessions")
      .update({
        last_activity_at: new Date().toISOString(),
        scans_count: client.rpc("increment", { row_id: sessionId }),
      })
      .eq("id", sessionId)
      .eq("is_active", true)

    if (error) {
      console.error("Failed to update scanner session activity:", error)
    }
  }

  /**
   * Increment scan count for a session
   */
  static async incrementScanCount(sessionId: string): Promise<void> {
    console.log("🔍 [Scanner Service] incrementScanCount called with sessionId:", sessionId)
    
    const client = await this.getClient()
    console.log("🔍 [Scanner Service] Got Supabase client")

    console.log("🔍 [Scanner Service] Calling RPC: increment_scanner_session_scans")
    const { data, error } = await client.rpc("increment_scanner_session_scans", {
      session_id: sessionId,
    })

    console.log("🔍 [Scanner Service] RPC response:", { data, error })

    if (error) {
      console.warn("⚠️ [Scanner Service] RPC failed, using fallback increment. Error:", error)
      
      // Fallback to manual increment
      const { data: session, error: fetchError } = await client
        .from("scanner_sessions")
        .select("scans_count")
        .eq("id", sessionId)
        .single()

      console.log("🔍 [Scanner Service] Fetched session for fallback:", { session, fetchError })

      if (session) {
        const newCount = session.scans_count + 1
        console.log("🔍 [Scanner Service] Updating scan count from", session.scans_count, "to", newCount)
        
        const { error: updateError } = await client
          .from("scanner_sessions")
          .update({
            scans_count: newCount,
            last_activity_at: new Date().toISOString(),
          })
          .eq("id", sessionId)
        
        if (updateError) {
          console.error("❌ [Scanner Service] Fallback update failed:", updateError)
        } else {
          console.log("✅ [Scanner Service] Fallback update successful")
        }
      } else {
        console.error("❌ [Scanner Service] Could not fetch session for fallback")
      }
    } else {
      console.log("✅ [Scanner Service] RPC increment successful")
    }
  }

  /**
   * End a scanner session
   */
  static async endSession(sessionId: string): Promise<void> {
    const client = await this.getClient()

    const { error } = await client
      .from("scanner_sessions")
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
      })
      .eq("id", sessionId)

    if (error) {
      throw error
    }
  }

  /**
   * End all active sessions for a user and event
   */
  static async endUserEventSessions(userId: string, eventId: string): Promise<void> {
    const client = await this.getClient()

    const { error } = await client
      .from("scanner_sessions")
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("event_id", eventId)
      .eq("is_active", true)

    if (error) {
      console.error("Failed to end user event sessions:", error)
    }
  }

  /**
   * Get all active scanner sessions
   */
  static async getActiveSessions(): Promise<ScannerSession[]> {
    const client = await this.getClient()

    const { data, error } = await client
      .from("scanner_sessions")
      .select("*")
      .eq("is_active", true)
      .order("last_activity_at", { ascending: false })

    if (error) {
      throw error
    }

    return (data ?? []).map((row) => this.serializeSession(row as ScannerSessionRow))
  }

  /**
   * Get active sessions for a specific event
   */
  static async getActiveSessionsByEvent(eventId: string): Promise<ScannerSession[]> {
    const client = await this.getClient()

    const { data, error } = await client
      .from("scanner_sessions")
      .select("*")
      .eq("event_id", eventId)
      .eq("is_active", true)
      .order("last_activity_at", { ascending: false })

    if (error) {
      throw error
    }

    return (data ?? []).map((row) => this.serializeSession(row as ScannerSessionRow))
  }

  /**
   * Get current user's active session for an event
   */
  static async getCurrentUserSession(eventId: string): Promise<ScannerSession | null> {
    const client = await this.getClient()

    const { data: { user }, error: userError } = await client.auth.getUser()
    if (userError || !user) {
      return null
    }

    const { data, error } = await client
      .from("scanner_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("event_id", eventId)
      .eq("is_active", true)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return this.serializeSession(data as ScannerSessionRow)
  }

  /**
   * Subscribe to active sessions changes (real-time)
   */
  static subscribeToActiveSessions(
    callback: (sessions: ScannerSession[]) => void
  ): () => void {
    let client: SupabaseClient

    const setupSubscription = async () => {
      client = await this.getClient()

      const channel = client
        .channel("scanner_sessions_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "scanner_sessions",
            filter: "is_active=eq.true",
          },
          async () => {
            // Fetch updated active sessions
            const sessions = await this.getActiveSessions()
            callback(sessions)
          }
        )
        .subscribe()

      return () => {
        channel.unsubscribe()
      }
    }

    let unsubscribe: (() => void) | null = null
    setupSubscription().then((unsub) => {
      unsubscribe = unsub
    })

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }
}