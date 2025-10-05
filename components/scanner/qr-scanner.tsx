"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, Flashlight, FlashlightOff, X, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { BrowserMultiFormatReader } from "@zxing/browser"
import { NotFoundException, Result } from "@zxing/library"
import { useGuests } from "@/lib/guests-context"
import { useEvents } from "@/lib/events-context"

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

const RESTART_DELAY_MS = 1500

export function QRScanner({ eventId, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [lastScanResult, setLastScanResult] = useState<ScanResultState | null>(null)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHandlingResultRef = useRef(false)
  const isReaderActiveRef = useRef(false)

  const { guests, checkInGuest } = useGuests()
  const { events } = useEvents()

  const event = events.find((e) => e.id === eventId)
  const eventGuests = guests.filter((g) => g.eventId === eventId)
  const checkedInCount = eventGuests.filter((g) => g.checkedIn).length

  const resetScannerState = useCallback(() => {
    setLastScanResult(null)
    setScannerError(null)
  }, [])

  const stopScanning = useCallback(() => {
    isReaderActiveRef.current = false

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = null
    }

    if (readerRef.current) {
      readerRef.current.reset()
      readerRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.onloadedmetadata = null
    }

    setIsScanning(false)
    setTorchEnabled(false)
  }, [])

  const handleSuccessfulScan = useCallback(
    async (payload: string, rawResult: Result) => {
      if (isHandlingResultRef.current) {
        return
      }

      isHandlingResultRef.current = true

      try {
        const [scannedEventId, uniqueCode] = payload.split(":")

        if (scannedEventId !== eventId) {
          setLastScanResult({
            type: "error",
            message: "QR code is for a different event",
          })
          return
        }

        const guest = eventGuests.find((g) => g.uniqueCode === uniqueCode)

        if (!guest) {
          setLastScanResult({
            type: "error",
            message: "Guest not found in this event",
          })
          return
        }

        if (guest.checkedIn) {
          setLastScanResult({
            type: "duplicate",
            message: `${guest.name} already checked in`,
            guest,
            timestamp: guest.checkedInAt,
          })
          return
        }

        await checkInGuest(eventId, uniqueCode, "scanner")
        setLastScanResult({
          type: "success",
          message: `${guest.name} checked in successfully!`,
          guest,
          timestamp: new Date().toLocaleTimeString(),
        })
      } catch (error) {
        console.error("Failed to process QR code:", error)
        setLastScanResult({
          type: "error",
          message: "Failed to process QR code",
        })
      } finally {
        isHandlingResultRef.current = false
      }
    },
    [checkInGuest, eventGuests, eventId],
  )

  const startReader = useCallback(async () => {
    if (!videoRef.current) return

    if (!readerRef.current) {
      readerRef.current = new BrowserMultiFormatReader()
    }

    const track = streamRef.current?.getVideoTracks()[0]
    const hasCapabilities = track?.getCapabilities() as MediaTrackCapabilities | undefined

    if (hasCapabilities?.torch === false) {
      setTorchEnabled(false)
    }

    try {
      if (!readerRef.current || !videoRef.current) {
        throw new Error("Scanner not ready")
      }

      const deviceId = track?.getSettings()?.deviceId
      const result = await readerRef.current.decodeOnceFromVideoDevice(deviceId ?? undefined, videoRef.current)
      await handleSuccessfulScan(result.getText(), result)

      if (!isReaderActiveRef.current) {
        return
      }

      restartTimeoutRef.current = setTimeout(() => {
        resetScannerState()
        if (isReaderActiveRef.current) {
          startReader().catch((error) => {
            console.error("Failed to restart scanner:", error)
            setScannerError("Unable to continue scanning. Please try again.")
            stopScanning()
          })
        }
      }, RESTART_DELAY_MS)
    } catch (error) {
      if (error instanceof NotFoundException) {
        // No QR code found in frame yet; restart scanner loop
        restartTimeoutRef.current = setTimeout(() => {
          if (!isReaderActiveRef.current) {
            return
          }

          startReader().catch((err) => {
            console.error("Failed to restart scanner after no detection:", err)
            setScannerError("Unable to keep scanning. Please restart the scanner.")
            stopScanning()
          })
        }, 250)
        return
      }

      console.error("Scanner error:", error)
      setScannerError("Unexpected scanner error. Please restart.")
      stopScanning()
    }
  }, [handleSuccessfulScan, resetScannerState, stopScanning])

  const startScanning = useCallback(async () => {
    resetScannerState()

    try {
      if (isReaderActiveRef.current) {
        return
      }

      isReaderActiveRef.current = true

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        
        // Wait for video metadata to load
        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => {
            resolve()
          }
          video.onerror = () => {
            reject(new Error("Failed to load video metadata"))
          }
          // Timeout after 5 seconds
          setTimeout(() => reject(new Error("Video load timeout")), 5000)
        })
        
        try {
          await video.play()
        } catch (playError) {
          console.error("Failed to play video stream:", playError)
          setScannerError("Unable to start the camera stream. Tap to retry.")
          throw playError
        }
      }

      setIsScanning(true)
      await startReader()
    } catch (error) {
      console.error("Camera access error:", error)
      const message =
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Camera access denied. Please enable camera permissions."
          : "Unable to access the camera. Check if another application is using it."
      setLastScanResult({
        type: "error",
        message,
      })
      setScannerError(message)
      isReaderActiveRef.current = false
      stopScanning()
    }
  }, [resetScannerState, startReader, stopScanning])

  const toggleTorch = useCallback(async () => {
    const stream = streamRef.current
    if (!stream) return

    const track = stream.getVideoTracks()[0]
    const capabilities = track.getCapabilities() as MediaTrackCapabilities | undefined

    if (!capabilities || !("torch" in capabilities)) {
      setScannerError("Torch not supported on this device.")
      return
    }

    try {
      const desired = !torchEnabled
      await track.applyConstraints({
        advanced: [{ torch: desired } as MediaTrackConstraints],
      })
      setTorchEnabled(desired)
      setScannerError(null)
    } catch (error) {
      console.error("Torch toggle error:", error)
      setScannerError("Unable to toggle the torch on this device.")
    }
  }, [torchEnabled])

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [stopScanning])

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/60 border-b border-white/10">
        <div>
          <h2 className="text-lg font-semibold text-white">{event?.title}</h2>
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
          className="text-white hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 relative overflow-hidden bg-black">
        {isScanning ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="absolute inset-0 w-full h-full object-cover"
              style={{ display: 'block' }}
            />

            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-white/80 rounded-lg relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 pointer-events-auto z-10">
              <Button variant="outline" size="lg" onClick={toggleTorch} className="bg-black/60 border-white/20 text-white">
                {torchEnabled ? <FlashlightOff className="mr-2 h-5 w-5" /> : <Flashlight className="mr-2 h-5 w-5" />}
                <span>{torchEnabled ? "Torch Off" : "Torch On"}</span>
              </Button>
              <Button variant="outline" size="lg" onClick={stopScanning} className="bg-black/60 border-white/20 text-white">
                <Camera className="mr-2 h-5 w-5" />
                <span>Pause Scanner</span>
              </Button>
            </div>

            {scannerError && (
              <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-red-500/80 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 pointer-events-auto z-10">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{scannerError}</span>
              </div>
            )}

            {lastScanResult && (
              <Card className="absolute bottom-36 left-1/2 transform -translate-x-1/2 w-80 max-w-[90%] bg-black/80 border-white/10 text-white pointer-events-auto z-10">
                <CardContent className="p-4 flex gap-3 items-start">
                  {lastScanResult.type === "success" ? (
                    <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0" />
                  ) : lastScanResult.type === "duplicate" ? (
                    <Clock className="h-6 w-6 text-amber-300 shrink-0" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-red-400 shrink-0" />
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-white/20 text-white/80 uppercase tracking-wide">
                        {lastScanResult.type}
                      </Badge>
                      {lastScanResult.timestamp && (
                        <span className="text-xs text-white/60">{lastScanResult.timestamp}</span>
                      )}
                    </div>
                    <p className="text-sm leading-snug">{lastScanResult.message}</p>
                    {lastScanResult.guest?.name && (
                      <p className="text-xs text-white/60">Guest: {lastScanResult.guest.name}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center text-white/80 px-6">
            <Camera className="h-12 w-12 text-white/60" />
            <p className="text-sm leading-relaxed">
              Ready to scan guest passes. Grant camera permissions and press start when you are ready.
            </p>
            <Button size="lg" onClick={() => {
              void startScanning()
            }} className="bg-primary text-primary-foreground">
              <Camera className="mr-2 h-5 w-5" />
              <span>Start Scanning</span>
            </Button>
            {scannerError && (
              <div className="flex items-center justify-center gap-2 text-red-300 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{scannerError}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/10 bg-black/70">
        <div className="flex flex-col gap-4 text-white/70 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p>Tip: Ask guests to brighten their screen and hold the QR steady inside the guide.</p>
            <p className="text-xs text-white/50">If the camera freezes, pause and restart the scanner.</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                if (isScanning) {
                  stopScanning()
                } else {
                  void startScanning()
                }
              }}
              className="border-white/20 text-white"
            >
              <Camera className="mr-2 h-5 w-5" />
              <span>{isScanning ? "Pause Scanner" : "Start Scanner"}</span>
            </Button>
            <Button variant="ghost" size="lg" onClick={resetScannerState} className="text-white/70 hover:text-white">
              Reset Status
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
