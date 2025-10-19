"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, Clock, User, Mail, Phone, X, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface DuplicateCheckinModalProps {
  open: boolean
  onClose: () => void
  guest: {
    name: string
    email?: string
    phone?: string
    photoUrl?: string
    checkedInAt?: string
    usherName?: string
    firstCheckinAt?: string
  }
}

export function DuplicateCheckinModal({ open, onClose, guest }: DuplicateCheckinModalProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  // Debug logging
  console.log("[DuplicateCheckinModal] Guest data:", {
    name: guest.name,
    photoUrl: guest.photoUrl,
    hasPhotoUrl: !!guest.photoUrl,
  })

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatCheckinTime = (timestamp?: string) => {
    if (!timestamp) return "Unknown"
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch {
      return "Unknown"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <CheckCircle className="h-5 w-5" />
            Already Checked In
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Guest Photo and Name */}
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-orange-100">
                {guest.photoUrl && !imageError && (
                  <AvatarImage 
                    src={guest.photoUrl} 
                    alt={guest.name}
                    onError={(e) => {
                      console.error("[DuplicateCheckinModal] Failed to load image:", guest.photoUrl)
                      setImageError(true)
                      setImageLoading(false)
                    }}
                    onLoad={() => {
                      console.log("[DuplicateCheckinModal] Image loaded successfully:", guest.photoUrl)
                      setImageLoading(false)
                    }}
                  />
                )}
                <AvatarFallback className="text-3xl bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                  {getInitials(guest.name)}
                </AvatarFallback>
              </Avatar>
              {/* Loading spinner overlay */}
              {guest.photoUrl && imageLoading && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">{guest.name}</h3>
              <Badge variant="secondary" className="mt-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Checked In
              </Badge>
            </div>
          </div>

          {/* Guest Details */}
          <div className="space-y-3 bg-gray-50 rounded-lg p-4">
            {guest.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700">{guest.email}</span>
              </div>
            )}

            {guest.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700">{guest.phone}</span>
              </div>
            )}

            {guest.usherName && (
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700">
                  Checked in by <span className="font-medium">{guest.usherName}</span>
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">
                {formatCheckinTime(guest.firstCheckinAt || guest.checkedInAt)}
              </span>
            </div>
          </div>

          {/* Info Message */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800 text-center">
              This guest has already been checked in. No action needed.
            </p>
          </div>

          {/* Close Button */}
          <Button onClick={onClose} className="w-full" size="lg">
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}