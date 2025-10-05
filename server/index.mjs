import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import QRCode from 'qrcode'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import JSZip from 'jszip'

const app = express()
app.use(cors())
app.use(express.json({ limit: '20mb' }))

function buildGuestList(guestsPayload, guestIds, guestsById = new Map()) {
  if (Array.isArray(guestsPayload)) {
    return guestsPayload.map((guest) => ({ id: guest.id, name: guest.name, uniqueCode: guest.uniqueCode }))
  }

  if (!Array.isArray(guestIds)) {
    return []
  }

  return guestIds
    .map((guestId) => guestsById.get(guestId))
    .filter(Boolean)
    .map((guest) => ({ id: guest.id, name: guest.name, uniqueCode: guest.uniqueCode }))
}

function buildPngFilename(eventId, guest) {
  const safeName = (guest.name || guest.uniqueCode).replace(/[^a-zA-Z0-9-_.]/g, '-')
  return `${eventId}-${safeName}-${guest.uniqueCode}.png`
}

async function addGuestPageToPdf(pdfDoc, eventId, guest) {
  const data = `${eventId}:${guest.uniqueCode}`
  const pngBuffer = await QRCode.toBuffer(data, { type: 'png', width: 300 })
  const pngImage = await pdfDoc.embedPng(pngBuffer)
  const imageWidth = pngImage.width
  const imageHeight = pngImage.height

  const margin = 40
  const pageWidth = Math.max(300 + margin * 2, imageWidth + margin * 2)
  const pageHeight = imageHeight + 120

  const page = pdfDoc.addPage([pageWidth, pageHeight])
  const x = (pageWidth - imageWidth) / 2
  const y = pageHeight - imageHeight - 60

  page.drawImage(pngImage, { x, y, width: imageWidth, height: imageHeight })
  page.drawText(guest.name || '', { x: margin, y: 20, size: 12, font: await pdfDoc.embedFont(StandardFonts.Helvetica), color: rgb(0, 0, 0) })
}

async function generatePdfBundle(eventId, guests) {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  for (const guest of guests) {
    const data = `${eventId}:${guest.uniqueCode}`
    const pngBuffer = await QRCode.toBuffer(data, { type: 'png', width: 300 })
    const pngImage = await pdfDoc.embedPng(pngBuffer)
    const imageWidth = pngImage.width
    const imageHeight = pngImage.height

    const margin = 40
    const pageWidth = Math.max(300 + margin * 2, imageWidth + margin * 2)
    const pageHeight = imageHeight + 120

    const page = pdfDoc.addPage([pageWidth, pageHeight])
    const x = (pageWidth - imageWidth) / 2
    const y = pageHeight - imageHeight - 60

    page.drawImage(pngImage, { x, y, width: imageWidth, height: imageHeight })
    page.drawText(guest.name || '', { x: margin, y: 20, size: 12, font, color: rgb(0, 0, 0) })
    page.drawText(guest.uniqueCode || '', { x: margin, y: 40, size: 10, font, color: rgb(0.2, 0.2, 0.2) })
  }

  return pdfDoc.save()
}

async function generateZipBundle(eventId, guests) {
  const zip = new JSZip()

  for (const guest of guests) {
    const data = `${eventId}:${guest.uniqueCode}`
    const pngBuffer = await QRCode.toBuffer(data, { type: 'png', width: 400 })
    const fileName = buildPngFilename(eventId, guest)
    zip.file(fileName, pngBuffer)
  }

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
}

app.post('/api/generate-bundle', async (req, res) => {
  try {
    const { eventId, guests: guestsPayload, guestIds, format } = req.body || {}

    if (!eventId || !format || !(Array.isArray(guestsPayload) || Array.isArray(guestIds))) {
      return res.status(400).json({ error: 'Invalid payload' })
    }

    const guests = buildGuestList(guestsPayload, guestIds)
    if (guests.length === 0) {
      return res.status(400).json({ error: 'No guests found for provided IDs' })
    }

    if (format === 'pdf') {
      const pdfBytes = await generatePdfBundle(eventId, guests)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="bundle-${eventId}.pdf"`)
      return res.send(Buffer.from(pdfBytes))
    }

    if (format === 'zip') {
      const zipContent = await generateZipBundle(eventId, guests)
      res.setHeader('Content-Type', 'application/zip')
      res.setHeader('Content-Disposition', `attachment; filename="bundle-${eventId}.zip"`)
      return res.send(zipContent)
    }

    return res.status(400).json({ error: 'Unsupported format. Use "pdf" or "zip".' })
  } catch (err) {
    console.error('Server error in /api/generate-bundle:', err)
    return res.status(500).json({ error: err?.message || String(err) })
  }
})

const port = process.env.PORT || 4050
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`))
