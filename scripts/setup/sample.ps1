# 抽样构建 + 逐页渲图，用于调版式时的快速目检（不跑全书）。
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $root
New-Item -ItemType Directory -Force -Path build\logs | Out-Null
& {
  node scripts\build.mjs --only 1-1,1-5,2-2 2>&1
  "--- preview"
  New-Item -ItemType Directory -Force build\preview | Out-Null
  Remove-Item build\preview\*.png -ErrorAction SilentlyContinue
  & 'C:\Program Files\gs\gs10.07.1\bin\gswin64c.exe' -q -dNOPAUSE -dBATCH -sDEVICE=png16m -r60 -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -sOutputFile="$root\build\preview\s%02d.png" "$root\dist\resonance-screen.pdf" 2>&1
  & 'C:\Program Files\gs\gs10.07.1\bin\gswin64c.exe' -q -dNOPAUSE -dBATCH -sDEVICE=png16m -r130 -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -sOutputFile="$root\build\preview\h%02d.png" "$root\dist\resonance-screen.pdf" 2>&1
  "EXIT DONE"
} *>&1 | Out-File -Encoding utf8 (Join-Path $root 'build\logs\sample.log')
