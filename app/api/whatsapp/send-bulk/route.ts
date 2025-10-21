import { NextRequest, NextResponse } from 'next/server'
import { whatsappService } from '@/lib/whatsapp-service'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/whatsapp/send-bulk
 * Send WhatsApp invitations to multiple guests
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
    const { guestIds, eventId } = body

    if (!guestIds || !Array.isArray(guestIds) || guestIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid guestIds array' },
        { status: 400 }
      )
    }

    if (!eventId) {
      return NextResponse.json(
        { error: 'Missing eventId' },
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

    // Fetch all guests
    const { data: guests, error: guestsError } = await supabase
      .from('guests')
      .select('*')
      .in('id', guestIds)
      .eq('event_id', eventId)

    if (guestsError || !guests) {
      return NextResponse.json(
        { error: 'Failed to fetch guests' },
        { status: 500 }
      )
    }

    // Filter guests with phone numbers
    const guestsWithPhone = guests.filter(g => g.phone)

    if (guestsWithPhone.length === 0) {
      return NextResponse.json(
        { error: 'None of the selected guests have phone numbers' },
        { status: 400 }
      )
    }

    // Format event date
    const eventDate = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    const appUrl = process.env.VITE_APP_URL || process.env.NEXT_PUBLIC_APP_URL

    // Send invitations with rate limiting (1 message per second to avoid API limits)
    const results = {
      success: [] as string[],
      failed: [] as { guestId: string; name: string; error: string }[],
      skipped: [] as { guestId: string; name: string; reason: string }[],
    }

    for (const guest of guestsWithPhone) {
      try {
        // Generate QR code URL
        const qrCodeUrl = `${appUrl}/api/guests/${guest.id}/qr-code`

        // Send invitation
        await whatsappService.sendGuestInvitation({
          guestName: guest.name,
          guestPhone: guest.phone,
          eventName: event.name,
          eventDate: eventDate,
          eventLocation: event.location || 'TBA',
          qrCodeUrl: qrCodeUrl,
        })

        // Update guest record
        await supabase
          .from('guests')
          .update({
            invitation_sent: true,
            invitation_sent_at: new Date().toISOString(),
          })
          .eq('id', guest.id)

        results.success.push(guest.name)

        // Rate limiting: Wait 1 second between messages
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`Failed to send invitation to ${guest.name}:`, error)
        results.failed.push({
          guestId: guest.id,
          name: guest.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Track skipped guests (no phone number)
    const guestsWithoutPhone = guests.filter(g => !g.phone)
    guestsWithoutPhone.forEach(guest => {
      results.skipped.push({
        guestId: guest.id,
        name: guest.name,
        reason: 'No phone number',
      })
    })

    return NextResponse.json({
      success: true,
      message: `Sent ${results.success.length} invitations`,
      results: {
        sent: results.success.length,
        failed: results.failed.length,
        skipped: results.skipped.length,
        details: results,
      },
    })

  } catch (error) {
    console.error('Error sending bulk WhatsApp invitations:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to send bulk WhatsApp invitations',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}