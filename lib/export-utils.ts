import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

export interface Guest {
  id: string
  name: string
  email?: string
  phone?: string
  seatingArea?: 'Reserved' | 'Free Seating'
  cuisineChoice?: 'Traditional' | 'Western'
  uniqueCode: string
  checkedIn: boolean
  checkedInAt?: string
  checkedInBy?: string
  usherName?: string
  usherEmail?: string
  createdAt?: string
}

export interface Event {
  id: string
  title: string
  description?: string
  startsAt: string
  venue?: string
  status: string
}

export interface ExportData {
  event: Event
  guests: Guest[]
}

// Calculate analytics from guest data
export function calculateAnalytics(guests: Guest[]) {
  const totalGuests = guests.length
  const checkedInGuests = guests.filter(g => g.checkedIn).length
  const notCheckedIn = totalGuests - checkedInGuests
  const checkInRate = totalGuests > 0 ? ((checkedInGuests / totalGuests) * 100).toFixed(1) : '0'
  
  // Check-in timeline (hourly breakdown)
  const checkInsByHour: { [hour: string]: number } = {}
  guests.forEach(guest => {
    if (guest.checkedIn && guest.checkedInAt) {
      const date = new Date(guest.checkedInAt)
      const hour = format(date, 'HH:00')
      checkInsByHour[hour] = (checkInsByHour[hour] || 0) + 1
    }
  })
  
  // Check-in by usher (use usherName for real usher statistics)
  const checkInsByUsher: { [usher: string]: number } = {}
  guests.forEach(guest => {
    if (guest.checkedIn && guest.usherName) {
      const usher = guest.usherName
      checkInsByUsher[usher] = (checkInsByUsher[usher] || 0) + 1
    }
  })
  
  return {
    totalGuests,
    checkedInGuests,
    notCheckedIn,
    checkInRate,
    checkInsByHour,
    checkInsByUsher,
  }
}

