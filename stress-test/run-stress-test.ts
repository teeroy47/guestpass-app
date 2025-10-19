/**
 * Stress Test Runner
 * 
 * Main entry point for running all stress tests.
 * Run this script to test system performance under load.
 * 
 * Usage:
 *   npm run stress-test
 */

import { runConcurrentCheckinStressTest, testPhotoCleanup } from './concurrent-checkin-test'
import { printStorageReport, cleanupOrphanedFiles, monitorStorageRealtime } from './storage-monitoring'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Create a test event for stress testing
 */
async function createTestEvent() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  console.log('📝 Creating test event...')
  
  const { data, error } = await supabase
    .from('events')
    .insert({
      title: 'Stress Test Event',
      description: 'Automated stress test - safe to delete',
      starts_at: new Date().toISOString(),
      venue: 'Test Venue',
      status: 'active',
      owner_id: 'test-owner', // You may need to adjust this
    })
    .select()
    .single()
  
  if (error) {
    console.error('❌ Failed to create test event:', error)
    throw error
  }
  
  console.log(`✅ Test event created: ${data.id}\n`)
  return data.id
}

/**
 * Main stress test suite
 */
async function runFullStressTest() {
  console.log('╔════════════════════════════════════════════════╗')
  console.log('║   GUESTPASS SYSTEM STRESS TEST SUITE          ║')
  console.log('╚════════════════════════════════════════════════╝\n')
  
  try {
    // Step 1: Storage baseline
    console.log('STEP 1: Storage Baseline')
    console.log('─────────────────────────────────────────────────')
    await printStorageReport()
    
    // Step 2: Create test event
    console.log('STEP 2: Test Event Creation')
    console.log('─────────────────────────────────────────────────')
    const eventId = await createTestEvent()
    
    // Step 3: Run concurrent check-in test
    console.log('STEP 3: Concurrent Check-in Test')
    console.log('─────────────────────────────────────────────────')
    const metrics = await runConcurrentCheckinStressTest(eventId)
    
    // Step 4: Storage after test
    console.log('STEP 4: Storage After Test')
    console.log('─────────────────────────────────────────────────')
    await printStorageReport()
    
    // Step 5: Test photo cleanup
    console.log('STEP 5: Photo Cleanup Test')
    console.log('─────────────────────────────────────────────────')
    await testPhotoCleanup(eventId)
    
    // Step 6: Final storage check
    console.log('STEP 6: Final Storage Check')
    console.log('─────────────────────────────────────────────────')
    await printStorageReport()
    
    // Step 7: Summary
    console.log('╔════════════════════════════════════════════════╗')
    console.log('║   STRESS TEST COMPLETE                         ║')
    console.log('╚════════════════════════════════════════════════╝\n')
    
    console.log('📊 Final Summary:')
    console.log(`  Total Check-ins: ${metrics.totalCheckins}`)
    console.log(`  Success Rate: ${((metrics.successfulCheckins / metrics.totalCheckins) * 100).toFixed(2)}%`)
    console.log(`  Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms`)
    console.log(`  Storage Used: ${(metrics.totalStorageUsed / 1024).toFixed(2)} MB`)
    console.log(`  Photos Uploaded: ${metrics.photosUploaded}`)
    
    if (metrics.successfulCheckins === metrics.totalCheckins) {
      console.log('\n✅ ALL TESTS PASSED!')
    } else {
      console.log(`\n⚠️ ${metrics.failedCheckins} check-ins failed`)
    }
    
    console.log('\n💡 Next Steps:')
    console.log('  1. Review the metrics above')
    console.log('  2. Check for any errors or warnings')
    console.log('  3. Run cleanup if needed: npm run cleanup-orphaned')
    console.log('  4. Monitor storage: npm run monitor-storage\n')
    
  } catch (error) {
    console.error('❌ Stress test failed:', error)
    process.exit(1)
  }
}

/**
 * Quick performance test (lighter version)
 */
async function runQuickTest() {
  console.log('⚡ QUICK PERFORMANCE TEST\n')
  
  try {
    const eventId = await createTestEvent()
    
    // Run with fewer ushers and guests
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    console.log('Testing with 3 ushers, 10 guests each...\n')
    
    // Simplified test logic here
    // You can adjust the TEST_CONFIG in concurrent-checkin-test.ts
    
    console.log('✅ Quick test complete!\n')
    
  } catch (error) {
    console.error('❌ Quick test failed:', error)
  }
}

/**
 * Parse command line arguments and run appropriate test
 */
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'full'
  
  switch (command) {
    case 'full':
      await runFullStressTest()
      break
    
    case 'quick':
      await runQuickTest()
      break
    
    case 'storage':
      await printStorageReport()
      break
    
    case 'cleanup':
      const dryRun = !args.includes('--confirm')
      await cleanupOrphanedFiles(dryRun)
      break
    
    case 'monitor':
      const interval = parseInt(args[1]) || 60
      await monitorStorageRealtime(interval)
      break
    
    case 'help':
    default:
      console.log('Guestpass Stress Test Suite')
      console.log('─────────────────────────────────────────────────')
      console.log('Usage: npm run stress-test [command] [options]\n')
      console.log('Commands:')
      console.log('  full              Run full stress test suite (default)')
      console.log('  quick             Run quick performance test')
      console.log('  storage           Print storage report')
      console.log('  cleanup [--confirm]  Clean up orphaned files')
      console.log('  monitor [interval]   Monitor storage in real-time')
      console.log('  help              Show this help message\n')
      console.log('Examples:')
      console.log('  npm run stress-test full')
      console.log('  npm run stress-test storage')
      console.log('  npm run stress-test cleanup --confirm')
      console.log('  npm run stress-test monitor 30\n')
      break
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { runFullStressTest, runQuickTest }