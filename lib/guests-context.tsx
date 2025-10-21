"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef, type ReactNode } from "react"
import { GuestService } from "./guest-service"
import { useEvents } from "./events-context"
import { createBrowserSupabaseClient } from "./supabase/browser"

export interface Guest {
  id: string
  eventId: string
  name: string
  email?: string
  phone?: string
  seatingArea?: 'Reserved' | 'Free Seating'
  cuisineChoice?: 'Traditional' | 'Western'
  uniqueCode: string
  checkedIn: boolean
  checkedInAt?: string
  checkedInBy?: string
  usherName?: string
  usherEmail?: string
  attended: boolean
  photoUrl?: string
  firstCheckinAt?: string
  createdAt: string
}

interface GuestsContextType {
  guests: Guest[]
  loading: boolean
  getGuestsByEvent: (eventId: string) => Guest[]
  addGuest: (guest: Omit<Guest, "id" | "createdAt" | "checkedIn" | "uniqueCode">) => Promise<Guest | null>
  addGuestsBulk: (guests: Omit<Guest, "id" | "createdAt" | "checkedIn" | "uniqueCode">[]) => Promise<{
    id: string
    uniqueCode: string
    name: string
    email?: string
  }[]>
  updateGuest: (id: string, updates: Partial<Guest>) => Promise<void>
  deleteGuest: (id: string) => Promise<void>
  deleteGuestsBulk: (ids: string[]) => Promise<void>
  checkInGuest: (
    eventId: string,
    uniqueCode: string,
    checkedInBy: string,
    usherName?: string,
    usherEmail?: string,
    photoUrl?: string,
  ) => Promise<{
    status: "ok" | "already" | "not_found"
    guest?: Guest
    checkedInAt?: string
  }>
  refreshGuests: () => Promise<void>
}

const GuestsContext = createContext<GuestsContextType | undefined>(undefined)

export function useGuests() {
  const context = useContext(GuestsContext)
  if (context === undefined) {
    throw new Error("useGuests must be used within a GuestsProvider")
  }
  return context
}

