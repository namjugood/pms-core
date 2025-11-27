# Package script for v2.0.0
$version = "2.0.0"
$packageRoot = "package"
$sevenZip = ".\node_modules\7zip-bin\win\x64\7za.exe"
$winUnpacked = "$packageRoot\win-unpacked"
$pmsCore = "$packageRoot\pms-core"
$file7z = "$packageRoot\pms-core_v$version.7z"

Write-Host "========================================" -ForegroundColor Green
Write-Host "PMS-Core v$version Packaging" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# [0/3] Clean up previous builds
Write-Host "[0/3] Cleaning up previous artifacts..." -ForegroundColor Cyan

# 1. win-unpacked 폴더가 있으면 삭제 (이전 빌드 잔여물)
if (Test-Path $winUnpacked) {
    Write-Host "Removing old win-unpacked..." -ForegroundColor Gray
    Remove-Item $winUnpacked -Recurse -Force
}

# 2. pms-core 폴더가 있으면 삭제 (이전 패키징 잔여물)
if (Test-Path $pmsCore) {
    Write-Host "Removing old pms-core..." -ForegroundColor Gray
    Remove-Item $pmsCore -Recurse -Force
}

# 3. 기존 7z 파일 삭제
if (Test-Path $file7z) {
    Write-Host "Removing old archive..." -ForegroundColor Gray
    Remove-Item $file7z -Force
}

Write-Host "Cleanup completed!" -ForegroundColor Green
Write-Host ""

# [1/3] Build and Pack
Write-Host "[1/3] Building and packing..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1 
}

# Run pack but don't fail on code signing errors
# win-unpacked 폴더가 새로 생성됨
npm run pack 2>&1 | Out-Null

# Check if win-unpacked exists (the important part)
if (!(Test-Path $winUnpacked)) {
    Write-Host "Error: Build directory not found!" -ForegroundColor Red
    exit 1
}
Write-Host "Build completed!" -ForegroundColor Green
Write-Host ""

# [2/3] Create pms-core structure
Write-Host "[2/3] Creating pms-core structure..." -ForegroundColor Cyan

# win-unpacked를 pms-core로 이름 변경 (이동)
Move-Item $winUnpacked $pmsCore -Force

Write-Host "pms-core directory created!" -ForegroundColor Green
Write-Host ""

# [3/3] Create 7z archive
Write-Host "[3/3] Creating 7z archive..." -ForegroundColor Cyan

# Create 7z with pms-core folder structure
Push-Location $packageRoot
& "..\$sevenZip" a -t7z -mx9 "pms-core_v$version.7z" "pms-core" -r
$exitCode = $LASTEXITCODE
Pop-Location

if ($exitCode -eq 0 -and (Test-Path $file7z)) {
    $size = (Get-Item $file7z).Length / 1MB
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Packaging Completed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Package: $file7z" -ForegroundColor Yellow
    Write-Host "Size: $("{0:N2}" -f $size) MB" -ForegroundColor Yellow
    Write-Host "Structure: pms-core/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Contents:" -ForegroundColor Cyan
    Write-Host "- pms-core/" -ForegroundColor White
    Write-Host "  - 기여도 평가 점수 프로그램.exe" -ForegroundColor White
    Write-Host "  - resources/" -ForegroundColor White
    Write-Host "  - locales/" -ForegroundColor White
    Write-Host "  - ..." -ForegroundColor White
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Cyan
    Write-Host "1. Extract pms-core_v$version.7z" -ForegroundColor White
    Write-Host "2. Run pms-core/기여도 평가 점수 프로그램.exe" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Error: Failed to create 7z file" -ForegroundColor Red
    exit 1
}