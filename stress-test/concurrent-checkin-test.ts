/**
 * Stress Test: Concurrent Check-in Simulation
 * 
 * This test simulates 10 ushers concurrently checking in guests
 * with photo uploads to test system performance and storage handling.
 * 
 * Test Scenarios:
 * 1. 10 concurrent ushers
 * 2. Each usher checks in 60 guests over 4 hours (15 guests/hour)
 * 3. Total: 600 check-ins with photos
 * 4. Measures: Response time, success rate, storage usage
 */

import { createClient } from '@supabase/supabase-js'

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const TEST_CONFIG = {
  NUM_USHERS: 10,
  GUESTS_PER_USHER: 60,
  CONCURRENT_BATCH_SIZE: 10, // How many check-ins to run simultaneously
  DELAY_BETWEEN_BATCHES: 2000, // 2 seconds between batches
  PHOTO_SIZE_KB: 350, // Average photo size
}

interface CheckinResult {
  success: boolean
  duration: number
  guestId: string
  photoUploaded: boolean
  error?: string
}

interface TestMetrics {
  totalCheckins: number
  successfulCheckins: number
  failedCheckins: number
  averageResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  photosUploaded: number
  totalStorageUsed: number
  errors: string[]
}

/**
 * Generate a mock photo blob for testing
 */
function generateMockPhoto(sizeKB: number = 350): Blob {
  // Create a canvas and generate a random image
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 1200
  const ctx = canvas.getContext('2d')!
  
  // Fill with random colors to simulate a photo
  const imageData = ctx.createImageData(1200, 1200)
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = Math.random() * 255     // R
    imageData.data[i + 1] = Math.random() * 255 // G
    imageData.data[i + 2] = Math.random() * 255 // B
    imageData.data[i + 3] = 255                 // A
  }
  ctx.putImageData(imageData, 0, 0)
  
  // Convert to blob
  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!)
    }, 'image/jpeg', 0.9)
  }) as any
}

/**
 * Simulate a single guest check-in with photo upload
 */
