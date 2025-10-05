import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useEvents } from "@/lib/events-context"
import { useGuests } from "@/lib/guests-context"
import { differenceInMinutes, format, isValid, startOfHour } from "date-fns"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, Users, Clock, Calendar, CheckCircle, AlertCircle } from "lucide-react"

export function AnalyticsDashboard() {
  const { events } = useEvents()
  const { guests } = useGuests()

  const totalEvents = events.length
  const activeEvents = events.filter((event) => event.status === "active").length
  const completedEvents = events.filter((event) => event.status === "completed").length
  const draftEvents = events.filter((event) => event.status === "draft").length

  const totalGuests = guests.length
  const checkedInGuests = guests.filter((guest) => guest.checkedIn).length
  const overallAttendanceRate = totalGuests > 0 ? (checkedInGuests / totalGuests) * 100 : 0
  const pendingGuests = Math.max(totalGuests - checkedInGuests, 0)

  const eventLookup = new Map(events.map((event) => [event.id, event]))

  const checkInLags = guests
    .filter((guest) => guest.checkedIn && guest.checkedInAt)
    .map((guest) => {
      const event = eventLookup.get(guest.eventId)
      if (!event || !guest.checkedInAt) return null

      const checkInDate = new Date(guest.checkedInAt)
      const eventStartDate = new Date(event.startsAt)

      if (!isValid(checkInDate) || !isValid(eventStartDate)) {
        return null
      }

      const minutes = differenceInMinutes(checkInDate, eventStartDate)
      return minutes < 0 ? 0 : minutes
    })
    .filter((value): value is number => value !== null)

  const averageCheckInDelay =
    checkInLags.length > 0 ? checkInLags.reduce((sum, minutes) => sum + minutes, 0) / checkInLags.length : null

  const eventAttendanceData = events.map((event) => {
    const eventGuests = guests.filter((guest) => guest.eventId === event.id)
    const eventCheckedIn = eventGuests.filter((guest) => guest.checkedIn).length
    const attendanceRate = eventGuests.length > 0 ? (eventCheckedIn / eventGuests.length) * 100 : 0

    return {
      id: event.id,
      name: event.title.length > 15 ? `${event.title.substring(0, 15)}...` : event.title,
      total: eventGuests.length,
      checkedIn: eventCheckedIn,
      rate: attendanceRate,
      status: event.status,
      startsAt: event.startsAt,
    }
  })

  const timelineBuckets = new Map<number, number>()
  guests.forEach((guest) => {
    if (!guest.checkedIn || !guest.checkedInAt) return

    const checkInDate = new Date(guest.checkedInAt)
    if (!isValid(checkInDate)) return

    const bucket = startOfHour(checkInDate).getTime()
    timelineBuckets.set(bucket, (timelineBuckets.get(bucket) ?? 0) + 1)
  })

  const timelineData = Array.from(timelineBuckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([timestamp, count]) => ({
      hour: format(new Date(timestamp), "MMM d, ha"),
      checkIns: count,
    }))

  const statusData = [
    { name: "Active", value: activeEvents, color: "#3b82f6" },
    { name: "Completed", value: completedEvents, color: "#10b981" },
    { name: "Draft", value: draftEvents, color: "#6b7280" },
  ]

  const topEvents = [...eventAttendanceData]
    .filter((event) => event.total > 0)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5)

  type Alert = {
    type: "success" | "warning" | "info"
    title: string
    description: string
  }

  const alerts: Alert[] = []

  eventAttendanceData.forEach((event) => {
    if (event.total === 0) return

    if (event.rate >= 85) {
      alerts.push({
        type: "success",
        title: `${event.name} attendance is strong`,
        description: `${event.checkedIn} of ${event.total} guests have checked in (${event.rate.toFixed(1)}%).`,
      })
    } else if (event.rate <= 40 && event.status === "active") {
      alerts.push({
        type: "warning",
        title: `${event.name} attendance needs attention`,
        description: `${event.checkedIn} of ${event.total} guests have arrived so far.`,
      })
    }
  })

  if (alerts.length === 0) {
    alerts.push({
      type: "info",
      title: "No alerts",
      description: "Attendance looks steady across current events.",
    })
  }

  const alertStyles = {
    success: {
      container: "bg-green-500/10 border-green-500/20",
      icon: "text-green-500",
      title: "text-green-400",
      Icon: CheckCircle,
    },
    warning: {
      container: "bg-yellow-500/10 border-yellow-500/20",
      icon: "text-yellow-500",
      title: "text-yellow-400",
      Icon: AlertCircle,
    },
    info: {
      container: "bg-blue-500/10 border-blue-500/20",
      icon: "text-blue-500",
      title: "text-blue-400",
      Icon: Users,
    },
  } satisfies Record<Alert["type"], { container: string; icon: string; title: string; Icon: typeof Users }>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
        <p className="text-muted-foreground">Comprehensive insights into your event performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallAttendanceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {checkedInGuests} of {totalGuests} guests
            </p>
            <Progress value={overallAttendanceRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEvents}</div>
            <p className="text-xs text-muted-foreground">{totalEvents} total events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Check-in Delay</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageCheckInDelay !== null ? `${averageCheckInDelay.toFixed(1)} min` : "--"}
            </div>
            <p className="text-xs text-muted-foreground">After scheduled start time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Check-ins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingGuests}</div>
            <p className="text-xs text-muted-foreground">{checkedInGuests} guests checked in</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Event Attendance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Event Attendance</CardTitle>
            <CardDescription>Check-in rates by event</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "6px",
                  }}
                />
                <Bar dataKey="checkedIn" fill="#3b82f6" name="Checked In" />
                <Bar dataKey="total" fill="#6b7280" name="Total Guests" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Check-in Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Check-in Timeline</CardTitle>
            <CardDescription>Hourly check-in activity</CardDescription>
          </CardHeader>
          <CardContent>
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="hour" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "6px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="checkIns"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No check-ins recorded yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Event Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Event Status</CardTitle>
            <CardDescription>Distribution of event statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "6px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              {statusData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Events */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Top Performing Events</CardTitle>
            <CardDescription>Events with highest attendance rates</CardDescription>
          </CardHeader>
          <CardContent>
            {topEvents.length > 0 ? (
              <div className="space-y-4">
                {topEvents.map((event, index) => (
                  <div key={event.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{event.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.checkedIn} / {event.total} guests
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={event.rate >= 80 ? "default" : event.rate >= 60 ? "secondary" : "destructive"}>
                        {event.rate.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No attendance data available yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Real-time Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Alerts</CardTitle>
          <CardDescription>Automated insights from recent check-ins</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert, index) => {
              const style = alertStyles[alert.type]
              const Icon = style.Icon

              return (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-3 border rounded-lg ${style.container}`}
                  role="status"
                >
                  <Icon className={`h-5 w-5 ${style.icon}`} />
                  <div>
                    <p className={`font-medium ${style.title}`}>{alert.title}</p>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
