"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, Flashlight, FlashlightOff, X, CheckCircle, AlertCircle, Clock, Pause, Play } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"
import { useGuests } from "@/lib/guests-context"
import { useEvents } from "@/lib/events-context"
import { useAuth } from "@/lib/auth-context"
import { soundEffects } from "@/lib/sound-effects"
import { PhotoCaptureDialog } from "./photo-capture-dialog"
import { DuplicateCheckinModal } from "./duplicate-checkin-modal"
import { CheckInSummaryDialog } from "./checkin-summary-dialog"
import { SupabaseGuestService } from "@/lib/supabase/guest-service"
import { ScannerSessionService } from "@/lib/supabase/scanner-session-service"
import { compressImage } from "@/lib/image-utils"
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

interface QRScannerProps {
  eventId: string
  onClose: () => void
}

type ScanResultState = {
  type: "success" | "duplicate" | "error" | "step1-complete"
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
  const [showSummary, setShowSummary] = useState(false)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1) // Track current step
  const [pendingCheckIn, setPendingCheckIn] = useState<{
    uniqueCode: string
    guestName: string
    guestId: string
  } | null>(null)
  const [duplicateGuest, setDuplicateGuest] = useState<any>(null)
  const [checkedInGuest, setCheckedInGuest] = useState<any>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [showAllCheckedInDialog, setShowAllCheckedInDialog] = useState(false)
  const [inactivityWarning, setInactivityWarning] = useState(false)
  const [scannerSessionId, setScannerSessionId] = useState<string | null>(null)
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const scannerDivId = "qr-reader"
  const isProcessingRef = useRef(false)
  const streamRef = useRef<MediaStream | null>(null)
  const isMountedRef = useRef(true)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  
  // Performance optimization: Create a Map for O(1) guest lookup by unique code
  const guestLookupRef = useRef<Map<string, any>>(new Map())

  const { guests, checkInGuest, refreshGuests } = useGuests()
  const { events } = useEvents()
  const { user, displayName } = useAuth()

  const event = events.find((e) => e.id === eventId)
  const eventGuests = guests.filter((g) => g.eventId === eventId)
  const checkedInCount = eventGuests.filter((g) => g.checkedIn).length
  const allGuestsCheckedIn = eventGuests.length > 0 && checkedInCount === eventGuests.length
  
  // Build guest lookup map for fast scanning (O(1) instead of O(n))
  useEffect(() => {
    const lookupMap = new Map()
    eventGuests.forEach(guest => {
      lookupMap.set(guest.uniqueCode, guest)
    })
    guestLookupRef.current = lookupMap
  }, [eventGuests])

  // Reset inactivity timer on any scan activity
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    setInactivityWarning(false)
    
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }
    
    // Show warning at 4 minutes (240000ms)
    const warningTimer = setTimeout(() => {
      if (isMountedRef.current && isScanning && !isPaused) {
        setInactivityWarning(true)
      }
    }, 240000) // 4 minutes
    
    // Auto-pause at 5 minutes (300000ms)
    inactivityTimerRef.current = setTimeout(() => {
      if (isMountedRef.current && isScanning && !isPaused) {
        console.log("⏸️ Auto-pausing scanner due to 5 minutes of inactivity")
        stopScanning()
        setIsPaused(true)
        setInactivityWarning(false)
        setScannerError("Scanner paused due to inactivity")
        setTimeout(() => setScannerError(null), 3000)
      }
    }, 300000) // 5 minutes
    
    return () => clearTimeout(warningTimer)
  }, [isScanning, isPaused])

  // Start inactivity timer when scanning starts
  useEffect(() => {
    if (isScanning && !isPaused) {
      resetInactivityTimer()
    }
    
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
    }
  }, [isScanning, isPaused, resetInactivityTimer])

  const resetScannerState = useCallback(() => {
    if (!isMountedRef.current) return
    setLastScanResult(null)
    setScannerError(null)
  }, [])

  const handleNextGuest = useCallback(() => {
    if (!isMountedRef.current) return
    // Reset all states for next guest
    setShowSummary(false)
    setCheckedInGuest(null)
    setPendingCheckIn(null)
    setLastScanResult(null)
    setCurrentStep(1)
    isProcessingRef.current = false
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
          
          // Store checked-in guest for summary
          setCheckedInGuest(result.guest)
          
          // Show summary dialog
          setShowSummary(true)
          
          // Clear last scan result
          setLastScanResult(null)
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
          setCurrentStep(1)
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

        // Compress photo for faster upload (increased resolution for better quality)
        const compressedBlob = await compressImage(
          new File([photoBlob], "photo.jpg", { type: "image/jpeg" }),
          {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.9,
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
          
          // Store checked-in guest for summary
          setCheckedInGuest(result.guest)
          
          // Show summary dialog
          setShowSummary(true)
          
          // Clear last scan result
          setLastScanResult(null)
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
          setCurrentStep(1)
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
      
      // Reset inactivity timer on successful scan
      resetInactivityTimer()

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

        // Step 1 Complete: QR Code scanned successfully
        soundEffects.playSuccessTone()
        setCurrentStep(1)
        setLastScanResult({
          type: "step1-complete",
          message: `✓ Step 1 Complete: ${guest.name} identified`,
          guest: guest,
          timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
        })

        // Increment scanner session scan count
        console.log("🔍 [QR Scanner] About to increment scan count", {
          scannerSessionId,
          hasScannerSessionId: !!scannerSessionId,
          timestamp: new Date().toISOString()
        })
        
        if (scannerSessionId) {
          try {
            console.log("🔍 [QR Scanner] Calling incrementScanCount with ID:", scannerSessionId)
            await ScannerSessionService.incrementScanCount(scannerSessionId)
            console.log("✅ [QR Scanner] Successfully incremented scan count")
          } catch (error) {
            console.error("❌ [QR Scanner] Failed to increment scan count:", error)
          }
        } else {
          console.warn("⚠️ [QR Scanner] No scannerSessionId available - cannot increment scan count")
        }

        // Store pending check-in data
        setPendingCheckIn({
          uniqueCode,
          guestName: guest.name,
          guestId: guest.id,
        })

        // Wait 1.5 seconds then proceed to Step 2
        setTimeout(() => {
          setCurrentStep(2)
          setLastScanResult(null)
          setShowPhotoCapture(true)
          isProcessingRef.current = false
        }, 1500)
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
    [eventId, displayName, user, resetInactivityTimer, scannerSessionId]
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
      
      // End scanner session tracking
      if (scannerSessionId) {
        try {
          await ScannerSessionService.endSession(scannerSessionId)
          console.log("📊 Scanner session ended:", scannerSessionId)
          setScannerSessionId(null)
        } catch (error) {
          console.error("Failed to end scanner session:", error)
        }
      }
      
      // Only update state if still mounted
      if (isMountedRef.current) {
        setIsScanning(false)
        setTorchEnabled(false)
      }
      isProcessingRef.current = false
    } catch (error) {
      console.error("Error stopping scanner:", error)
    }
  }, [scannerSessionId])

  const startScanning = useCallback(async () => {
    // Check if all guests are already checked in
    if (allGuestsCheckedIn) {
      setShowAllCheckedInDialog(true)
      return
    }
    
    resetScannerState()
    setScannerError(null)
    setIsPaused(false)
    
    // Start scanner session tracking
    try {
      const usherName = displayName || user?.email || "Unknown Usher"
      const usherEmail = user?.email || ""
      console.log("🔍 [QR Scanner] Starting scanner session for:", { usherName, usherEmail, eventId })
      
      const session = await ScannerSessionService.startSession({
        eventId,
        usherName,
        usherEmail,
      })
      
      setScannerSessionId(session.id)
      console.log("✅ [QR Scanner] Scanner session started successfully:", session.id)
    } catch (error) {
      console.error("❌ [QR Scanner] Failed to start scanner session:", error)
      // Continue anyway - session tracking is not critical
    }
    
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
          // Advanced camera constraints for better performance
          videoConstraints: {
            facingMode: "environment", // Prefer rear camera
            focusMode: "continuous", // Enable continuous autofocus
            advanced: [
              { focusMode: "continuous" },
              { focusDistance: 0 } // Auto focus
            ]
          }
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

      // Get the video stream for torch control and apply autofocus
      const videoElement = document.querySelector(`#${scannerDivId} video`) as HTMLVideoElement
      if (videoElement && videoElement.srcObject) {
        streamRef.current = videoElement.srcObject as MediaStream
        
        // Try to enable autofocus on the video track if supported
        const videoTrack = streamRef.current.getVideoTracks()[0]
        if (videoTrack) {
          try {
            const capabilities = videoTrack.getCapabilities() as any
            
            // Apply autofocus if supported
            if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
              await videoTrack.applyConstraints({
                advanced: [{ focusMode: 'continuous' } as any]
              })
              console.log('✓ Continuous autofocus enabled')
            }
          } catch (error) {
            // Autofocus not supported on this device - continue without it
            console.log('Autofocus not available on this device')
          }
        }
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
  }, [resetScannerState, handleSuccessfulScan, allGuestsCheckedIn])

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
    isMountedRef.current = true
    
    return () => {
      // Mark as unmounted to prevent state updates
      isMountedRef.current = false
      
      // Cleanup function - run synchronously to avoid race conditions
      const cleanup = async () => {
        try {
          // End scanner session if active
          if (scannerSessionId) {
            try {
              await ScannerSessionService.endSession(scannerSessionId)
              console.log("📊 Scanner session ended on unmount:", scannerSessionId)
            } catch (error) {
              console.error("Failed to end scanner session on unmount:", error)
            }
          }
          
          // Stop scanner if it's running
          if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            try {
              await html5QrCodeRef.current.stop()
            } catch (error) {
              console.debug("Scanner stop error:", error)
            }
          }
          
          // Stop all media tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
              try {
                track.stop()
              } catch (error) {
                console.debug("Track stop error:", error)
              }
            })
            streamRef.current = null
          }
          
          // Clear scanner instance
          if (html5QrCodeRef.current && typeof html5QrCodeRef.current.clear === 'function') {
            try {
              await html5QrCodeRef.current.clear()
            } catch (error) {
              // Silently handle clear errors during unmount
              console.debug("Scanner clear error:", error)
            }
          }
          
          html5QrCodeRef.current = null
        } catch (error) {
          console.debug("Cleanup error:", error)
        }
      }
      
      cleanup()
    }
  }, [])

  return (
    <>
      <style>{`
        #${scannerDivId} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 1.5rem;
        }
        #${scannerDivId} {
          border-radius: 1.5rem;
          box-shadow: 
            0 0 0 9999px rgba(0, 0, 0, 0.85),
            0 0 40px rgba(139, 92, 246, 0.6),
            0 0 80px rgba(139, 92, 246, 0.4),
            0 0 120px rgba(139, 92, 246, 0.2);
          overflow: hidden;
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

            {/* Scanning Guide Overlay - Instruction Only */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="relative">
                <div className="w-64 h-64"></div>
                <p className="text-white text-center mt-6 text-sm font-semibold drop-shadow-lg bg-black/60 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/20">
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

            {/* Inactivity Warning */}
            {inactivityWarning && !scannerError && (
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 max-w-[90%] bg-amber-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 pointer-events-auto z-20 animate-pulse">
                <Clock className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">Scanner will pause in 1 minute due to inactivity</span>
              </div>
            )}

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
                  {lastScanResult.type === "success" || lastScanResult.type === "step1-complete" ? (
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
                          lastScanResult.type === "success" || lastScanResult.type === "step1-complete"
                            ? "text-emerald-300 border-emerald-400/50" 
                            : lastScanResult.type === "duplicate"
                            ? "text-amber-300 border-amber-400/50"
                            : "text-red-300 border-red-400/50"
                        }`}
                      >
                        {lastScanResult.type === "step1-complete" ? "STEP 1" : lastScanResult.type}
                      </Badge>
                      {lastScanResult.timestamp && (
                        <span className="text-xs text-white/60">{lastScanResult.timestamp}</span>
                      )}
                    </div>
                    <p className="text-sm leading-snug font-medium">{lastScanResult.message}</p>
                    {lastScanResult.type === "step1-complete" && lastScanResult.guest && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-white/60">🪑 Seating:</span>
                          <span className="text-emerald-300 font-medium">{lastScanResult.guest.seatingArea || 'Free Seating'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-white/60">🍽️ Cuisine:</span>
                          <span className="text-emerald-300 font-medium">{lastScanResult.guest.cuisineChoice || 'Traditional'}</span>
                        </div>
                        <p className="text-xs text-emerald-300 font-medium mt-2">
                          → Proceeding to Step 2: Photo Capture
                        </p>
                      </div>
                    )}
                    {lastScanResult.guest?.name && lastScanResult.type !== "step1-complete" && (
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
              {isPaused ? <Pause className="h-10 w-10 text-amber-400" /> : <Camera className="h-10 w-10 text-primary" />}
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">
                {isPaused ? "Scanner Paused" : "Ready to Scan"}
              </h3>
              <p className="text-sm text-white/70 leading-relaxed max-w-md">
                {isPaused 
                  ? "Camera paused due to inactivity. Press resume when ready to continue scanning."
                  : "Grant camera permissions and press start to begin scanning guest passes."
                }
              </p>
            </div>
            <Button 
              size="lg" 
              onClick={startScanning} 
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
            >
              {isPaused ? (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  <span>Resume Scanning</span>
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-5 w-5" />
                  <span>Start Scanning</span>
                </>
              )}
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
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className={`flex items-center gap-2 ${currentStep === 1 ? 'text-primary font-semibold' : 'text-white/50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep === 1 ? 'border-primary bg-primary/20' : 'border-white/30'
              }`}>
                1
              </div>
              <span className="text-xs sm:text-sm">QR Scan</span>
            </div>
            <div className="w-8 h-0.5 bg-white/30"></div>
            <div className={`flex items-center gap-2 ${currentStep === 2 ? 'text-primary font-semibold' : 'text-white/50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep === 2 ? 'border-primary bg-primary/20' : 'border-white/30'
              }`}>
                2
              </div>
              <span className="text-xs sm:text-sm">Photo</span>
            </div>
          </div>
          
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
            setCurrentStep(1) // Reset to Step 1 if photo dialog is closed
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
            setCurrentStep(1) // Reset to Step 1 after duplicate modal closes
            isProcessingRef.current = false
          }}
          guest={duplicateGuest}
        />
      )}

      {/* Check-In Summary Dialog */}
      {showSummary && checkedInGuest && (
        <CheckInSummaryDialog
          open={showSummary}
          onClose={() => setShowSummary(false)}
          onNextGuest={handleNextGuest}
          guest={checkedInGuest}
        />
      )}

      {/* All Guests Checked In Dialog */}
      <AlertDialog open={showAllCheckedInDialog} onOpenChange={setShowAllCheckedInDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              All Guests Checked In
            </AlertDialogTitle>
            <AlertDialogDescription>
              All {eventGuests.length} guests for this event have already been checked in. 
              {" "}Do you want to continue scanning anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowAllCheckedInDialog(false)
              onClose()
            }}>
              Close Scanner
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowAllCheckedInDialog(false)
              // Force start scanning even though all are checked in
              resetScannerState()
              setScannerError(null)
              setIsPaused(false)
              setIsScanning(true)
              
              // Continue with normal scanning flow
              setTimeout(async () => {
                const scannerElement = document.getElementById(scannerDivId)
                if (!scannerElement) return
                
                if (!html5QrCodeRef.current) {
                  html5QrCodeRef.current = new Html5Qrcode(scannerDivId)
                }
                
                try {
                  const devices = await Html5Qrcode.getCameras()
                  if (!devices || devices.length === 0) {
                    throw new Error("No cameras found on this device")
                  }
                  
                  const rearCamera = devices.find(device => 
                    device.label.toLowerCase().includes('back') || 
                    device.label.toLowerCase().includes('rear') ||
                    device.label.toLowerCase().includes('environment')
                  )
                  
                  const selectedCameraId = rearCamera?.id || devices[0].id
                  setCameraId(selectedCameraId)
                  
                  await html5QrCodeRef.current.start(
                    selectedCameraId,
                    {
                      fps: 30,
                      qrbox: { width: 250, height: 250 },
                      aspectRatio: 1.0,
                      disableFlip: false,
                      videoConstraints: {
                        facingMode: "environment",
                        focusMode: "continuous",
                        advanced: [
                          { focusMode: "continuous" },
                          { focusDistance: 0 }
                        ]
                      }
                    },
                    (decodedText) => {
                      handleSuccessfulScan(decodedText)
                    },
                    (errorMessage) => {
                      // Silent scanning
                    }
                  )
                  
                  const videoElement = document.querySelector(`#${scannerDivId} video`) as HTMLVideoElement
                  if (videoElement && videoElement.srcObject) {
                    streamRef.current = videoElement.srcObject as MediaStream
                  }
                } catch (error) {
                  console.error("Camera access error:", error)
                  const message = error instanceof Error ? error.message : "Unable to access camera"
                  setScannerError(message)
                  setIsScanning(false)
                }
              }, 100)
            }}>
              Continue Scanning
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </>
  )
}
