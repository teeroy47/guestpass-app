import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  AreaChart,
  Area,
  Legend,
} from "recharts"
import { TrendingUp, Users, Clock, Calendar, CheckCircle, AlertCircle, Sparkles, Download, Filter } from "lucide-react"
import { useState, useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { useToast } from "@/hooks/use-toast"
import html2canvas from "html2canvas"

interface AnalyticsDashboardProps {
  eventId?: string // Optional: if provided, show analytics for this event only
}

export function AnalyticsDashboard({ eventId: propEventId }: AnalyticsDashboardProps = {}) {
  const { events } = useEvents()
  const { guests } = useGuests()
  const { toast } = useToast()
  const dashboardRef = useRef<HTMLDivElement>(null)
  const barChartRef = useRef<HTMLDivElement>(null)
  const areaChartRef = useRef<HTMLDivElement>(null)
  const pieChartRef = useRef<HTMLDivElement>(null)
  
  const [selectedEventId, setSelectedEventId] = useState<string>(propEventId || "all")
  const [isDownloading, setIsDownloading] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [chartImages, setChartImages] = useState<{
    barChart?: string
    areaChart?: string
    pieChart?: string
  }>({})

  // If propEventId is provided, lock the selection to that event
  const effectiveEventId = propEventId || selectedEventId
  const isEventLocked = !!propEventId

  // Filter events and guests based on selection
  const filteredEvents = effectiveEventId === "all" 
    ? events 
    : events.filter(e => e.id === effectiveEventId)
  
  const filteredGuests = effectiveEventId === "all"
    ? guests
    : guests.filter(g => g.eventId === effectiveEventId)

  const selectedEvent = effectiveEventId !== "all" 
    ? events.find(e => e.id === effectiveEventId)
    : null

  const totalEvents = filteredEvents.length
  const activeEvents = filteredEvents.filter((event) => event.status === "active").length
  const completedEvents = filteredEvents.filter((event) => event.status === "completed").length
  const draftEvents = filteredEvents.filter((event) => event.status === "draft").length

  const totalGuests = filteredGuests.length
  const checkedInGuests = filteredGuests.filter((guest) => guest.checkedIn).length
  const overallAttendanceRate = totalGuests > 0 ? (checkedInGuests / totalGuests) * 100 : 0
  const pendingGuests = Math.max(totalGuests - checkedInGuests, 0)

  const eventLookup = new Map(events.map((event) => [event.id, event]))

  // Convert charts to canvas images before printing
  const convertChartsToImages = async () => {
    const images: { barChart?: string; areaChart?: string; pieChart?: string } = {}
    
    try {
      // Convert bar chart
      if (barChartRef.current) {
        const barCanvas = await html2canvas(barChartRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
        })
        images.barChart = barCanvas.toDataURL('image/png')
      }
      
      // Convert area chart
      if (areaChartRef.current) {
        const areaCanvas = await html2canvas(areaChartRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
        })
        images.areaChart = areaCanvas.toDataURL('image/png')
      }
      
      // Convert pie chart
      if (pieChartRef.current) {
        const pieCanvas = await html2canvas(pieChartRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
        })
        images.pieChart = pieCanvas.toDataURL('image/png')
      }
    } catch (error) {
      console.error('Error converting charts to images:', error)
    }
    
    return images
  }

  // Print/Download dashboard using react-to-print
  const handleDownloadDashboard = useReactToPrint({
    contentRef: dashboardRef,
    documentTitle: selectedEvent 
      ? `Analytics - ${selectedEvent.title} - ${new Date().toISOString().split("T")[0]}`
      : `Analytics - All Events - ${new Date().toISOString().split("T")[0]}`,
    onBeforePrint: async () => {
      setIsDownloading(true)
      // Convert charts to images
      const images = await convertChartsToImages()
      setChartImages(images)
      setIsPrinting(true)
      // Wait for images to be set in state and rendered
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve()
        }, 500)
      })
    },
    onAfterPrint: () => {
      setIsDownloading(false)
      setIsPrinting(false)
      setChartImages({}) // Clear images after printing
      toast({
        title: "Dashboard Ready!",
        description: "Use your browser's print dialog to save as PDF or print.",
      })
    },
    pageStyle: `
      @page {
        size: A4 landscape;
        margin: 15mm;
      }
      
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color-adjust: exact;
        }
        
        /* Preserve the exact layout as shown on screen */
        * {
          box-sizing: border-box;
        }
        
        /* Hide any interactive elements */
        button, select {
          display: none !important;
        }
        
        /* Maintain grid layout */
        .grid {
          display: grid !important;
          gap: 1.5rem !important;
        }
        
        /* Ensure cards maintain their styling */
        .card {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        
        /* Ensure images render properly */
        img {
          max-width: 100%;
          height: auto;
        }
      }
    `
  })

  // Calculate average check-in time for completed events only
  // This measures the average time from first scan to each guest check-in
  const calculateAverageCheckInTime = () => {
    // Only include completed events
    const completedEventsList = filteredEvents.filter((event) => {
      if (event.status === "completed") return true
      // Also include events that have passed their end date
      const eventEndDate = new Date(event.endsAt || event.startsAt)
      return isValid(eventEndDate) && eventEndDate < new Date()
    })

    if (completedEventsList.length === 0) {
      return { display: "--", label: "No completed events", isEarly: null }
    }

    let totalCheckInDurations: number[] = []

    completedEventsList.forEach((event) => {
      const eventGuests = filteredGuests.filter((g) => g.eventId === event.id && g.checkedIn && g.checkedInAt)
      
      if (eventGuests.length === 0) return

      // Find the first check-in time for this event (when scanning started)
      const checkInTimes = eventGuests
        .map((g) => new Date(g.checkedInAt!).getTime())
        .filter((time) => !isNaN(time))
      
      if (checkInTimes.length === 0) return

      const firstCheckInTime = Math.min(...checkInTimes)

      // Calculate time from first scan to each subsequent check-in
      eventGuests.forEach((guest) => {
        const guestCheckInTime = new Date(guest.checkedInAt!).getTime()
        if (!isNaN(guestCheckInTime)) {
          const durationMinutes = (guestCheckInTime - firstCheckInTime) / (1000 * 60)
          totalCheckInDurations.push(durationMinutes)
        }
      })
    })

    if (totalCheckInDurations.length === 0) {
      return { display: "--", label: "No check-in data", isEarly: null }
    }

    // Calculate average
    const avgMinutes = totalCheckInDurations.reduce((sum, dur) => sum + dur, 0) / totalCheckInDurations.length

    // Format the display
    if (avgMinutes < 1) {
      const seconds = Math.round(avgMinutes * 60)
      return { display: `${seconds}s`, label: "per guest check-in", isEarly: true }
    } else if (avgMinutes < 60) {
      const mins = Math.round(avgMinutes)
      return { display: `${mins}m`, label: "per guest check-in", isEarly: null }
    } else {
      const hours = Math.floor(avgMinutes / 60)
      const mins = Math.round(avgMinutes % 60)
      const timeStr = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
      return { display: timeStr, label: "per guest check-in", isEarly: false }
    }
  }

  const checkInTimingDisplay = calculateAverageCheckInTime()

  const eventAttendanceData = filteredEvents.map((event) => {
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
  filteredGuests.forEach((guest) => {
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
    { name: "Active", value: activeEvents, color: "#3b82f6", gradient: "from-blue-500 to-cyan-500" },
    { name: "Completed", value: completedEvents, color: "#10b981", gradient: "from-green-500 to-emerald-500" },
    { name: "Draft", value: draftEvents, color: "#6b7280", gradient: "from-gray-500 to-slate-500" },
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
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {isEventLocked ? "Event Analytics" : "Analytics Dashboard"}
          </h2>
          <p className="text-muted-foreground">
            {selectedEvent 
              ? `Analytics for ${selectedEvent.title}`
              : "Comprehensive insights into your event performance"
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isEventLocked && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            onClick={handleDownloadDashboard}
            disabled={isDownloading}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? "Preparing..." : "Export PDF"}
          </Button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div ref={dashboardRef} className="space-y-6">

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              {overallAttendanceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {checkedInGuests} of {totalGuests} guests
            </p>
            <Progress value={overallAttendanceRate} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/10 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
              <Calendar className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
              {activeEvents}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{totalEvents} total events</p>
          </CardContent>
        </Card>

        <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
          checkInTimingDisplay.isEarly === true 
            ? "border-green-500/20 hover:border-green-500/40 hover:shadow-green-500/10" 
            : checkInTimingDisplay.isEarly === false
            ? "border-amber-500/20 hover:border-amber-500/40 hover:shadow-amber-500/10"
            : "border-blue-500/20 hover:border-blue-500/40 hover:shadow-blue-500/10"
        }`}>
          <div className={`absolute inset-0 pointer-events-none ${
            checkInTimingDisplay.isEarly === true
              ? "bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/10"
              : checkInTimingDisplay.isEarly === false
              ? "bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10"
              : "bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10"
          }`} />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Check-in Time</CardTitle>
            <div className={`p-2 rounded-lg ${
              checkInTimingDisplay.isEarly === true
                ? "bg-gradient-to-br from-green-500 to-emerald-600"
                : checkInTimingDisplay.isEarly === false
                ? "bg-gradient-to-br from-amber-500 to-orange-600"
                : "bg-gradient-to-br from-blue-500 to-cyan-600"
            }`}>
              <Clock className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold bg-clip-text text-transparent ${
              checkInTimingDisplay.isEarly === true
                ? "bg-gradient-to-r from-green-500 to-emerald-600"
                : checkInTimingDisplay.isEarly === false
                ? "bg-gradient-to-r from-amber-500 to-orange-600"
                : "bg-gradient-to-r from-blue-500 to-cyan-600"
            }`}>
              {checkInTimingDisplay.display}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{checkInTimingDisplay.label}</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Check-ins</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">
              {pendingGuests}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{checkedInGuests} guests checked in</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Event Attendance Chart */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle>Event Attendance</CardTitle>
                <CardDescription>Check-in rates by event</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isPrinting && chartImages.barChart ? (
              <div className="flex justify-center">
                <img src={chartImages.barChart} alt="Event Attendance Chart" style={{ maxWidth: '100%', height: 'auto' }} />
              </div>
            ) : (
              <div ref={barChartRef}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={eventAttendanceData} barGap={8}>
                    <defs>
                      <linearGradient id="checkedInGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.7} />
                      </linearGradient>
                      <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6b7280" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#4b5563" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#9ca3af" 
                      fontSize={12} 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tick={{ fill: '#9ca3af' }}
                    />
                    <YAxis stroke="#9ca3af" fontSize={12} tick={{ fill: '#9ca3af' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(17, 24, 39, 0.95)",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                        borderRadius: "12px",
                        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
                        backdropFilter: "blur(10px)",
                      }}
                      cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                    />
                    <Bar 
                      dataKey="checkedIn" 
                      fill="url(#checkedInGradient)" 
                      name="Checked In" 
                      radius={[8, 8, 0, 0]}
                      isAnimationActive={false}
                    />
                    <Bar 
                      dataKey="total" 
                      fill="url(#totalGradient)" 
                      name="Total Guests" 
                      radius={[8, 8, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Check-in Timeline */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle>Check-in Timeline</CardTitle>
                <CardDescription>Hourly check-in activity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {timelineData.length > 0 ? (
              isPrinting && chartImages.areaChart ? (
                <div className="flex justify-center">
                  <img src={chartImages.areaChart} alt="Check-in Timeline Chart" style={{ maxWidth: '100%', height: 'auto' }} />
                </div>
              ) : (
                <div ref={areaChartRef}>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={timelineData}>
                      <defs>
                        <linearGradient id="timelineGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                          <stop offset="50%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <XAxis 
                        dataKey="hour" 
                        stroke="#9ca3af" 
                        fontSize={12}
                        tick={{ fill: '#9ca3af' }}
                      />
                      <YAxis 
                        stroke="#9ca3af" 
                        fontSize={12} 
                        allowDecimals={false}
                        tick={{ fill: '#9ca3af' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(17, 24, 39, 0.95)",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                          borderRadius: "12px",
                          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
                          backdropFilter: "blur(10px)",
                        }}
                        cursor={{ stroke: 'rgba(16, 185, 129, 0.3)', strokeWidth: 2 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="checkIns"
                        stroke="#10b981"
                        strokeWidth={3}
                        fill="url(#timelineGradient)"
                        isAnimationActive={false}
                        dot={{ 
                          fill: "#10b981", 
                          strokeWidth: 2, 
                          r: 5,
                          stroke: "#fff"
                        }}
                        activeDot={{ 
                          r: 7, 
                          fill: "#10b981",
                          stroke: "#fff",
                          strokeWidth: 2
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )
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
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle>Event Status</CardTitle>
                <CardDescription>Distribution of event statuses</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isPrinting && chartImages.pieChart ? (
              <div className="flex justify-center">
                <img 
                  src={chartImages.pieChart} 
                  alt="Status Distribution Chart" 
                  style={{ maxWidth: '100%', height: 'auto' }} 
                />
              </div>
            ) : (
              <div ref={pieChartRef}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <defs>
                      {statusData.map((entry, index) => (
                        <linearGradient key={`gradient-${index}`} id={`statusGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                          <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie 
                      data={statusData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={50} 
                      outerRadius={85} 
                      paddingAngle={3} 
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      {statusData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`url(#statusGradient${index})`}
                          stroke="rgba(255, 255, 255, 0.1)"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(17, 24, 39, 0.95)",
                        border: "1px solid rgba(139, 92, 246, 0.3)",
                        borderRadius: "12px",
                        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
                        backdropFilter: "blur(10px)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex justify-center flex-wrap gap-4 mt-4">
              {statusData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 backdrop-blur-sm">
                  <div 
                    className="w-3 h-3 rounded-full shadow-lg" 
                    style={{ 
                      backgroundColor: entry.color,
                      boxShadow: `0 0 10px ${entry.color}40`
                    }} 
                  />
                  <span className="text-sm font-medium">{entry.name}</span>
                  <span className="text-xs text-muted-foreground">({entry.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Events */}
        <Card className="md:col-span-2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none" />
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle>Top Performing Events</CardTitle>
                <CardDescription>Events with highest attendance rates</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {topEvents.length > 0 ? (
              <div className="space-y-3">
                {topEvents.map((event, index) => {
                  const medalColors = [
                    'from-yellow-400 to-amber-500',
                    'from-gray-300 to-gray-400',
                    'from-orange-400 to-amber-600'
                  ]
                  const medalColor = medalColors[index] || 'from-blue-400 to-blue-500'
                  
                  return (
                    <div 
                      key={event.id} 
                      className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${medalColor} text-white font-bold text-sm shadow-lg`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{event.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.checkedIn} / {event.total} guests checked in
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="hidden sm:block w-24">
                          <Progress 
                            value={event.rate} 
                            className="h-2"
                          />
                        </div>
                        <Badge 
                          variant={event.rate >= 80 ? "default" : event.rate >= 60 ? "secondary" : "destructive"}
                          className="font-bold min-w-[60px] justify-center shadow-md"
                        >
                          {event.rate.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                No attendance data available yet.
              </div>
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
      {/* End Dashboard Content */}
    </div>
  )
}
