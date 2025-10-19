"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useEvents } from "@/lib/events-context"
import { useAuth } from "@/lib/auth-context"
import { CreateEventDialog } from "./create-event-dialog"
import { EventDetailsDialog } from "./event-details-dialog"
import { Camera, Calendar, MapPin, Users, Plus, Search, MoreHorizontal, Mail, Trash2, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { QRScanner } from "@/components/scanner/qr-scanner"
import { useToast } from "@/components/ui/use-toast"

export function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "default"
    case "completed":
      return "secondary"
    case "draft":
      return "outline"
    default:
      return "default"
  }
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

const EventCard = ({
  event,
  onEdit,
  onDelete,
  onOpenScanner,
  isSelected,
  onToggleSelect,
  selectionMode,
}: {
  event: any
  onEdit: (event: any) => void
  onDelete: (id: string) => void
  onOpenScanner: (eventId: string) => void
  isSelected: boolean
  onToggleSelect: (id: string) => void
  selectionMode: boolean
}) => {
  const handleCardClick = () => {
    if (selectionMode && event.isAdmin) {
      onToggleSelect(event.id)
    } else if (!selectionMode) {
      onEdit(event)
    }
  }

  return (
    <Card 
      className={`bg-card border-border hover:border-primary/50 transition-colors cursor-pointer ${isSelected ? 'ring-2 ring-primary' : ''}`} 
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {selectionMode && event.isAdmin && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect(event.id)}
                onClick={(e) => e.stopPropagation()}
                className="mt-1"
              />
            )}
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-1">{event.title}</CardTitle>
              <Badge variant={getStatusColor(event.status)} className="mt-2">
                {event.status}
              </Badge>
            </div>
          </div>
          {event.isAdmin && !selectionMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(event); }}>Edit Event</DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(event.id); }} className="text-destructive">
                  Delete Event
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {event.description && <CardDescription className="line-clamp-2">{event.description}</CardDescription>}

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            {formatDate(event.startsAt)}
          </div>
          {event.venue && (
            <div className="flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              <span className="line-clamp-1">{event.venue}</span>
            </div>
          )}
          <div className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            {event.checkedInGuests} / {event.totalGuests} checked in
          </div>
        </div>

        {event.totalGuests > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Attendance</span>
              <span>{Math.round((event.checkedInGuests / event.totalGuests) * 100)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
              <div
                className="h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${(event.checkedInGuests / event.totalGuests) * 100}%`,
                  backgroundColor: (() => {
                    const percentage = (event.checkedInGuests / event.totalGuests) * 100
                    if (percentage < 30) return 'rgb(239, 68, 68)' // red-500
                    if (percentage < 70) return 'rgb(234, 179, 8)' // yellow-500
                    return 'rgb(34, 197, 94)' // green-500
                  })()
                }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          {event.isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(event.id)
              }}
              className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              Delete Event
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onOpenScanner(event.id)
            }}
            className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Camera className="h-4 w-4 mr-1" />
            Scan
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function EventList() {
  const { events, loading, deleteEvent, updateEvent } = useEvents()
  const { user } = useAuth()
  const { toast } = useToast()
  const role = (user?.app_metadata?.role ?? "usher") as "admin" | "usher"
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showInviteBuilder, setShowInviteBuilder] = useState(false)
  const [scannerEventId, setScannerEventId] = useState<string | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const isAdmin = role === "admin"

  const filteredEvents = events.filter((event: any) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || event.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      await deleteEvent(eventId)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedEventIds.length === 0) return
    
    const confirmMessage = `Are you sure you want to delete ${selectedEventIds.length} event(s)? This action cannot be undone.`
    if (!confirm(confirmMessage)) return

    setIsDeleting(true)
    try {
      // Delete all selected events
      await Promise.all(selectedEventIds.map((id) => deleteEvent(id)))
      
      toast({
        title: "Events deleted",
        description: `Successfully deleted ${selectedEventIds.length} event(s)`,
      })
      
      // Reset selection
      setSelectedEventIds([])
      setSelectionMode(false)
    } catch (error) {
      console.error("Failed to delete events:", error)
      toast({
        title: "Delete failed",
        description: "Failed to delete some events. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkStatusChange = async (newStatus: "draft" | "active" | "completed") => {
    if (selectedEventIds.length === 0) return

    setIsUpdatingStatus(true)
    try {
      // Update status for all selected events
      await Promise.all(selectedEventIds.map((id) => updateEvent(id, { status: newStatus })))
      
      toast({
        title: "Status updated",
        description: `Successfully updated ${selectedEventIds.length} event(s) to ${newStatus}`,
      })
      
      // Reset selection
      setSelectedEventIds([])
      setSelectionMode(false)
    } catch (error) {
      console.error("Failed to update event status:", error)
      toast({
        title: "Update failed",
        description: "Failed to update some events. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const toggleSelectEvent = (eventId: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedEventIds.length === filteredEvents.length) {
      setSelectedEventIds([])
    } else {
      setSelectedEventIds(filteredEvents.map((e: any) => e.id))
    }
  }

  const onOpenScanner = (eventId: string) => {
    setScannerEventId(eventId)
  }

  const handleOpenGuestManager = () => {
    if (!events.length) {
      setShowCreateDialog(true)
      return
    }

    const targetEventId = selectedEvent ?? events[0]?.id
    if (!targetEventId) {
      setShowCreateDialog(true)
      return
    }

    setSelectedEvent(targetEventId)
    setEditingEvent({ id: targetEventId })
    setShowDetailsDialog(true)
  }

  const handleOpenCreateDialog = () => {
    setEditingEvent(null)
    setSelectedEvent(null)
    setShowCreateDialog(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Events</h2>
          <p className="text-muted-foreground">Manage your events and track attendance</p>
        </div>
        {isAdmin && (
          <div className="flex flex-col sm:flex-row gap-2">
            {!selectionMode ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleOpenGuestManager}
                  className="w-full sm:w-auto bg-card hover:bg-accent"
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>Manage Guests</span>
                </Button>
                <Button 
                  onClick={handleOpenCreateDialog}
                  className="w-full sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Create Event</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowInviteBuilder(true)}
                  className="w-full sm:w-auto bg-card hover:bg-accent"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  <span>Create Invite</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectionMode(true)}
                  className="w-full sm:w-auto bg-card hover:bg-accent"
                >
                  <Checkbox className="mr-2 h-4 w-4" />
                  <span>Bulk Actions</span>
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectionMode(false)
                    setSelectedEventIds([])
                  }}
                  className="w-full sm:w-auto"
                >
                  <X className="mr-2 h-4 w-4" />
                  <span>Cancel</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={toggleSelectAll}
                  className="w-full sm:w-auto"
                >
                  <span>{selectedEventIds.length === filteredEvents.length ? "Deselect All" : "Select All"}</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      disabled={selectedEventIds.length === 0 || isUpdatingStatus}
                      className="w-full sm:w-auto"
                    >
                      <span>{isUpdatingStatus ? "Updating..." : `Change Status (${selectedEventIds.length})`}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleBulkStatusChange("draft")}>
                      Set to Draft
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusChange("active")}>
                      Set to Active
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusChange("completed")}>
                      Set to Completed
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  variant="destructive" 
                  onClick={handleBulkDelete}
                  disabled={selectedEventIds.length === 0 || isDeleting}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>{isDeleting ? "Deleting..." : `Delete (${selectedEventIds.length})`}</span>
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
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
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Get started by creating your first event"}
            </p>
            {isAdmin && !searchTerm && statusFilter === "all" && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event: any) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={() => setEditingEvent(event)}
              onDelete={handleDeleteEvent}
              onOpenScanner={onOpenScanner}
              isSelected={selectedEventIds.includes(event.id)}
              onToggleSelect={toggleSelectEvent}
              selectionMode={selectionMode}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateEventDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open)
          if (!open) {
            setSelectedEvent(null)
          }
        }}
      />
      <EventDetailsDialog
        eventId={selectedEvent ?? editingEvent?.id ?? ""}
        open={showDetailsDialog || !!editingEvent}
        onOpenChange={(open) => {
          if (!open) {
            setEditingEvent(null)
            setSelectedEvent(null)
            setShowDetailsDialog(false)
          }
        }}
        defaultTab={showDetailsDialog ? "guests" : undefined}
      />
      
      {/* QR Scanner */}
      {scannerEventId && (
        <QRScanner
          eventId={scannerEventId}
          onClose={() => setScannerEventId(null)}
        />
      )}
    </div>
  )
}
