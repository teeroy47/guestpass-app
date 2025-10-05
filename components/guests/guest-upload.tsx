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

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
        const nameIndex = headers.findIndex((h) => h.includes("name"))
        const emailIndex = headers.findIndex((h) => h.includes("email"))

        if (nameIndex === -1) {
          setError("CSV file must contain a 'name' column")
          return
        }

        const guests: ParsedGuest[] = []
        const errors: string[] = []

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))

          if (values.length < headers.length) {
            errors.push(`Row ${i + 1}: Insufficient columns`)
            continue
          }

          const name = values[nameIndex]?.trim()
          if (!name) {
            errors.push(`Row ${i + 1}: Name is required`)
            continue
          }

          const email = emailIndex !== -1 ? values[emailIndex]?.trim() : undefined

          guests.push({
            name,
            email: email || undefined,
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
      "name,email\nJohn Smith,john@example.com\nSarah Johnson,sarah@example.com\nMichael Chen,michael@example.com"
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
                    • <strong>name</strong> - Guest full name (required)
                  </li>
                  <li>
                    • <strong>email</strong> - Guest email address (optional)
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium">File Format</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• CSV files with comma separation</li>
                  <li>• First row must contain column headers</li>
                  <li>• UTF-8 encoding recommended</li>
                  <li>• Maximum 1000 guests per upload</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium">Example CSV</h4>
                <div className="bg-muted p-3 rounded text-sm font-mono">
                  name,email
                  <br />
                  John Smith,john@example.com
                  <br />
                  Sarah Johnson,sarah@example.com
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
                    <div>
                      <p className="font-medium">{guest.name}</p>
                      {guest.email && <p className="text-sm text-muted-foreground">{guest.email}</p>}
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
