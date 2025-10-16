"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEvents } from "@/lib/events-context"
import { useGuests } from "@/lib/guests-context"
import { generateQRCodeData, generateQRCodeSVG, downloadQRCodeAsPNGFromSVG } from "@/lib/qr-utils"
import QRCode from "react-qr-code"
import { QrCode, Download, FileImage, Package, Search } from "lucide-react"

export function QRCodeGenerator() {
  const { events } = useEvents()
  const { getGuestsByEvent } = useGuests()
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)

  const selectedEvent = events.find((e) => e.id === selectedEventId)
  const eventGuests = useMemo(() => {
    if (!selectedEventId) return []
    return getGuestsByEvent(selectedEventId)
  }, [selectedEventId, getGuestsByEvent])

  const filteredGuests = useMemo(() => {
    return eventGuests.filter(
      (guest) =>
        guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.uniqueCode.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [eventGuests, searchTerm])

  const handleGuestSelection = (guestId: string, selected: boolean) => {
    const newSelection = new Set(selectedGuests)
    if (selected) {
      newSelection.add(guestId)
    } else {
      newSelection.delete(guestId)
    }
    setSelectedGuests(newSelection)
  }

  const selectAllGuests = () => {
    setSelectedGuests(new Set(filteredGuests.map((g) => g.id)))
  }

  const clearSelection = () => {
    setSelectedGuests(new Set())
  }

  const downloadSingleQR = async (guestId: string) => {
    const guest = eventGuests.find((g) => g.id === guestId)
    if (!guest || !selectedEvent) return

    const qrData = generateQRCodeData(selectedEvent.id, guest.uniqueCode)
    const svgString = await generateQRCodeSVG(qrData, 400)
    const filename = `${guest.name.replace(/[^a-zA-Z0-9]/g, "-")}-${guest.uniqueCode}.png`

    await downloadQRCodeAsPNGFromSVG(svgString, filename, 400)
  }

  const downloadSelectedQRs = async () => {
    if (selectedGuests.size === 0 || !selectedEvent) return

    setGenerating(true)

    try {
      // Generate and download each QR code with a small delay
      const selectedGuestsList = eventGuests.filter((g) => selectedGuests.has(g.id))

      for (let i = 0; i < selectedGuestsList.length; i++) {
        const guest = selectedGuestsList[i]
        const qrData = generateQRCodeData(selectedEvent.id, guest.uniqueCode)
        const svgString = await generateQRCodeSVG(qrData, 400)
        const filename = `${guest.name.replace(/[^a-zA-Z0-9]/g, "-")}-${guest.uniqueCode}.png`

        await downloadQRCodeAsPNGFromSVG(svgString, filename, 400)

        // Small delay between downloads to prevent browser blocking
        if (i < selectedGuestsList.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }
    } finally {
      setGenerating(false)
    }
  }

  const generateBulkPDF = async () => {
    if (selectedGuests.size === 0 || !selectedEvent) return

    setGenerating(true)

    try {
      const response = await fetch("/api/generate-bundle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          guests: eventGuests
            .filter((guest) => selectedGuests.has(guest.id))
            .map((guest) => ({ id: guest.id, name: guest.name, uniqueCode: guest.uniqueCode, eventId: guest.eventId })),
          format: "pdf",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate PDF bundle")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `guestpass-${selectedEvent.id}-bundle.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error generating PDF bundle:", error)
    } finally {
      setGenerating(false)
    }
  }

  const generateBulkZIP = async () => {
    if (selectedGuests.size === 0 || !selectedEvent) return

    setGenerating(true)

    try {
      const response = await fetch("/api/generate-bundle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          guests: eventGuests
            .filter((guest) => selectedGuests.has(guest.id))
            .map((guest) => ({ id: guest.id, name: guest.name, uniqueCode: guest.uniqueCode, eventId: guest.eventId })),
          format: "zip",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate ZIP bundle")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `guestpass-${selectedEvent.id}-bundle.zip`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error generating ZIP bundle:", error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">QR Code Generator</h2>
        <p className="text-muted-foreground">Generate and export QR codes for event guests</p>
      </div>

      {/* Event Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Event</CardTitle>
          <CardDescription>Choose an event to generate QR codes for its guests</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Choose an event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id} disabled={event.status === "completed"}>
                  {event.title} ({event.status})
                  {event.status === "completed" && " - QR generation disabled"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedEvent && selectedEvent.status === "completed" && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ This event is marked as completed. QR code generation is disabled for completed events.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEventId && selectedEvent && selectedEvent.status !== "completed" && (
        <Tabs defaultValue="individual" className="space-y-6">
          <TabsList>
            <TabsTrigger value="individual">Individual QR Codes</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Export</TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center">
                      <QrCode className="mr-2 h-5 w-5" />
                      Guest QR Codes ({filteredGuests.length})
                    </CardTitle>
                    <CardDescription>Generate individual QR codes for guests</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search guests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {filteredGuests.length === 0 ? (
                  <div className="text-center py-8">
                    <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No guests found</h3>
                    <p className="text-muted-foreground">
                      {eventGuests.length === 0
                        ? "This event doesn't have any guests yet."
                        : "Try adjusting your search criteria."}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredGuests.map((guest) => {
                      const qrData = generateQRCodeData(selectedEvent!.id, guest.uniqueCode)

                      return (
                        <Card key={guest.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-center">
                              <div className="border rounded-lg p-2 bg-white flex items-center justify-center">
                                <QRCode value={qrData} size={120} />
                              </div>
                            </div>

                            <div className="text-center space-y-1">
                              <p className="font-medium text-sm">{guest.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{guest.uniqueCode}</p>
                              {guest.checkedIn && (
                                <Badge variant="default" className="text-xs">
                                  Checked In
                                </Badge>
                              )}
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full bg-transparent"
                              onClick={() => downloadSingleQR(guest.id)}
                            >
                              <Download className="mr-2 h-3 w-3" />
                              Download PNG
                            </Button>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="mr-2 h-5 w-5" />
                    Bulk Export Options
                  </CardTitle>
                  <CardDescription>Export multiple QR codes at once</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Guest Selection</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllGuests}
                        disabled={filteredGuests.length === 0}
                      >
                        Select All ({filteredGuests.length})
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearSelection} disabled={selectedGuests.size === 0}>
                        Clear Selection
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedGuests.size} guests selected</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Export Format</Label>
                    <div className="space-y-2">
                      <Button
                        className="w-full justify-start bg-transparent"
                        variant="outline"
                        onClick={downloadSelectedQRs}
                        disabled={selectedGuests.size === 0 || generating}
                      >
                        <FileImage className="mr-2 h-4 w-4" />
                        {generating ? "Generating..." : "Individual PNG Files"}
                      </Button>
                      <Button
                        className="w-full justify-start bg-transparent"
                        variant="outline"
                        onClick={generateBulkPDF}
                        disabled={selectedGuests.size === 0 || generating}
                      >
                        <Package className="mr-2 h-4 w-4" />
                        {generating ? "Generating..." : "PDF Bundle"}
                      </Button>
                      <Button
                        className="w-full justify-start bg-transparent"
                        variant="outline"
                        onClick={generateBulkZIP}
                        disabled={selectedGuests.size === 0 || generating}
                      >
                        <Package className="mr-2 h-4 w-4" />
                        {generating ? "Generating..." : "ZIP Bundle"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Guest Selection</CardTitle>
                  <CardDescription>Choose guests for bulk export</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {filteredGuests.map((guest) => (
                      <div key={guest.id} className="flex items-center space-x-3 p-2 rounded border">
                        <input
                          type="checkbox"
                          checked={selectedGuests.has(guest.id)}
                          onChange={(e) => handleGuestSelection(guest.id, e.target.checked)}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{guest.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{guest.uniqueCode}</p>
                        </div>
                        {guest.checkedIn && (
                          <Badge variant="default" className="text-xs">
                            Checked In
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
