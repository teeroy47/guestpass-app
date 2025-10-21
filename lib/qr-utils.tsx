// QR Code generation utilities
import QRCode from "qrcode"

export function generateQRCodeData(eventId: string, uniqueCode: string): string {
  // Format: eventId:uniqueCode for easy parsing during scanning
  return `${eventId}:${uniqueCode}`
}

export function parseQRCodeData(qrData: string): { eventId: string; uniqueCode: string } | null {
  const parts = qrData.split(":")
  if (parts.length !== 2) {
    return null
  }
  return {
    eventId: parts[0],
    uniqueCode: parts[1],
  }
}

// Generate QR code SVG using the 'qrcode' package
export async function generateQRCodeSVG(data: string, size = 200): Promise<string> {
  // QRCode.toString returns an SVG string when type: 'svg' is used
  try {
    const svg = await QRCode.toString(data, { type: "svg", width: size })
    return svg
  } catch (err) {
    console.error("Failed to generate QR SVG:", err)
    // Fallback: return a minimal SVG to avoid breaking callers
    return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" fill="white"/></svg>`
  }
}

// Convert an SVG string into a PNG and trigger download in the browser
export async function downloadQRCodeAsPNGFromSVG(
  svgString: string,
  filename: string,
  size = 400,
  guestName?: string
): Promise<void> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return resolve()

    // Add extra height for guest name if provided
    const textHeight = guestName ? 60 : 0
    const padding = 20
    canvas.width = size
    canvas.height = size + textHeight

    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      // Fill white background
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw the QR code
      ctx.drawImage(img, 0, 0, size, size)

      // Draw guest name if provided
      if (guestName) {
        ctx.fillStyle = "#000000"
        ctx.font = "bold 24px Arial, sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        
        // Draw text in the center of the text area
        const textY = size + textHeight / 2
        ctx.fillText(guestName, canvas.width / 2, textY)
      }

      // Download as PNG
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = filename
          a.click()
          URL.revokeObjectURL(url)
        }
        resolve()
      }, "image/png")
    }

    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(svgBlob)
    img.src = url
  })
}

export async function downloadQRCodeAsPNG(svgString: string, filename: string, size = 400, guestName?: string) {
  return downloadQRCodeAsPNGFromSVG(svgString, filename, size, guestName)
}
