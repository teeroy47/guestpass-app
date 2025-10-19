/**
 * Storage Monitoring Utility
 * 
 * Monitors Supabase storage usage and provides insights
 * on storage consumption, orphaned files, and cleanup recommendations.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface StorageStats {
  totalFiles: number
  totalSizeBytes: number
  totalSizeMB: number
  filesByEvent: Record<string, { count: number; sizeBytes: number }>
  orphanedFiles: string[]
  oldestFile: { name: string; createdAt: string } | null
  newestFile: { name: string; createdAt: string } | null
}

/**
 * Get all files in the guestpass bucket
 */
async function getAllStorageFiles(supabase: ReturnType<typeof createClient>) {
  const allFiles: any[] = []
  
  // List all folders in guest-photos
  const { data: folders, error: foldersError } = await supabase.storage
    .from('guestpass')
    .list('guest-photos', {
      limit: 1000,
    })
  
  if (foldersError) {
    console.error('Error listing folders:', foldersError)
    return allFiles
  }
  
  // For each folder (event), list all files
  for (const folder of folders || []) {
    if (folder.name) {
      const { data: files, error: filesError } = await supabase.storage
        .from('guestpass')
        .list(`guest-photos/${folder.name}`, {
          limit: 1000,
        })
      
      if (!filesError && files) {
        allFiles.push(...files.map(f => ({
          ...f,
          eventId: folder.name,
          fullPath: `guest-photos/${folder.name}/${f.name}`,
        })))
      }
    }
  }
  
  return allFiles
}

/**
 * Get all guest photo URLs from database
 */
async function getAllDatabasePhotoUrls(supabase: ReturnType<typeof createClient>) {
  const { data: guests, error } = await supabase
    .from('guests')
    .select('photo_url, event_id')
    .not('photo_url', 'is', null)
  
  if (error) {
    console.error('Error fetching guest photos:', error)
    return []
  }
  
  return guests || []
}

/**
 * Calculate storage statistics
 */
export async function getStorageStats(): Promise<StorageStats> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  console.log('📊 Analyzing storage usage...\n')
  
  // Get all files from storage
  const storageFiles = await getAllStorageFiles(supabase)
  
  // Get all photo URLs from database
  const dbPhotos = await getAllDatabasePhotoUrls(supabase)
  const dbPhotoSet = new Set(
    dbPhotos.map(p => {
      const match = p.photo_url?.match(/\/guestpass\/(.+)$/)
      return match ? match[1] : null
    }).filter(Boolean)
  )
  
  // Calculate stats
  const stats: StorageStats = {
    totalFiles: storageFiles.length,
    totalSizeBytes: 0,
    totalSizeMB: 0,
    filesByEvent: {},
    orphanedFiles: [],
    oldestFile: null,
    newestFile: null,
  }
  
  let oldestDate = new Date()
  let newestDate = new Date(0)
  
  for (const file of storageFiles) {
    // Total size
    stats.totalSizeBytes += file.metadata?.size || 0
    
    // By event
    if (!stats.filesByEvent[file.eventId]) {
      stats.filesByEvent[file.eventId] = { count: 0, sizeBytes: 0 }
    }
    stats.filesByEvent[file.eventId].count++
    stats.filesByEvent[file.eventId].sizeBytes += file.metadata?.size || 0
    
    // Check if orphaned
    if (!dbPhotoSet.has(file.fullPath)) {
      stats.orphanedFiles.push(file.fullPath)
    }
    
    // Track oldest/newest
    const fileDate = new Date(file.created_at)
    if (fileDate < oldestDate) {
      oldestDate = fileDate
      stats.oldestFile = { name: file.name, createdAt: file.created_at }
    }
    if (fileDate > newestDate) {
      newestDate = fileDate
      stats.newestFile = { name: file.name, createdAt: file.created_at }
    }
  }
  
  stats.totalSizeMB = stats.totalSizeBytes / (1024 * 1024)
  
  return stats
}

/**
 * Print storage report
 */
