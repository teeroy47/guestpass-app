import React from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to Guestpass</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Manage your event guests with ease using QR codes
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/login">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" variant="outline">
              View Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Create Events</CardTitle>
            <CardDescription>Set up your events in minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Quickly create and manage events with all the details you need.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage Guests</CardTitle>
            <CardDescription>Keep track of your attendees</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Upload guest lists, generate QR codes, and monitor check-ins in real-time.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QR Code Check-in</CardTitle>
            <CardDescription>Fast and secure entry</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Use QR codes for quick and contactless guest check-ins at your events.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
