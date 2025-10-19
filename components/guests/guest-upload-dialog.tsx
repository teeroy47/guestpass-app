"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useGuests } from "@/lib/guests-context"
import { Upload, Download, AlertCircle, CheckCircle, Users } from "lucide-react"

interface ParsedGuest {
  name: string
  email?: string
  phone?: string
  seatingArea?: 'Reserved' | 'Free Seating'
  cuisineChoice?: 'Traditional' | 'Western'
  row: number
}

interface GuestUploadDialogProps {
  eventId: string
  eventTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GuestUploadDialog({ eventId, eventTitle, open, onOpenChange }: GuestUploadDialogProps) {
  const { addGuestsBulk } = useGuests()
  const [file, setFile] = useState<File | null>(null)
  const [parsedGuests, setParsedGuests] = useState<ParsedGuest[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        const phoneIndex = headers.findIndex((h) => h.includes("phone"))
        const seatingIndex = headers.findIndex((h) => h.includes("seating"))
        const cuisineIndex = headers.findIndex((h) => h.includes("cuisine"))

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
          const phone = phoneIndex !== -1 ? values[phoneIndex]?.trim() : undefined
          
          // Parse seating area with validation
          let seatingArea: 'Reserved' | 'Free Seating' = 'Free Seating'
          if (seatingIndex !== -1) {
            const seatingValue = values[seatingIndex]?.trim()
            if (seatingValue === 'Reserved' || seatingValue === 'Free Seating') {
              seatingArea = seatingValue
            } else if (seatingValue) {
              errors.push(`Row ${i + 1}: Invalid seating area '${seatingValue}'. Must be 'Reserved' or 'Free Seating'`)
            }
          }
          
          // Parse cuisine choice with validation
          let cuisineChoice: 'Traditional' | 'Western' = 'Traditional'
          if (cuisineIndex !== -1) {
            const cuisineValue = values[cuisineIndex]?.trim()
            if (cuisineValue === 'Traditional' || cuisineValue === 'Western') {
              cuisineChoice = cuisineValue
            } else if (cuisineValue) {
              errors.push(`Row ${i + 1}: Invalid cuisine choice '${cuisineValue}'. Must be 'Traditional' or 'Western'`)
            }
          }

          guests.push({
            name,
            email: email || undefined,
            phone: phone || undefined,
            seatingArea,
            cuisineChoice,
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
    if (!eventId || parsedGuests.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const guestsToAdd = parsedGuests.map((guest) => ({
        eventId: eventId,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        seatingArea: guest.seatingArea,
        cuisineChoice: guest.cuisineChoice,
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

      // Close dialog after successful upload
      setTimeout(() => {
        onOpenChange(false)
      }, 1500)
    } catch (err) {
      setError("Failed to upload guests. Please try again.")
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 2000)
    }
  }

  const downloadTemplate = () => {
    const csvContent =
      "name,email,phone,seating,cuisine\nJohn Smith,john@example.com,+265991234567,Reserved,Traditional\nSarah Johnson,sarah@example.com,+265992345678,Free Seating,Western\nMichael Chen,michael@example.com,+265993456789,Free Seating,Traditional"
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "guest-list-template.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Guest List</DialogTitle>
          <DialogDescription>
            Import guests from CSV file for <strong>{eventTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Guest List File *</Label>
              <Input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
              />
              <p className="text-xs text-muted-foreground">Supported formats: CSV (Excel coming soon)</p>
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
                disabled={parsedGuests.length === 0 || uploading}
                className="flex-1"
              >
                {uploading ? "Uploading..." : `Upload ${parsedGuests.length} Guests`}
              </Button>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Template
              </Button>
            </div>
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
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <h4 className="font-medium">Preview ({parsedGuests.length} guests)</h4>
              </div>
              <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                <div className="space-y-2">
                  {parsedGuests.slice(0, 10).map((guest, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{guest.name}</p>
                        {guest.email && <p className="text-xs text-muted-foreground">{guest.email}</p>}
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
            </div>
          )}

          {/* File Requirements */}
          <div className="border rounded-md p-4 bg-muted/50">
            <h4 className="font-medium mb-2 text-sm">File Requirements</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• <strong>name</strong> column is required</li>
              <li>• <strong>email</strong> column is optional</li>
              <li>• <strong>phone</strong> column is optional (format: +265991234567)</li>
              <li>• <strong>seating</strong> column is optional (Reserved or Free Seating)</li>
              <li>• <strong>cuisine</strong> column is optional (Traditional or Western)</li>
              <li>• First row must contain column headers</li>
              <li>• CSV format with comma separation</li>
              <li>• Maximum 1000 guests per upload</li>
            </ul>
            <div className="mt-3">
              <p className="text-xs font-medium mb-1">Example CSV:</p>
              <div className="bg-background p-2 rounded text-xs font-mono">
                name,email,phone,seating,cuisine<br />
                John Smith,john@example.com,+265991234567,Reserved,Traditional<br />
                Sarah Johnson,sarah@example.com,+265992345678,Free Seating,Western
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}