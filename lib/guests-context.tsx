"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { GuestService } from "./guest-service"
import { useEvents } from "./events-context"

export interface Guest {
  id: string
  eventId: string
  name: string
  email?: string
  uniqueCode: string
  checkedIn: boolean
  checkedInAt?: string
  checkedInBy?: string
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
  ) => Promise<{
    status: "ok" | "already" | "not_found"
    guest?: Guest
    checkedInAt?: string
  }>
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
  const { events, refreshEvents } = useEvents()
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)

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
    }
  }, [events])

  useEffect(() => {
    refreshGuests()
  }, [refreshGuests])

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
      await refreshEvents()
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
      await refreshEvents()
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
      await refreshEvents()
    } catch (error) {
      console.error("Failed to update guest", error)
    }
  }

  const deleteGuest = async (id: string) => {
    try {
      await GuestService.deleteGuest(id)
      setGuests((prev) => prev.filter((guest) => guest.id !== id))
      await refreshEvents()
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
      await refreshEvents()
    } catch (error) {
      console.error("Failed to delete guests in bulk", error)
      throw error
    }
  }

  const checkInGuest = async (eventId: string, uniqueCode: string, checkedInBy: string) => {
    try {
      const result = await GuestService.checkInGuest(eventId, uniqueCode, checkedInBy)

      if (result.status === "ok" && result.guest) {
        setGuests((prev) =>
          prev.map((guest) =>
            guest.id === result.guest?.id
              ? {
                  ...guest,
                  checkedIn: true,
                  checkedInAt: result.guest?.checkedInAt,
                  checkedInBy: result.guest?.checkedInBy,
                }
              : guest,
          ),
        )
        await refreshEvents()
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
  }

  return <GuestsContext.Provider value={value}>{children}</GuestsContext.Provider>
}
