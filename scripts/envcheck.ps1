$ErrorActionPreference = 'Continue'
$root = 'C:\Users\omen\Desktop\Documents\Printing\Resonance'
Set-Location $root
$log = "$root\scripts\envcheck.log"

$out = & {
  "== tools"
  "node:    $(node -v 2>$null)"
  "npm:     $(npm -v 2>$null)"
  "pandoc:  $((pandoc -v 2>$null) | Select-Object -First 1)"
  "python:  $(python --version 2>&1)"
  "gs:      $(where.exe gswin64c 2>$null)"
  "chrome:  $(Test-Path 'C:\Program Files\Google\Chrome\Application\chrome.exe')  (CHROME=$env:CHROME)"
  "gs env:  $env:GS"

  "== python packages"
  python -c "import pypdf,pypdfium2;print('pypdf',pypdf.__version__,'| pypdfium2 ok')" 2>&1
  python -c "import fontTools;print('fonttools',fontTools.version)" 2>&1

  "== node modules"
  foreach ($m in 'katex', 'playwright-core') {
    $p = "node_modules\$m\package.json"
    if (Test-Path $p) { "$m $((Get-Content $p -Raw | ConvertFrom-Json).version)" } else { "MISSING $m (run npm install)" }
  }

  "== fonts (20 referenced by src/fonts.css)"
  $need = @(
    'GSF-Text-Regular.ttf', 'GSF-Text-Medium.ttf', 'GSF-Text-Bold.ttf',
    'GSF-Display-Light.ttf', 'GSF-Display-Medium.ttf', 'GSF-Display-Bold.ttf',
    'GSF-Cond-Medium.ttf', 'GSF-Cond-Bold.ttf', 'GSF-Cond-Black.ttf',
    'SourceHanSansSC-Light.otf', 'SourceHanSansSC-Regular.otf', 'SourceHanSansSC-Medium.otf',
    'SourceHanSansSC-Bold.otf', 'SourceHanSansSC-Heavy.otf',
    'NotoSerifCJKsc-Light.otf', 'NotoSerifCJKsc-Regular.otf', 'NotoSerifCJKsc-Medium.otf',
    'NotoSerifCJKsc-SemiBold.otf', 'NotoSerifCJKsc-Bold.otf', 'NotoSerifCJKsc-Black.otf'
  )
  $miss = $need | Where-Object { -not (Test-Path "fonts\$_") }
  "present: $($need.Count - $miss.Count)/$($need.Count)"
  if ($miss) {
    $miss | ForEach-Object { "MISSING fonts\$_" }
    "Missing fonts do NOT fail the build (Chrome falls back silently). See AGENTS.md section 2."
  }

  "== icc"
  foreach ($f in 'icc\sRGB.icc', 'icc\gs_default_cmyk.icc') {
    if (Test-Path $f) { "$f  $((Get-Item $f).Length) B" } else { "MISSING $f" }
  }

  "== build cache"
  "build/html: $((Get-ChildItem build\html -Filter *.html -ErrorAction SilentlyContinue).Count) files"
  "dist:       $((Get-ChildItem dist -Filter *.pdf -ErrorAction SilentlyContinue).Count) pdf"
  "DONE"
} *>&1

$out | Out-File -Encoding utf8 $log
$out
