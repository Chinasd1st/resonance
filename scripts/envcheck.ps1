$ErrorActionPreference = 'Continue'
$log = 'C:\Users\omen\Desktop\Documents\Printing\Resonance\scripts\envcheck.log'
& {
  "node: $(node -v)"
  "npm: $(npm -v)"
  "pandoc: $((pandoc -v 2>$null) | Select-Object -First 1)"
  "gs: $(where.exe gswin64c 2>$null)"
  "qpdf: $(where.exe qpdf 2>$null)"
  "magick: $(where.exe magick 2>$null)"
  "python: $(python --version 2>&1)"
  "pymupdf: $(python -c 'import fitz;print(fitz.VersionBind)' 2>&1)"
  "chrome: $(Test-Path 'C:\Program Files\Google\Chrome\Application\chrome.exe')"
  "winget: $(where.exe winget 2>$null)"
  "scoop: $(where.exe scoop 2>$null)"
  "--- fonts"
  Get-ChildItem C:\Windows\Fonts, "$env:LOCALAPPDATA\Microsoft\Windows\Fonts" -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match 'Source|Noto|Google|Han|Product' } | ForEach-Object { $_.FullName }
  "--- icc"
  Get-ChildItem C:\Windows\System32\spool\drivers\color -ErrorAction SilentlyContinue | ForEach-Object { $_.Name }
} *> $log
