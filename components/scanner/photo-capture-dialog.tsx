"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Camera, X, RotateCcw, Check, Loader2 } from "lucide-react"
import { compressImage, captureFromVideo } from "@/lib/image-utils"

interface PhotoCaptureDialogProps {
  open: boolean
  onClose: () => void
  onCapture: (photoBlob: Blob) => Promise<void>
  onSkip?: () => Promise<void>
  guestName: string
}

export function PhotoCaptureDialog({ open, onClose, onCapture, onSkip, guestName }: PhotoCaptureDialogProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      console.log("Requesting camera access...")
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Camera access timeout")), 10000)
      )
      
      const cameraPromise = navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user", // Front camera for selfie
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      const mediaStream = await Promise.race([cameraPromise, timeoutPromise]) as MediaStream

      console.log("Camera access granted:", mediaStream)
      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        // Ensure video plays
        await videoRef.current.play().catch(err => {
          console.error("Video play error:", err)
        })
      }
    } catch (err) {
      console.error("Camera access error:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      if (errorMessage.includes("Permission denied") || errorMessage.includes("NotAllowedError")) {
        setError("Camera permission denied. Please allow camera access and try again.")
      } else if (errorMessage.includes("timeout")) {
        setError("Camera access timed out. Please try again.")
      } else {
        setError("Unable to access camera. Please check permissions and try again.")
      }
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }, [stream])

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current) return

    try {
      setIsProcessing(true)
      const photoBlob = await captureFromVideo(videoRef.current, {
        quality: 0.85,
        format: "jpeg",
      })

      // Compress the photo
      const compressedBlob = await compressImage(
        new File([photoBlob], "photo.jpg", { type: "image/jpeg" }),
        {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.85,
          format: "jpeg",
        }
      )

      // Create preview URL
      const previewUrl = URL.createObjectURL(compressedBlob)
      setCapturedPhoto(previewUrl)

      // Stop camera
      stopCamera()
    } catch (err) {
      console.error("Photo capture error:", err)
      setError("Failed to capture photo. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }, [stopCamera])

  const retakePhoto = useCallback(() => {
    if (capturedPhoto) {
      URL.revokeObjectURL(capturedPhoto)
      setCapturedPhoto(null)
    }
    startCamera()
  }, [capturedPhoto, startCamera])

  const confirmPhoto = useCallback(async () => {
    if (!capturedPhoto) return

    try {
      setIsProcessing(true)
      setError(null)

      // Convert data URL to Blob
      const response = await fetch(capturedPhoto)
      const blob = await response.blob()

      console.log("Starting photo upload...", { size: blob.size, type: blob.type })

      // Add timeout to prevent infinite loading
      const uploadPromise = onCapture(blob)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Upload timeout")), 30000) // 30 second timeout
      )

      await Promise.race([uploadPromise, timeoutPromise])

      console.log("Photo upload completed successfully")

      // Cleanup
      URL.revokeObjectURL(capturedPhoto)
      setCapturedPhoto(null)
      onClose()
    } catch (err) {
      console.error("Photo upload error:", err)
      setError(err instanceof Error ? err.message : "Failed to upload photo. Please try again.")
      setIsProcessing(false)
    }
  }, [capturedPhoto, onCapture, onClose])

  const handleSkip = useCallback(async () => {
    if (!onSkip) return
    
    try {
      setIsProcessing(true)
      console.log("Skipping photo capture...")
      await onSkip()
      stopCamera()
      if (capturedPhoto) {
        URL.revokeObjectURL(capturedPhoto)
        setCapturedPhoto(null)
      }
      onClose()
    } catch (err) {
      console.error("Skip error:", err)
      setError("Failed to complete check-in. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }, [onSkip, stopCamera, capturedPhoto, onClose])

  const handleClose = useCallback(() => {
    stopCamera()
    if (capturedPhoto) {
      URL.revokeObjectURL(capturedPhoto)
      setCapturedPhoto(null)
    }
    onClose()
  }, [stopCamera, capturedPhoto, onClose])

  // Start camera when dialog opens
  useEffect(() => {
    if (open && !stream && !capturedPhoto) {
      console.log("Dialog opened, starting camera...")
      startCamera()
    }
    
    // Cleanup when dialog closes
    return () => {
      if (!open) {
        stopCamera()
      }
    }
  }, [open, stream, capturedPhoto, startCamera, stopCamera])

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        handleClose()
      }
    },
    [handleClose]
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Capture Guest Photo
          </DialogTitle>
          <DialogDescription>
            Take a photo of <span className="font-semibold">{guestName}</span> for verification
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera/Photo Preview */}
          <div className="relative aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden">
            {!capturedPhoto ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!stream && !error && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                )}
              </>
            ) : (
              <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
                <div className="text-center text-white p-4">
                  <p className="text-sm mb-4">{error}</p>
                  <Button onClick={startCamera} variant="secondary" size="sm">
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            {/* Guide Overlay */}
            {stream && !capturedPhoto && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-white/50 rounded-full relative">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-16 h-16 border-t-4 border-l-4 border-primary rounded-tl-full"></div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-16 border-b-4 border-r-4 border-primary rounded-br-full"></div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {!capturedPhoto ? (
              <>
                <div className="flex gap-3">
                  <Button onClick={handleClose} variant="outline" className="flex-1" disabled={isProcessing}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={capturePhoto}
                    className="flex-1"
                    disabled={!stream || isProcessing}
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Capture
                      </>
                    )}
                  </Button>
                </div>
                {onSkip && (
                  <Button 
                    onClick={handleSkip} 
                    variant="ghost" 
                    className="w-full text-muted-foreground hover:text-foreground" 
                    disabled={isProcessing}
                    size="sm"
                  >
                    Skip Photo & Check In Without Photo
                  </Button>
                )}
              </>
            ) : (
              <div className="flex gap-3">
                <Button onClick={retakePhoto} variant="outline" className="flex-1" disabled={isProcessing}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button onClick={confirmPhoto} className="flex-1" disabled={isProcessing} size="lg">
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Confirm
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Info */}
          <p className="text-xs text-center text-muted-foreground">
            Photo will be stored securely and used for verification purposes only
          </p>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  )
}