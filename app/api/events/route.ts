import { NextResponse } from "next/server"
import { EventService } from "@/lib/event-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get("ownerId") ?? undefined
    const status = searchParams.get("status") ?? undefined
    const startsAfter = searchParams.get("startsAfter") ?? undefined

    const events = await EventService.listEvents({ ownerId, status, startsAfter })

    return NextResponse.json({ data: events })
  } catch (error) {
    console.error("Failed to fetch events", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    const requiredFields: Array<keyof typeof payload> = ["title", "startsAt", "ownerId", "status"]
    const missingField = requiredFields.find((field) => !payload[field])

    if (missingField) {
      return NextResponse.json({ error: `Missing required field: ${missingField}` }, { status: 400 })
    }

    const event = await EventService.createEvent({
      title: payload.title,
      description: payload.description,
      startsAt: payload.startsAt,
      venue: payload.venue,
      ownerId: payload.ownerId,
      status: payload.status,
    })

    if (!event) {
      return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
    }

    return NextResponse.json({ data: event }, { status: 201 })
  } catch (error) {
    console.error("Failed to create event", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}