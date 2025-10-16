"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { User, Mail, Shield, Loader2, Check } from "lucide-react"

export function UserProfile() {
  const { user, displayName, updateDisplayName } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState(displayName || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const role = (user?.app_metadata?.role ?? "usher") as "admin" | "usher"
  const email = user?.email || ""

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

    if (trimmedName.length > 100) {
      setError("Name must be 100 characters or fewer")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await updateDisplayName(trimmedName)
      toast({
        title: "Profile updated",
        description: "Your display name has been updated successfully",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update name"
      setError(errorMessage)
      toast({
        title: "Update failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasChanges = name.trim() !== (displayName || "")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Profile Settings</h2>
        <p className="text-muted-foreground">Manage your account information and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Your account details and role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <div className="text-sm font-medium text-foreground bg-muted px-3 py-2 rounded-md">
                {email}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Role
              </Label>
              <div>
                <Badge variant={role === "admin" ? "default" : "secondary"} className="text-sm">
                  {role === "admin" ? "Administrator" : "Usher"}
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {role === "admin" 
                  ? "You have full access to all features including event management and analytics."
                  : "You can scan guest QR codes and check in attendees at events."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Display Name Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Display Name
            </CardTitle>
            <CardDescription>
              This name will appear in usher statistics and check-in records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Your Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError(null)
                  }}
                  disabled={isSubmitting}
                  className={error ? "border-destructive" : ""}
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                {!error && displayName && (
                  <p className="text-xs text-muted-foreground">
                    Current name: {displayName}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting || !hasChanges}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : hasChanges ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Update Name
                  </>
                ) : (
                  "No Changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info Card */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="shrink-0">
              <div className="rounded-full bg-blue-500/10 p-2">
                <User className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Why is my name important?</p>
              <p className="text-sm text-muted-foreground">
                Your display name helps event organizers track which ushers are checking in guests. 
                It appears in the usher statistics dashboard and in guest check-in records for accountability and performance tracking.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}