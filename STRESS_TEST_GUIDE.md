# 🔥 Stress Test Guide

Complete guide for running performance and stress tests on the Guestpass system.

---

## 📋 Overview

This stress test suite simulates real-world usage scenarios to validate:

1. **Performance** - Response times under concurrent load
2. **Reliability** - Success rates with multiple simultaneous operations
3. **Storage** - Photo upload/storage handling and cleanup
4. **Scalability** - System behavior with 10+ concurrent ushers

---

## 🚀 Quick Start

### Run Full Stress Test
```bash
npm run stress-test
```

This will:
- Create a test event
- Simulate 10 ushers checking in 60 guests each (600 total)
- Upload 600 photos (~210 MB)
- Measure performance metrics
- Test photo cleanup on event deletion
- Generate comprehensive report

### Run Quick Test (Lighter)
```bash
npm run stress-test quick
```

Runs a lighter version with fewer ushers and guests for quick validation.

---

## 📊 Available Commands

### 1. Full Stress Test
```bash
npm run stress-test full
```

**What it does:**
- Creates test event
- Simulates 10 concurrent ushers
- Each usher checks in 60 guests with photos
- Measures response times, success rates
- Tests photo cleanup functionality
- Generates before/after storage reports

**Expected Duration:** 10-15 minutes

**Expected Results:**
- ✅ Success Rate: >95%
- ✅ Average Response Time: <3000ms
- ✅ Storage Used: ~210 MB
- ✅ All photos cleaned up after event deletion

---

### 2. Storage Report
```bash
npm run stress-test storage
```

**What it shows:**
- Total files and storage used
- Storage breakdown by event
- Orphaned files (not linked to any guest)
- Storage usage percentage
- Recommendations

**Example Output:**
```
📦 Overall Statistics:
  Total Files: 1,234
  Total Size: 432.50 MB
  Average File Size: 350 KB

📁 Storage by Event:
  event-abc123: 150 files, 52.50 MB
  event-def456: 120 files, 42.00 MB

🗑️ Orphaned Files:
  Count: 45
  Estimated Wasted Space: 15.75 MB

💡 Recommendations:
  Storage Used: 43.25% of free tier
  ✅ Storage usage is healthy
```

---

### 3. Cleanup Orphaned Files
```bash
# Dry run (preview only)
npm run stress-test cleanup

# Actually delete files
npm run stress-test cleanup --confirm
```

**What it does:**
- Scans for photos not linked to any guest record
- Shows list of orphaned files
- Calculates space that can be reclaimed
- Deletes files (if --confirm flag is used)

**When to use:**
- After deleting events manually from database
- After failed uploads
- Regular maintenance (monthly)

---

### 4. Real-time Storage Monitoring
```bash
# Check every 60 seconds (default)
npm run stress-test monitor

# Check every 30 seconds
npm run stress-test monitor 30
```

**What it does:**
- Monitors storage usage in real-time
- Shows changes in file count and size
- Tracks orphaned files
- Useful during active events

**Press Ctrl+C to stop**

---

## 📈 Test Scenarios

### Scenario 1: Peak Event Load
**Simulates:** Busy event with 10 ushers working simultaneously

```bash
npm run stress-test full
```

**Configuration:**
- 10 concurrent ushers
- 60 guests per usher
- 600 total check-ins
- ~210 MB storage

**Success Criteria:**
- ✅ >95% success rate
- ✅ <3s average response time
- ✅ No storage errors
- ✅ Photos cleaned up after deletion

---

### Scenario 2: Storage Capacity
**Simulates:** Multiple events over time

**Steps:**
1. Run full stress test 3-5 times
2. Check storage report after each run
3. Verify cleanup is working
4. Monitor storage percentage

**Success Criteria:**
- ✅ Storage stays under 80% of free tier
- ✅ No orphaned files accumulate
- ✅ Cleanup reclaims space properly

---

### Scenario 3: Concurrent Operations
**Simulates:** Multiple ushers uploading photos simultaneously

**What to watch:**
- Response time consistency
- Upload success rate
- Database lock contention
- Storage API rate limits

---

## 🎯 Performance Benchmarks

### Expected Performance (Good)
```
✅ Average Response Time: 1,500 - 2,500ms
✅ Success Rate: >98%
✅ Throughput: 5-10 check-ins/second
✅ Storage Usage: <80% of tier limit
```

### Acceptable Performance (OK)
```
⚠️ Average Response Time: 2,500 - 4,000ms
⚠️ Success Rate: 95-98%
⚠️ Throughput: 3-5 check-ins/second
⚠️ Storage Usage: 80-90% of tier limit
```

### Poor Performance (Needs Investigation)
```
❌ Average Response Time: >4,000ms
❌ Success Rate: <95%
❌ Throughput: <3 check-ins/second
❌ Storage Usage: >90% of tier limit
```

---

## 🔍 Interpreting Results

### Response Times

**Fast (<2s):**
- Excellent user experience
- System handling load well
- No bottlenecks

**Moderate (2-4s):**
- Acceptable for most use cases
- Monitor for degradation
- Consider optimization if trending up

**Slow (>4s):**
- Poor user experience
- Investigate bottlenecks:
  - Network latency
  - Database queries
  - Storage API limits
  - Image compression settings

