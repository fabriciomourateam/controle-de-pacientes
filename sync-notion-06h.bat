@echo off
echo ========================================
echo   SINCRONIZACAO NOTION - 06:00
echo ========================================
echo Data/Hora: %date% %time%
echo.

cd /d "C:\Users\fhbom\CONTROLE DE PACIENTES\controle-de-pacientes"

echo Iniciando sincronizacao...
node sync-notion-scheduled.js

echo.
echo Sincronizacao finalizada!
echo ========================================
