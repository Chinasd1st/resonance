# 备字体 + 抓 ICC。字体文件是仓库外唯一必须手工备的料（见 AGENTS.md §2）。
$ErrorActionPreference = 'Continue'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $root
New-Item -ItemType Directory -Force -Path build\logs | Out-Null
& {
  python scripts\setup\fonts.py 2>&1
  "--- icc"
  try {
    Invoke-WebRequest -UseBasicParsing -TimeoutSec 60 -Uri 'https://www.eci.org/_media/downloads/icc_profiles_from_eci/eci_offset_2009.zip' -OutFile build\eci.zip
    Expand-Archive -Force build\eci.zip build\eci
    Get-ChildItem build\eci -Recurse -Filter *.icc | ForEach-Object { $_.FullName }
    $p = Get-ChildItem build\eci -Recurse -Filter 'ISOcoated_v2_300_eci.icc' | Select-Object -First 1
    if ($p) { Copy-Item $p.FullName icc\ISOcoated_v2_300_eci.icc -Force; "ICC OK" }
  } catch { "ICC download failed: $_" }
  Copy-Item 'C:\Program Files\gs\gs10.07.1\iccprofiles\srgb.icc' icc\sRGB.icc -Force
  Copy-Item 'C:\Program Files\gs\gs10.07.1\iccprofiles\default_cmyk.icc' icc\gs_default_cmyk.icc -Force
  Copy-Item 'C:\Program Files\gs\gs10.07.1\lib\PDFX_def.ps' build\PDFX_def.orig.ps -Force
  & 'C:\Program Files\gs\gs10.07.1\bin\gswin64c.exe' -h 2>&1 | Select-Object -First 3
  "DONE"
} *>&1 | Out-File -Encoding utf8 (Join-Path $root 'build\logs\fonts.log')