---

### Success Rate

**High (>98%):**
- System is reliable
- Error handling working well

**Moderate (95-98%):**
- Some failures occurring
- Check error logs for patterns
- May be transient network issues

**Low (<95%):**
- Significant reliability issues
- Check:
  - Database connection limits
  - Storage policies
  - API rate limits
  - Error logs

---

### Storage Usage

**Healthy (<50%):**
- Plenty of headroom
- No immediate concerns

**Moderate (50-80%):**
- Monitor regularly
- Plan for cleanup or upgrade

**High (>80%):**
- Action needed soon
- Run cleanup immediately
- Consider upgrading storage tier
- Review photo resolution settings

---

## 🛠️ Troubleshooting

### Test Fails to Start

**Error:** "Failed to create test event"

**Solutions:**
1. Check Supabase credentials in `.env.local`
2. Verify database connection
3. Check user permissions
4. Ensure `events` table exists

---

### Low Success Rate

**Error:** Many check-ins failing

**Solutions:**
1. Check Supabase logs for errors
2. Verify storage policies are correct
3. Check database connection limits
4. Review network connectivity
5. Check for rate limiting

---

### Slow Response Times

**Issue:** Average >4s response time

**Solutions:**
1. Check network latency to Supabase
2. Review image compression settings
3. Check database indexes
4. Monitor Supabase dashboard for issues
5. Consider reducing photo resolution

---

### Storage Full

**Error:** "Storage limit exceeded"

**Solutions:**
1. Run cleanup: `npm run stress-test cleanup --confirm`
2. Delete old events with photos
3. Check for orphaned files
4. Consider upgrading Supabase plan
5. Reduce photo resolution/quality

---

### Photos Not Cleaning Up

**Issue:** Orphaned files accumulating

**Solutions:**
1. Verify `deleteEvent` function includes cleanup logic
2. Check storage policies allow deletion
3. Review error logs during event deletion
4. Manually run cleanup tool
5. Check file path extraction logic

---

## 📝 Test Checklist

Before running stress tests:

- [ ] Backup important data
- [ ] Verify `.env.local` has correct credentials
- [ ] Check Supabase storage policies are set
- [ ] Ensure sufficient storage space available
- [ ] Review current storage usage
- [ ] Close unnecessary browser tabs/apps
- [ ] Have stable internet connection

After running stress tests:

- [ ] Review all metrics and reports
- [ ] Check for any errors or warnings
- [ ] Verify photos were cleaned up
- [ ] Run storage report
- [ ] Clean up orphaned files if any
- [ ] Document any issues found
- [ ] Update performance benchmarks if needed

---

## 🎓 Best Practices

### Regular Testing
- Run stress tests before major events
- Test after code changes affecting check-in flow
- Monthly storage audits
- Quarterly performance benchmarks

### Monitoring
- Set up real-time monitoring during events
- Track storage usage trends
- Monitor error rates
- Review performance metrics

### Maintenance
- Clean up orphaned files monthly
- Delete old test events
- Review and optimize photo settings
- Update benchmarks as system evolves

### Optimization
- Adjust photo resolution based on needs
- Optimize database queries
- Review storage policies
- Consider CDN for photo delivery

---

## 📞 Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review Supabase dashboard logs
3. Check browser console for errors
4. Review `FEATURE_UPDATES.md` for recent changes
5. Contact system administrator

---

## 🔄 Continuous Improvement

After each stress test:

1. **Document Results**
   - Save metrics to a log file
   - Note any anomalies
   - Track trends over time

2. **Identify Bottlenecks**
   - Slowest operations
   - Highest failure rates
   - Resource constraints

3. **Optimize**
   - Address identified issues
   - Test optimizations
   - Measure improvements

4. **Update Benchmarks**
   - Adjust expected performance
   - Update this guide
   - Share learnings with team

---

## 📊 Sample Test Report

```
╔════════════════════════════════════════════════╗
║   STRESS TEST RESULTS - 2024-01-15            ║
╚════════════════════════════════════════════════╝

Test Configuration:
  Ushers: 10
  Guests per Usher: 60
  Total Check-ins: 600
  Duration: 12m 34s

Performance Metrics:
  ✅ Success Rate: 98.5% (591/600)
  ✅ Average Response Time: 2,145ms
  ✅ Min Response Time: 1,234ms
  ✅ Max Response Time: 4,567ms
  ✅ Throughput: 7.9 check-ins/second

Storage Metrics:
  ✅ Photos Uploaded: 591
  ✅ Storage Used: 206.85 MB
  ✅ Average Photo Size: 350 KB
  ✅ Photos Cleaned Up: 591/591 (100%)

Issues Found:
  ⚠️ 9 check-ins failed due to network timeout
  ⚠️ 3 photos took >4s to upload

Recommendations:
  ✅ System performing well overall
  ⚠️ Monitor network stability during events
  💡 Consider retry logic for failed uploads

Overall Assessment: PASS ✅
```

---

## 🎯 Next Steps

1. **Run your first stress test:**
   ```bash
   npm run stress-test
   ```

2. **Review the results** and compare to benchmarks

3. **Address any issues** found during testing

4. **Set up regular monitoring** for production events

5. **Document your findings** and share with team

---

**Happy Testing! 🚀**