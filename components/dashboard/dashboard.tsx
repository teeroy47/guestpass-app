"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"

import { useEvents } from "@/lib/events-context"
import { useGuests } from "@/lib/guests-context"
import { useAuth } from "@/lib/auth-context"
import { EventList } from "@/components/events/event-list"
import { GuestUpload } from "@/components/guests/guest-upload"
import { GuestList } from "@/components/guests/guest-list"
import { QRCodeGenerator } from "@/components/qr/qr-code-generator"
import { QRScanner } from "@/components/scanner/qr-scanner"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"
import { ActiveEventsRealtime } from "@/components/dashboard/active-events-realtime"
import { ActiveScannerSessions } from "@/components/dashboard/active-scanner-sessions"
import { UsherStatistics } from "@/components/dashboard/usher-statistics"
import { UserProfile } from "@/components/profile/user-profile"
import { UserManagement } from "@/components/admin/user-management"
import { QrCode, Users, Calendar, Upload, Scan, Plus, BarChart3, LogOut, User, ShieldCheck } from "lucide-react"

export function Dashboard() {
  const { events, loading: eventsLoading } = useEvents()
  const { guests, loading: guestsLoading } = useGuests()
  const { user, signOut, displayName: authDisplayName, userRole } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [scannerOpen, setScannerOpen] = useState(false)
  const [selectedEventForScanning, setSelectedEventForScanning] = useState<string | null>(null)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  
  const isLoading = eventsLoading || guestsLoading

  // Use display name from auth context (which comes from database), fallback to email
  const displayName = authDisplayName ?? user?.email ?? "GuestPass User"
  // Use role from database (via context), fallback to app_metadata, then default to usher
  const role = (userRole ?? user?.app_metadata?.role ?? "usher") as "admin" | "usher"
  const isAdmin = role === "admin"
  const isSuperAdmin = user?.email?.toLowerCase() === "chiunyet@africau.edu"

  // Calculate stats
  const totalEvents = events.length
  const activeEvents = events.filter((e) => e.status === "active").length
  const totalGuests = guests.length
  const totalCheckedIn = guests.filter((g) => g.checkedIn).length
  const attendanceRate = totalGuests > 0 ? (totalCheckedIn / totalGuests) * 100 : 0
  
  // Calculate active scanners (guests checked in within the last 5 minutes)
  // This will be refreshed automatically when guests context updates
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  const activeScanners = new Set(
    guests
      .filter((g) => g.checkedIn && g.checkedInAt && new Date(g.checkedInAt) > fiveMinutesAgo)
      .map((g) => g.checkedInBy)
      .filter((by): by is string => !!by)
  ).size

  const openScanner = (eventId: string) => {
    setSelectedEventForScanning(eventId)
    setScannerOpen(true)
  }

  const closeScanner = () => {
    setScannerOpen(false)
    setSelectedEventForScanning(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <QrCode className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">guestPass</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Event Check-in System</p>
              </div>
            </div>

            <div className="relative shrink-0">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-foreground">{displayName}</p>
                  <div className="flex items-center justify-end space-x-2">
                    <Badge variant={isAdmin ? "default" : "secondary"}>{role}</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsAccountMenuOpen((prev) => !prev)}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>

              {isAccountMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-card p-4 shadow-lg">
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">Signed in as</p>
                      <p>{user?.email}</p>
                    </div>
                    <Button
                      className="w-full"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        signOut()
                          .then(() => {
                            toast({ title: "Signed out", description: "You have been signed out successfully." })
                          })
                          .catch((error) => {
                            console.error("Sign out failed", error)
                            toast({ title: "Sign out failed", description: "Please try again.", variant: "destructive" })
                          })
                          .finally(() => setIsAccountMenuOpen(false))
                      }}
                    >
                      Sign out
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 bg-muted/50">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="events" className="text-xs sm:text-sm">Events</TabsTrigger>
              {isAdmin && <TabsTrigger value="upload" className="text-xs sm:text-sm">Upload</TabsTrigger>}
              <TabsTrigger value="guests" className="text-xs sm:text-sm">Guests</TabsTrigger>
              <TabsTrigger value="qr-codes" className="text-xs sm:text-sm whitespace-nowrap">QR Codes</TabsTrigger>
              <TabsTrigger value="scanner" className="text-xs sm:text-sm">Scanner</TabsTrigger>
              {isAdmin && <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>}
              {isSuperAdmin && <TabsTrigger value="users" className="text-xs sm:text-sm">Users</TabsTrigger>}
              <TabsTrigger value="profile" className="text-xs sm:text-sm">Profile</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalEvents}</div>
                      <p className="text-xs text-muted-foreground">{activeEvents} currently active</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalGuests.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Across all events</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Checked In</CardTitle>
                      <QrCode className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalCheckedIn.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">{attendanceRate.toFixed(1)}% attendance rate</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Scanners</CardTitle>
                      <Scan className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{activeScanners}</div>
                      <p className="text-xs text-muted-foreground">Active in last 5 minutes</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {!isLoading && (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  <ActiveEventsRealtime />

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Common tasks for event management</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {isAdmin && (
                        <Button
                          className="w-full justify-start"
                          variant="outline"
                          onClick={() => setActiveTab("events")}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create New Event
                        </Button>
                      )}
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                        onClick={() => setActiveTab("scanner")}
                      >
                        <Scan className="mr-2 h-4 w-4" />
                        Start Scanning
                      </Button>
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                        onClick={() => setActiveTab("qr-codes")}
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        Generate QR Codes
                      </Button>
                      {isAdmin && (
                        <>
                          <Button
                            className="w-full justify-start"
                            variant="outline"
                            onClick={() => setActiveTab("upload")}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Guest List
                          </Button>
                          <Button
                            className="w-full justify-start"
                            variant="outline"
                            onClick={() => setActiveTab("analytics")}
                          >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            View Analytics
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Active Scanner Sessions - Admin Only */}
                {isAdmin && (
                  <div className="mt-6">
                    <ActiveScannerSessions />
                  </div>
                )}

                {/* Usher Statistics Section - Quick Access */}
                <div className="mt-6">
                  <UsherStatistics />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="events">
            <EventList onNavigateToGuests={() => setActiveTab("guests")} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="upload">
              <GuestUpload />
            </TabsContent>
          )}

          <TabsContent value="guests">
            <GuestList />
          </TabsContent>

          <TabsContent value="qr-codes">
            <QRCodeGenerator />
          </TabsContent>

          <TabsContent value="scanner">
            <Card>
              <CardHeader>
                <CardTitle>QR Code Scanner</CardTitle>
                <CardDescription>Select an event to start scanning guest QR codes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeEvents > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {events
                        .filter((e) => e.status === "active")
                        .map((event) => (
                          <Card
                            key={event.id}
                            className="cursor-pointer hover:bg-accent"
                            onClick={() => openScanner(event.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-medium">{event.title}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(event.startsAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}
                                  </p>
                                </div>
                                <Button size="sm">
                                  <Scan className="h-4 w-4 mr-2" />
                                  Scan
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Scan className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Active Events</h3>
                      <p className="text-muted-foreground">Create an active event to start scanning</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="analytics" className="space-y-6">
              <AnalyticsDashboard />
              
              {/* Usher Statistics Section */}
              <div className="mt-6">
                <UsherStatistics />
              </div>
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
          )}

          <TabsContent value="profile">
            <UserProfile />
          </TabsContent>
        </Tabs>
      </main>

      {/* Scanner Modal */}
      {scannerOpen && selectedEventForScanning && (
        <QRScanner eventId={selectedEventForScanning} onClose={closeScanner} />
      )}
    </div>
  )
}
