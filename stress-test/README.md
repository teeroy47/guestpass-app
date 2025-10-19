# 🔥 Stress Test Suite

Comprehensive performance and load testing for the Guestpass system.

## Quick Start

```bash
# Run full stress test
npm run stress-test

# Check storage usage
npm run stress-test:storage

# Clean up orphaned files
npm run stress-test:cleanup
```

## What's Included

### Test Files

- **`concurrent-checkin-test.ts`** - Simulates 10 concurrent ushers checking in guests
- **`storage-monitoring.ts`** - Storage usage tracking and cleanup utilities
- **`run-stress-test.ts`** - Main test runner with CLI interface

### Test Scenarios

1. **Concurrent Check-ins** - 10 ushers × 60 guests = 600 check-ins with photos
2. **Storage Management** - Track usage, detect orphaned files
3. **Photo Cleanup** - Verify automatic deletion on event removal
4. **Performance Metrics** - Response times, success rates, throughput

## Commands

### Full Stress Test
```bash
npm run stress-test
```
Runs complete test suite with 600 check-ins and comprehensive reporting.

### Quick Test
```bash
npm run stress-test:quick
```
Lighter version for quick validation.

### Storage Report
```bash
npm run stress-test:storage
```
Shows current storage usage, orphaned files, and recommendations.

### Cleanup Orphaned Files
```bash
# Dry run (preview only)
npm run stress-test:cleanup

# Actually delete files
npm run stress-test:cleanup --confirm
```

### Real-time Monitoring
```bash
# Check every 60 seconds
npm run stress-test:monitor

# Check every 30 seconds
npm run stress-test:monitor 30
```

## Expected Results

### Good Performance ✅
- Success Rate: >98%
- Average Response Time: <2.5s
- Storage Usage: <80%
- Zero orphaned files

### Acceptable Performance ⚠️
- Success Rate: 95-98%
- Average Response Time: 2.5-4s
- Storage Usage: 80-90%
- <10 orphaned files

### Needs Investigation ❌
- Success Rate: <95%
- Average Response Time: >4s
- Storage Usage: >90%
- >10 orphaned files

## Documentation

See **`STRESS_TEST_GUIDE.md`** in the project root for:
- Detailed usage instructions
- Troubleshooting guide
- Performance benchmarks
- Best practices
- Maintenance schedule

## Test Configuration

Edit `concurrent-checkin-test.ts` to adjust:

```typescript
const TEST_CONFIG = {
  NUM_USHERS: 10,              // Number of concurrent ushers
  GUESTS_PER_USHER: 60,        // Guests per usher
  CONCURRENT_BATCH_SIZE: 10,   // Simultaneous operations
  DELAY_BETWEEN_BATCHES: 2000, // Delay in ms
  PHOTO_SIZE_KB: 350,          // Average photo size
}
```

## Requirements

- Node.js 18+
- TypeScript
- Valid Supabase credentials in `.env.local`
- Sufficient storage space in Supabase

## Troubleshooting

### Test won't start
- Check `.env.local` has correct Supabase credentials
- Verify database connection
- Ensure `events` and `guests` tables exist

### Low success rate
- Check Supabase logs for errors
- Verify storage policies
- Check network connectivity
- Review rate limits

### Storage full
- Run cleanup: `npm run stress-test:cleanup --confirm`
- Delete old events
- Consider upgrading Supabase plan

## Support

For detailed help, see:
- `STRESS_TEST_GUIDE.md` - Complete guide
- `PHOTO_CLEANUP_AND_STRESS_TEST.md` - Implementation details
- Supabase dashboard logs

---

**Happy Testing! 🚀**