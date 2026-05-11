@echo off
chcp 65001 > nul

echo ================================
echo  LOP 빌드 시작
echo ================================
echo.

:: [1] Next.js 빌드
echo [1/3] Next.js 빌드 중...
cd /d C:\Development\3_LOP\lop
call npm run build
if errorlevel 1 (
    echo.
    echo [오류] Next.js 빌드 실패
    pause
    exit /b 1
)

:: lop\out 폴더 확인
if not exist "C:\Development\3_LOP\lop\out" (
    echo.
    echo [오류] lop\out 폴더가 없습니다. Next.js 빌드를 확인하세요.
    pause
    exit /b 1
)

:: [2] electron\dist 갱신 (robocopy /MIR = 완전 동기화)
echo.
echo [2/3] 빌드 결과물 동기화 중...
robocopy C:\Development\3_LOP\lop\out C:\Development\3_LOP\electron\dist /MIR /NFL /NDL /NJH /NJS /nc /ns /np
if errorlevel 8 (
    echo.
    echo [오류] 파일 동기화 실패
    pause
    exit /b 1
)

:: [3] electron-builder
echo.
echo [3/3] exe 생성 중...
cd /d C:\Development\3_LOP\electron
call npx electron-builder --win --x64
if errorlevel 1 (
    echo.
    echo [오류] exe 빌드 실패
    pause
    exit /b 1
)

echo.
echo ================================
echo  완료!
echo  C:\Development\3_LOP\release\lop_v0.4.0_portable.exe
echo ================================
pause
