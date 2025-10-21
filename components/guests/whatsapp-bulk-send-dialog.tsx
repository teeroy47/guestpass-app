"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface WhatsAppBulkSendDialogProps {
  selectedGuestIds: string[]
  selectedGuests: Array<{ id: string; name: string; phone?: string }>
  eventId: string
  onComplete?: () => void
}

interface SendResult {
  sent: number
  failed: number
  skipped: number
  details: {
    success: string[]
    failed: Array<{ guestId: string; name: string; error: string }>
    skipped: Array<{ guestId: string; name: string; reason: string }>
  }
}

export function WhatsAppBulkSendDialog({
  selectedGuestIds,
  selectedGuests,
  eventId,
  onComplete,
}: WhatsAppBulkSendDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SendResult | null>(null)
  const { toast } = useToast()

  // Count guests with phone numbers
  const guestsWithPhone = selectedGuests.filter(g => g.phone)
  const guestsWithoutPhone = selectedGuests.filter(g => !g.phone)

  const handleSendBulk = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/whatsapp/send-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestIds: selectedGuestIds,
          eventId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to send invitations')
      }

      setResult(data.results)

      toast({
        title: "Invitations Sent!",
        description: `Successfully sent ${data.results.sent} WhatsApp invitations`,
        duration: 5000,
      })

      if (onComplete) {
        onComplete()
      }

    } catch (error) {
      console.error('Error sending bulk WhatsApp invitations:', error)
      
      toast({
        title: "Failed to Send",
        description: error instanceof Error ? error.message : 'Could not send WhatsApp invitations',
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={selectedGuestIds.length === 0}
          className="gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          Send WhatsApp ({selectedGuestIds.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Send WhatsApp Invitations
          </DialogTitle>
          <DialogDescription>
            Send event invitations with QR codes via WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          {!result && (
            <div className="space-y-3">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Selected:</span>
                  <Badge variant="secondary">{selectedGuestIds.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">With Phone:</span>
                  <Badge variant="default" className="bg-green-600">
                    {guestsWithPhone.length}
                  </Badge>
                </div>
                {guestsWithoutPhone.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Without Phone:</span>
                    <Badge variant="destructive">{guestsWithoutPhone.length}</Badge>
                  </div>
                )}
              </div>

              {guestsWithoutPhone.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-yellow-800">
                      <p className="font-medium">Note:</p>
                      <p>{guestsWithoutPhone.length} guest(s) will be skipped (no phone number)</p>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Each guest will receive a personalized message with event details and their QR code.
                Messages are sent at 1 per second to comply with API rate limits.
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-3">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Sending invitations... This may take a few minutes.
              </p>
            </div>
          )}

          {/* Results */}
          {result && !isLoading && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-700">{result.sent}</p>
                  <p className="text-xs text-green-600">Sent</p>
                </div>
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-center">
                  <XCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-red-700">{result.failed}</p>
                  <p className="text-xs text-red-600">Failed</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-yellow-700">{result.skipped}</p>
                  <p className="text-xs text-yellow-600">Skipped</p>
                </div>
              </div>

              {/* Detailed Results */}
              <ScrollArea className="h-[200px] border rounded-lg p-3">
                <div className="space-y-2">
                  {/* Success */}
                  {result.details.success.map((name, index) => (
                    <div key={`success-${index}`} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                      <span className="text-green-700">{name}</span>
                    </div>
                  ))}

                  {/* Failed */}
                  {result.details.failed.map((item, index) => (
                    <div key={`failed-${index}`} className="flex items-start gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-700 font-medium">{item.name}</p>
                        <p className="text-xs text-red-600">{item.error}</p>
                      </div>
                    </div>
                  ))}

                  {/* Skipped */}
                  {result.details.skipped.map((item, index) => (
                    <div key={`skipped-${index}`} className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0" />
                      <span className="text-yellow-700">{item.name}</span>
                      <span className="text-xs text-muted-foreground">({item.reason})</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          {!result ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleSendBulk}
                disabled={isLoading || guestsWithPhone.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send to {guestsWithPhone.length} Guest{guestsWithPhone.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}