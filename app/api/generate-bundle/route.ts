import { NextResponse } from "next/server"
import QRCode from "qrcode"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import JSZip from "jszip"

// Dynamically import canvas (using @napi-rs/canvas which has pre-built binaries)
let createCanvas: any, loadImage: any

async function initCanvas() {
  if (createCanvas) return // Already initialized
  try {
    // Try @napi-rs/canvas first (has pre-built binaries for Vercel)
    try {
      const canvasModule = await import("@napi-rs/canvas")
      createCanvas = canvasModule.createCanvas
      loadImage = canvasModule.loadImage
    } catch {
      // Fallback to node-canvas if available locally
      const canvasModule = await import("canvas")
      createCanvas = canvasModule.createCanvas
      loadImage = canvasModule.loadImage
    }
  } catch (e) {
    console.warn("Canvas module not available - using plain QR codes")
    createCanvas = null
    loadImage = null
  }
}

// Increase the maximum execution time for this route (Vercel)
export const maxDuration = 60 // 60 seconds for Pro plan, 10 for Hobby
export const dynamic = 'force-dynamic'

type GuestInput = { id?: string; name?: string; uniqueCode: string }

type GenerateBundlePayload = {
  eventId?: string
  guests?: GuestInput[]
  guestIds?: string[]
  format?: "pdf" | "zip"
}

// Maximum guests per bundle to prevent timeouts
const MAX_GUESTS_PER_BUNDLE = 1000 // Increased from 500 to handle larger events

function buildGuestList(guestsPayload?: GuestInput[], guestIds?: string[], guestsById: Map<string, GuestInput> = new Map()) {
  if (Array.isArray(guestsPayload)) {
    return guestsPayload.map((guest) => ({ id: guest.id, name: guest.name, uniqueCode: guest.uniqueCode }))
  }

  if (!Array.isArray(guestIds)) {
    return []
  }

  return guestIds
    .map((guestId) => guestsById.get(guestId))
    .filter((guest): guest is GuestInput => Boolean(guest))
    .map((guest) => ({ id: guest.id, name: guest.name, uniqueCode: guest.uniqueCode }))
}

function buildPngFilename(eventId: string, guest: GuestInput) {
  const safeName = (guest.name || "Guest").replace(/[^a-zA-Z0-9-_.]/g, "-")
  return `${safeName}-${guest.uniqueCode}.png`
}

async function generatePdfBundle(eventId: string, guests: GuestInput[]) {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Generate all QR codes in parallel
  const qrPromises = guests.map(guest => {
    const data = `${eventId}:${guest.uniqueCode}`
    return QRCode.toBuffer(data, { type: "png", width: 300 })
  })
  
  const qrBuffers = await Promise.all(qrPromises)
  
  // Add pages for all guests
  for (let i = 0; i < guests.length; i++) {
    const guest = guests[i]
    const pngBuffer = qrBuffers[i]
    const pngImage = await pdfDoc.embedPng(pngBuffer)

    const margin = 40
    const pageWidth = Math.max(300 + margin * 2, pngImage.width + margin * 2)
    const pageHeight = pngImage.height + 140 // Increased height for guest name

    const page = pdfDoc.addPage([pageWidth, pageHeight])
    const x = (pageWidth - pngImage.width) / 2
    const y = pageHeight - pngImage.height - 80 // Adjusted position

    page.drawImage(pngImage, { x, y, width: pngImage.width, height: pngImage.height })
    
    // Draw guest name centered below QR code
    const guestName = guest.name || "Guest"
    const nameWidth = boldFont.widthOfTextAtSize(guestName, 16)
    const nameX = (pageWidth - nameWidth) / 2
    page.drawText(guestName, { x: nameX, y: 40, size: 16, font: boldFont, color: rgb(0, 0, 0) })
    
    // Draw unique code centered below name
    const codeText = guest.uniqueCode || ""
    const codeWidth = font.widthOfTextAtSize(codeText, 10)
    const codeX = (pageWidth - codeWidth) / 2
    page.drawText(codeText, { x: codeX, y: 20, size: 10, font, color: rgb(0.4, 0.4, 0.4) })
  }

  return pdfDoc.save()
}

