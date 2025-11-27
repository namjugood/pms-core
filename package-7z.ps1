# Package script for v2.0.0 (Versioned Folder Strategy)
$version = "2.0.0"
$packageRoot = "package"
$sevenZip = ".\node_modules\7zip-bin\win\x64\7za.exe"

# [변경됨] 고정된 이름이 아니라 버전을 포함한 폴더명 사용
$dirName = "pms-core_v$version"       # 예: pms-core_v2.0.0
$pmsCore = "$packageRoot\$dirName"    # 전체 경로

$winUnpacked = "$packageRoot\win-unpacked"
$file7z = "$packageRoot\${dirName}.7z" # 압축파일도 버전 따라감
$appName = "pms-core"

# 진행률 표시 헬퍼
function Update-JobProgress {
    param ( [int]$Percent, [string]$Status )
    Write-Progress -Activity "PMS-Core v$version Packaging" -Status $Status -PercentComplete $Percent
}

# 폴더 삭제/이동 함수 (같은 버전을 재빌드할 때를 대비해 유지)
function Nuke-Folder {
    param ([string]$Path)
    if (Test-Path $Path) {
        Write-Host "   Targeting '$Path'..." -NoNewline
        Remove-Item $Path -Recurse -Force -ErrorAction SilentlyContinue
        
        if (Test-Path $Path) {
            cmd /c "rd /s /q `"$Path`"" 2>$null
            if (Test-Path $Path) {
                # 삭제 안 되면 Temp로 이동 (이름 바꾸기 전략)
                $trashPath = "$env:TEMP\pms-trash-" + (Get-Random)
                try {
                    Move-Item -Path $Path -Destination $trashPath -Force -ErrorAction Stop
                    Write-Host " [MOVED to TEMP]" -ForegroundColor Yellow
                } catch {
                    Write-Host " [LOCKED]" -ForegroundColor Red
                    Write-Host "❌ Error: Cannot remove/move existing version folder." -ForegroundColor Red
                    exit 1
                }
            } else { Write-Host " [DELETED]" -ForegroundColor Green }
        } else { Write-Host " [DELETED]" -ForegroundColor Green }
    }
}

# 터미널 위치 안전장치
$absTarget = Resolve-Path $pmsCore -ErrorAction SilentlyContinue
if ($absTarget -and $PWD.Path.StartsWith($absTarget.Path)) {
    Set-Location "$packageRoot\.."
}

Clear-Host
Update-JobProgress -Percent 0 -Status "Initializing..."
Write-Host "========================================" -ForegroundColor Green
Write-Host "PMS-Core Packaging: $dirName" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# [0/4] Process Check
Update-JobProgress -Percent 5 -Status "Checking processes..."
$runningProc = Get-Process -Name $appName -ErrorAction SilentlyContinue
if ($runningProc) {
    Write-Host "⚠️  Killing running app..." -ForegroundColor Yellow
    Stop-Process -Name $appName -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# [1/4] Clean Workspace
Update-JobProgress -Percent 10 -Status "Step 1/4: Preparing workspace..."
Write-Host "[Clean] Clearing target paths..." -ForegroundColor Cyan

# win-unpacked 삭제
Nuke-Folder $winUnpacked

# [중요] '이번 버전'의 폴더만 삭제 시도 (이전 버전 폴더는 건드리지 않음)
if (Test-Path $pmsCore) {
    Write-Host "Found existing build for v$version. Overwriting..." -ForegroundColor Yellow
    Nuke-Folder $pmsCore
}

# 이번 버전의 압축파일 삭제
if (Test-Path $file7z) { Remove-Item $file7z -Force }

# 널브러진 파일 정리
if (Test-Path $packageRoot) {
    Get-ChildItem -Path $packageRoot -Include *.exe, *.dll, *.bin, *.dat -File | Remove-Item -Force
}

# [2/4] Build & Pack
Update-JobProgress -Percent 30 -Status "Step 2/4: Building & Packing..."
Write-Host "[Build] Running npm run build..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed!" -ForegroundColor Red; exit 1 }

Write-Host "[Pack] Running npm run pack..." -ForegroundColor Cyan
npm run pack
if (!(Test-Path $winUnpacked)) {
    Write-Host "Error: 'win-unpacked' creation failed!" -ForegroundColor Red
    exit 1
}

# [3/4] Organize (Versioned Folder)
Update-JobProgress -Percent 60 -Status "Step 3/4: Creating versioned folder..."
Write-Host "[Organize] Renaming to $dirName..." -ForegroundColor Cyan

# win-unpacked -> pms-core_v2.0.0
Move-Item $winUnpacked $pmsCore -Force

# [4/4] Compress
Update-JobProgress -Percent 80 -Status "Step 4/4: Compressing..."
Write-Host "[Compress] Creating 7z archive..." -ForegroundColor Cyan

Push-Location $packageRoot
# 압축 파일 안에 pms-core_v2.0.0 폴더가 들어가도록 설정
& "..\$sevenZip" a -t7z -mx9 "${dirName}.7z" "$dirName" -r
$exitCode = $LASTEXITCODE
Pop-Location

if ($exitCode -eq 0 -and (Test-Path $file7z)) {
    Update-JobProgress -Percent 100 -Status "Done!"
    $size = (Get-Item $file7z).Length / 1MB
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Folder: package\$dirName" -ForegroundColor Cyan
    Write-Host "File:   $file7z" -ForegroundColor Yellow
    Write-Host "Size:   $("{0:N2}" -f $size) MB" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Note: Previous version folders were NOT deleted." -ForegroundColor Gray
    Start-Sleep -Seconds 1
    Write-Progress -Activity "PMS-Core v$version Packaging" -Completed
} else {
    Write-Host "Error: Compression failed" -ForegroundColor Red
    exit 1
}