// Export to Excel with multiple sheets
export function exportToExcel(data: ExportData) {
  const { event, guests } = data
  const analytics = calculateAnalytics(guests)
  
  // Create workbook
  const wb = XLSX.utils.book_new()
  
  // Sheet 1: Guest List
  const guestData = guests.map(guest => ({
    'Name': guest.name,
    'Email': guest.email || '',
    'Phone': guest.phone || '',
    'Seating Area': guest.seatingArea || '',
    'Cuisine Choice': guest.cuisineChoice || '',
    'Unique Code': guest.uniqueCode,
    'Checked In': guest.checkedIn ? 'Yes' : 'No',
    'Check-in Time': guest.checkedInAt ? format(new Date(guest.checkedInAt), 'MMM dd, yyyy HH:mm') : '',
    'Checked By': guest.usherName || guest.checkedInBy || '',
    'Registration Date': guest.createdAt ? format(new Date(guest.createdAt), 'MMM dd, yyyy') : '',
  }))
  const ws1 = XLSX.utils.json_to_sheet(guestData)
  XLSX.utils.book_append_sheet(wb, ws1, 'Guest List')
  
  // Sheet 2: Summary Statistics
  const summaryData = [
    { 'Metric': 'Event Name', 'Value': event.title },
    { 'Metric': 'Event Date', 'Value': format(new Date(event.startsAt), 'MMM dd, yyyy HH:mm') },
    { 'Metric': 'Venue', 'Value': event.venue || 'N/A' },
    { 'Metric': 'Status', 'Value': event.status },
    { 'Metric': '', 'Value': '' },
    { 'Metric': 'Total Guests', 'Value': analytics.totalGuests },
    { 'Metric': 'Checked In', 'Value': analytics.checkedInGuests },
    { 'Metric': 'Not Checked In', 'Value': analytics.notCheckedIn },
    { 'Metric': 'Check-in Rate', 'Value': `${analytics.checkInRate}%` },
  ]
  const ws2 = XLSX.utils.json_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, ws2, 'Summary')
  
  // Sheet 3: Check-ins by Hour
  const hourlyData = Object.entries(analytics.checkInsByHour)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, count]) => ({
      'Hour': hour,
      'Check-ins': count,
    }))
  if (hourlyData.length > 0) {
    const ws3 = XLSX.utils.json_to_sheet(hourlyData)
    XLSX.utils.book_append_sheet(wb, ws3, 'Hourly Check-ins')
  }
  
  // Sheet 4: Check-ins by Usher
  const usherData = Object.entries(analytics.checkInsByUsher)
    .sort(([, a], [, b]) => b - a)
    .map(([usher, count]) => ({
      'Usher': usher,
      'Check-ins': count,
    }))
  if (usherData.length > 0) {
    const ws4 = XLSX.utils.json_to_sheet(usherData)
    XLSX.utils.book_append_sheet(wb, ws4, 'Usher Performance')
  }
  
  // Generate file
  const fileName = `${event.title.replace(/[^a-zA-Z0-9]/g, '-')}-Report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
  XLSX.writeFile(wb, fileName)
}

// Export to PDF with charts and analytics
export function exportToPDF(data: ExportData) {
  const { event, guests } = data
  const analytics = calculateAnalytics(guests)
  
  const doc = new jsPDF()
  let yPos = 20
  
  // Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Event Report', 105, yPos, { align: 'center' })
  yPos += 15
  
  // Event Details
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Event: ${event.title}`, 20, yPos)
  yPos += 7
  doc.text(`Date: ${format(new Date(event.startsAt), 'MMM dd, yyyy HH:mm')}`, 20, yPos)
  yPos += 7
  if (event.venue) {
    doc.text(`Venue: ${event.venue}`, 20, yPos)
    yPos += 7
  }
  doc.text(`Status: ${event.status.toUpperCase()}`, 20, yPos)
  yPos += 7
  doc.text(`Report Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 20, yPos)
  yPos += 15
  
  // Summary Statistics Box
  doc.setFillColor(240, 240, 240)
  doc.rect(20, yPos, 170, 40, 'F')
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary Statistics', 25, yPos + 10)
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total Guests: ${analytics.totalGuests}`, 25, yPos + 20)
  doc.text(`Checked In: ${analytics.checkedInGuests}`, 25, yPos + 28)
  doc.text(`Not Checked In: ${analytics.notCheckedIn}`, 25, yPos + 36)
  
  doc.text(`Check-in Rate: ${analytics.checkInRate}%`, 110, yPos + 20)
  
  // Progress bar for check-in rate
  const barWidth = 60
  const barHeight = 8
  const barX = 110
  const barY = yPos + 25
  const fillWidth = (parseFloat(analytics.checkInRate) / 100) * barWidth
  
  doc.setDrawColor(200, 200, 200)
  doc.rect(barX, barY, barWidth, barHeight)
  doc.setFillColor(34, 197, 94) // Green
  doc.rect(barX, barY, fillWidth, barHeight, 'F')
  
  yPos += 50
  
  // Guest List Table
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Guest List', 20, yPos)
  yPos += 5
  
  const tableData = guests.map(guest => [
    guest.name,
    guest.email || '',
    guest.seatingArea || '',
    guest.cuisineChoice || '',
    guest.checkedIn ? 'Yes' : 'No',
    guest.checkedInAt ? format(new Date(guest.checkedInAt), 'MMM dd HH:mm') : '',
    guest.usherName || guest.checkedInBy || '',
  ])
  
  autoTable(doc, {
    startY: yPos,
    head: [['Name', 'Email', 'Seating', 'Cuisine', 'Checked In', 'Check-in Time', 'Checked By']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] }, // Blue
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 40 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 15 },
      5: { cellWidth: 30 },
      6: { cellWidth: 30 },
    },
  })
  
  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 10
  
  // Add new page for analytics if needed
  if (finalY > 250) {
    doc.addPage()
    yPos = 20
  } else {
    yPos = finalY + 15
  }
  
  // Hourly Check-ins
  if (Object.keys(analytics.checkInsByHour).length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Check-ins by Hour', 20, yPos)
    yPos += 5
    
    const hourlyData = Object.entries(analytics.checkInsByHour)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, count]) => [hour, count.toString()])
    
    autoTable(doc, {
      startY: yPos,
      head: [['Hour', 'Check-ins']],
      body: hourlyData,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] }, // Green
      styles: { fontSize: 10 },
    })
    
    yPos = (doc as any).lastAutoTable.finalY + 15
  }
  
  // Usher Performance
  if (Object.keys(analytics.checkInsByUsher).length > 0) {
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Usher Performance', 20, yPos)
    yPos += 5
    
    const usherData = Object.entries(analytics.checkInsByUsher)
      .sort(([, a], [, b]) => b - a)
      .map(([usher, count]) => [usher, count.toString()])
    
    autoTable(doc, {
      startY: yPos,
      head: [['Usher', 'Check-ins']],
      body: usherData,
      theme: 'grid',
      headStyles: { fillColor: [168, 85, 247] }, // Purple
      styles: { fontSize: 10 },
    })
  }
  
  // Footer on each page
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Page ${i} of ${pageCount} | ${event.title}`,
      105,
      290,
      { align: 'center' }
    )
  }
  
  // Save PDF
  const fileName = `${event.title.replace(/[^a-zA-Z0-9]/g, '-')}-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  doc.save(fileName)
}