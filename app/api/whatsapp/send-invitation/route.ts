import { NextRequest, NextResponse } from 'next/server'
import { whatsappService } from '@/lib/whatsapp-service'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/whatsapp/send-invitation
 * Send WhatsApp invitation with QR code to a guest
 */
export async function POST(request: NextRequest) {
  try {
    // Check if WhatsApp is configured
    if (!whatsappService.isConfigured()) {
      return NextResponse.json(
        { 
          error: 'WhatsApp service not configured',
          message: 'Please configure WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in environment variables'
        },
        { status: 503 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { guestId, eventId } = body

    if (!guestId || !eventId) {
      return NextResponse.json(
        { error: 'Missing required fields: guestId and eventId' },
        { status: 400 }
      )
    }

    // Fetch guest details
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single()

    if (guestError || !guest) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      )
    }

    // Check if guest has a phone number
    if (!guest.phone) {
      return NextResponse.json(
        { error: 'Guest does not have a phone number' },
        { status: 400 }
      )
    }

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Verify user owns this event
    if (event.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to send invitations for this event' },
        { status: 403 }
      )
    }

    // Generate QR code URL (assuming you have a public URL for QR codes)
    // This should be a publicly accessible URL that WhatsApp can fetch
    const appUrl = process.env.VITE_APP_URL || process.env.NEXT_PUBLIC_APP_URL
    const qrCodeUrl = `${appUrl}/api/guests/${guestId}/qr-code`

    // Format event date
    const eventDate = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    // Send WhatsApp invitation
    const result = await whatsappService.sendGuestInvitation({
      guestName: guest.name,
      guestPhone: guest.phone,
      eventName: event.name,
      eventDate: eventDate,
      eventLocation: event.location || 'TBA',
      qrCodeUrl: qrCodeUrl,
    })

    // Update guest record to track invitation sent
    await supabase
      .from('guests')
      .update({
        invitation_sent: true,
        invitation_sent_at: new Date().toISOString(),
      })
      .eq('id', guestId)

    return NextResponse.json({
      success: true,
      message: 'WhatsApp invitation sent successfully',
      messageId: result.messages[0].id,
      recipient: result.contacts[0].wa_id,
    })

  } catch (error) {
    console.error('Error sending WhatsApp invitation:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to send WhatsApp invitation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}