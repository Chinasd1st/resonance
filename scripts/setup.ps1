$ErrorActionPreference = 'Continue'
$root = 'C:\Users\omen\Desktop\Documents\Printing\Resonance'
Set-Location $root
$log = "$root\scripts\setup.log"
& {
  New-Item -ItemType Directory -Force -Path build, build\ref, build\md, build\media, dist, fonts, icc, src | Out-Null
  if (-not (Test-Path package.json)) { npm init -y | Out-Null }
  npm pkg set type=module name=resonance
  $env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1'
  npm i playwright-core katex 2>&1
  python -m pip install --quiet fonttools brotli pypdf 2>&1
  "--- reference render"
  $gs = 'C:\Program Files\gs\gs10.07.1\bin\gswin64c.exe'
  & $gs -q -dNOPAUSE -dBATCH -sDEVICE=png16m -r40 -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -dFirstPage=1 -dLastPage=24 -sOutputFile="$root\build\ref\p%02d.png" "$root\ref\2025-autumn-issue-cn.pdf" 2>&1
  & $gs -q -dNODISPLAY -dNOSAFER -c "($($root.Replace('\','/'))/ref/2025-autumn-issue-cn.pdf) (r) file runpdfbegin pdfpagecount = quit" 2>&1
  "--- gs icc"
  Get-ChildItem 'C:\Program Files\gs\gs10.07.1\iccprofiles' | ForEach-Object Name
  Get-ChildItem 'C:\Program Files\gs\gs10.07.1\lib' -Filter 'PDFX*' | ForEach-Object FullName
  "DONE"
} *>&1 | Out-File -Encoding utf8 $log
