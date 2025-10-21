"use client"

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react"
import { EventService, type CreateEventInput } from "./event-service"
import { createBrowserSupabaseClient } from "./supabase/browser"

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
  refreshEventsSilently: () => Promise<void>
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
  const supabaseClient = useRef(createBrowserSupabaseClient())
  const isMountedRef = useRef(true)

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

  // Set up real-time subscription for event updates
  useEffect(() => {
    isMountedRef.current = true
    console.log("🔄 Setting up real-time event subscription")
    
    const channel = supabaseClient.current
      .channel("events-realtime", {
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
          table: "events",
        },
        (payload) => {
          // Only update state if component is still mounted
          if (!isMountedRef.current) return
          
          console.log("📡 Real-time event update received:", payload.eventType)
          
          if (payload.eventType === "INSERT") {
            const newEvent = payload.new as any
            setEvents((prev) => {
              // Avoid duplicates
              if (prev.some((e) => e.id === newEvent.id)) return prev
              return [...prev, {
                id: newEvent.id,
                title: newEvent.title,
                description: newEvent.description,
                startsAt: newEvent.starts_at,
                venue: newEvent.venue,
                ownerId: newEvent.owner_id,
                createdAt: newEvent.created_at,
                totalGuests: newEvent.total_guests || 0,
                checkedInGuests: newEvent.checked_in_guests || 0,
                status: newEvent.status as Event["status"],
              }]
            })
          } else if (payload.eventType === "UPDATE") {
            const updatedEvent = payload.new as any
            setEvents((prev) =>
              prev.map((event) =>
                event.id === updatedEvent.id
                  ? {
                      ...event,
                      title: updatedEvent.title,
                      description: updatedEvent.description,
                      startsAt: updatedEvent.starts_at,
                      venue: updatedEvent.venue,
                      totalGuests: updatedEvent.total_guests || 0,
                      checkedInGuests: updatedEvent.checked_in_guests || 0,
                      status: updatedEvent.status as Event["status"],
                    }
                  : event
              )
            )
          } else if (payload.eventType === "DELETE") {
            const deletedEvent = payload.old as any
            setEvents((prev) => prev.filter((event) => event.id !== deletedEvent.id))
          }
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Real-time event subscription connected")
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Real-time event subscription error:", err)
          setTimeout(() => {
            if (isMountedRef.current) {
              console.log("🔄 Attempting to reconnect event subscription...")
              channel.subscribe()
            }
          }, 3000)
        } else if (status === "TIMED_OUT") {
          console.warn("⏱️ Real-time event subscription timed out, reconnecting...")
          if (isMountedRef.current) {
            channel.subscribe()
          }
        } else if (status === "CLOSED") {
          console.warn("🔌 Real-time event subscription closed")
        }
      })

    return () => {
      isMountedRef.current = false
      console.log("🧹 Cleaning up real-time event subscription")
      supabaseClient.current.removeChannel(channel)
    }
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

  const refreshEventsSilently = async () => {
    try {
      // Fetch events without setting loading state
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
      console.error("Failed to silently refresh events", error)
    }
  }

  const value = {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    getEvent,
    refreshEvents,
    refreshEventsSilently,
  }

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
}
