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
import { QrCode, Users, Calendar, Upload, Scan, Plus, BarChart3, LogOut } from "lucide-react"

export function Dashboard() {
  const { events } = useEvents()
  const { guests } = useGuests()
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [scannerOpen, setScannerOpen] = useState(false)
  const [selectedEventForScanning, setSelectedEventForScanning] = useState<string | null>(null)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? "GuestPass User"
  const role = (user?.app_metadata?.role ?? "usher") as "admin" | "usher"
  const isAdmin = role === "admin"

  // Calculate stats
  const totalEvents = events.length
  const activeEvents = events.filter((e) => e.status === "active").length
  const totalGuests = guests.length
  const totalCheckedIn = guests.filter((g) => g.checkedIn).length
  const attendanceRate = totalGuests > 0 ? (totalCheckedIn / totalGuests) * 100 : 0

  const openScanner = (eventId: string) => {
    setSelectedEventForScanning(eventId)
    setScannerOpen(true)
  }

  const closeScanner = () => {
    setScannerOpen(false)
    setSelectedEventForScanning(null)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <QrCode className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">guestPass</h1>
                <p className="text-sm text-muted-foreground">Event Check-in System</p>
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{displayName}</p>
                  <div className="flex items-center space-x-2">
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
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            {isAdmin && <TabsTrigger value="upload">Upload</TabsTrigger>}
            <TabsTrigger value="guests">Guests</TabsTrigger>
            <TabsTrigger value="qr-codes">QR Codes</TabsTrigger>
            <TabsTrigger value="scanner">Scanner</TabsTrigger>
            {isAdmin && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
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
                  <div className="text-2xl font-bold">5</div>
                  <p className="text-xs text-muted-foreground">Ushers currently scanning</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Events</CardTitle>
                  <CardDescription>Your latest event check-ins</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {events.slice(0, 3).map((event) => (
                    <div key={event.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{new Date(event.startsAt).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={event.status === "active" ? "default" : "secondary"}>{event.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks for event management</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isAdmin && (
                    <Button
                      className="w-full justify-start bg-transparent"
                      variant="outline"
                      onClick={() => setActiveTab("events")}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Event
                    </Button>
                  )}
                  <Button
                    className="w-full justify-start bg-transparent"
                    variant="outline"
                    onClick={() => setActiveTab("scanner")}
                  >
                    <Scan className="mr-2 h-4 w-4" />
                    Start Scanning
                  </Button>
                  <Button
                    className="w-full justify-start bg-transparent"
                    variant="outline"
                    onClick={() => setActiveTab("qr-codes")}
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    Generate QR Codes
                  </Button>
                  {isAdmin && (
                    <>
                      <Button
                        className="w-full justify-start bg-transparent"
                        variant="outline"
                        onClick={() => setActiveTab("upload")}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Guest List
                      </Button>
                      <Button
                        className="w-full justify-start bg-transparent"
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
          </TabsContent>

          <TabsContent value="events">
            <EventList />
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
                                    {new Date(event.startsAt).toLocaleDateString()}
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
            <TabsContent value="analytics">
              <AnalyticsDashboard />
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Scanner Modal */}
      {scannerOpen && selectedEventForScanning && (
        <QRScanner eventId={selectedEventForScanning} onClose={closeScanner} />
      )}
    </div>
  )
}
