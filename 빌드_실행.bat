@echo off
chcp 65001 >nul
echo ╔════════════════════════════════════════════════╗
echo ║  기여도 평가 점수 프로그램 - 빌드 스크립트   ║
echo ╚════════════════════════════════════════════════╝
echo.

echo [1/3] TypeScript 컴파일 및 파일 준비 중...
call node build.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ 빌드 실패: TypeScript 컴파일 오류
    pause
    exit /b 1
)

echo.
echo [2/3] Electron 앱 패키징 중...
echo (이 작업은 몇 분이 걸릴 수 있습니다)
call npx electron-builder
if %errorlevel% neq 0 (
    echo.
    echo ❌ 빌드 실패: electron-builder 오류
    pause
    exit /b 1
)

echo.
echo ╔════════════════════════════════════════════════╗
echo ║           ✅ 빌드 완료!                        ║
echo ╚════════════════════════════════════════════════╝
echo.
echo 생성된 파일:
echo   📁 release\기여도 평가 점수 프로그램 1.0.0.exe (포터블 버전)
echo.
echo release 폴더를 열어 확인하세요.
echo.
pause

