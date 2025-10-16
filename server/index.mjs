import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import express from 'express'
import cors from 'cors'
import QRCode from 'qrcode'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import JSZip from 'jszip'
import { MailerSend, EmailParams, Sender, Recipient, Attachment } from 'mailersend'

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envPath = join(__dirname, '..', '.env.local')
console.log('Loading environment from:', envPath)
dotenv.config({ path: envPath })

// Debug: Log environment variable status (without exposing the actual key)
console.log('Environment variables loaded:')
console.log('- MAILERSEND_API_KEY:', process.env.MAILERSEND_API_KEY ? '✓ Set' : '✗ Not set')
console.log('- MAILERSEND_FROM_EMAIL:', process.env.MAILERSEND_FROM_EMAIL || '✗ Not set')
console.log('- MAILERSEND_FROM_NAME:', process.env.MAILERSEND_FROM_NAME || '✗ Not set')
console.log('- MAILERSEND_TEMPLATE_ID:', process.env.MAILERSEND_TEMPLATE_ID || '✗ Not set')

const app = express()
app.use(cors())
app.use(express.json({ limit: '20mb' }))

// Initialize MailerSend
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || "",
})

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

app.post('/api/send-invitations', async (req, res) => {
  try {
    const {
      eventId,
      eventTitle,
      eventDate,
      eventVenue,
      guests,
      fromEmail = process.env.MAILERSEND_FROM_EMAIL || "",
      fromName = process.env.MAILERSEND_FROM_NAME || "GuestPass Events"
    } = req.body || {}

    // Validate API key
    if (!process.env.MAILERSEND_API_KEY) {
      return res.status(500).json({ error: "MailerSend API key is not configured" })
    }

    // Validate template ID
    if (!process.env.MAILERSEND_TEMPLATE_ID) {
      return res.status(500).json({ error: "MailerSend template ID is not configured" })
    }

    // Validate required fields
    if (!eventId || !eventTitle || !eventDate || !guests || guests.length === 0) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Filter guests with valid email addresses
    const guestsWithEmail = guests.filter(guest => guest.email && guest.email.trim() !== "")

    if (guestsWithEmail.length === 0) {
      return res.status(400).json({ error: "No guests with valid email addresses found" })
    }

    // Format event date
    const formattedDate = new Date(eventDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    const results = {
      sent: [],
      sentGuestIds: [],
      failed: [],
    }

    // Create sender object
    const sentFrom = new Sender(fromEmail, fromName)

    // Send emails in batches to avoid rate limits
    const batchSize = 10
    for (let i = 0; i < guestsWithEmail.length; i += batchSize) {
      const batch = guestsWithEmail.slice(i, i + batchSize)
      
      await Promise.all(
        batch.map(async (guest) => {
          try {
            // Generate QR code for this guest as PNG
            const qrData = `${eventId}:${guest.uniqueCode}`
            const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
              width: 300,
              margin: 2,
              color: {
                dark: "#000000",
                light: "#FFFFFF",
              },
            })
            
            // Convert data URL to base64 content (remove the data:image/png;base64, prefix)
            const base64Content = qrCodeDataUrl.split(",")[1]

            // Create attachment with content ID for inline embedding
            // Attachment(content, filename, disposition, contentId)
            const attachment = new Attachment(
              base64Content,
              `qr-code-${guest.uniqueCode}.png`,
              "inline",
              "qrcode"
            )

            // Create recipient
            const recipients = [new Recipient(guest.email, guest.name)]

            // Create email parameters with template
            const emailParams = new EmailParams()
              .setFrom(sentFrom)
              .setTo(recipients)
              .setSubject(`You're Invited: ${eventTitle}`)
              .setTemplateId(process.env.MAILERSEND_TEMPLATE_ID)
              .setAttachments([attachment])
              .setPersonalization([
                {
                  email: guest.email,
                  data: {
                    guest_name: guest.name,
                    event_title: eventTitle,
                    event_date: formattedDate,
                    event_venue: eventVenue || "To be announced",
                    unique_code: guest.uniqueCode,
                    from_name: fromName
                  }
                }
              ])

            // Send email with MailerSend
            console.log(`Sending invitation to ${guest.email}...`)
            await mailerSend.email.send(emailParams)
            console.log(`✓ Invitation sent to ${guest.email}`)

            results.sent.push(guest.email)
            results.sentGuestIds.push(guest.id)
          } catch (error) {
            console.error(`Failed to send email to ${guest.email}:`, error)
            console.error('Full error details:', JSON.stringify(error, null, 2))
            results.failed.push({
              email: guest.email,
              guestId: guest.id,
              error: error instanceof Error ? error.message : String(error),
            })
          }
        })
      )

      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < guestsWithEmail.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return res.json({
      success: true,
      message: `Sent ${results.sent.length} invitation(s)`,
      results: {
        total: guestsWithEmail.length,
        sent: results.sent.length,
        failed: results.failed.length,
        sentGuestIds: results.sentGuestIds,
        failedEmails: results.failed,
      },
    })
  } catch (error) {
    console.error("Error sending invitations:", error)
    return res.status(500).json({ 
      error: "Failed to send invitations",
      details: error instanceof Error ? error.message : "Unknown error"
    })
  }
})

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`))
