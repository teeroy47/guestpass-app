"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface WhatsAppSendButtonProps {
  guestId: string
  guestName: string
  guestPhone?: string
  eventId: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function WhatsAppSendButton({
  guestId,
  guestName,
  guestPhone,
  eventId,
  variant = "outline",
  size = "sm",
  className,
}: WhatsAppSendButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const { toast } = useToast()

  const handleSendInvitation = async () => {
    setShowConfirmDialog(false)
    setIsLoading(true)

    try {
      const response = await fetch('/api/whatsapp/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestId,
          eventId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to send invitation')
      }

      toast({
        title: "Invitation Sent!",
        description: `WhatsApp invitation sent to ${guestName}`,
        duration: 5000,
      })

    } catch (error) {
      console.error('Error sending WhatsApp invitation:', error)
      
      toast({
        title: "Failed to Send",
        description: error instanceof Error ? error.message : 'Could not send WhatsApp invitation',
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Check if guest has phone number
  if (!guestPhone) {
    return (
      <Button
        variant="ghost"
        size={size}
        disabled
        className={className}
        title="No phone number available"
      >
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
      </Button>
    )
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowConfirmDialog(true)}
        disabled={isLoading}
        className={className}
        title="Send WhatsApp invitation"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MessageCircle className="h-4 w-4" />
        )}
        {size !== "icon" && (
          <span className="ml-2">
            {isLoading ? "Sending..." : "WhatsApp"}
          </span>
        )}
      </Button>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Send WhatsApp Invitation
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Send event invitation with QR code to:
              </p>
              <div className="bg-muted p-3 rounded-md">
                <p className="font-semibold">{guestName}</p>
                <p className="text-sm text-muted-foreground">{guestPhone}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                The guest will receive a message with event details and their personal QR code.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendInvitation}
              className="bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Send Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}