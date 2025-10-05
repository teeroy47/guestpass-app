import { NextResponse } from "next/server"
import QRCode from "qrcode"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import JSZip from "jszip"

type GuestInput = { id?: string; name?: string; uniqueCode: string }

type GenerateBundlePayload = {
  eventId?: string
  guests?: GuestInput[]
  guestIds?: string[]
  format?: "pdf" | "zip"
}

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
  const safeName = (guest.name || guest.uniqueCode).replace(/[^a-zA-Z0-9-_.]/g, "-")
  return `${eventId}-${safeName}-${guest.uniqueCode}.png`
}

async function generatePdfBundle(eventId: string, guests: GuestInput[]) {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  for (const guest of guests) {
    const data = `${eventId}:${guest.uniqueCode}`
    const pngBuffer = await QRCode.toBuffer(data, { type: "png", width: 300 })
    const pngImage = await pdfDoc.embedPng(pngBuffer)

    const margin = 40
    const pageWidth = Math.max(300 + margin * 2, pngImage.width + margin * 2)
    const pageHeight = pngImage.height + 120

    const page = pdfDoc.addPage([pageWidth, pageHeight])
    const x = (pageWidth - pngImage.width) / 2
    const y = pageHeight - pngImage.height - 60

    page.drawImage(pngImage, { x, y, width: pngImage.width, height: pngImage.height })
    page.drawText(guest.name || "", { x: margin, y: 20, size: 12, font, color: rgb(0, 0, 0) })
    page.drawText(guest.uniqueCode || "", { x: margin, y: 40, size: 10, font, color: rgb(0.2, 0.2, 0.2) })
  }

  return pdfDoc.save()
}

async function generateZipBundle(eventId: string, guests: GuestInput[]) {
  const zip = new JSZip()

  for (const guest of guests) {
    const data = `${eventId}:${guest.uniqueCode}`
    const pngBuffer = await QRCode.toBuffer(data, { type: "png", width: 400 })
    const fileName = buildPngFilename(eventId, guest)
    zip.file(fileName, pngBuffer)
  }

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })
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