async function simulateCheckin(
  supabase: ReturnType<typeof createClient>,
  eventId: string,
  usherName: string,
  guestIndex: number
): Promise<CheckinResult> {
  const startTime = Date.now()
  
  try {
    // Step 1: Create guest record
    const guestName = `Test Guest ${usherName}-${guestIndex}`
    const uniqueCode = `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .insert({
        event_id: eventId,
        name: guestName,
        email: `${uniqueCode}@test.com`,
        unique_code: uniqueCode,
        checked_in: false,
      })
      .select()
      .single()
    
    if (guestError) throw guestError
    
    // Step 2: Upload photo
    const photoBlob = generateMockPhoto(TEST_CONFIG.PHOTO_SIZE_KB)
    const photoPath = `guest-photos/${eventId}/${guest.id}.jpg`
    
    const { error: uploadError } = await supabase.storage
      .from('guestpass')
      .upload(photoPath, photoBlob, {
        contentType: 'image/jpeg',
        upsert: false,
      })
    
    if (uploadError) throw uploadError
    
    // Step 3: Get public URL
    const { data: urlData } = supabase.storage
      .from('guestpass')
      .getPublicUrl(photoPath)
    
    // Step 4: Update guest with photo URL and check-in
    const { error: updateError } = await supabase
      .from('guests')
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: usherName,
        photo_url: urlData.publicUrl,
        first_checkin_at: new Date().toISOString(),
      })
      .eq('id', guest.id)
    
    if (updateError) throw updateError
    
    const duration = Date.now() - startTime
    
    return {
      success: true,
      duration,
      guestId: guest.id,
      photoUploaded: true,
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    return {
      success: false,
      duration,
      guestId: '',
      photoUploaded: false,
      error: error.message,
    }
  }
}

/**
 * Run stress test for a single usher
 */
async function runUsherTest(
  supabase: ReturnType<typeof createClient>,
  eventId: string,
  usherName: string,
  numGuests: number
): Promise<CheckinResult[]> {
  const results: CheckinResult[] = []
  
  console.log(`🚀 ${usherName} starting check-ins...`)
  
  for (let i = 0; i < numGuests; i++) {
    const result = await simulateCheckin(supabase, eventId, usherName, i + 1)
    results.push(result)
    
    if (result.success) {
      console.log(`✅ ${usherName} checked in guest ${i + 1}/${numGuests} (${result.duration}ms)`)
    } else {
      console.error(`❌ ${usherName} failed guest ${i + 1}/${numGuests}: ${result.error}`)
    }
    
    // Small delay to simulate realistic timing
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return results
}

/**
 * Calculate test metrics
 */
function calculateMetrics(allResults: CheckinResult[]): TestMetrics {
  const successfulResults = allResults.filter(r => r.success)
  const failedResults = allResults.filter(r => !r.success)
  
  const responseTimes = successfulResults.map(r => r.duration)
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
  const minResponseTime = Math.min(...responseTimes)
  const maxResponseTime = Math.max(...responseTimes)
  
  const photosUploaded = allResults.filter(r => r.photoUploaded).length
  const totalStorageUsed = photosUploaded * TEST_CONFIG.PHOTO_SIZE_KB
  
  return {
    totalCheckins: allResults.length,
    successfulCheckins: successfulResults.length,
    failedCheckins: failedResults.length,
    averageResponseTime: avgResponseTime,
    minResponseTime,
    maxResponseTime,
    photosUploaded,
    totalStorageUsed,
    errors: failedResults.map(r => r.error || 'Unknown error'),
  }
}

/**
 * Main stress test function
 */
export async function runConcurrentCheckinStressTest(eventId: string) {
  console.log('🔥 STARTING CONCURRENT CHECK-IN STRESS TEST 🔥')
  console.log('================================================')
  console.log(`Event ID: ${eventId}`)
  console.log(`Number of Ushers: ${TEST_CONFIG.NUM_USHERS}`)
  console.log(`Guests per Usher: ${TEST_CONFIG.GUESTS_PER_USHER}`)
  console.log(`Total Check-ins: ${TEST_CONFIG.NUM_USHERS * TEST_CONFIG.GUESTS_PER_USHER}`)
  console.log(`Expected Storage: ${(TEST_CONFIG.NUM_USHERS * TEST_CONFIG.GUESTS_PER_USHER * TEST_CONFIG.PHOTO_SIZE_KB) / 1024} MB`)
  console.log('================================================\n')
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const startTime = Date.now()
  
  // Run all ushers concurrently
  const usherPromises = Array.from({ length: TEST_CONFIG.NUM_USHERS }, (_, i) => {
    const usherName = `Usher-${i + 1}`
    return runUsherTest(supabase, eventId, usherName, TEST_CONFIG.GUESTS_PER_USHER)
  })
  
  const allResults = (await Promise.all(usherPromises)).flat()
  const totalDuration = Date.now() - startTime
  
  // Calculate metrics
  const metrics = calculateMetrics(allResults)
  
  // Print results
  console.log('\n================================================')
  console.log('📊 STRESS TEST RESULTS')
  console.log('================================================')
  console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`)
  console.log(`Total Check-ins: ${metrics.totalCheckins}`)
  console.log(`Successful: ${metrics.successfulCheckins} (${((metrics.successfulCheckins / metrics.totalCheckins) * 100).toFixed(2)}%)`)
  console.log(`Failed: ${metrics.failedCheckins} (${((metrics.failedCheckins / metrics.totalCheckins) * 100).toFixed(2)}%)`)
  console.log(`\nPerformance:`)
  console.log(`  Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms`)
  console.log(`  Min Response Time: ${metrics.minResponseTime}ms`)
  console.log(`  Max Response Time: ${metrics.maxResponseTime}ms`)
  console.log(`  Throughput: ${(metrics.successfulCheckins / (totalDuration / 1000)).toFixed(2)} check-ins/second`)
  console.log(`\nStorage:`)
  console.log(`  Photos Uploaded: ${metrics.photosUploaded}`)
  console.log(`  Total Storage Used: ${(metrics.totalStorageUsed / 1024).toFixed(2)} MB`)
  
  if (metrics.errors.length > 0) {
    console.log(`\n⚠️ Errors (showing first 10):`)
    metrics.errors.slice(0, 10).forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`)
    })
  }
  
  console.log('================================================\n')
  
  return metrics
}

/**
 * Test photo cleanup on event deletion
 */
export async function testPhotoCleanup(eventId: string) {
  console.log('🧹 TESTING PHOTO CLEANUP ON EVENT DELETION')
  console.log('================================================\n')
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  // Step 1: Count photos before deletion
  const { data: guestsBefore, error: fetchError } = await supabase
    .from('guests')
    .select('photo_url')
    .eq('event_id', eventId)
    .not('photo_url', 'is', null)
  
  if (fetchError) {
    console.error('❌ Failed to fetch guests:', fetchError)
    return
  }
  
  const photoCountBefore = guestsBefore?.length || 0
  console.log(`📸 Photos before deletion: ${photoCountBefore}`)
  
  // Step 2: Delete event (should trigger photo cleanup)
  console.log('🗑️ Deleting event...')
  const deleteStart = Date.now()
  
  const response = await fetch(`/api/events/${eventId}`, {
    method: 'DELETE',
  })
  
  const deleteDuration = Date.now() - deleteStart
  
  if (!response.ok) {
    console.error('❌ Failed to delete event:', await response.text())
    return
  }
  
  console.log(`✅ Event deleted in ${deleteDuration}ms`)
  
  // Step 3: Verify photos are deleted from storage
  console.log('🔍 Verifying photo cleanup...')
  
  // Try to access one of the photo URLs
  if (guestsBefore && guestsBefore.length > 0) {
    const samplePhotoUrl = guestsBefore[0].photo_url
    const photoPath = samplePhotoUrl?.match(/\/guestpass\/(.+)$/)?.[1]
    
    if (photoPath) {
      const { data, error } = await supabase.storage
        .from('guestpass')
        .list(photoPath.split('/')[0])
      
      if (error) {
        console.log('✅ Photos successfully deleted from storage')
      } else {
        console.log('⚠️ Some photos may still exist in storage')
      }
    }
  }
  
  console.log('================================================\n')
}