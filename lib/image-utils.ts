/**
 * Image Compression and Optimization Utilities
 * Optimizes images for fast upload and efficient storage
 */

export interface CompressImageOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: "jpeg" | "webp"
}

/**
 * Compress and resize an image file for optimal storage
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed image as Blob
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.85,
    format = "jpeg",
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height

          if (width > height) {
            width = maxWidth
            height = width / aspectRatio
          } else {
            height = maxHeight
            width = height * aspectRatio
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Failed to get canvas context"))
          return
        }

        // Use high-quality image smoothing
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"

        // Draw image
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error("Failed to compress image"))
            }
          },
          `image/${format}`,
          quality
        )
      }

      img.onerror = () => {
        reject(new Error("Failed to load image"))
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Capture image from video stream (for camera capture)
 * @param videoElement - The video element showing camera feed
 * @param options - Compression options
 * @returns Compressed image as Blob
 */
export async function captureFromVideo(
  videoElement: HTMLVideoElement,
  options: CompressImageOptions & { circular?: boolean } = {}
): Promise<Blob> {
  const { quality = 0.85, format = "jpeg", circular = true } = options

  return new Promise((resolve, reject) => {
    try {
      const videoWidth = videoElement.videoWidth
      const videoHeight = videoElement.videoHeight
      
      // Calculate the size of the circular crop area
      // Use the smaller dimension to ensure the circle fits
      const size = Math.min(videoWidth, videoHeight)
      const radius = size / 2
      
      // Create canvas with square dimensions for circular crop
      const canvas = document.createElement("canvas")
      canvas.width = size
      canvas.height = size

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Failed to get canvas context"))
        return
      }

      if (circular) {
        // Create circular clipping path
        ctx.beginPath()
        ctx.arc(radius, radius, radius, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()
      }

      // Calculate source position to center the crop
      const sx = (videoWidth - size) / 2
      const sy = (videoHeight - size) / 2

      // Draw the video frame centered and cropped to circle
      ctx.drawImage(
        videoElement,
        sx, sy, size, size,  // Source rectangle (centered)
        0, 0, size, size     // Destination rectangle (full canvas)
      )

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error("Failed to capture image"))
          }
        },
        `image/${format}`,
        quality
      )
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Convert Blob to File with proper naming
 * @param blob - The blob to convert
 * @param filename - The desired filename
 * @returns File object
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type })
}

/**
 * Validate image file type and size
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB
 * @returns Validation result
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please upload a JPEG, PNG, or WebP image.",
    }
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB. Please choose a smaller image.`,
    }
  }

  return { valid: true }
}

/**
 * Generate a unique filename for guest photo
 * @param guestId - The guest ID
 * @param eventId - The event ID
 * @returns Unique filename
 */
export function generatePhotoFilename(guestId: string, eventId: string): string {
  const timestamp = Date.now()
  return `guest-photos/${eventId}/${guestId}_${timestamp}.jpg`
}

/**
 * Get estimated upload time based on file size and network speed
 * @param fileSizeBytes - File size in bytes
 * @param networkSpeedMbps - Network speed in Mbps (default: 10 for 4G)
 * @returns Estimated time in seconds
 */
export function estimateUploadTime(
  fileSizeBytes: number,
  networkSpeedMbps: number = 10
): number {
  const fileSizeMb = fileSizeBytes / (1024 * 1024)
  const timeSeconds = (fileSizeMb * 8) / networkSpeedMbps
  return Math.ceil(timeSeconds)
}