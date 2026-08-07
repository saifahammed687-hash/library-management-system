@echo off
REM This script always works from its own folder automatically.
cd /d "%~dp0"
echo ============================================
echo Working folder: %cd%
echo ============================================
echo.

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo Setting up Git for the first time in this folder...
  git init
  git branch -M main
)

git remote get-url origin >nul 2>&1
if errorlevel 1 (
  echo Connecting to GitHub repository...
  git remote add origin https://github.com/saifahammed687-hash/library-management-system.git
)

echo.
echo Adding and committing changes...
git add .
git commit -m "Update library system"

echo.
echo Pushing to GitHub...
git push -u origin main --force

echo.
echo ============================================
echo DONE. Scroll up to check for any red errors.
echo ============================================
pause
