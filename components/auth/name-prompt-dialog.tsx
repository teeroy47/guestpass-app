"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User } from "lucide-react"

interface NamePromptDialogProps {
  open: boolean
  onSubmit: (name: string) => Promise<void>
  userEmail: string
}

export function NamePromptDialog({ open, onSubmit, userEmail }: NamePromptDialogProps) {
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  console.log("[NamePromptDialog] Render:", { open, userEmail, name })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedName = name.trim()
    
    if (!trimmedName) {
      setError("Please enter your name")
      return
    }

    if (trimmedName.length < 2) {
      setError("Name must be at least 2 characters")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit(trimmedName)
      // Dialog will close automatically when open prop changes
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save name")
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-3">
                <User className="h-6 w-6 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-center">Welcome! What's your name?</DialogTitle>
            <DialogDescription className="text-center">
              We need your name to track your check-in activity and display it on the usher statistics
              dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(null)
                }}
                disabled={isSubmitting}
                autoFocus
                maxLength={100}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="text-muted-foreground">
                <strong>Email:</strong> {userEmail}
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                Your name will be associated with this email address
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}