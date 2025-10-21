/**
 * WhatsApp Business Cloud API Service
 * Direct integration with Meta's WhatsApp Business Platform
 * No third-party services required
 */

interface WhatsAppMessageResponse {
  messaging_product: string
  contacts: Array<{
    input: string
    wa_id: string
  }>
  messages: Array<{
    id: string
  }>
}

interface WhatsAppError {
  error: {
    message: string
    type: string
    code: number
    error_data?: {
      details: string
    }
    fbtrace_id: string
  }
}

interface SendTextMessageParams {
  to: string
  message: string
}

interface SendTemplateMessageParams {
  to: string
  templateName: string
  languageCode?: string
  parameters?: Array<{
    type: 'text' | 'image' | 'document'
    text?: string
    image?: { link: string }
    document?: { link: string; filename: string }
  }>
}

interface SendImageMessageParams {
  to: string
  imageUrl: string
  caption?: string
}

interface SendDocumentMessageParams {
  to: string
  documentUrl: string
  filename: string
  caption?: string
}

/**
 * WhatsApp Service Class
 * Handles all WhatsApp Business API operations
 */
export class WhatsAppService {
  private accessToken: string
  private phoneNumberId: string
  private apiVersion: string = 'v21.0'
  private baseUrl: string

  constructor() {
    // Get credentials from environment variables
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || ''
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || ''
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}`

    if (!this.accessToken || !this.phoneNumberId) {
      console.warn('WhatsApp credentials not configured. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID')
    }
  }

  /**
   * Check if WhatsApp service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.accessToken && this.phoneNumberId)
  }

  /**
   * Format phone number to WhatsApp format (remove + and spaces)
   * Example: +263 78 521 1893 -> 263785211893
   */
  private formatPhoneNumber(phone: string): string {
    return phone.replace(/[\s+()-]/g, '')
  }

  /**
   * Make API request to WhatsApp
   */
  private async makeRequest(endpoint: string, body: any): Promise<WhatsAppMessageResponse> {
    const url = `${this.baseUrl}${endpoint}`
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        const error = data as WhatsAppError
        throw new Error(
          `WhatsApp API Error: ${error.error.message} (Code: ${error.error.code})`
        )
      }

      return data as WhatsAppMessageResponse
    } catch (error) {
      console.error('WhatsApp API request failed:', error)
      throw error
    }
  }

  /**
   * Send a simple text message
   */
  async sendTextMessage({ to, message }: SendTextMessageParams): Promise<WhatsAppMessageResponse> {
    const formattedPhone = this.formatPhoneNumber(to)

    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'text',
      text: {
        preview_url: true, // Enable link previews
        body: message,
      },
    }

    return this.makeRequest('/messages', body)
  }

  /**
   * Send an image with optional caption
   */
  async sendImageMessage({ to, imageUrl, caption }: SendImageMessageParams): Promise<WhatsAppMessageResponse> {
    const formattedPhone = this.formatPhoneNumber(to)

    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'image',
      image: {
        link: imageUrl,
        ...(caption && { caption }),
      },
    }

    return this.makeRequest('/messages', body)
  }

  /**
   * Send a document (PDF, etc.) with optional caption
   */
  async sendDocumentMessage({ to, documentUrl, filename, caption }: SendDocumentMessageParams): Promise<WhatsAppMessageResponse> {
    const formattedPhone = this.formatPhoneNumber(to)

    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'document',
      document: {
        link: documentUrl,
        filename: filename,
        ...(caption && { caption }),
      },
    }

    return this.makeRequest('/messages', body)
  }

  /**
   * Send a template message (pre-approved by Meta)
   * Templates must be created and approved in Meta Business Manager
   */
  async sendTemplateMessage({ 
    to, 
    templateName, 
    languageCode = 'en',
    parameters = []
  }: SendTemplateMessageParams): Promise<WhatsAppMessageResponse> {
    const formattedPhone = this.formatPhoneNumber(to)

    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        ...(parameters.length > 0 && {
          components: [
            {
              type: 'body',
              parameters: parameters,
            },
          ],
        }),
      },
    }

    return this.makeRequest('/messages', body)
  }

  /**
   * Send guest invitation with QR code
   * This is a convenience method for the guest pass app
   */
  async sendGuestInvitation({
    guestName,
    guestPhone,
    eventName,
    eventDate,
    eventLocation,
    qrCodeUrl,
  }: {
    guestName: string
    guestPhone: string
    eventName: string
    eventDate: string
    eventLocation: string
    qrCodeUrl: string
  }): Promise<WhatsAppMessageResponse> {
    // First, send the invitation message
    const message = `🎉 *Event Invitation*

Hello ${guestName}!

You're invited to: *${eventName}*

📅 Date: ${eventDate}
📍 Location: ${eventLocation}

Your personal QR code is attached below. Please present it at the entrance for check-in.

We look forward to seeing you! 🎊`

    await this.sendTextMessage({
      to: guestPhone,
      message,
    })

    // Then send the QR code image
    return this.sendImageMessage({
      to: guestPhone,
      imageUrl: qrCodeUrl,
      caption: `QR Code for ${guestName} - ${eventName}`,
    })
  }

  /**
   * Send check-in confirmation
   */
  async sendCheckInConfirmation({
    guestName,
    guestPhone,
    eventName,
    checkInTime,
  }: {
    guestName: string
    guestPhone: string
    eventName: string
    checkInTime: string
  }): Promise<WhatsAppMessageResponse> {
    const message = `✅ *Check-In Confirmed*

Hello ${guestName}!

You have been successfully checked in to:
*${eventName}*

⏰ Check-in time: ${checkInTime}

Enjoy the event! 🎉`

    return this.sendTextMessage({
      to: guestPhone,
      message,
    })
  }

  /**
   * Send event reminder
   */
  async sendEventReminder({
    guestName,
    guestPhone,
    eventName,
    eventDate,
    eventLocation,
    hoursUntilEvent,
  }: {
    guestName: string
    guestPhone: string
    eventName: string
    eventDate: string
    eventLocation: string
    hoursUntilEvent: number
  }): Promise<WhatsAppMessageResponse> {
    const message = `⏰ *Event Reminder*

Hello ${guestName}!

This is a reminder that *${eventName}* is starting in ${hoursUntilEvent} hours.

📅 Date: ${eventDate}
📍 Location: ${eventLocation}

Don't forget to bring your QR code for check-in!

See you soon! 🎊`

    return this.sendTextMessage({
      to: guestPhone,
      message,
    })
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService()