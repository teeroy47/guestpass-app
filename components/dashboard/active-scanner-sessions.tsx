"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Scan, User, Clock, Activity } from "lucide-react"
import { ScannerSessionService, type ScannerSession } from "@/lib/supabase/scanner-session-service"
import { useEvents } from "@/lib/events-context"
import { formatDistanceToNow } from "date-fns"

export function ActiveScannerSessions() {
  const [sessions, setSessions] = useState<ScannerSession[]>([])
  const [loading, setLoading] = useState(true)
  const { events } = useEvents()

  // Fetch active sessions
  const fetchSessions = async () => {
    try {
      const activeSessions = await ScannerSessionService.getActiveSessions()
      setSessions(activeSessions)
    } catch (error) {
      console.error("Failed to fetch active scanner sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchSessions()
  }, [])

  // Real-time subscription - updates only when data changes
  useEffect(() => {
    const unsubscribe = ScannerSessionService.subscribeToActiveSessions((updatedSessions) => {
      setSessions(updatedSessions)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Get event name by ID
  const getEventName = (eventId: string) => {
    const event = events.find((e) => e.id === eventId)
    return event?.title ?? "Unknown Event"
  }

  // Calculate total scans across all sessions
  const totalScans = sessions.reduce((sum, session) => sum + session.scansCount, 0)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Active Scanner Sessions
          </CardTitle>
          <CardDescription>Real-time monitoring of active scanners</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
              <Scan className="h-5 w-5" />
              Active Scanner Sessions
            </CardTitle>
            <CardDescription>Real-time monitoring</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-lg px-3 py-1">
              {sessions.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Scan className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No active scanner sessions</p>
            <p className="text-xs mt-1">Sessions will appear here when ushers start scanning</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{sessions.length}</div>
                <div className="text-xs text-muted-foreground">Active Scanners</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{totalScans}</div>
                <div className="text-xs text-muted-foreground">Total Scans</div>
              </div>
            </div>

            {/* Active Sessions List */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {sessions.map((session) => {
                const lastActivity = new Date(session.lastActivityAt)
                const timeSinceActivity = formatDistanceToNow(lastActivity, { addSuffix: true })
                const isRecentlyActive = Date.now() - lastActivity.getTime() < 60000 // Active in last minute

                return (
                  <div
                    key={session.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isRecentlyActive
                        ? "border-green-500/50 bg-green-500/5"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Usher Info */}
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate">{session.usherName}</span>
                          {isRecentlyActive && (
                            <Badge variant="default" className="text-xs bg-green-500">
                              <Activity className="h-3 w-3 mr-1 animate-pulse" />
                              Active
                            </Badge>
                          )}
                        </div>

                        {/* Event Name */}
                        <div className="text-sm text-muted-foreground mb-2 truncate">
                          📍 {getEventName(session.eventId)}
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Scan className="h-3 w-3" />
                            <span>{session.scansCount} scans</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{timeSinceActivity}</span>
                          </div>
                        </div>
                      </div>

                      {/* Scan Count Badge */}
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-bold text-primary">{session.scansCount}</div>
                        <div className="text-xs text-muted-foreground">scans</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}