export function GuestsProvider({ children }: { children: ReactNode }) {
  const { events, refreshEventsSilently } = useEvents()
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)
  const supabaseClient = useRef(createBrowserSupabaseClient())
  const isMountedRef = useRef(true)

  const refreshGuests = useCallback(async () => {
    setLoading(true)
    try {
      const allGuests: Guest[] = []
      for (const event of events) {
        const eventGuests = await GuestService.listGuestsByEvent(event.id)
        allGuests.push(...eventGuests)
      }
      setGuests(allGuests)
    } catch (error) {
      console.error("Failed to load guests", error)
    } finally {
      setLoading(false)
      setHasInitiallyLoaded(true)
    }
  }, [events])

  // Refresh guests when events are loaded
  useEffect(() => {
    // Only refresh if we have events and haven't loaded yet, OR if events changed
    if (events.length > 0 && !hasInitiallyLoaded) {
      refreshGuests()
    }
  }, [events.length, refreshGuests, hasInitiallyLoaded])

  // NOTE: Removed 30-second polling interval - now relying solely on real-time subscriptions
  // for guest updates. This prevents unnecessary page refreshes.

  // Set up real-time subscription for guest updates
  useEffect(() => {
    if (events.length === 0) return

    isMountedRef.current = true
    const eventIds = events.map((e) => e.id)
    
    console.log("🔄 Setting up real-time guest subscription for", eventIds.length, "events")
    
    const channel = supabaseClient.current
      .channel("guests-realtime", {
        config: {
          broadcast: { self: false },
          presence: { key: "" },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "guests",
          filter: `event_id=in.(${eventIds.join(",")})`,
        },
        (payload) => {
          // Only update state if component is still mounted
          if (!isMountedRef.current) return
          
          console.log("📡 Real-time guest update received:", payload.eventType)
          
          if (payload.eventType === "INSERT") {
            const newGuest = payload.new as any
            setGuests((prev) => {
              // Avoid duplicates
              if (prev.some((g) => g.id === newGuest.id)) return prev
              return [...prev, {
                id: newGuest.id,
                eventId: newGuest.event_id,
                name: newGuest.name,
                email: newGuest.email,
                phone: newGuest.phone,
                seatingArea: newGuest.seating_area,
                cuisineChoice: newGuest.cuisine_choice,
                uniqueCode: newGuest.unique_code,
                checkedIn: newGuest.checked_in,
                checkedInAt: newGuest.checked_in_at,
                checkedInBy: newGuest.checked_in_by,
                usherName: newGuest.usher_name,
                usherEmail: newGuest.usher_email,
                attended: newGuest.attended,
                photoUrl: newGuest.photo_url,
                firstCheckinAt: newGuest.first_checkin_at,
                createdAt: newGuest.created_at,
              }]
            })
            // Refresh events silently to update counts without showing loading state
            refreshEventsSilently()
          } else if (payload.eventType === "UPDATE") {
            const updatedGuest = payload.new as any
            setGuests((prev) =>
              prev.map((guest) =>
                guest.id === updatedGuest.id
                  ? {
                      ...guest,
                      name: updatedGuest.name,
                      email: updatedGuest.email,
                      phone: updatedGuest.phone,
                      seatingArea: updatedGuest.seating_area,
                      cuisineChoice: updatedGuest.cuisine_choice,
                      checkedIn: updatedGuest.checked_in,
                      checkedInAt: updatedGuest.checked_in_at,
                      checkedInBy: updatedGuest.checked_in_by,
                      usherName: updatedGuest.usher_name,
                      usherEmail: updatedGuest.usher_email,
                      attended: updatedGuest.attended,
                      photoUrl: updatedGuest.photo_url,
                      firstCheckinAt: updatedGuest.first_checkin_at,
                    }
                  : guest
              )
            )
            // Refresh events silently to update counts without showing loading state
            refreshEventsSilently()
          } else if (payload.eventType === "DELETE") {
            const deletedGuest = payload.old as any
            setGuests((prev) => prev.filter((guest) => guest.id !== deletedGuest.id))
            // Refresh events silently to update counts without showing loading state
            refreshEventsSilently()
          }
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Real-time guest subscription connected")
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Real-time guest subscription error:", err)
          setTimeout(() => {
            if (isMountedRef.current) {
              console.log("🔄 Attempting to reconnect guest subscription...")
              channel.subscribe()
            }
          }, 3000)
        } else if (status === "TIMED_OUT") {
          console.warn("⏱️ Real-time guest subscription timed out, reconnecting...")
          if (isMountedRef.current) {
            channel.subscribe()
          }
        } else if (status === "CLOSED") {
          console.warn("🔌 Real-time guest subscription closed")
        }
      })

    return () => {
      isMountedRef.current = false
      console.log("🧹 Cleaning up real-time guest subscription")
      supabaseClient.current.removeChannel(channel)
    }
  }, [events, refreshEventsSilently])

  const getGuestsByEvent = useMemo(
    () =>
      (eventId: string) => {
        return guests.filter((guest) => guest.eventId === eventId)
      },
    [guests],
  )

  const addGuest = async (guestData: Omit<Guest, "id" | "createdAt" | "checkedIn" | "uniqueCode">) => {
    try {
      // Check for duplicate guest (same name and email for the same event)
      const duplicate = guests.find(
        (g) =>
          g.eventId === guestData.eventId &&
          g.name.toLowerCase() === guestData.name.toLowerCase() &&
          (guestData.email ? g.email?.toLowerCase() === guestData.email.toLowerCase() : !g.email)
      )

      if (duplicate) {
        throw new Error("A guest with the same name and email already exists for this event.")
      }

      const created = await GuestService.createGuest({
        eventId: guestData.eventId,
        name: guestData.name,
        email: guestData.email,
        checkedInBy: guestData.checkedInBy,
      })

      if (!created) return null

      const guest: Guest = {
        ...guestData,
        id: created.id,
        createdAt: created.createdAt,
        uniqueCode: created.uniqueCode,
        checkedIn: created.checkedIn,
        checkedInAt: created.checkedInAt,
      }

      setGuests((prev) => [...prev, guest])
      await refreshEventsSilently()
      return guest
    } catch (error) {
      console.error("Failed to create guest", error)
      throw error
    }
  }

  const addGuestsBulk = async (guestsData: Omit<Guest, "id" | "createdAt" | "checkedIn" | "uniqueCode">[]) => {
    try {
      if (guestsData.length === 0) return []

      const eventId = guestsData[0]?.eventId
      if (!eventId) return []

      // Filter out duplicates before sending to the server
      const existingGuests = guests.filter((g) => g.eventId === eventId)
      const uniqueGuests = guestsData.filter((newGuest) => {
        return !existingGuests.some(
          (existing) =>
            existing.name.toLowerCase() === newGuest.name.toLowerCase() &&
            (newGuest.email ? existing.email?.toLowerCase() === newGuest.email.toLowerCase() : !existing.email)
        )
      })

      if (uniqueGuests.length === 0) {
        throw new Error("All guests already exist for this event.")
      }

      if (uniqueGuests.length < guestsData.length) {
        console.warn(`Skipped ${guestsData.length - uniqueGuests.length} duplicate guests`)
      }

      const created = await GuestService.createGuestsBulk(eventId, uniqueGuests)

      const newGuests: Guest[] = created.map((item) => {
        const source = uniqueGuests.find((guest) => guest.name === item.name && guest.email === item.email)
        return {
          id: item.id,
          eventId,
          name: item.name,
          email: item.email,
          uniqueCode: item.uniqueCode,
          checkedIn: false,
          createdAt: new Date().toISOString(),
        }
      })

      setGuests((prev) => [...prev, ...newGuests])
      await refreshEventsSilently()
      return created
    } catch (error) {
      console.error("Failed to create guests bulk", error)
      throw error
    }
  }

  const updateGuest = async (id: string, updates: Partial<Guest>) => {
    try {
      const updated = await GuestService.updateGuest(id, updates)

      if (!updated) return

      setGuests((prev) =>
        prev.map((guest) =>
          guest.id === id
            ? {
                ...guest,
                ...updated,
              }
            : guest,
        ),
      )
      await refreshEventsSilently()
    } catch (error) {
      console.error("Failed to update guest", error)
    }
  }

  const deleteGuest = async (id: string) => {
    try {
      await GuestService.deleteGuest(id)
      setGuests((prev) => prev.filter((guest) => guest.id !== id))
      await refreshEventsSilently()
    } catch (error) {
      console.error("Failed to delete guest", error)
      throw error
    }
  }

  const deleteGuestsBulk = async (ids: string[]) => {
    try {
      // Delete all guests in parallel
      await Promise.all(ids.map((id) => GuestService.deleteGuest(id)))
      setGuests((prev) => prev.filter((guest) => !ids.includes(guest.id)))
      await refreshEventsSilently()
    } catch (error) {
      console.error("Failed to delete guests in bulk", error)
      throw error
    }
  }

  const checkInGuest = async (eventId: string, uniqueCode: string, checkedInBy: string, usherName?: string, usherEmail?: string, photoUrl?: string) => {
    try {
      const result = await GuestService.checkInGuest(eventId, uniqueCode, checkedInBy, usherName, usherEmail, photoUrl)

      if (result.status === "ok" && result.guest) {
        setGuests((prev) =>
          prev.map((guest) =>
            guest.id === result.guest?.id
              ? {
                  ...guest,
                  checkedIn: true,
                  checkedInAt: result.guest?.checkedInAt,
                  checkedInBy: result.guest?.checkedInBy,
                  usherName: result.guest?.usherName,
                  usherEmail: result.guest?.usherEmail,
                  photoUrl: result.guest?.photoUrl,
                  firstCheckinAt: result.guest?.firstCheckinAt,
                }
              : guest,
          ),
        )
        await refreshEventsSilently()
      }

      return result
    } catch (error) {
      console.error("Failed to check in guest", error)
      return { status: "not_found" as const }
    }
  }

  const value = {
    guests,
    loading,
    getGuestsByEvent,
    addGuest,
    addGuestsBulk,
    updateGuest,
    deleteGuest,
    deleteGuestsBulk,
    checkInGuest,
    refreshGuests,
  }

  return <GuestsContext.Provider value={value}>{children}</GuestsContext.Provider>
}
