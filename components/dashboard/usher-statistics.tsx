"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEvents } from "@/lib/events-context"
import { useGuests } from "@/lib/guests-context"
import { Trophy, Users, Clock, TrendingUp, Award, User } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"

interface UsherStats {
  usherName: string
  usherEmail: string
  totalScans: number
  firstScanAt: string | null
  lastScanAt: string | null
  rank: number
}

export function UsherStatistics() {
  const { events } = useEvents()
  const { guests } = useGuests()
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [usherStats, setUsherStats] = useState<UsherStats[]>([])
  const supabaseClient = useRef(createBrowserSupabaseClient())

  // Filter events that have at least one checked-in guest
  const eventsWithCheckIns = events.filter((event) => {
    const eventGuests = guests.filter((g) => g.eventId === event.id)
    return eventGuests.some((g) => g.checkedIn)
  })

  // Auto-select first event with check-ins
  useEffect(() => {
    if (!selectedEventId && eventsWithCheckIns.length > 0) {
      setSelectedEventId(eventsWithCheckIns[0].id)
    }
  }, [eventsWithCheckIns, selectedEventId])

  // Calculate usher statistics for selected event
  useEffect(() => {
    if (!selectedEventId) {
      setUsherStats([])
      return
    }

    const eventGuests = guests.filter(
      (g) => g.eventId === selectedEventId && g.checkedIn && g.usherEmail
    )

    // Group by usher
    const statsMap = new Map<string, {
      usherName: string
      usherEmail: string
      totalScans: number
      firstScanAt: string | null
      lastScanAt: string | null
    }>()

    eventGuests.forEach((guest) => {
      const email = guest.usherEmail!
      
      if (!statsMap.has(email)) {
        statsMap.set(email, {
          usherName: guest.usherName || email,
          usherEmail: email,
          totalScans: 0,
          firstScanAt: guest.checkedInAt || null,
          lastScanAt: guest.checkedInAt || null,
        })
      }

      const stats = statsMap.get(email)!
      stats.totalScans++

      if (guest.checkedInAt) {
        if (!stats.firstScanAt || guest.checkedInAt < stats.firstScanAt) {
          stats.firstScanAt = guest.checkedInAt
        }
        if (!stats.lastScanAt || guest.checkedInAt > stats.lastScanAt) {
          stats.lastScanAt = guest.checkedInAt
        }
      }
    })

    // Convert to array and sort by total scans (descending)
    const statsArray = Array.from(statsMap.values())
      .sort((a, b) => b.totalScans - a.totalScans)
      .map((stat, index) => ({
        ...stat,
        rank: index + 1,
      }))

    setUsherStats(statsArray)
  }, [selectedEventId, guests])

  // Real-time subscription for instant updates when guests check in
  useEffect(() => {
    if (!selectedEventId) return

    // Subscribe to changes on the guests table for the selected event
    const channel = supabaseClient.current
      .channel(`usher-stats-${selectedEventId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "guests",
          filter: `event_id=eq.${selectedEventId}`,
        },
        (payload) => {
          const newGuest = payload.new as any
          const oldGuest = payload.old as any

          // Only process if checked_in status changed from false to true
          if (newGuest.checked_in && !oldGuest.checked_in && newGuest.usher_email) {
            console.log("🔴 Real-time check-in detected:", newGuest.name, "by", newGuest.usher_name)
            
            // Update usher stats in real-time
            setUsherStats((prevStats) => {
              const statsMap = new Map<string, UsherStats>()
              
              // Copy existing stats
              prevStats.forEach((stat) => {
                statsMap.set(stat.usherEmail, { ...stat })
              })

              // Update or add the usher who just scanned
              const usherEmail = newGuest.usher_email
              const usherName = newGuest.usher_name || usherEmail
              const checkedInAt = newGuest.checked_in_at

              if (statsMap.has(usherEmail)) {
                // Update existing usher stats
                const stat = statsMap.get(usherEmail)!
                stat.totalScans++
                
                if (checkedInAt) {
                  if (!stat.firstScanAt || checkedInAt < stat.firstScanAt) {
                    stat.firstScanAt = checkedInAt
                  }
                  if (!stat.lastScanAt || checkedInAt > stat.lastScanAt) {
                    stat.lastScanAt = checkedInAt
                  }
                }
              } else {
                // Add new usher
                statsMap.set(usherEmail, {
                  usherName,
                  usherEmail,
                  totalScans: 1,
                  firstScanAt: checkedInAt || null,
                  lastScanAt: checkedInAt || null,
                  rank: 0, // Will be recalculated below
                })
              }

              // Convert to array, sort, and assign ranks
              const statsArray = Array.from(statsMap.values())
                .sort((a, b) => b.totalScans - a.totalScans)
                .map((stat, index) => ({
                  ...stat,
                  rank: index + 1,
                }))

              return statsArray
            })
          }
        }
      )
      .subscribe()

    // Cleanup subscription on unmount or when selectedEventId changes
    return () => {
      supabaseClient.current.removeChannel(channel)
    }
  }, [selectedEventId])

  const selectedEvent = events.find((e) => e.id === selectedEventId)
  const topUsher = usherStats[0]
  const totalScans = usherStats.reduce((sum, stat) => sum + stat.totalScans, 0)

  if (eventsWithCheckIns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usher Statistics</CardTitle>
          <CardDescription>Track usher performance and scan activity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground">No check-ins recorded yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Usher statistics will appear here once guests start checking in
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
              <Trophy className="h-5 w-5 text-yellow-500" />
              Usher Statistics
            </CardTitle>
            <CardDescription>Track usher performance and scan activity</CardDescription>
          </div>
          {topUsher && (
            <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
              <Award className="h-3 w-3 mr-1" />
              Top Performer
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Event</label>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an event" />
            </SelectTrigger>
            <SelectContent>
              {eventsWithCheckIns.map((event) => {
                const eventGuestsCount = guests.filter(
                  (g) => g.eventId === event.id && g.checkedIn
                ).length
                return (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title} ({eventGuestsCount} check-ins)
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Stats */}
        {selectedEvent && (
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{usherStats.length}</div>
              <div className="text-xs text-muted-foreground">Active Ushers</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totalScans}</div>
              <div className="text-xs text-muted-foreground">Total Scans</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {topUsher ? topUsher.totalScans : 0}
              </div>
              <div className="text-xs text-muted-foreground">Top Score</div>
            </div>
          </div>
        )}

        {/* Top Usher Highlight */}
        {topUsher && (
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-yellow-900 dark:text-yellow-100">
                    {topUsher.usherName}
                  </h3>
                  <Badge variant="secondary" className="bg-yellow-200 text-yellow-900">
                    #1 Usher
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp className="h-4 w-4 text-yellow-600" />
                    <span className="font-semibold text-yellow-900 dark:text-yellow-100">
                      {topUsher.totalScans} scans
                    </span>
                  </div>
                  {topUsher.firstScanAt && (
                    <div className="flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-300">
                      <Clock className="h-3 w-3" />
                      Started: {new Date(topUsher.firstScanAt).toLocaleTimeString("en-US", { hour12: false })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usher Leaderboard */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Leaderboard
          </h3>
          <div className="space-y-2">
            {usherStats.map((stat) => {
              const isTopUsher = stat.rank === 1
              const percentage = topUsher ? (stat.totalScans / topUsher.totalScans) * 100 : 100

              return (
                <div
                  key={stat.usherEmail}
                  className={`p-3 rounded-lg border transition-all ${
                    isTopUsher
                      ? "bg-yellow-50 dark:bg-yellow-950/10 border-yellow-300 dark:border-yellow-700"
                      : "bg-muted/50 border-border hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          isTopUsher
                            ? "bg-yellow-500 text-white"
                            : stat.rank === 2
                            ? "bg-gray-400 text-white"
                            : stat.rank === 3
                            ? "bg-orange-400 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {stat.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{stat.usherName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isTopUsher ? "default" : "secondary"}>
                        {stat.totalScans} scans
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        isTopUsher ? "bg-yellow-500" : "bg-primary"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Time Info */}
                  {stat.firstScanAt && stat.lastScanAt && (
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(stat.firstScanAt).toLocaleTimeString("en-US", { hour12: false })}
                          {" → "}
                          {new Date(stat.lastScanAt).toLocaleTimeString("en-US", { hour12: false })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Guest Details - Who Scanned Who */}
        {selectedEventId && (
          <div className="space-y-2 pt-4 border-t">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Recent Scans
            </h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {guests
                .filter((g) => g.eventId === selectedEventId && g.checkedIn && g.usherEmail)
                .sort((a, b) => {
                  const timeA = a.checkedInAt ? new Date(a.checkedInAt).getTime() : 0
                  const timeB = b.checkedInAt ? new Date(b.checkedInAt).getTime() : 0
                  return timeB - timeA
                })
                .slice(0, 20)
                .map((guest) => (
                  <div
                    key={guest.id}
                    className="flex items-center justify-between p-2 rounded bg-muted/30 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{guest.name}</span>
                      <span className="text-muted-foreground"> scanned by </span>
                      <span className="font-medium text-primary">{guest.usherName}</span>
                    </div>
                    {guest.checkedInAt && (
                      <span className="text-muted-foreground ml-2 flex-shrink-0">
                        {new Date(guest.checkedInAt).toLocaleTimeString("en-US", { hour12: false })}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}