"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { EventService, type CreateEventInput } from "./event-service"

export interface Event {
  id: string
  title: string
  description?: string | null
  startsAt: string
  venue?: string | null
  ownerId: string
  createdAt: string
  totalGuests: number
  checkedInGuests: number
  status: "draft" | "active" | "completed"
}

interface EventsContextType {
  events: Event[]
  loading: boolean
  createEvent: (event: Omit<Event, "id" | "createdAt">) => Promise<Event | null>
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  getEvent: (id: string) => Event | undefined
  refreshEvents: () => Promise<void>
}

const EventsContext = createContext<EventsContextType | undefined>(undefined)

export function useEvents() {
  const context = useContext(EventsContext)
  if (context === undefined) {
    throw new Error("useEvents must be used within an EventsProvider")
  }
  return context
}

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const data = await EventService.listEvents()
      const now = new Date()
      
      // Map events and auto-update status based on date
      const mappedEvents = data.map((event) => {
        const eventDate = new Date(event.startsAt)
        // Consider event completed if it's more than 24 hours past the start time
        const completionThreshold = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000)
        
        let status = event.status as Event["status"]
        
        // Auto-complete events that have passed
        if (status === "active" && now > completionThreshold) {
          status = "completed"
          // Update in background (don't await to avoid blocking UI)
          EventService.updateEvent(event.id, { status: "completed" }).catch(err => 
            console.error("Failed to auto-complete event", event.id, err)
          )
        }
        
        return {
          ...event,
          status,
        }
      })
      
      setEvents(mappedEvents)
    } catch (error) {
      console.error("Failed to load events", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const createEvent = async (eventData: Omit<Event, "id" | "createdAt">) => {
    try {
      // Check for duplicate event (same title, venue, and start time)
      const duplicate = events.find(
        (e) =>
          e.title.toLowerCase() === eventData.title.toLowerCase() &&
          e.venue?.toLowerCase() === eventData.venue?.toLowerCase() &&
          new Date(e.startsAt).getTime() === new Date(eventData.startsAt).getTime()
      )

      if (duplicate) {
        throw new Error("An event with the same title, venue, and start time already exists.")
      }

      const payload: CreateEventInput = {
        title: eventData.title,
        description: eventData.description,
        startsAt: eventData.startsAt,
        venue: eventData.venue,
        status: eventData.status,
        ownerId: eventData.ownerId,
      }

      const created = await EventService.createEvent(payload)
      if (!created) {
        throw new Error("Supabase returned no event data")
      }

      const event: Event = {
        ...created,
        id: created.id,
        createdAt: created.createdAt,
        status: created.status as Event["status"],
      }

      setEvents((prev) => [...prev, event])
      return event
    } catch (error) {
      console.error("Failed to create event", error)
      throw error
    }
  }

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    try {
      await EventService.updateEvent(id, updates)
      setEvents((prev) =>
        prev.map((event) =>
          event.id === id
            ? {
                ...event,
                ...updates,
              }
            : event,
        ),
      )
    } catch (error) {
      console.error("Failed to update event", error)
    }
  }

  const deleteEvent = async (id: string) => {
    try {
      await EventService.deleteEvent(id)
      setEvents((prev) => prev.filter((event) => event.id !== id))
    } catch (error) {
      console.error("Failed to delete event", error)
    }
  }

  const getEvent = (id: string) => {
    return events.find((event) => event.id === id)
  }

  const refreshEvents = async () => {
    await fetchEvents()
  }

  const value = {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    getEvent,
    refreshEvents,
  }

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
}
