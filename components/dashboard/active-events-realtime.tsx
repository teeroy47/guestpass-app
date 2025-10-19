"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useEvents } from "@/lib/events-context"
import { useGuests } from "@/lib/guests-context"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"
import { CheckCircle, Users, Activity, Bell, TrendingUp, Clock, UserCheck } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface CheckInNotification {
  guestName: string
  usherName: string | null
  eventTitle: string
  timestamp: number
}

export function ActiveEventsRealtime() {
  const { events } = useEvents()
  const { guests, getGuestsByEvent } = useGuests()
  const { toast } = useToast()
  const [recentCheckIns, setRecentCheckIns] = useState<CheckInNotification[]>([])
  const lastCheckInCountRef = useRef<Map<string, number>>(new Map())
  const supabaseClient = useRef(createBrowserSupabaseClient())

  // Filter active events only
  const activeEvents = events.filter((e) => e.status === "active")

  // Calculate stats for each active event
  const activeEventStats = activeEvents.map((event) => {
    const eventGuests = getGuestsByEvent(event.id)
    const checkedInCount = eventGuests.filter((g) => g.checkedIn).length
    const totalGuests = eventGuests.length
    const attendanceRate = totalGuests > 0 ? (checkedInCount / totalGuests) * 100 : 0

    return {
      event,
      checkedInCount,
      totalGuests,
      attendanceRate,
    }
  })

  // Set up real-time subscription for guest check-ins (optimized for multiple concurrent events)
  useEffect(() => {
    if (activeEvents.length === 0) return

    const activeEventIds = activeEvents.map((e) => e.id)
    
    // Create a single channel for all active events (more efficient than multiple channels)
    const channel = supabaseClient.current
      .channel("active-events-checkins", {
        config: {
          broadcast: { self: false }, // Don't receive own broadcasts
          presence: { key: "" },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "guests",
          filter: `event_id=in.(${activeEventIds.join(",")})`,
        },
        (payload) => {
          const updatedGuest = payload.new as any
          const oldGuest = payload.old as any

          // Check if this is a new check-in (checked_in changed to true)
          if (updatedGuest.checked_in && oldGuest && !oldGuest.checked_in) {
            // Find which event this guest belongs to
            const eventId = updatedGuest.event_id
            const event = activeEvents.find((e) => e.id === eventId)

            if (event) {
              const usherInfo = updatedGuest.usher_name 
                ? ` by ${updatedGuest.usher_name}` 
                : ""
              
              // Show toast notification (throttled to prevent spam)
              toast({
                title: "✅ Guest Checked In",
                description: `${updatedGuest.name} has checked in to ${event.title}${usherInfo}`,
                duration: 2500, // Reduced from 3000 for faster dismissal
              })

              // Add to recent check-ins list (optimized with timestamp-based deduplication)
              setRecentCheckIns((prev) => {
                // Prevent duplicate entries within 1 second
                const isDuplicate = prev.some(
                  (item) =>
                    item.guestName === updatedGuest.name &&
                    item.eventTitle === event.title &&
                    Date.now() - item.timestamp < 1000
                )

                if (isDuplicate) return prev

                return [
                  {
                    guestName: updatedGuest.name,
                    usherName: updatedGuest.usher_name || null,
                    eventTitle: event.title,
                    timestamp: Date.now(),
                  },
                  ...prev.slice(0, 4), // Keep only last 5
                ]
              })
            }
          }
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Real-time analytics connected")
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Real-time analytics connection error:", err)
          // Attempt to reconnect after 3 seconds
          setTimeout(() => {
            console.log("🔄 Attempting to reconnect real-time analytics...")
            channel.subscribe()
          }, 3000)
        } else if (status === "TIMED_OUT") {
          console.warn("⏱️ Real-time analytics connection timed out, reconnecting...")
          channel.subscribe()
        } else if (status === "CLOSED") {
          console.warn("🔌 Real-time analytics connection closed")
        }
      })

    // Cleanup subscription on unmount
    return () => {
      console.log("🧹 Cleaning up real-time analytics subscription")
      supabaseClient.current.removeChannel(channel)
    }
  }, [activeEvents, toast])

  // Auto-remove old notifications after 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setRecentCheckIns((prev) => prev.filter((n) => now - n.timestamp < 10000))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (activeEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Events</CardTitle>
          <CardDescription>Real-time check-in analytics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground">No active events at the moment</p>
            <p className="text-xs text-muted-foreground mt-1">
              Events marked as "Active" will appear here with live check-in updates
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary animate-pulse" />
              Active Events
            </CardTitle>
            <CardDescription>Real-time check-in analytics</CardDescription>
          </div>
          <Badge variant="default" className="animate-pulse">
            {activeEvents.length} Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recent Check-ins Notifications */}
        {recentCheckIns.length > 0 && (
          <div className="space-y-2 mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
              <Bell className="h-4 w-4" />
              Recent Check-ins
            </div>
            {recentCheckIns.map((checkIn, index) => (
              <div
                key={`${checkIn.guestName}-${checkIn.timestamp}`}
                className="flex items-center justify-between gap-2 text-sm animate-in fade-in slide-in-from-top-2"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-green-700 dark:text-green-300">
                      {checkIn.guestName}
                    </span>
                    {checkIn.usherName && (
                      <span className="text-xs text-muted-foreground ml-1">
                        by {checkIn.usherName}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {Math.floor((Date.now() - checkIn.timestamp) / 1000)}s ago
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Active Events List */}
        {activeEventStats.map(({ event, checkedInCount, totalGuests, attendanceRate }) => {
          const eventGuests = getGuestsByEvent(event.id)
          const recentCheckIns = eventGuests
            .filter((g) => g.checkedIn && g.checkedInAt)
            .sort((a, b) => new Date(b.checkedInAt!).getTime() - new Date(a.checkedInAt!).getTime())
            .slice(0, 5)
          
          const uniqueUshers = new Set(eventGuests.filter((g) => g.checkedIn && g.usherName).map((g) => g.usherName))
          
          return (
            <Popover key={event.id}>
              <PopoverTrigger asChild>
                <div className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.startsAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </p>
                    </div>
                    <Badge variant="default" className="shrink-0 animate-pulse">
                      Active
                    </Badge>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="text-2xl font-bold text-primary">{checkedInCount}</div>
                      <div className="text-xs text-muted-foreground">Checked In</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="text-2xl font-bold">{totalGuests - checkedInCount}</div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="text-2xl font-bold text-green-600">{attendanceRate.toFixed(0)}%</div>
                      <div className="text-xs text-muted-foreground">Rate</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>
                        {checkedInCount} / {totalGuests}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${attendanceRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Live Statistics
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Active Ushers:</span>
                      </div>
                      <span className="font-medium">{uniqueUshers.size}</span>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Avg. Rate:</span>
                      </div>
                      <span className="font-medium">{attendanceRate.toFixed(1)}%</span>
                    </div>
                  </div>

                  {recentCheckIns.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Recent Check-ins
                      </h4>
                      <div className="space-y-2">
                        {recentCheckIns.map((guest, idx) => (
                          <div key={guest.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                              <span className="truncate font-medium">{guest.name}</span>
                            </div>
                            <span className="text-muted-foreground flex-shrink-0 ml-2">
                              {Math.floor((Date.now() - new Date(guest.checkedInAt!).getTime()) / 60000)}m ago
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {uniqueUshers.size > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Active Ushers</h4>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(uniqueUshers).map((usher) => (
                          <Badge key={usher} variant="secondary" className="text-xs">
                            {usher}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )
        })}

        {/* Summary Stats */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Total Across All Active Events</span>
            </div>
            <div className="font-semibold">
              {activeEventStats.reduce((sum, stat) => sum + stat.checkedInCount, 0)} /{" "}
              {activeEventStats.reduce((sum, stat) => sum + stat.totalGuests, 0)} guests
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}