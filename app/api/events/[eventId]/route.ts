import { NextResponse } from "next/server"
import { EventService } from "@/lib/event-service"

type EventRouteParams = {
  params: {
    eventId: string
  }
}

export async function GET(_request: Request, { params }: EventRouteParams) {
  const { eventId } = params
  try {
    const event = await EventService.getEvent(eventId)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ data: event })
  } catch (error) {
    console.error(`Failed to fetch event ${eventId}`, error)
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: EventRouteParams) {
  const { eventId } = params
  try {
    const payload = await request.json()
    const updated = await EventService.updateEvent(eventId, payload)

    if (!updated) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error(`Failed to update event ${eventId}`, error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: EventRouteParams) {
  const { eventId } = params
  try {
    await EventService.deleteEvent(eventId)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error(`Failed to delete event ${eventId}`, error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}