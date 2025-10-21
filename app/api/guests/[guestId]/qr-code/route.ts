import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import QRCode from 'qrcode'

/**
 * GET /api/guests/[guestId]/qr-code
 * Generate and return QR code image for a guest
 * This endpoint is public so WhatsApp can fetch the image
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { guestId: string } }
) {
  try {
    const { guestId } = params

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 400 }
      )
    }

    // Fetch guest details (no auth required for QR code generation)
    const supabase = await createClient()
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id, name, event_id')
      .eq('id', guestId)
      .single()

    if (guestError || !guest) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      )
    }

    // Generate QR code data (same format as your existing QR codes)
    const qrData = JSON.stringify({
      guestId: guest.id,
      eventId: guest.event_id,
      name: guest.name,
    })

    // Generate QR code as PNG buffer
    const qrCodeBuffer = await QRCode.toBuffer(qrData, {
      type: 'png',
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })

    // Return image with proper headers
    return new NextResponse(qrCodeBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': `inline; filename="qr-${guestId}.png"`,
      },
    })

  } catch (error) {
    console.error('Error generating QR code:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate QR code',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}