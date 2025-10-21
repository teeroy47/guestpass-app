"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, User, Phone, UtensilsCrossed, Armchair, Camera, Clock } from "lucide-react"

interface CheckInSummaryDialogProps {
  open: boolean
  onClose: () => void
  onNextGuest: () => void
  guest: {
    name: string
    email?: string
    phone?: string
    seatingArea?: string
    cuisineChoice?: string
    photoUrl?: string
    checkedInAt?: string
    checkedInBy?: string
  }
}

export function CheckInSummaryDialog({ 
  open, 
  onClose, 
  onNextGuest, 
  guest 
}: CheckInSummaryDialogProps) {
  
  const handleNextGuest = () => {
    onNextGuest()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[380px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-emerald-600 text-base">
            <CheckCircle className="h-5 w-5" />
            Check-In Successful!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Guest Photo (if available) */}
          {guest.photoUrl && (
            <div className="flex justify-center">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500">
                <img 
                  src={guest.photoUrl} 
                  alt={guest.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Guest Details Card */}
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-3 space-y-2">
              {/* Name */}
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm break-words">{guest.name}</p>
                </div>
              </div>

              {/* Phone */}
              {guest.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{guest.phone}</p>
                  </div>
                </div>
              )}

              <div className="border-t border-emerald-200 pt-2 mt-2 space-y-2">
                {/* Seating Area */}
                <div className="flex items-center gap-2">
                  <Armchair className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground">Seating: </span>
                    <span className="font-medium text-xs">
                      {guest.seatingArea || 'Free Seating'}
                    </span>
                  </div>
                </div>

                {/* Cuisine Choice */}
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground">Cuisine: </span>
                    <span className="font-medium text-xs">
                      {guest.cuisineChoice || 'Traditional'}
                    </span>
                  </div>
                </div>

                {/* Photo Status */}
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground">Photo: </span>
                    <span className="font-medium text-xs">
                      {guest.photoUrl ? '✓ Captured' : 'Not Taken'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Check-in Time */}
              {guest.checkedInAt && (
                <div className="flex items-center gap-2 pt-2 border-t border-emerald-200">
                  <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {new Date(guest.checkedInAt).toLocaleString('en-US', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                      {guest.checkedInBy && ` • ${guest.checkedInBy}`}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Button */}
          <Button 
            onClick={handleNextGuest}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Check In Another Guest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}