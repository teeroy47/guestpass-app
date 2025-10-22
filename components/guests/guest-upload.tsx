"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useEvents } from "@/lib/events-context"
import { useGuests } from "@/lib/guests-context"
import { Upload, FileText, Download, AlertCircle, CheckCircle, Users } from "lucide-react"

interface ParsedGuest {
  name: string
  email?: string
  phone?: string
  seatingArea?: 'Reserved' | 'Free Seating'
  cuisineChoice?: 'Traditional' | 'Western'
  customData?: Record<string, any>
  row: number
}

export function GuestUpload() {
  const { events } = useEvents()
  const { addGuestsBulk } = useGuests()
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [parsedGuests, setParsedGuests] = useState<ParsedGuest[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeEvents = events.filter((e) => e.status === "active" || e.status === "draft")

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError("")
    setSuccess("")
    setParsedGuests([])

    // Validate file type
    const validTypes = [".csv", ".xlsx", ".xls"]
    const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf("."))

    if (!validTypes.includes(fileExtension)) {
      setError("Please select a CSV or Excel file (.csv, .xlsx, .xls)")
      setFile(null)
      return
    }

    // Parse CSV file
    if (fileExtension === ".csv") {
      parseCSVFile(selectedFile)
    } else {
      setError("Excel files (.xlsx, .xls) parsing will be available soon. Please use CSV format for now.")
      setFile(null)
    }
  }

  const parseCSVFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split("\n").filter((line) => line.trim())

        if (lines.length < 2) {
          setError("CSV file must contain at least a header row and one data row")
          return
        }

        // Auto-detect delimiter (comma or tab)
        const firstLine = lines[0]
        const hasTab = firstLine.includes("\t")
        const delimiter = hasTab ? "\t" : ","

        const headers = firstLine.split(delimiter).map((h) => h.trim().toLowerCase())
        
        // Create flexible mapping for field names
        const nameIndex = headers.findIndex((h) => 
          h === "name" || h === "full name" || h.includes("name")
        )
        const emailIndex = headers.findIndex((h) => 
          h === "email" || h.includes("email")
        )
        const phoneIndex = headers.findIndex((h) => 
          h === "phone" || h === "phone number" || h.includes("phone")
        )
        const seatingIndex = headers.findIndex((h) => 
          h === "seating" || h.includes("seating")
        )
        const cuisineIndex = headers.findIndex((h) => 
          h === "cuisine" || h === "your choice of cuisine:" || h.includes("cuisine")
        )
        const parkingIndex = headers.findIndex((h) => 
          h === "parking:" || h === "parking" || h.includes("parking")
        )

        // Standard columns that shouldn't be treated as custom fields
        const standardColumns = new Set([nameIndex, emailIndex, phoneIndex, seatingIndex, cuisineIndex, parkingIndex].filter(i => i !== -1))

        if (nameIndex === -1) {
          setError("CSV file must contain a 'name' column")
          return
        }

        const guests: ParsedGuest[] = []
        const errors: string[] = []

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(delimiter).map((v) => v.trim().replace(/"/g, ""))

          const name = values[nameIndex]?.trim()
          if (!name) {
            errors.push(`Row ${i + 1}: Name is required`)
            continue
          }

          const email = emailIndex !== -1 ? values[emailIndex]?.trim() : undefined
          const phone = phoneIndex !== -1 ? values[phoneIndex]?.trim() : undefined
          
          // Parse seating area - accept standard values, store custom ones in customData
          let seatingArea: 'Reserved' | 'Free Seating' | undefined = undefined
          let customSeatingArea: string | undefined = undefined
          if (seatingIndex !== -1) {
            const seatingValue = values[seatingIndex]?.trim()
            if (seatingValue === 'Reserved' || seatingValue === 'Free Seating') {
              seatingArea = seatingValue
            } else if (seatingValue && seatingValue !== '') {
              // Store custom seating values in customData instead of rejecting
              customSeatingArea = seatingValue
            }
          }
          
          // Parse cuisine choice - accept standard values, store custom ones in customData
          let cuisineChoice: 'Traditional' | 'Western' | undefined = undefined
          let customCuisineChoice: string | undefined = undefined
          if (cuisineIndex !== -1) {
            const cuisineValue = values[cuisineIndex]?.trim()
            if (cuisineValue === 'Traditional' || cuisineValue === 'Western') {
              cuisineChoice = cuisineValue
            } else if (cuisineValue && cuisineValue !== '') {
              // Store custom cuisine values in customData instead of rejecting
              customCuisineChoice = cuisineValue
            }
          }

          // Capture any custom fields (columns that aren't standard ones)
          const customData: Record<string, any> = {}
          
          // Add custom seating area if present
          if (customSeatingArea) {
            customData['seatingDetails'] = customSeatingArea
          }
          
          // Add custom cuisine choice if present
          if (customCuisineChoice) {
            customData['cuisineDetails'] = customCuisineChoice
          }
          
          // Add parking to custom data if present
          if (parkingIndex !== -1) {
            const parkingValue = values[parkingIndex]?.trim()
            if (parkingValue) {
              customData['parking'] = parkingValue
            }
          }
          
          headers.forEach((header, index) => {
            if (!standardColumns.has(index) && values[index]) {
              // Skip empty Column### headers
              if (header.match(/^column\d+$/)) {
                return
              }
              // Convert header to camelCase for storage
              const camelCaseKey = header
                .replace(/[-_\s:]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
              if (!customData[camelCaseKey]) { // Don't overwrite if already set
                customData[camelCaseKey] = values[index]
              }
            }
          })

          guests.push({
            name,
            email: email || undefined,
            phone: phone || undefined,
            seatingArea,
            cuisineChoice,
            customData: Object.keys(customData).length > 0 ? customData : undefined,
            row: i + 1,
          })
        }

        if (errors.length > 0) {
          setError(
            `Found ${errors.length} errors:\n${errors.slice(0, 5).join("\n")}${errors.length > 5 ? "\n..." : ""}`,
          )
        }

        setParsedGuests(guests)
        if (guests.length > 0) {
          setSuccess(`Successfully parsed ${guests.length} guests from CSV file`)
        }
      } catch (err) {
        setError("Failed to parse CSV file. Please check the format.")
      }
    }
    reader.readAsText(file)
  }

  const handleUpload = async () => {
    if (!selectedEventId || parsedGuests.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const guestsToAdd = parsedGuests.map((guest) => ({
        eventId: selectedEventId,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        seatingArea: guest.seatingArea,
        cuisineChoice: guest.cuisineChoice,
        customData: guest.customData,
      }))

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 100)

      await addGuestsBulk(guestsToAdd)

      clearInterval(progressInterval)
      setUploadProgress(100)

      setSuccess(`Successfully uploaded ${parsedGuests.length} guests!`)
      setParsedGuests([])
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      setError("Failed to upload guests. Please try again.")
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 2000)
    }
  }

  const downloadTemplate = () => {
    const csvContent =
      "Full Name,Email,Phone Number,Seating,Your choice of cuisine:,Parking:\nJohn Smith,john@example.com,+263785211893,Reserved,Traditional,Lot A\nSarah Johnson,sarah@example.com,+263785211894,Free Seating,Western,Lot B\nMichael Chen,michael@example.com,+263785211895,Free Seating,Traditional,Lot A"
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "guest-list-template.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Upload Guest List</h2>
        <p className="text-muted-foreground">Import guests from CSV or Excel files</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="mr-2 h-5 w-5" />
              Upload File
            </CardTitle>
            <CardDescription>Select an event and upload your guest list</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-select">Select Event *</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an event" />
                </SelectTrigger>
                <SelectContent>
                  {activeEvents.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload">Guest List File *</Label>
              <Input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                disabled={!selectedEventId}
              />
              <p className="text-xs text-muted-foreground">Supported formats: CSV, Excel (.xlsx, .xls)</p>
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading guests...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={!selectedEventId || parsedGuests.length === 0 || uploading}
                className="flex-1"
              >
                {uploading ? "Uploading..." : `Upload ${parsedGuests.length} Guests`}
              </Button>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Template
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              File Requirements
            </CardTitle>
            <CardDescription>Format your guest list correctly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium">Required Columns</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • <strong>Full Name</strong> (or "name") - Guest full name (required)
                  </li>
                  <li>
                    • <strong>Email</strong> - Guest email address (optional)
                  </li>
                  <li>
                    • <strong>Phone Number</strong> (or "phone") - Guest phone number (optional, format: +263785211893)
                  </li>
                  <li>
                    • <strong>Seating</strong> - Accepts any value (e.g., "Reserved", "Free Seating", "VIP - Table 2", etc.)
                  </li>
                  <li>
                    • <strong>Your choice of cuisine:</strong> (or "cuisine") - Accepts any value (e.g., "Traditional", "Western", or custom options)
                  </li>
                  <li>
                    • <strong>Parking:</strong> - Parking information (optional, custom field)
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium">File Format</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• CSV files with comma or tab separation</li>
                  <li>• First row must contain column headers</li>
                  <li>• UTF-8 encoding recommended</li>
                  <li>• Custom seating/cuisine values stored as custom fields (displayed at check-in)</li>
                  <li>• Maximum 1000 guests per upload</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium">Example CSV</h4>
                <div className="bg-muted p-3 rounded text-sm font-mono">
                  Full Name,Email,Phone Number,Seating,Your choice of cuisine:,Parking:
                  <br />
                  John Smith,john@example.com,+263785211893,VIP - Table 2,Traditional,Lot A
                  <br />
                  Sarah Johnson,sarah@example.com,+263785211894,Free Seating,Western,Lot B
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Preview */}
      {parsedGuests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Preview ({parsedGuests.length} guests)
            </CardTitle>
            <CardDescription>Review guests before uploading</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 overflow-y-auto">
              <div className="space-y-2">
                {parsedGuests.slice(0, 10).map((guest, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                    <div className="flex-1">
                      <p className="font-medium">{guest.name}</p>
                      {guest.email && <p className="text-sm text-muted-foreground">{guest.email}</p>}
                      <div className="flex gap-3 mt-1">
                        {guest.phone && <p className="text-xs text-muted-foreground">📱 {guest.phone}</p>}
                        {guest.seatingArea && <p className="text-xs text-muted-foreground">🪑 {guest.seatingArea}</p>}
                        {guest.cuisineChoice && <p className="text-xs text-muted-foreground">🍽️ {guest.cuisineChoice}</p>}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">Row {guest.row}</span>
                  </div>
                ))}
                {parsedGuests.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    ... and {parsedGuests.length - 10} more guests
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