async function generateZipBundle(eventId: string, guests: GuestInput[]) {
  const zip = new JSZip()
  await initCanvas()

  console.log(`Starting ZIP generation for ${guests.length} guests (sequential processing)...`)
  console.log(`Canvas available: ${createCanvas !== null}`)

  // Process guests sequentially to minimize memory usage
  let processedCount = 0
  for (let i = 0; i < guests.length; i++) {
    const guest = guests[i]
    const guestName = guest.name || 'Guest'
    const uniqueCode = guest.uniqueCode || ''
    
    try {
      // Generate QR code for this guest
      const data = `${eventId}:${uniqueCode}`
      const qrDataUrl = await QRCode.toDataURL(data, { width: 400, margin: 2 })
      
      // If canvas is available, add text overlay
      if (createCanvas && loadImage) {
        try {
          // Create canvas with QR code and text
          const qrSize = 400
          const textHeight = 100
          const totalHeight = qrSize + textHeight
          const canvas = createCanvas(qrSize, totalHeight)
          const ctx = canvas.getContext('2d')
          
          // Fill white background
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, qrSize, totalHeight)
          
          // Load and draw QR code
          const qrImage = await loadImage(qrDataUrl)
          ctx.drawImage(qrImage, 0, 0, qrSize, qrSize)
          
          // Draw guest name (bold, black)
          ctx.fillStyle = '#000000'
          ctx.font = 'bold 28px Arial, Helvetica, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(guestName, qrSize / 2, qrSize + 35)
          
          // Draw unique code (smaller, gray)
          ctx.fillStyle = '#666666'
          ctx.font = '18px Arial, Helvetica, sans-serif'
          ctx.fillText(uniqueCode, qrSize / 2, qrSize + 70)
          
          // Convert canvas to PNG buffer and add directly to zip
          const pngBuffer = canvas.toBuffer('image/png')
          const fileName = buildPngFilename(eventId, guest)
          zip.file(fileName, pngBuffer)
        } catch (canvasError) {
          // Canvas failed, use plain QR code
          console.warn(`Canvas rendering failed for ${guestName}, using plain QR code:`, canvasError)
          const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '')
          const qrBuffer = Buffer.from(base64Data, 'base64')
          const fileName = buildPngFilename(eventId, guest)
          zip.file(fileName, qrBuffer)
        }
      } else {
        // Canvas not available, use plain QR code
        const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '')
        const qrBuffer = Buffer.from(base64Data, 'base64')
        const fileName = buildPngFilename(eventId, guest)
        zip.file(fileName, qrBuffer)
      }
      
      processedCount++
      if (processedCount % 50 === 0) {
        console.log(`Progress: ${processedCount}/${guests.length} guests processed...`)
      }
    } catch (error) {
      console.error(`Error generating QR for guest ${guestName}:`, error)
    }
  }
  
  console.log(`All ${processedCount} guests processed, generating ZIP...`)
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } })
  console.log(`ZIP generated successfully: ${zipBuffer.length} bytes`)
  
  return zipBuffer
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateBundlePayload
    const { eventId, guests: guestsPayload, guestIds, format } = body || {}

    if (!eventId || !format || !(Array.isArray(guestsPayload) || Array.isArray(guestIds))) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const guests = buildGuestList(guestsPayload, guestIds)

    if (guests.length === 0) {
      return NextResponse.json({ error: "No guests found for provided IDs" }, { status: 400 })
    }

    // Warn if exceeding recommended limit
    if (guests.length > MAX_GUESTS_PER_BUNDLE) {
      return NextResponse.json({ 
        error: `Too many guests selected. Maximum is ${MAX_GUESTS_PER_BUNDLE} guests per bundle. You selected ${guests.length} guests.`,
        maxAllowed: MAX_GUESTS_PER_BUNDLE,
        requested: guests.length
      }, { status: 400 })
    }

    console.log(`Generating ${format.toUpperCase()} bundle for ${guests.length} guests...`)

    if (format === "pdf") {
      const pdfBytes = await generatePdfBundle(eventId, guests)
      return new NextResponse(pdfBytes, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="bundle-${eventId}.pdf"`,
        },
      })
    }

    if (format === "zip") {
      const zipContent = await generateZipBundle(eventId, guests)
      return new NextResponse(zipContent, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="bundle-${eventId}.zip"`,
        },
      })
    }

    return NextResponse.json({ error: 'Unsupported format. Use "pdf" or "zip".' }, { status: 400 })
  } catch (err: unknown) {
    console.error("Error generating bundle:", err)
    const message = err instanceof Error ? err.message : "Unexpected error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Use POST with a JSON body to generate a bundle." }, { status: 405 })
}
