# QR Code Guest Name Feature - Testing Guide

## Quick Test Checklist

### ✅ Prerequisites
- [ ] App is running locally or deployed
- [ ] You have at least one active event
- [ ] Event has at least 3 guests registered
- [ ] You're logged in as admin or usher

---

## Test 1: Individual QR Code Download

### Steps:
1. Navigate to **QR Code Generator** page
2. Select an event from the dropdown
3. Switch to **"Individual QR Codes"** tab
4. Find a guest card (e.g., "John Doe")
5. Click **"Download PNG"** button

### Expected Result:
✅ File downloads with name like: `John-Doe-ABC123.png`
✅ Open the PNG file
✅ QR code is visible at the top
✅ Guest name "John Doe" is visible at the bottom
✅ Text is centered and bold
✅ Image size is approximately 400x460 pixels

### ❌ Failure Indicators:
- No guest name visible on image
- Text is cut off or misaligned
- Image is corrupted or won't open
- Download fails with error

---

## Test 2: Bulk PNG Downloads

### Steps:
1. Navigate to **QR Code Generator** page
2. Select an event
3. Switch to **"Bulk Export"** tab
4. Click **"Select All"** button
5. Click **"Individual PNG Files"** button
6. Wait for downloads to complete (500ms delay between each)

### Expected Result:
✅ Multiple PNG files download (one per guest)
✅ Each file named with guest name: `Jane-Smith-XYZ456.png`
✅ Open 2-3 random files
✅ Each shows correct guest name at bottom
✅ All QR codes are unique
✅ All images have consistent format

### ❌ Failure Indicators:
- Downloads stop or fail midway
- Some images missing guest names
- Guest names don't match filenames
- Images have inconsistent sizes

---

## Test 3: PDF Bundle Export

### Steps:
1. Navigate to **QR Code Generator** page
2. Select an event
3. Switch to **"Bulk Export"** tab
4. Select 3-5 guests (or use "Select All")
5. Click **"PDF Bundle"** button
6. Wait for PDF to generate and download

### Expected Result:
✅ PDF file downloads: `guestpass-[event-id]-bundle.pdf`
✅ Open the PDF
✅ One page per guest
✅ Each page shows:
   - QR code at top (centered)
   - Guest name below QR code (bold, 16pt, centered)
   - Unique code below name (gray, 10pt, centered)
✅ Professional layout with proper spacing
✅ All pages have consistent formatting

### ❌ Failure Indicators:
- PDF fails to generate (500 error)
- Pages missing guest names
- Text is misaligned or overlapping
- QR codes are distorted
- Inconsistent page layouts

---

## Test 4: ZIP Archive Export

### Steps:
1. Navigate to **QR Code Generator** page
2. Select an event
3. Switch to **"Bulk Export"** tab
4. Select 3-5 guests
5. Click **"ZIP Archive"** button
6. Wait for ZIP to generate and download
7. Extract the ZIP file

### Expected Result:
✅ ZIP file downloads: `guestpass-[event-id]-bundle.zip`
✅ Extract successfully
✅ Contains one PNG per selected guest
✅ Files named: `[event-id]-[Guest-Name]-[Code].png`
✅ Open 2-3 PNG files
✅ Each shows:
   - QR code at top
   - Guest name at bottom (bold, 24px, centered)
✅ All images are 400x460 pixels
✅ High quality, no artifacts

### ❌ Failure Indicators:
- ZIP fails to generate
- ZIP is corrupted or won't extract
- PNG files missing guest names
- Images are low quality or distorted
- Sharp library errors in console

---

## Test 5: Special Characters in Names

### Steps:
1. Create or find a guest with special characters in name:
   - Example: "O'Brien", "José García", "Smith-Jones"
2. Download individual QR code for this guest
3. Check the PNG file

### Expected Result:
✅ File downloads successfully
✅ Filename has special chars replaced: `O-Brien-ABC123.png`
✅ Guest name on image shows correctly: "O'Brien"
✅ Special characters render properly in image
✅ No encoding issues or garbled text

### ❌ Failure Indicators:
- Download fails
- Special characters show as boxes or ???
- Text is garbled or unreadable
- Filename has invalid characters

---

## Test 6: Long Guest Names

### Steps:
1. Create or find a guest with a long name:
   - Example: "Christopher Alexander Montgomery-Wellington III"
2. Download QR code
3. Check if name fits properly

### Expected Result:
✅ File downloads successfully
✅ Long name is visible on image
✅ Text doesn't overflow or get cut off
✅ Font size remains readable
✅ QR code is not obscured

### ❌ Failure Indicators:
- Name is cut off
- Text overflows image boundaries
- Font is too small to read
- Layout is broken

---

## Test 7: Missing Guest Name

### Steps:
1. Create a guest with empty name field (if possible)
2. Or modify code temporarily to pass empty string
3. Download QR code

### Expected Result:
✅ File downloads successfully
✅ Shows "Guest" as fallback name
✅ No errors or crashes
✅ QR code still works

### ❌ Failure Indicators:
- Download fails
- Blank space where name should be
- Error in console
- Image is corrupted

---

## Test 8: QR Code Functionality

### Steps:
1. Download a QR code with guest name
2. Open the PNG file
3. Use QR scanner app or scanner page to scan it
4. Verify check-in works

### Expected Result:
✅ QR code scans successfully
✅ Guest is identified correctly
✅ Check-in completes normally
✅ Guest name added to image doesn't affect scanning

