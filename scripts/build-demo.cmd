@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-demo.ps1" %*
if errorlevel 1 pause