export async function printStorageReport() {
  console.log('🔍 STORAGE MONITORING REPORT')
  console.log('================================================\n')
  
  const stats = await getStorageStats()
  
  console.log('📦 Overall Statistics:')
  console.log(`  Total Files: ${stats.totalFiles}`)
  console.log(`  Total Size: ${stats.totalSizeMB.toFixed(2)} MB`)
  console.log(`  Average File Size: ${(stats.totalSizeBytes / stats.totalFiles / 1024).toFixed(2)} KB`)
  
  if (stats.oldestFile) {
    console.log(`  Oldest File: ${stats.oldestFile.name} (${new Date(stats.oldestFile.createdAt).toLocaleDateString()})`)
  }
  if (stats.newestFile) {
    console.log(`  Newest File: ${stats.newestFile.name} (${new Date(stats.newestFile.createdAt).toLocaleDateString()})`)
  }
  
  console.log('\n📁 Storage by Event:')
  const sortedEvents = Object.entries(stats.filesByEvent)
    .sort((a, b) => b[1].sizeBytes - a[1].sizeBytes)
    .slice(0, 10)
  
  for (const [eventId, data] of sortedEvents) {
    const sizeMB = (data.sizeBytes / (1024 * 1024)).toFixed(2)
    console.log(`  ${eventId}: ${data.count} files, ${sizeMB} MB`)
  }
  
  console.log('\n🗑️ Orphaned Files:')
  console.log(`  Count: ${stats.orphanedFiles.length}`)
  console.log(`  Estimated Wasted Space: ${((stats.orphanedFiles.length * 350) / 1024).toFixed(2)} MB`)
  
  if (stats.orphanedFiles.length > 0) {
    console.log(`  Sample orphaned files (first 5):`)
    stats.orphanedFiles.slice(0, 5).forEach((file, i) => {
      console.log(`    ${i + 1}. ${file}`)
    })
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:')
  const freeStorageGB = 1 // Supabase free tier
  const usedStorageGB = stats.totalSizeMB / 1024
  const percentUsed = (usedStorageGB / freeStorageGB) * 100
  
  console.log(`  Storage Used: ${percentUsed.toFixed(2)}% of free tier (${usedStorageGB.toFixed(3)} GB / ${freeStorageGB} GB)`)
  
  if (percentUsed > 80) {
    console.log('  ⚠️ WARNING: Storage usage is high!')
    console.log('  - Consider cleaning up orphaned files')
    console.log('  - Review old events and delete if no longer needed')
  } else if (percentUsed > 50) {
    console.log('  ⚠️ CAUTION: Storage usage is moderate')
    console.log('  - Monitor usage regularly')
    console.log('  - Clean up orphaned files to reclaim space')
  } else {
    console.log('  ✅ Storage usage is healthy')
  }
  
  if (stats.orphanedFiles.length > 0) {
    console.log(`  - Clean up ${stats.orphanedFiles.length} orphaned files to reclaim ~${((stats.orphanedFiles.length * 350) / 1024).toFixed(2)} MB`)
  }
  
  console.log('\n================================================\n')
  
  return stats
}

/**
 * Clean up orphaned files
 */
export async function cleanupOrphanedFiles(dryRun: boolean = true) {
  console.log('🧹 ORPHANED FILES CLEANUP')
  console.log('================================================\n')
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be deleted\n')
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const stats = await getStorageStats()
  
  if (stats.orphanedFiles.length === 0) {
    console.log('✅ No orphaned files found!')
    console.log('================================================\n')
    return
  }
  
  console.log(`Found ${stats.orphanedFiles.length} orphaned files`)
  console.log(`Estimated space to reclaim: ${((stats.orphanedFiles.length * 350) / 1024).toFixed(2)} MB\n`)
  
  if (!dryRun) {
    console.log('🗑️ Deleting orphaned files...')
    
    // Delete in batches of 100
    const batchSize = 100
    let deleted = 0
    let failed = 0
    
    for (let i = 0; i < stats.orphanedFiles.length; i += batchSize) {
      const batch = stats.orphanedFiles.slice(i, i + batchSize)
      
      const { error } = await supabase.storage
        .from('guestpass')
        .remove(batch)
      
      if (error) {
        console.error(`❌ Failed to delete batch ${i / batchSize + 1}:`, error)
        failed += batch.length
      } else {
        deleted += batch.length
        console.log(`✅ Deleted batch ${i / batchSize + 1} (${batch.length} files)`)
      }
    }
    
    console.log(`\n📊 Cleanup Results:`)
    console.log(`  Deleted: ${deleted} files`)
    console.log(`  Failed: ${failed} files`)
    console.log(`  Space Reclaimed: ${((deleted * 350) / 1024).toFixed(2)} MB`)
  } else {
    console.log('📋 Files that would be deleted (first 20):')
    stats.orphanedFiles.slice(0, 20).forEach((file, i) => {
      console.log(`  ${i + 1}. ${file}`)
    })
    
    console.log(`\n💡 Run with dryRun=false to actually delete these files`)
  }
  
  console.log('================================================\n')
}

/**
 * Monitor storage in real-time
 */
export async function monitorStorageRealtime(intervalSeconds: number = 60) {
  console.log('📡 REAL-TIME STORAGE MONITORING')
  console.log(`Checking every ${intervalSeconds} seconds...`)
  console.log('Press Ctrl+C to stop\n')
  
  let previousStats: StorageStats | null = null
  
  const check = async () => {
    const stats = await getStorageStats()
    const timestamp = new Date().toLocaleTimeString()
    
    console.log(`[${timestamp}] Files: ${stats.totalFiles} | Size: ${stats.totalSizeMB.toFixed(2)} MB | Orphaned: ${stats.orphanedFiles.length}`)
    
    if (previousStats) {
      const fileDiff = stats.totalFiles - previousStats.totalFiles
      const sizeDiff = stats.totalSizeMB - previousStats.totalSizeMB
      
      if (fileDiff !== 0 || sizeDiff !== 0) {
        console.log(`  📈 Change: ${fileDiff > 0 ? '+' : ''}${fileDiff} files, ${sizeDiff > 0 ? '+' : ''}${sizeDiff.toFixed(2)} MB`)
      }
    }
    
    previousStats = stats
  }
  
  // Initial check
  await check()
  
  // Set up interval
  setInterval(check, intervalSeconds * 1000)
}