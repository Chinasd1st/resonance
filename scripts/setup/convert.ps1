# docx → HTML 片段（pandoc）。只在稿子改动后才需要重跑：build/html 是派生缓存，与 docx 没有自动比对。
# 用法：powershell -File scripts/setup/convert.ps1
$ErrorActionPreference = 'Continue'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $root
New-Item -ItemType Directory -Force -Path build\logs | Out-Null
$log = Join-Path $root 'build\logs\convert.log'
& {
  New-Item -ItemType Directory -Force -Path build\html, build\md, build\media | Out-Null
  Get-ChildItem docs -Filter *.docx | ForEach-Object {
    $id = ($_.BaseName -split '_')[0]
    $media = "build/media/$id"
    pandoc $_.FullName -f docx+styles -t html5 --katex --wrap=none --extract-media=$media -o "build/html/$id.html" 2>&1
    pandoc $_.FullName -f docx -t gfm --wrap=none -o "build/md/$id.md" 2>&1
    "$id OK"
  }
  "--- media"
  Get-ChildItem build\media -Recurse -File | ForEach-Object { "$($_.FullName.Replace($root,'')) $($_.Length)" }
  "DONE"
} *>&1 | Out-File -Encoding utf8 $log
