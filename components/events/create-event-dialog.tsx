"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEvents } from "@/lib/events-context"
import { useAuth } from "@/lib/auth-context"
import { Calendar, MapPin, FileText } from "lucide-react"

interface CreateEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateEventDialog({ open, onOpenChange }: CreateEventDialogProps) {
  const { createEvent } = useEvents()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startsAt: "",
    venue: "",
    status: "draft" as const,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const createdEvent = await createEvent({
        ...formData,
        ownerId: user.id,
      })

      if (!createdEvent) {
        throw new Error("Event creation returned no data")
      }

      toast({
        title: "Event created",
        description: `"${createdEvent.title}" is ready to go!`,
      })

      // Reset form
      setFormData({
        title: "",
        description: "",
        startsAt: "",
        venue: "",
        status: "draft",
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error creating event:", error)
      toast({
        title: "Failed to create event",
        description: "Please try again or contact support if the problem persists.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Set up a new event for guest check-ins. You can always edit these details later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Event Title *
              </Label>
              <Input
                id="title"
                placeholder="Tech Conference 2024"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of your event..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startsAt" className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Start Date & Time *
              </Label>
              <Input
                id="startsAt"
                type="datetime-local"
                value={formData.startsAt}
                onChange={(e) => handleInputChange("startsAt", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue" className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                Venue
              </Label>
              <Input
                id="venue"
                placeholder="Convention Center, Downtown"
                value={formData.venue}
                onChange={(e) => handleInputChange("venue", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Initial Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title || !formData.startsAt}>
              {loading ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
