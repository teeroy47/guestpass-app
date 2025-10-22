"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { useEvents } from "@/lib/events-context"
import { useGuests, type Guest } from "@/lib/guests-context"
import { useAuth } from "@/lib/auth-context"
import { exportToExcel, exportToPDF } from "@/lib/export-utils"
import { SupabaseGuestService } from "@/lib/supabase/guest-service"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"
import { GuestUploadDialog } from "@/components/guests/guest-upload-dialog"
import { Calendar, Users, Download, Upload, BarChart3, Loader2, Plus, Trash2, Pencil, X, Check, ShieldAlert, FileSpreadsheet, FileText, Mail, Send, Tag } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface EventDetailsDialogProps {
  eventId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: "overview" | "guests" | "analytics"
}

type EventFormState = {
  title: string
  description?: string | null
  startsAt: string
  venue?: string | null
  status: "draft" | "active" | "completed"
}

export function EventDetailsDialog({ eventId, open, onOpenChange, defaultTab = "overview" }: EventDetailsDialogProps) {
  const { getEvent, updateEvent } = useEvents()
  const { getGuestsByEvent, addGuest, updateGuest, deleteGuest } = useGuests()
  const { user, loading: isAuthLoading } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [isEditing, setIsEditing] = useState(false)
  const [formState, setFormState] = useState<EventFormState | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const event = getEvent(eventId)
  const eventGuests = getGuestsByEvent(eventId)
  const userRole = (user?.app_metadata?.role ?? "usher") as "admin" | "usher"
  const canManageGuests = userRole === "admin"
  const isAuthReady = !isAuthLoading
  const isEventCompleted = event?.status === "completed"
  const showAdminControls = !isAuthReady || !user || canManageGuests
  const isReadOnlyAdminView = isAuthReady && !!user && !canManageGuests
  const isReadOnly = isReadOnlyAdminView || isEventCompleted

  const [guestForm, setGuestForm] = useState({
    name: "",
    email: "",
    phone: "",
    seatingArea: "Free Seating" as 'Reserved' | 'Free Seating',
    cuisineChoice: "Traditional" as 'Traditional' | 'Western',
    customData: {} as Record<string, any>,
  })

  const [editingGuestId, setEditingGuestId] = useState<string | null>(null)
  const [guestSearch, setGuestSearch] = useState("")
  const [guestFormErrors, setGuestFormErrors] = useState<string | null>(null)
  const [isGuestSubmitting, setIsGuestSubmitting] = useState(false)
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set())
  const [isSendingInvites, setIsSendingInvites] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isCustomFieldDialogOpen, setIsCustomFieldDialogOpen] = useState(false)
  const [customFieldName, setCustomFieldName] = useState("")
  const [customFieldValue, setCustomFieldValue] = useState("")

  useEffect(() => {
    if (event && open) {
      setFormState({
        title: event.title,
        description: event.description,
        startsAt: event.startsAt,
        venue: event.venue,
        status: event.status,
      })
      setIsEditing(false)
    }
  }, [event, open])

  const formatDateTimeInput = (value: string) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return ""
    }
    const year = date.getFullYear()
    const month = `${date.getMonth() + 1}`.padStart(2, "0")
    const day = `${date.getDate()}`.padStart(2, "0")
    const hours = `${date.getHours()}`.padStart(2, "0")
    const minutes = `${date.getMinutes()}`.padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const startsAtInputValue = formState ? formatDateTimeInput(formState.startsAt) : ""

  if (!event || !formState) {
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "completed":
        return "secondary"
      case "draft":
        return "outline"
      default:
        return "secondary"
    }
  }

  const attendanceRate =
    eventGuests.length > 0 ? (eventGuests.filter((g) => g.checkedIn).length / eventGuests.length) * 100 : 0

  const handleExportExcel = () => {
    try {
      exportToExcel({
        event: {
          ...event,
          description: event.description ?? undefined,
          venue: event.venue ?? undefined,
        },
        guests: eventGuests,
      })
      toast({
        title: "Export Successful",
        description: "Event data exported to Excel successfully",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleExportPDF = () => {
    try {
      exportToPDF({
        event: {
          ...event,
          description: event.description ?? undefined,
          venue: event.venue ?? undefined,
        },
        guests: eventGuests,
      })
      toast({
        title: "Export Successful",
        description: "Event report exported to PDF successfully",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSendInvitations = async (sendToAll: boolean = false) => {
    // Determine which guests to send to
    let guestsToInvite = sendToAll 
      ? eventGuests.filter(g => g.email && g.email.trim() !== "")
      : eventGuests.filter(g => selectedGuests.has(g.id) && g.email && g.email.trim() !== "")

    if (guestsToInvite.length === 0) {
      toast({
        title: "No guests to invite",
        description: sendToAll 
          ? "No guests have email addresses on file."
          : "Please select guests with email addresses to send invitations.",
        variant: "destructive",
      })
      return
    }

    // Filter out guests who already received invitations
    const alreadyInvited = guestsToInvite.filter(g => g.invitationSent)
    const notYetInvited = guestsToInvite.filter(g => !g.invitationSent)

    // Warn if some guests already received invitations
    if (alreadyInvited.length > 0) {
      const proceed = confirm(
        `${alreadyInvited.length} guest(s) already received invitations:\n${alreadyInvited.map(g => `- ${g.name}`).join('\n')}\n\nDo you want to send invitations only to the ${notYetInvited.length} guest(s) who haven't received one yet?`
      )
      if (!proceed) {
        return
      }
    }

    // Use only guests who haven't been invited yet
    const finalGuestsToInvite = notYetInvited.length > 0 ? notYetInvited : guestsToInvite

    if (finalGuestsToInvite.length === 0) {
      toast({
        title: "All guests already invited",
        description: "All selected guests have already received invitations.",
        variant: "default",
      })
      return
    }

    // Confirm before sending
    const confirmMessage = `Send invitations to ${finalGuestsToInvite.length} guest(s)?`
    
    if (!confirm(confirmMessage)) {
      return
    }

    setIsSendingInvites(true)

    try {
      const response = await fetch("/api/send-invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: event.id,
          eventTitle: event.title,
          eventDate: event.startsAt,
          eventVenue: event.venue,
          guests: finalGuestsToInvite.map(g => ({
            id: g.id,
            name: g.name,
            email: g.email!,
            uniqueCode: g.uniqueCode,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitations")
      }

      // Mark guests as invited in the database
      if (data.results.sentGuestIds && data.results.sentGuestIds.length > 0) {
        try {
          await SupabaseGuestService.markInvitationSent(data.results.sentGuestIds)
          // Refresh the guest list to show updated invitation status
          await getGuestsByEvent(eventId)
        } catch (error) {
          console.error("Failed to update invitation status:", error)
        }
      }

      // Clear selection after successful send
      setSelectedGuests(new Set())

      // Show success notification
      if (data.results.sent > 0) {
        toast({
          title: "✅ Invitations Sent Successfully!",
          description: `Successfully sent ${data.results.sent} invitation${data.results.sent > 1 ? 's' : ''} with QR codes.`,
        })
      }

      // Show detailed results if there were failures
      if (data.results.failed > 0 && data.results.failedEmails) {
        console.error("Failed emails:", data.results.failedEmails)
        
        // Create a detailed error message
        const failedEmailsList = data.results.failedEmails
          .map((f: any) => `${f.email}: ${f.error}`)
          .join(', ')
        
        toast({
          title: "⚠️ Some Invitations Failed",
          description: `${data.results.failed} email(s) could not be sent. Failed: ${failedEmailsList.substring(0, 100)}${failedEmailsList.length > 100 ? '...' : ''}`,
          variant: "destructive",
        })
      }
      
      // If all failed
      if (data.results.sent === 0 && data.results.failed > 0) {
        toast({
          title: "❌ All Invitations Failed",
          description: "No invitations were sent. Please check the email addresses and try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending invitations:", error)
      toast({
        title: "Failed to send invitations",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSendingInvites(false)
    }
  }

  const toggleGuestSelection = (guestId: string) => {
    setSelectedGuests(prev => {
      const newSet = new Set(prev)
      if (newSet.has(guestId)) {
        newSet.delete(guestId)
      } else {
        newSet.add(guestId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedGuests.size === filteredGuests.length) {
      setSelectedGuests(new Set())
    } else {
      setSelectedGuests(new Set(filteredGuests.map(g => g.id)))
    }
  }

  const handleFieldChange = (field: keyof EventFormState, value: string) => {
    setFormState((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const resetGuestForm = () => {
    setGuestForm({ 
      name: "", 
      email: "", 
      phone: "", 
      seatingArea: "Free Seating",
      cuisineChoice: "Traditional",
      customData: {}
    })
    setGuestFormErrors(null)
    setEditingGuestId(null)
    setCustomFieldName("")
    setCustomFieldValue("")
  }

  const validateGuestForm = () => {
    if (!guestForm.name.trim()) {
      setGuestFormErrors("Guest name is required.")
      return false
    }

    if (guestForm.email && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(guestForm.email)) {
      setGuestFormErrors("Please enter a valid email address.")
      return false
    }

    setGuestFormErrors(null)
    return true
  }

  const handleCreateOrUpdateGuest = async () => {
    if (!event) return
    if (!validateGuestForm()) return

    setIsGuestSubmitting(true)

    try {
      if (editingGuestId) {
        await updateGuest(editingGuestId, {
          name: guestForm.name.trim(),
          email: guestForm.email.trim() || undefined,
          phone: guestForm.phone.trim() || undefined,
          seatingArea: guestForm.seatingArea,
          cuisineChoice: guestForm.cuisineChoice,
          customData: Object.keys(guestForm.customData).length > 0 ? guestForm.customData : undefined,
        })
        toast({
          title: "Guest updated",
          description: "The guest information has been updated successfully.",
        })
        resetGuestForm()
      } else {
        const result = await addGuest({
          eventId: event.id,
          name: guestForm.name.trim(),
          email: guestForm.email.trim() || undefined,
          phone: guestForm.phone.trim() || undefined,
          seatingArea: guestForm.seatingArea,
          cuisineChoice: guestForm.cuisineChoice,
          customData: Object.keys(guestForm.customData).length > 0 ? guestForm.customData : undefined,
          checkedInBy: undefined,
        })
        
        if (result) {
          toast({
            title: "Guest added successfully",
            description: `${guestForm.name.trim()} has been added to the event.`,
          })
          resetGuestForm()
        }
      }
    } catch (error) {
      console.error("Failed to save guest", error)
      const errorMessage = error instanceof Error ? error.message : "There was an issue saving the guest."
      
      // Check if it's a duplicate error
      if (errorMessage.includes("already exists")) {
        toast({
          title: "This guest already exists",
          description: "A guest with the same name and email is already registered for this event.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Guest action failed",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setIsGuestSubmitting(false)
    }
  }

  const handleAddCustomField = () => {
    if (!customFieldName.trim()) {
      setGuestFormErrors("Field name is required.")
      return
    }

    const fieldNameCamelCase = customFieldName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+(.)/g, (_, char) => char.toUpperCase())

    setGuestForm((prev) => ({
      ...prev,
      customData: {
        ...prev.customData,
        [fieldNameCamelCase]: customFieldValue.trim(),
      },
    }))

    setCustomFieldName("")
    setCustomFieldValue("")
    setGuestFormErrors(null)
  }

  const handleRemoveCustomField = (fieldName: string) => {
    setGuestForm((prev) => {
      const newCustomData = { ...prev.customData }
      delete newCustomData[fieldName]
      return {
        ...prev,
        customData: newCustomData,
      }
    })
  }

  const handleEditGuest = (guest: Guest) => {
    setGuestForm({
      name: guest.name,
      email: guest.email || "",
      phone: guest.phone || "",
      seatingArea: guest.seatingArea || "Free Seating",
      cuisineChoice: guest.cuisineChoice || "Traditional",
      customData: guest.customData || {},
    })
    setEditingGuestId(guest.id)
  }

  const handleDeleteGuest = async (guestId: string) => {
    if (!confirm("Are you sure you want to delete this guest?")) {
      return
    }

    setIsGuestSubmitting(true)
    try {
      await deleteGuest(guestId)
      toast({
        title: "Guest removed",
        description: "The guest has been removed from the event.",
      })
      if (editingGuestId === guestId) {
        resetGuestForm()
      }
    } catch (error) {
      console.error("Failed to delete guest", error)
      toast({
        title: "Delete failed",
        description: "Unable to delete the guest. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGuestSubmitting(false)
    }
  }

  const handleCheckInToggle = async (guest: Guest) => {
    setIsGuestSubmitting(true)
    try {
      if (guest.checkedIn) {
        await updateGuest(guest.id, {
          checkedIn: false,
          checkedInAt: undefined,
          checkedInBy: undefined,
        })
        toast({
          title: "Guest marked as not checked in",
          description: `${guest.name} has been marked as not checked in.`,
        })
      } else {
        const checkedInAt = new Date().toISOString()
        await updateGuest(guest.id, {
          checkedIn: true,
          checkedInAt,
          checkedInBy: user?.email || "Admin",
        })
        toast({
          title: "Guest checked in",
          description: `${guest.name} has been checked in.`,
        })
      }
    } catch (error) {
      console.error("Failed to toggle guest check-in status", error)
      toast({
        title: "Check-in update failed",
        description: "Unable to update the check-in status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGuestSubmitting(false)
    }
  }

  const filteredGuests = guestSearch
    ? eventGuests.filter((guest) =>
        guest.name.toLowerCase().includes(guestSearch.toLowerCase()) ||
        (guest.email ? guest.email.toLowerCase().includes(guestSearch.toLowerCase()) : false) ||
        guest.uniqueCode.toLowerCase().includes(guestSearch.toLowerCase()),
      )
    : eventGuests

  const handleSave = async () => {
    if (!formState) {
      return
    }

    setIsSubmitting(true)
    try {
      // Check if status is changing to "completed"
      const isChangingToCompleted = formState.status === "completed" && event.status !== "completed"

      await updateEvent(event.id, {
        title: formState.title,
        description: formState.description,
        startsAt: new Date(formState.startsAt).toISOString(),
        venue: formState.venue,
        status: formState.status,
      })

      // If event is being marked as completed, mark all checked-in guests as attended
      if (isChangingToCompleted) {
        try {
          const updatedGuests = await SupabaseGuestService.markGuestsAsAttended(event.id)
          
          // Refresh the guest list to show updated attendance status
          await getGuestsByEvent(event.id)
          
          toast({
            title: "Event completed",
            description: `Event marked as completed. ${updatedGuests.length} checked-in guest(s) marked as attended.`,
          })
        } catch (error) {
          console.error("Failed to mark guests as attended:", error)
          toast({
            title: "Warning",
            description: "Event updated but failed to mark guests as attended. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Event updated",
          description: "Your changes have been saved successfully.",
        })
      }
      
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update event", error)
      toast({
        title: "Update failed",
        description: "There was an issue saving your changes.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full lg:max-w-[1400px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">
                {isEditing ? (
                  <Input
                    value={formState.title}
                    onChange={(event) => handleFieldChange("title", event.target.value)}
                    className="text-xl font-semibold"
                  />
                ) : (
                  event.title
                )}
              </DialogTitle>
              <DialogDescription className="mt-1">Created on {formatDate(event.createdAt)}</DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <Select value={formState.status} onValueChange={(value) => handleFieldChange("status", value)}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={getStatusColor(event.status)}>{event.status}</Badge>
              )}
              {showAdminControls ? (
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} disabled={isEventCompleted}>
                      Edit
                    </Button>
                  )}
                </div>
              ) : null}
              {isReadOnly && (
                <Badge variant="secondary">{isEventCompleted ? "Completed - Read Only" : "View only"}</Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 mx-6 mt-4 flex-shrink-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="guests">Guests</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 mt-4">
            {isEventCompleted && (
              <Alert>
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Event Completed</AlertTitle>
                <AlertDescription>
                  This event has been marked as completed. All editing and guest management features are disabled. You can still view data and export reports.
                </AlertDescription>
              </Alert>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Event Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Start Time</p>
                    {isEditing ? (
                      <Input
                        type="datetime-local"
                        value={startsAtInputValue}
                        onChange={(event) => handleFieldChange("startsAt", event.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{formatDate(event.startsAt)}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Venue</p>
                    {isEditing ? (
                      <Input
                        value={formState.venue ?? ""}
                        onChange={(event) => handleFieldChange("venue", event.target.value)}
                        placeholder="Enter venue"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{event.venue || "—"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Description</p>
                    {isEditing ? (
                      <Textarea
                        value={formState.description ?? ""}
                        onChange={(event) => handleFieldChange("description", event.target.value)}
                        rows={3}
                        placeholder="Add event description"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{event.description || "—"}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Guests</span>
                    <span className="text-sm font-medium">{eventGuests.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Checked In</span>
                    <span className="text-sm font-medium">{eventGuests.filter((g) => g.checkedIn).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Attendance Rate</span>
                    <span className="text-sm font-medium">{attendanceRate.toFixed(1)}%</span>
                  </div>
                  {eventGuests.length > 0 && (
                    <div className="space-y-1">
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${attendanceRate}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {showAdminControls && !isEventCompleted && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsUploadDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Guests
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isSendingInvites}>
                      {isSendingInvites ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-4 w-4" />
                      )}
                      Send Invitations
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleSendInvitations(true)}>
                      <Send className="mr-2 h-4 w-4" />
                      Send to All Guests
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab("guests")}>
                      <Users className="mr-2 h-4 w-4" />
                      Select Specific Guests
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export Data
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportExcel}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportPDF}>
                      <FileText className="mr-2 h-4 w-4" />
                      Export as PDF Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </TabsContent>

          <TabsContent value="guests" className="flex-1 overflow-y-auto px-6 pb-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Guest List ({filteredGuests.length})</CardTitle>
                <CardDescription>Event attendees and check-in status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <Input
                      placeholder="Search guests by name, email, or code"
                      value={guestSearch}
                      onChange={(event) => setGuestSearch(event.target.value)}
                      className="w-full md:w-72"
                    />
                  </div>
                  {showAdminControls && !isEventCompleted && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedGuests.size > 0 && (
                        <>
                          <Badge variant="secondary" className="text-sm">
                            {selectedGuests.size} selected
                          </Badge>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleSendInvitations(false)}
                            disabled={isSendingInvites}
                          >
                            {isSendingInvites ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="mr-2 h-4 w-4" />
                            )}
                            Send to Selected
                          </Button>
                        </>
                      )}
                      {editingGuestId ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetGuestForm}
                          disabled={isGuestSubmitting}
                          className="text-muted-foreground"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel edit
                        </Button>
                      ) : null}
                      <Button onClick={handleCreateOrUpdateGuest} disabled={isGuestSubmitting} size="sm">
                        {isGuestSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        {editingGuestId ? "Save guest" : "Add guest"}
                      </Button>
                    </div>
                  )}
                </div>

                {guestFormErrors ? (
                  <p className="text-sm text-destructive">{guestFormErrors}</p>
                ) : null}

                {showAdminControls && !isEventCompleted && (
                  <div className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="guest-name">
                          Guest name
                        </label>
                        <Input
                          id="guest-name"
                          placeholder="Enter guest name"
                          value={guestForm.name}
                          onChange={(event) => setGuestForm((prev) => ({ ...prev, name: event.target.value }))}
                          disabled={isGuestSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="guest-email">
                          Email (optional)
                        </label>
                        <Input
                          id="guest-email"
                          type="email"
                          placeholder="Enter guest email"
                          value={guestForm.email}
                          onChange={(event) => setGuestForm((prev) => ({ ...prev, email: event.target.value }))}
                          disabled={isGuestSubmitting}
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="guest-phone">
                          Phone (optional)
                        </label>
                        <Input
                          id="guest-phone"
                          type="tel"
                          placeholder="+263785211893"
                          value={guestForm.phone}
                          onChange={(event) => setGuestForm((prev) => ({ ...prev, phone: event.target.value }))}
                          disabled={isGuestSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="guest-seating">
                          Seating Area
                        </label>
                        <Select
                          value={guestForm.seatingArea}
                          onValueChange={(value: 'Reserved' | 'Free Seating') => 
                            setGuestForm((prev) => ({ ...prev, seatingArea: value }))
                          }
                          disabled={isGuestSubmitting}
                        >
                          <SelectTrigger id="guest-seating">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Reserved">Reserved</SelectItem>
                            <SelectItem value="Free Seating">Free Seating</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="guest-cuisine">
                          Cuisine Choice
                        </label>
                        <Select
                          value={guestForm.cuisineChoice}
                          onValueChange={(value: 'Traditional' | 'Western') => 
                            setGuestForm((prev) => ({ ...prev, cuisineChoice: value }))
                          }
                          disabled={isGuestSubmitting}
                        >
                          <SelectTrigger id="guest-cuisine">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Traditional">Traditional</SelectItem>
                            <SelectItem value="Western">Western</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Custom Fields Section */}
                    <div className="border-t pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Custom Fields</label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsCustomFieldDialogOpen(true)}
                          disabled={isGuestSubmitting}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Field
                        </Button>
                      </div>

                      {/* Display added custom fields */}
                      {Object.keys(guestForm.customData).length > 0 && (
                        <div className="space-y-2">
                          {Object.entries(guestForm.customData).map(([key, value]) => (
                            <div
                              key={key}
                              className="flex items-center justify-between bg-muted p-3 rounded-md text-sm"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-foreground capitalize">
                                  {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                                </div>
                                <div className="text-muted-foreground text-xs mt-1">{String(value)}</div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveCustomField(key)}
                                disabled={isGuestSubmitting}
                                className="text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {filteredGuests.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No guests match your filters yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {showAdminControls && !isEventCompleted && (
                            <TableHead className="w-12">
                              <Checkbox
                                checked={selectedGuests.size === filteredGuests.length && filteredGuests.length > 0}
                                onCheckedChange={toggleSelectAll}
                                aria-label="Select all guests"
                              />
                            </TableHead>
                          )}
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden md:table-cell">Email</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead className="hidden lg:table-cell">Invitation</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredGuests.map((guest) => (
                          <TableRow key={guest.id}>
                            {showAdminControls && !isEventCompleted && (
                              <TableCell>
                                <Checkbox
                                  checked={selectedGuests.has(guest.id)}
                                  onCheckedChange={() => toggleGuestSelection(guest.id)}
                                  aria-label={`Select ${guest.name}`}
                                />
                              </TableCell>
                            )}
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span>{guest.name}</span>
                                <span className="text-xs text-muted-foreground md:hidden">{guest.email || "—"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{guest.email || "—"}</TableCell>
                            <TableCell className="font-mono text-sm">{guest.uniqueCode}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {guest.invitationSent ? (
                                <div className="flex flex-col">
                                  <Badge variant="outline" className="inline-flex items-center gap-1 w-fit">
                                    <Mail className="h-3 w-3" />
                                    Sent
                                  </Badge>
                                  {guest.invitationSentAt && (
                                    <span className="text-xs text-muted-foreground mt-1">
                                      {new Date(guest.invitationSentAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="secondary" className="inline-flex items-center gap-1">
                                  Not sent
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={guest.checkedIn ? "default" : "secondary"} className="inline-flex items-center gap-2">
                                {guest.checkedIn ? <Check className="h-3 w-3" /> : null}
                                {guest.checkedIn ? "Checked In" : "Not Checked In"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-2">
                                {showAdminControls && !isEventCompleted ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleCheckInToggle(guest)}
                                      disabled={isGuestSubmitting}
                                      title={guest.checkedIn ? "Mark as not checked in" : "Check in guest"}
                                    >
                                      {isGuestSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : guest.checkedIn ? (
                                        <X className="h-4 w-4" />
                                      ) : (
                                        <Check className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleEditGuest(guest)}
                                      disabled={isGuestSubmitting}
                                      title="Edit guest"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteGuest(guest.id)}
                                      disabled={isGuestSubmitting}
                                      title="Remove guest"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : isEventCompleted ? (
                                  <span className="text-xs text-muted-foreground">Read only</span>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="flex-1 overflow-y-auto px-6 pb-6 mt-4">
            <AnalyticsDashboard eventId={eventId} />
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Guest Upload Dialog */}
      <GuestUploadDialog
        eventId={eventId}
        eventTitle={event.title}
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
      />

      {/* Custom Field Dialog */}
      <Dialog open={isCustomFieldDialogOpen} onOpenChange={setIsCustomFieldDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Add Custom Field
            </DialogTitle>
            <DialogDescription>
              Add a custom field to this guest's profile. Field names will be formatted automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="field-name">
                Field Name
              </label>
              <Input
                id="field-name"
                placeholder="e.g., Parking, Table Assignment, Dietary Notes"
                value={customFieldName}
                onChange={(e) => setCustomFieldName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddCustomField()
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="field-value">
                Field Value
              </label>
              <Input
                id="field-value"
                placeholder="e.g., Lot A, Table 5, Nut allergy"
                value={customFieldValue}
                onChange={(e) => setCustomFieldValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddCustomField()
                  }
                }}
              />
            </div>

            {guestFormErrors && customFieldName && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {guestFormErrors}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCustomFieldDialogOpen(false)
                setCustomFieldName("")
                setCustomFieldValue("")
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddCustomField}>Add Field</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