### ❌ Failure Indicators:
- QR code won't scan
- Wrong guest is identified
- Scanner shows error
- Check-in fails

---

## Test 9: Cross-Browser Compatibility

### Steps:
1. Test individual download in:
   - Chrome/Edge
   - Firefox
   - Safari (if available)
2. Verify downloads work in each browser

### Expected Result:
✅ Downloads work in all browsers
✅ Images display correctly in all browsers
✅ No browser-specific issues
✅ Consistent quality across browsers

### ❌ Failure Indicators:
- Download fails in specific browser
- Images corrupted in certain browser
- Canvas rendering issues
- Browser console errors

---

## Test 10: Mobile Device Testing

### Steps:
1. Open app on mobile device
2. Navigate to QR Code Generator
3. Download individual QR code
4. Check the downloaded image

### Expected Result:
✅ Download works on mobile
✅ Image opens in gallery/photos
✅ Guest name is visible and readable
✅ QR code is scannable from mobile screen

### ❌ Failure Indicators:
- Download fails on mobile
- Image won't open
- Text is too small to read
- QR code quality is poor

---

## Performance Tests

### Test 11: Bulk Download Performance

### Steps:
1. Select 50+ guests
2. Click "Individual PNG Files"
3. Monitor download progress

### Expected Result:
✅ All files download successfully
✅ 500ms delay between downloads prevents browser blocking
✅ No memory issues or crashes
✅ All files are complete and valid

### ❌ Failure Indicators:
- Browser blocks downloads
- Some files are missing
- Browser becomes unresponsive
- Memory errors

---

### Test 12: Large PDF Bundle

### Steps:
1. Select 50+ guests
2. Generate PDF bundle
3. Wait for generation

### Expected Result:
✅ PDF generates successfully (may take 10-30 seconds)
✅ File size is reasonable (< 5MB for 50 guests)
✅ All pages render correctly
✅ No timeout errors

### ❌ Failure Indicators:
- Request times out
- PDF is corrupted
- File size is excessive
- Server error (500)

---

## Debugging Tips

### If downloads fail:
1. Check browser console for errors
2. Verify canvas API is supported
3. Check browser download settings
4. Try incognito/private mode

### If guest names don't appear:
1. Check that `guestName` parameter is being passed
2. Verify canvas text rendering code
3. Check font loading
4. Inspect canvas dimensions

### If PDF/ZIP generation fails:
1. Check server logs for errors
2. Verify Sharp library is installed
3. Check memory limits
4. Test with smaller batch first

### If QR codes won't scan:
1. Verify QR code data format
2. Check image quality/resolution
3. Test with different scanner apps
4. Ensure adequate contrast

---

## Success Criteria

All tests should pass with ✅ results. The feature is ready for production when:

- [x] Individual downloads include guest names
- [x] Bulk downloads include guest names
- [x] PDF bundles show guest names
- [x] ZIP archives contain named QR codes
- [x] Special characters handled correctly
- [x] Long names display properly
- [x] QR codes remain scannable
- [x] Cross-browser compatibility confirmed
- [x] Mobile devices work correctly
- [x] Performance is acceptable for large batches

---

## Rollback Plan

If critical issues are found:

1. Revert changes to `lib/qr-utils.tsx`
2. Revert changes to `components/qr/qr-code-generator.tsx`
3. Revert changes to `app/api/generate-bundle/route.ts`
4. Redeploy previous version
5. Investigate and fix issues
6. Re-test before redeploying

---

## Support Information

If you encounter issues during testing:

1. **Check Documentation**: 
   - `QR_CODE_GUEST_NAME_FEATURE.md` - Feature overview
   - `QR_CODE_BEFORE_AFTER.md` - Visual comparison

2. **Collect Information**:
   - Browser and version
   - Operating system
   - Error messages (console and network)
   - Steps to reproduce
   - Screenshots of issue

3. **Common Issues**:
   - **Canvas not supported**: Update browser
   - **Sharp errors**: Reinstall dependencies
   - **Memory issues**: Reduce batch size
   - **Font rendering**: Check system fonts

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Mark feature as complete
2. ✅ Update user documentation
3. ✅ Deploy to production
4. ✅ Notify users of new feature
5. ✅ Monitor for issues in production
6. ✅ Gather user feedback

---

## Test Results Template

```
Date: _______________
Tester: _______________
Environment: _______________

Test 1 - Individual Download:        [ ] Pass  [ ] Fail
Test 2 - Bulk PNG Downloads:         [ ] Pass  [ ] Fail
Test 3 - PDF Bundle:                 [ ] Pass  [ ] Fail
Test 4 - ZIP Archive:                [ ] Pass  [ ] Fail
Test 5 - Special Characters:         [ ] Pass  [ ] Fail
Test 6 - Long Names:                 [ ] Pass  [ ] Fail
Test 7 - Missing Name:               [ ] Pass  [ ] Fail
Test 8 - QR Functionality:           [ ] Pass  [ ] Fail
Test 9 - Cross-Browser:              [ ] Pass  [ ] Fail
Test 10 - Mobile:                    [ ] Pass  [ ] Fail
Test 11 - Bulk Performance:          [ ] Pass  [ ] Fail
Test 12 - Large PDF:                 [ ] Pass  [ ] Fail

Overall Result: [ ] PASS  [ ] FAIL

Notes:
_________________________________
_________________________________
_________________________________
```