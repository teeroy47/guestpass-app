"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useEvents } from "@/lib/events-context"
import { useGuests } from "@/lib/guests-context"
import { useAuth } from "@/lib/auth-context"
import { Search, MoreHorizontal, Download, Users, CheckCircle, Clock, Trash2 } from "lucide-react"

export function GuestList() {
  const { events } = useEvents()
  const { guests, deleteGuest } = useGuests()
  const { user } = useAuth()
  const role = (user?.app_metadata?.role ?? "usher") as "admin" | "usher"
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const isAdmin = role === "admin"

  const selectedEvent = events.find((e) => e.id === selectedEventId)
  const eventGuests = useMemo(() => {
    if (!selectedEventId) return []
    return guests.filter((guest) => guest.eventId === selectedEventId)
  }, [guests, selectedEventId])

  const filteredGuests = useMemo(() => {
    return eventGuests.filter((guest) => {
      const matchesSearch =
        guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.uniqueCode.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "checked-in" && guest.checkedIn) ||
        (statusFilter === "not-checked-in" && !guest.checkedIn)

      return matchesSearch && matchesStatus
    })
  }, [eventGuests, searchTerm, statusFilter])

  const stats = useMemo(() => {
    const total = eventGuests.length
    const checkedIn = eventGuests.filter((g) => g.checkedIn).length
    const notCheckedIn = total - checkedIn
    const attendanceRate = total > 0 ? (checkedIn / total) * 100 : 0

    return { total, checkedIn, notCheckedIn, attendanceRate }
  }, [eventGuests])

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleDeleteGuest = async (guestId: string) => {
    if (confirm("Are you sure you want to delete this guest? This action cannot be undone.")) {
      await deleteGuest(guestId)
    }
  }

  const exportGuestList = () => {
    if (!selectedEvent || eventGuests.length === 0) return

    const csvHeaders = ["Name", "Email", "Unique Code", "Checked In", "Check-in Time"]
    const csvRows = eventGuests.map((guest) => [
      guest.name,
      guest.email || "",
      guest.uniqueCode,
      guest.checkedIn ? "Yes" : "No",
      guest.checkedInAt ? formatDateTime(guest.checkedInAt) : "",
    ])

    const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedEvent.title.replace(/[^a-zA-Z0-9]/g, "-")}-guest-list.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Guest Management</h2>
          <p className="text-muted-foreground">View and manage event attendees</p>
        </div>
      </div>

      {/* Event Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Event</CardTitle>
          <CardDescription>Choose an event to view its guest list</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Choose an event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title} ({event.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedEventId && (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Checked In</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.checkedIn}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Not Checked In</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.notCheckedIn}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.attendanceRate.toFixed(1)}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Guest List ({filteredGuests.length})
                </CardTitle>
                <Button onClick={exportGuestList} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search guests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Guests</SelectItem>
                    <SelectItem value="checked-in">Checked In</SelectItem>
                    <SelectItem value="not-checked-in">Not Checked In</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Guest Table */}
              {filteredGuests.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No guests found</h3>
                  <p className="text-muted-foreground">
                    {eventGuests.length === 0
                      ? "This event doesn't have any guests yet."
                      : "Try adjusting your search or filter criteria."}
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check-in Time</TableHead>
                        {isAdmin && <TableHead className="w-[50px]"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGuests.map((guest) => (
                        <TableRow key={guest.id}>
                          <TableCell className="font-medium">{guest.name}</TableCell>
                          <TableCell className="text-muted-foreground">{guest.email || "—"}</TableCell>
                          <TableCell className="font-mono text-sm">{guest.uniqueCode}</TableCell>
                          <TableCell>
                            <Badge variant={guest.checkedIn ? "default" : "secondary"}>
                              {guest.checkedIn ? "Checked In" : "Not Checked In"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {guest.checkedInAt ? formatDateTime(guest.checkedInAt) : "—"}
                          </TableCell>
                          {isAdmin && (
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteGuest(guest.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Guest
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
