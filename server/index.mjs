import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import express from 'express'
import cors from 'cors'
import QRCode from 'qrcode'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import JSZip from 'jszip'
import { MailerSend, EmailParams, Sender, Recipient, Attachment } from 'mailersend'
import { createClient } from '@supabase/supabase-js'

// Dynamic import of canvas for better compatibility
let createCanvas, loadImage

async function initCanvas() {
  if (createCanvas) return
  try {
    // Try @napi-rs/canvas first (has pre-built binaries)
    try {
      const canvasModule = await import('@napi-rs/canvas')
      createCanvas = canvasModule.createCanvas
      loadImage = canvasModule.loadImage
    } catch {
      // Fallback to node-canvas if available locally
      const canvasModule = await import('canvas')
      createCanvas = canvasModule.createCanvas
      loadImage = canvasModule.loadImage
    }
  } catch (e) {
    console.warn('Canvas module not available - using plain QR codes')
    createCanvas = null
    loadImage = null
  }
}

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
console.log('- VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✓ Set' : '✗ Not set')
console.log('- VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Not set')
console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Not set')

const app = express()
app.use(cors())
app.use(express.json({ limit: '20mb' }))

// Maximum guests per bundle to prevent timeouts
const MAX_GUESTS_PER_BUNDLE = 1000 // Increased from 500 to handle larger events

// Initialize MailerSend
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || "",
})

// Initialize Supabase client with service role key for admin operations
// Falls back to anon key if service role key is not available
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  supabaseKey
)

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('✓ Using Supabase service role key (bypasses RLS)')
} else {
  console.log('⚠ Using Supabase anon key (subject to RLS policies)')
}

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
  const safeName = (guest.name || "Guest").replace(/[^a-zA-Z0-9-_.]/g, '-')
  return `${safeName}-${guest.uniqueCode}.png`
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
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Generate all QR codes in parallel
  const qrPromises = guests.map(guest => {
    const data = `${eventId}:${guest.uniqueCode}`
    return QRCode.toBuffer(data, { type: 'png', width: 300 })
  })
  
  const qrBuffers = await Promise.all(qrPromises)
  
  // Add pages for all guests
  for (let i = 0; i < guests.length; i++) {
    const guest = guests[i]
    const pngBuffer = qrBuffers[i]
    const pngImage = await pdfDoc.embedPng(pngBuffer)
    const imageWidth = pngImage.width
    const imageHeight = pngImage.height

    const margin = 40
    const pageWidth = Math.max(300 + margin * 2, imageWidth + margin * 2)
    const pageHeight = imageHeight + 140 // Increased height for guest name

    const page = pdfDoc.addPage([pageWidth, pageHeight])
    const x = (pageWidth - imageWidth) / 2
    const y = pageHeight - imageHeight - 80 // Adjusted position

    page.drawImage(pngImage, { x, y, width: imageWidth, height: imageHeight })
    
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

async function generateZipBundle(eventId, guests) {
  await initCanvas()
  console.log(`Starting ZIP generation for ${guests.length} guests (sequential processing)...`)
  console.log(`Canvas available: ${createCanvas !== null}`)
  const zip = new JSZip()

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
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } })
  console.log(`ZIP finalized: ${zipBuffer.length} bytes`)
  return zipBuffer
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

    // Warn if exceeding recommended limit
    if (guests.length > MAX_GUESTS_PER_BUNDLE) {
      return res.status(400).json({ 
        error: `Too many guests selected. Maximum is ${MAX_GUESTS_PER_BUNDLE} guests per bundle. You selected ${guests.length} guests.`,
        maxAllowed: MAX_GUESTS_PER_BUNDLE,
        requested: guests.length
      })
    }

    console.log(`Generating ${format.toUpperCase()} bundle for ${guests.length} guests...`)

    if (format === 'pdf') {
      const pdfBytes = await generatePdfBundle(eventId, guests)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="bundle-${eventId}.pdf"`)
      return res.send(Buffer.from(pdfBytes))
    }

    if (format === 'zip') {
      const zipContent = await generateZipBundle(eventId, guests)
      console.log(`ZIP bundle generated: ${zipContent.length} bytes`)
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

// User role management endpoint
app.post('/api/admin/update-user-role', async (req, res) => {
  try {
    const { userId, role, requestingUserEmail } = req.body

    console.log('Update user role request:', { userId, role, requestingUserEmail })

    // Validate requesting user is super admin
    const SUPER_ADMIN_EMAIL = 'chiunyet@africau.edu'
    if (requestingUserEmail !== SUPER_ADMIN_EMAIL) {
      console.log('Access denied: Not super admin')
      return res.status(403).json({ error: 'Access denied. Only super admin can update user roles.' })
    }

    // Validate input
    if (!userId || !role) {
      return res.status(400).json({ error: 'Missing required fields: userId and role' })
    }

    if (role !== 'admin' && role !== 'usher') {
      return res.status(400).json({ error: 'Invalid role. Must be "admin" or "usher"' })
    }

    // Check if user exists and get their email
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    if (fetchError || !user) {
      console.error('User not found:', fetchError)
      return res.status(404).json({ error: 'User not found' })
    }

    // Prevent changing super admin's role
    if (user.email === SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Cannot change super admin role' })
    }

    // Update user role
    const { error: updateError } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user role:', updateError)
      return res.status(500).json({ error: 'Failed to update user role' })
    }

    console.log(`✓ User role updated: ${user.email} -> ${role}`)
    return res.json({ success: true, message: 'User role updated successfully' })
  } catch (error) {
    console.error('Error in update-user-role endpoint:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`))
