"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { generateQRCodeData, generateQRCodeSVG, downloadQRCodeAsPNG } from "@/lib/qr-utils"
import { Calendar, Users, QrCode, Download, Upload, BarChart3, Loader2, Plus, Trash2, Pencil, X, Check, ShieldAlert } from "lucide-react"

interface EventDetailsDialogProps {
  eventId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: "overview" | "guests" | "qr" | "analytics"
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
  const showAdminControls = !isAuthReady || !user || canManageGuests
  const isReadOnlyAdminView = isAuthReady && !!user && !canManageGuests

  const [guestForm, setGuestForm] = useState({
    name: "",
    email: "",
  })

  const [editingGuestId, setEditingGuestId] = useState<string | null>(null)
  const [guestSearch, setGuestSearch] = useState("")
  const [guestFormErrors, setGuestFormErrors] = useState<string | null>(null)
  const [isGuestSubmitting, setIsGuestSubmitting] = useState(false)

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

  const downloadGuestQR = (guest: any) => {
    const qrData = generateQRCodeData(event.id, guest.uniqueCode)
    const svgString = generateQRCodeSVG(qrData, 400)
    const filename = `${guest.name.replace(/[^a-zA-Z0-9]/g, "-")}-${guest.uniqueCode}.png`
    downloadQRCodeAsPNG(svgString, filename, 400)
  }

  const handleFieldChange = (field: keyof EventFormState, value: string) => {
    setFormState((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const resetGuestForm = () => {
    setGuestForm({ name: "", email: "" })
    setGuestFormErrors(null)
    setEditingGuestId(null)
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
          email: guestForm.email.trim() || null,
        })
        toast({
          title: "Guest updated",
          description: "The guest information has been updated successfully.",
        })
      } else {
        await addGuest({
          eventId: event.id,
          name: guestForm.name.trim(),
          email: guestForm.email.trim() || undefined,
          checkedInBy: undefined,
        })
        toast({
          title: "Guest added",
          description: "A new guest has been added to the event.",
        })
      }
      resetGuestForm()
    } catch (error) {
      console.error("Failed to save guest", error)
      toast({
        title: "Guest action failed",
        description: "There was an issue saving the guest. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGuestSubmitting(false)
    }
  }

  const handleEditGuest = (guest: Guest) => {
    setGuestForm({
      name: guest.name,
      email: guest.email || "",
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
          checkedInAt: null,
          checkedInBy: null,
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
          checkedInBy: user?.name || "Admin",
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
      await updateEvent(event.id, {
        title: formState.title,
        description: formState.description,
        startsAt: new Date(formState.startsAt).toISOString(),
        venue: formState.venue,
        status: formState.status,
      })

      toast({
        title: "Event updated",
        description: "Your changes have been saved successfully.",
      })
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
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
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
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      Edit
                    </Button>
                  )}
                </div>
              ) : isReadOnlyAdminView ? (
                <Badge variant="secondary">View only</Badge>
              ) : null}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="guests">Guests</TabsTrigger>
            <TabsTrigger value="qr-codes">QR Codes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
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

            {showAdminControls && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Guests
                </Button>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("qr-codes")}>
                  <QrCode className="mr-2 h-4 w-4" />
                  Generate QR Codes
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="guests">
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
                  {showAdminControls && (
                    <div className="flex items-center gap-2">
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

                {showAdminControls && (
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
                )}

                {filteredGuests.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No guests match your filters yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden md:table-cell">Email</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredGuests.map((guest) => (
                          <TableRow key={guest.id}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span>{guest.name}</span>
                                <span className="text-xs text-muted-foreground md:hidden">{guest.email || "—"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{guest.email || "—"}</TableCell>
                            <TableCell className="font-mono text-sm">{guest.uniqueCode}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={guest.checkedIn ? "default" : "secondary"} className="inline-flex items-center gap-2">
                                {guest.checkedIn ? <Check className="h-3 w-3" /> : null}
                                {guest.checkedIn ? "Checked In" : "Not Checked In"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => downloadGuestQR(guest)}
                                  title="Download QR code"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                {showAdminControls ? (
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

          <TabsContent value="qr-codes">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">QR Code Management</CardTitle>
                <CardDescription>Generate and download QR codes for guests</CardDescription>
              </CardHeader>
              <CardContent>
                {eventGuests.length === 0 ? (
                  <div className="text-center py-8">
                    <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Add guests to this event to generate QR codes.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-h-60 overflow-y-auto">
                      {eventGuests.slice(0, 6).map((guest) => {
                        const qrData = generateQRCodeData(event.id, guest.uniqueCode)
                        const qrSvg = generateQRCodeSVG(qrData, 80)

                        return (
                          <div key={guest.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                            <div
                              className="border rounded p-1 bg-white flex-shrink-0"
                              dangerouslySetInnerHTML={{ __html: qrSvg }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{guest.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{guest.uniqueCode}</p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-1 h-6 text-xs bg-transparent"
                                onClick={() => downloadGuestQR(guest)}
                              >
                                <Download className="mr-1 h-3 w-3" />
                                PNG
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {eventGuests.length > 6 && (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          ... and {eventGuests.length - 6} more guests
                        </p>
                        <Button variant="outline" size="sm">
                          <QrCode className="mr-2 h-4 w-4" />
                          View All QR Codes
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Event Analytics
                </CardTitle>
                <CardDescription>Detailed insights and statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Analytics dashboard coming in next step...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
