# Build script for Capacitor APK
# This builds the Next.js app as a static export for the native app

Write-Host "Building Next.js app for Capacitor (static export)..." -ForegroundColor Cyan

# Set environment variable for static export
$env:CAPACITOR_BUILD = "true"

# Build Next.js
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] Build complete!" -ForegroundColor Green
    Write-Host "`nNow sync to Android:" -ForegroundColor Yellow
    Write-Host "  npx cap sync android" -ForegroundColor Cyan
    Write-Host "`nThen build APK in Android Studio" -ForegroundColor Yellow
} else {
    Write-Host "`n[FAILED] Build failed!" -ForegroundColor Red
    exit 1
}
