"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, Flashlight, FlashlightOff, X, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"
import { useGuests } from "@/lib/guests-context"
import { useEvents } from "@/lib/events-context"
import { useAuth } from "@/lib/auth-context"
import { soundEffects } from "@/lib/sound-effects"
import { PhotoCaptureDialog } from "./photo-capture-dialog"
import { DuplicateCheckinModal } from "./duplicate-checkin-modal"
import { SupabaseGuestService } from "@/lib/supabase/guest-service"
import { compressImage } from "@/lib/image-utils"

interface QRScannerProps {
  eventId: string
  onClose: () => void
}

type ScanResultState = {
  type: "success" | "duplicate" | "error"
  message: string
  guest?: any
  timestamp?: string
}

export function QRScanner({ eventId, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [lastScanResult, setLastScanResult] = useState<ScanResultState | null>(null)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [cameraId, setCameraId] = useState<string | null>(null)
  const [showPhotoCapture, setShowPhotoCapture] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [pendingCheckIn, setPendingCheckIn] = useState<{
    uniqueCode: string
    guestName: string
    guestId: string
  } | null>(null)
  const [duplicateGuest, setDuplicateGuest] = useState<any>(null)
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const scannerDivId = "qr-reader"
  const isProcessingRef = useRef(false)
  const streamRef = useRef<MediaStream | null>(null)
  
  // Performance optimization: Create a Map for O(1) guest lookup by unique code
  const guestLookupRef = useRef<Map<string, any>>(new Map())

  const { guests, checkInGuest, refreshGuests } = useGuests()
  const { events } = useEvents()
  const { user, displayName } = useAuth()

  const event = events.find((e) => e.id === eventId)
  const eventGuests = guests.filter((g) => g.eventId === eventId)
  const checkedInCount = eventGuests.filter((g) => g.checkedIn).length
  
  // Build guest lookup map for fast scanning (O(1) instead of O(n))
  useEffect(() => {
    const lookupMap = new Map()
    eventGuests.forEach(guest => {
      lookupMap.set(guest.uniqueCode, guest)
    })
    guestLookupRef.current = lookupMap
  }, [eventGuests])

  const resetScannerState = useCallback(() => {
    setLastScanResult(null)
    setScannerError(null)
  }, [])

  const handlePhotoSkip = useCallback(
    async () => {
      if (!pendingCheckIn) return

      try {
        // Complete check-in without photo
        const usherName = displayName || user?.email || "Unknown Usher"
        const usherEmail = user?.email || undefined
        const result = await checkInGuest(
          eventId,
          pendingCheckIn.uniqueCode,
          "scanner",
          usherName,
          usherEmail,
          undefined // No photo URL
        )

        if (result.status === "ok") {
          soundEffects.playSuccessTone()
          setLastScanResult({
            type: "success",
            message: `${result.guest?.name} checked in successfully (no photo)`,
            guest: result.guest,
            timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
          })

          // Reset after 1 second
          setTimeout(() => {
            isProcessingRef.current = false
            setLastScanResult(null)
          }, 1000)
        }

        // Refresh guests to get updated data
        await refreshGuests()
      } catch (error) {
        console.error("Failed to check in:", error)
        setLastScanResult({
          type: "error",
          message: "Failed to complete check-in. Please try again.",
        })
        setTimeout(() => {
          isProcessingRef.current = false
          setLastScanResult(null)
        }, 2000)
      } finally {
        setPendingCheckIn(null)
        setShowPhotoCapture(false)
      }
    },
    [pendingCheckIn, eventId, displayName, user, checkInGuest, refreshGuests]
  )

  const handlePhotoCapture = useCallback(
    async (photoBlob: Blob) => {
      if (!pendingCheckIn) return

      try {
        console.log("[QR Scanner] Starting photo capture process:", {
          guestId: pendingCheckIn.guestId,
          guestName: pendingCheckIn.guestName,
          originalBlobSize: photoBlob.size,
        })

        // Compress photo for faster upload
        const compressedBlob = await compressImage(
          new File([photoBlob], "photo.jpg", { type: "image/jpeg" }),
          {
            maxWidth: 800,
            maxHeight: 800,
            quality: 0.85,
            format: "jpeg",
          }
        )

        console.log("[QR Scanner] Photo compressed:", {
          compressedSize: compressedBlob.size,
          compressionRatio: ((1 - compressedBlob.size / photoBlob.size) * 100).toFixed(1) + "%",
        })

        // Upload photo to Supabase Storage
        const photoUrl = await SupabaseGuestService.uploadGuestPhoto(
          pendingCheckIn.guestId,
          eventId,
          compressedBlob
        )

        console.log("[QR Scanner] Photo uploaded, URL received:", photoUrl)

        // Complete check-in with photo URL
        const usherName = displayName || user?.email || "Unknown Usher"
        const usherEmail = user?.email || undefined
        
        console.log("[QR Scanner] Completing check-in with photo URL...")
        
        const result = await checkInGuest(
          eventId,
          pendingCheckIn.uniqueCode,
          "scanner",
          usherName,
          usherEmail,
          photoUrl
        )

        console.log("[QR Scanner] Check-in completed:", {
          status: result.status,
          guestName: result.guest?.name,
          photoUrlSaved: result.guest?.photoUrl,
        })

        if (result.status === "ok") {
          soundEffects.playSuccessTone()
          setLastScanResult({
            type: "success",
            message: `${result.guest?.name} checked in successfully!`,
            guest: result.guest,
            timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
          })

          // Reset after 1 second
          setTimeout(() => {
            isProcessingRef.current = false
            setLastScanResult(null)
          }, 1000)
        }

        // Refresh guests to get updated data
        await refreshGuests()
      } catch (error) {
        console.error("Failed to upload photo:", error)
        setLastScanResult({
          type: "error",
          message: "Failed to upload photo. Check-in completed without photo.",
        })
        setTimeout(() => {
          isProcessingRef.current = false
          setLastScanResult(null)
        }, 2000)
      } finally {
        setPendingCheckIn(null)
        setShowPhotoCapture(false)
      }
    },
    [pendingCheckIn, eventId, displayName, user, checkInGuest, refreshGuests]
  )

  const handleSuccessfulScan = useCallback(
    async (decodedText: string) => {
      // Prevent duplicate processing
      if (isProcessingRef.current) {
        return
      }

      isProcessingRef.current = true

      try {
        const [scannedEventId, uniqueCode] = decodedText.split(":")

        if (scannedEventId !== eventId) {
          soundEffects.playErrorTone()
          setLastScanResult({
            type: "error",
            message: "QR code is for a different event",
          })
          setTimeout(() => {
            isProcessingRef.current = false
          }, 1500)
          return
        }

        // Look up guest from our optimized map
        const guest = guestLookupRef.current.get(uniqueCode)

        if (!guest) {
          soundEffects.playErrorTone()
          setLastScanResult({
            type: "error",
            message: "Guest not found in this event",
          })
          setTimeout(() => {
            isProcessingRef.current = false
          }, 1500)
          return
        }

        // Check if already checked in
        if (guest.checkedIn) {
          soundEffects.playDuplicateTone()
          setDuplicateGuest(guest)
          setShowDuplicateModal(true)
          isProcessingRef.current = false
          return
        }

        // First check-in - capture photo
        setPendingCheckIn({
          uniqueCode,
          guestName: guest.name,
          guestId: guest.id,
        })
        setShowPhotoCapture(true)
      } catch (error) {
        console.error("Failed to process QR code:", error)
        setLastScanResult({
          type: "error",
          message: "Failed to process QR code",
        })
        setTimeout(() => {
          isProcessingRef.current = false
        }, 1500)
      }
    },
    [eventId, displayName, user]
  )

  const stopScanning = useCallback(async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop()
      }
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      
      setIsScanning(false)
      setTorchEnabled(false)
      isProcessingRef.current = false
    } catch (error) {
      console.error("Error stopping scanner:", error)
    }
  }, [])

  const startScanning = useCallback(async () => {
    resetScannerState()
    setScannerError(null)
    
    // First, set scanning state to true so the div renders
    setIsScanning(true)

    // Wait for the DOM to update and the scanner div to be rendered
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      // Ensure the scanner div exists before initializing
      const scannerElement = document.getElementById(scannerDivId)
      if (!scannerElement) {
        throw new Error("Scanner container not found. Please try again.")
      }

      // Initialize scanner if not already done
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerDivId)
      }

      // Get available cameras
      const devices = await Html5Qrcode.getCameras()
      
      if (!devices || devices.length === 0) {
        throw new Error("No cameras found on this device")
      }

      // Try to find rear camera, otherwise use first available
      const rearCamera = devices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      )
      
      const selectedCameraId = rearCamera?.id || devices[0].id
      setCameraId(selectedCameraId)

      // Start scanning with optimized config for fast detection
      await html5QrCodeRef.current.start(
        selectedCameraId,
        {
          fps: 30, // Increased to 30 FPS for faster detection with large guest lists
          qrbox: { width: 250, height: 250 }, // Scanning box size
          aspectRatio: 1.0,
          disableFlip: false, // Allow flipped QR codes
        },
        (decodedText) => {
          handleSuccessfulScan(decodedText)
        },
        (errorMessage) => {
          // Ignore "No QR code found" errors - they're expected
          // Only log actual errors
          if (!errorMessage.includes("No MultiFormat Readers")) {
            // Silent - scanning continuously
          }
        }
      )

      // Get the video stream for torch control
      const videoElement = document.querySelector(`#${scannerDivId} video`) as HTMLVideoElement
      if (videoElement && videoElement.srcObject) {
        streamRef.current = videoElement.srcObject as MediaStream
      }
    } catch (error) {
      console.error("Camera access error:", error)
      const message = error instanceof Error ? error.message : "Unable to access camera"
      setScannerError(message)
      setLastScanResult({
        type: "error",
        message: message.includes("Permission") 
          ? "Camera access denied. Please enable camera permissions in your browser settings."
          : "Unable to access the camera. Please check if another app is using it.",
      })
      // Reset scanning state on error
      setIsScanning(false)
    }
  }, [resetScannerState, handleSuccessfulScan])

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) {
      setScannerError("Camera stream not available")
      return
    }

    const track = streamRef.current.getVideoTracks()[0]
    
    if (!track) {
      setScannerError("No video track found")
      return
    }

    const capabilities = track.getCapabilities() as any

    if (!capabilities.torch) {
      setScannerError("Torch not supported on this device")
      setTimeout(() => setScannerError(null), 2000)
      return
    }

    try {
      const newTorchState = !torchEnabled
      await track.applyConstraints({
        advanced: [{ torch: newTorchState } as any],
      })
      setTorchEnabled(newTorchState)
      setScannerError(null)
    } catch (error) {
      console.error("Torch toggle error:", error)
      setScannerError("Unable to toggle torch")
      setTimeout(() => setScannerError(null), 2000)
    }
  }, [torchEnabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup function
      const cleanup = async () => {
        try {
          await stopScanning()
          
          // Only clear if scanner exists and has the clear method
          if (html5QrCodeRef.current && typeof html5QrCodeRef.current.clear === 'function') {
            try {
              await html5QrCodeRef.current.clear()
            } catch (error) {
              // Silently handle clear errors during unmount
              console.debug("Scanner cleanup:", error)
            }
          }
        } catch (error) {
          console.debug("Cleanup error:", error)
        }
      }
      
      cleanup()
    }
  }, [stopScanning])

  return (
    <>
      <style>{`
        #${scannerDivId} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 1rem;
        }
        #${scannerDivId} {
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
        }
      `}</style>
      <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black z-50 flex flex-col safe-area-inset">
        {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/60 border-b border-white/10 backdrop-blur-sm">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-white truncate">{event?.title}</h2>
          <p className="text-sm text-white/70">
            {checkedInCount} / {eventGuests.length} checked in
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            stopScanning()
            onClose()
          }}
          className="text-white hover:bg-white/10 shrink-0 ml-2"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 relative overflow-hidden bg-black">
        {isScanning ? (
          <>
            {/* QR Scanner Container - Constrained to center box */}
            <div 
              id={scannerDivId} 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: '280px',
                height: '280px',
                overflow: 'hidden',
                borderRadius: '1rem',
              }}
            />

            {/* Scanning Guide Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="relative">
                <div className="w-64 h-64 border-2 border-white/50 rounded-2xl relative bg-transparent">
                  {/* Corner decorations */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl"></div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl"></div>
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl"></div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl"></div>
                  
                  {/* Scanning line animation */}
                  <div className="absolute inset-0 overflow-hidden rounded-2xl">
                    <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line"></div>
                  </div>
                </div>
                <p className="text-white text-center mt-4 text-sm font-medium drop-shadow-lg">
                  Position QR code within frame
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-wrap gap-3 justify-center pointer-events-auto z-20 px-4">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={toggleTorch} 
                className="bg-black/70 backdrop-blur-sm border-white/20 text-white hover:bg-black/80 hover:text-white"
              >
                {torchEnabled ? <FlashlightOff className="mr-2 h-5 w-5" /> : <Flashlight className="mr-2 h-5 w-5" />}
                <span className="hidden sm:inline">{torchEnabled ? "Torch Off" : "Torch On"}</span>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={stopScanning} 
                className="bg-black/70 backdrop-blur-sm border-white/20 text-white hover:bg-black/80 hover:text-white"
              >
                <Camera className="mr-2 h-5 w-5" />
                <span>Pause</span>
              </Button>
            </div>

            {/* Error Message */}
            {scannerError && (
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 max-w-[90%] bg-red-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 pointer-events-auto z-20">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">{scannerError}</span>
              </div>
            )}

            {/* Scan Result */}
            {lastScanResult && (
              <Card className="absolute top-20 left-1/2 transform -translate-x-1/2 w-80 max-w-[90%] bg-black/90 backdrop-blur-sm border-white/20 text-white pointer-events-auto z-20 shadow-2xl">
                <CardContent className="p-4 flex gap-3 items-start">
                  {lastScanResult.type === "success" ? (
                    <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0" />
                  ) : lastScanResult.type === "duplicate" ? (
                    <Clock className="h-6 w-6 text-amber-400 shrink-0" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-red-400 shrink-0" />
                  )}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant="outline" 
                        className={`border-white/30 uppercase tracking-wide text-xs ${
                          lastScanResult.type === "success" 
                            ? "text-emerald-300 border-emerald-400/50" 
                            : lastScanResult.type === "duplicate"
                            ? "text-amber-300 border-amber-400/50"
                            : "text-red-300 border-red-400/50"
                        }`}
                      >
                        {lastScanResult.type}
                      </Badge>
                      {lastScanResult.timestamp && (
                        <span className="text-xs text-white/60">{lastScanResult.timestamp}</span>
                      )}
                    </div>
                    <p className="text-sm leading-snug font-medium">{lastScanResult.message}</p>
                    {lastScanResult.guest?.name && (
                      <p className="text-xs text-white/70">Guest: {lastScanResult.guest.name}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-6 text-center text-white px-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <Camera className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">Ready to Scan</h3>
              <p className="text-sm text-white/70 leading-relaxed max-w-md">
                Grant camera permissions and press start to begin scanning guest passes.
              </p>
            </div>
            <Button 
              size="lg" 
              onClick={startScanning} 
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
            >
              <Camera className="mr-2 h-5 w-5" />
              <span>Start Scanning</span>
            </Button>
            {scannerError && (
              <div className="flex items-center justify-center gap-2 text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{scannerError}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Tips */}
      <div className="p-4 border-t border-white/10 bg-black/70 backdrop-blur-sm">
        <div className="flex flex-col gap-3 text-white/70 text-xs sm:text-sm">
          <p className="text-center">
            💡 <span className="font-medium">Tip:</span> Ask guests to brighten their screen and hold the QR code steady
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            {!isScanning && (
              <Button
                variant="outline"
                size="sm"
                onClick={startScanning}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Camera className="mr-2 h-4 w-4" />
                <span>Start Scanner</span>
              </Button>
            )}
            {lastScanResult && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetScannerState} 
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                Clear Status
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Photo Capture Dialog */}
      {showPhotoCapture && pendingCheckIn && (
        <PhotoCaptureDialog
          open={showPhotoCapture}
          onClose={() => {
            setShowPhotoCapture(false)
            setPendingCheckIn(null)
            isProcessingRef.current = false
          }}
          onCapture={handlePhotoCapture}
          onSkip={handlePhotoSkip}
          guestName={pendingCheckIn.guestName}
        />
      )}

      {/* Duplicate Check-in Modal */}
      {showDuplicateModal && duplicateGuest && (
        <DuplicateCheckinModal
          open={showDuplicateModal}
          onClose={() => {
            setShowDuplicateModal(false)
            setDuplicateGuest(null)
            isProcessingRef.current = false
          }}
          guest={duplicateGuest}
        />
      )}
    </div>
    </>
  )
}
