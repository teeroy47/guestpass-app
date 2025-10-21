/**
 * Migration Script: Fix Usher Names in Guest Records
 * 
 * This script updates all guest records where usher_name contains an email address
 * and replaces it with the actual user's display_name or full_name from the users table.
 * 
 * Run with: npm run fix-usher-names
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - VITE_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)')
  console.error('\n💡 Make sure your .env.local file is properly configured.')
  process.exit(1)
}

console.log('🔑 Using Supabase URL:', supabaseUrl)
console.log('🔑 Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon Key')
console.log('')

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixUsherNames() {
  console.log('🔍 Starting usher name migration...\n')

  try {
    // Step 1: Get all guests with usher_email set
    console.log('📊 Fetching guests with usher information...')
    const { data: guests, error: guestsError } = await supabase
      .from('guests')
      .select('id, usher_name, usher_email')
      .not('usher_email', 'is', null)

    if (guestsError) {
      throw new Error(`Failed to fetch guests: ${guestsError.message}`)
    }

    if (!guests || guests.length === 0) {
      console.log('✅ No guests found with usher information. Nothing to update.')
      return
    }

    console.log(`   Found ${guests.length} guests with usher information\n`)

    // Step 2: Get unique usher emails
    const usherEmails = [...new Set(guests.map(g => g.usher_email).filter(Boolean))]
    console.log(`👥 Found ${usherEmails.length} unique ushers\n`)

    // Step 3: Fetch user names for all ushers
    console.log('🔎 Fetching usher names from users table...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('email, display_name, full_name')
      .in('email', usherEmails)

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    // Create a map of email -> name
    const emailToNameMap = new Map<string, string>()
    users?.forEach(user => {
      const name = user.display_name || user.full_name || user.email
      emailToNameMap.set(user.email, name)
    })

    console.log(`   Found ${emailToNameMap.size} user records\n`)

    // Step 4: Update guests with correct usher names
    console.log('🔄 Updating guest records...')
    let updatedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const guest of guests) {
      if (!guest.usher_email) {
        skippedCount++
        continue
      }

      const correctName = emailToNameMap.get(guest.usher_email)
      
      if (!correctName) {
        console.log(`   ⚠️  No user found for email: ${guest.usher_email}`)
        skippedCount++
        continue
      }

      // Only update if the current usher_name is different from the correct name
      if (guest.usher_name === correctName) {
        skippedCount++
        continue
      }

      const { error: updateError } = await supabase
        .from('guests')
        .update({ usher_name: correctName })
        .eq('id', guest.id)

      if (updateError) {
        console.error(`   ❌ Failed to update guest ${guest.id}: ${updateError.message}`)
        errorCount++
      } else {
        console.log(`   ✅ Updated: "${guest.usher_name}" → "${correctName}"`)
        updatedCount++
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📈 Migration Summary:')
    console.log('='.repeat(60))
    console.log(`   Total guests processed: ${guests.length}`)
    console.log(`   ✅ Successfully updated: ${updatedCount}`)
    console.log(`   ⏭️  Skipped (already correct): ${skippedCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log('='.repeat(60))

    if (updatedCount > 0) {
      console.log('\n✨ Migration completed successfully!')
      console.log('   The leaderboard will now display correct usher names.')
    } else {
      console.log('\n✅ All records were already up to date!')
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
fixUsherNames()
  .then(() => {
    console.log('\n👋 Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error)
    process.exit(1)
  })