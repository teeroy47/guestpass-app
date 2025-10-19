# 🚀 Quick Start: Stress Testing

## ⚡ Run Your First Test (2 minutes)

```bash
# 1. Check current storage
npm run stress-test:storage

# 2. Run full stress test
npm run stress-test

# 3. Review results in console
```

That's it! The test will:
- ✅ Create a test event
- ✅ Simulate 10 ushers checking in 600 guests
- ✅ Upload 600 photos (~210 MB)
- ✅ Measure performance
- ✅ Delete event and verify cleanup
- ✅ Show comprehensive report

---

## 📊 What to Look For

### ✅ Good Results
```
✅ Success Rate: >98%
✅ Average Response Time: <2.5s
✅ Photos Uploaded: 600
✅ Photos Cleaned Up: 600/600 (100%)
✅ Storage Reclaimed: ~210 MB
```

### ⚠️ Needs Investigation
```
❌ Success Rate: <95%
❌ Average Response Time: >4s
❌ Photos Not Cleaned Up
❌ Storage Still Full
```

---

## 🎯 Common Commands

```bash
# Full test (10-15 minutes)
npm run stress-test

# Quick test (lighter, 3-5 minutes)
npm run stress-test:quick

# Storage report only
npm run stress-test:storage

# Clean up orphaned files
npm run stress-test:cleanup --confirm

# Monitor in real-time
npm run stress-test:monitor 30
```

---

## 🔍 Interpreting Results

### Example Output
```
╔════════════════════════════════════════════════╗
║   STRESS TEST RESULTS                          ║
╚════════════════════════════════════════════════╝

Total Duration: 12.34s
Total Check-ins: 600
Successful: 591 (98.50%)
Failed: 9 (1.50%)

Performance:
  Average Response Time: 2,145ms ✅
  Min Response Time: 1,234ms
  Max Response Time: 4,567ms
  Throughput: 7.9 check-ins/second ✅

Storage:
  Photos Uploaded: 591 ✅
  Total Storage Used: 206.85 MB
  Photos Cleaned Up: 591/591 (100%) ✅

Overall: PASS ✅
```

### What Each Metric Means

**Success Rate**
- >98% = Excellent ✅
- 95-98% = Good ⚠️
- <95% = Investigate ❌

**Response Time**
- <2s = Fast ✅
- 2-4s = Acceptable ⚠️
- >4s = Slow ❌

**Photo Cleanup**
- 100% = Perfect ✅
- <100% = Check logs ❌

---

## 🛠️ Troubleshooting

### Test Won't Start
```bash
# Check environment variables
cat .env.local | grep SUPABASE

# Verify database connection
npm run stress-test:storage
```

### Low Success Rate
- Check Supabase dashboard for errors
- Verify storage policies are set
- Check internet connection
- Review rate limits

### Photos Not Cleaning Up
- Check console logs during deletion
- Verify storage policies allow deletion
- Run manual cleanup: `npm run stress-test:cleanup --confirm`

---

## 📅 When to Run Tests

### Before Major Events
```bash
npm run stress-test:quick
```
Quick validation (5 minutes)

### Monthly Maintenance
```bash
npm run stress-test
npm run stress-test:cleanup --confirm
```
Full test + cleanup (15 minutes)

### During Events (Optional)
```bash
npm run stress-test:monitor 30
```
Real-time monitoring

---

## 📚 More Information

- **Complete Guide:** `STRESS_TEST_GUIDE.md`
- **Implementation Details:** `PHOTO_CLEANUP_AND_STRESS_TEST.md`
- **Quick Reference:** `stress-test/README.md`

---

## 🎉 Ready to Test!

Run your first stress test now:

```bash
npm run stress-test
```

The system will automatically:
1. Create test event
2. Simulate 600 concurrent check-ins
3. Measure all metrics
4. Clean up after itself
5. Show you the results

**Takes 10-15 minutes. Grab a coffee! ☕**

---

## 💡 Pro Tips

1. **Run storage report first** to see baseline
2. **Run tests during off-peak hours** for best results
3. **Monitor Supabase dashboard** during tests
4. **Save results** for comparison over time
5. **Clean up orphaned files monthly**

---

**Questions? Check `STRESS_TEST_GUIDE.md` for detailed help!**