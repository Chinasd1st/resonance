# docx → HTML 片段（pandoc）。只在稿子改动后才需要重跑：build/html 是派生缓存，与 docx 没有自动比对。
# 用法：powershell -File scripts/setup/convert.ps1
$ErrorActionPreference = 'Continue'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $root
New-Item -ItemType Directory -Force -Path build\logs | Out-Null
$log = Join-Path $root 'build\logs\convert.log'
& {
  New-Item -ItemType Directory -Force -Path build\html, build\md, build\media | Out-Null
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  Get-ChildItem docs -Filter *.docx | ForEach-Object {
    $id = ($_.BaseName -split '_')[0]
    $media = "build/media/$id"
    pandoc $_.FullName -f docx+styles -t html5 --katex --wrap=none --extract-media=$media -o "build/html/$id.html" 2>&1
    pandoc $_.FullName -f docx -t gfm --wrap=none -o "build/md/$id.md" 2>&1
    # pandoc 只导出它在正文里真的引用到的图。原稿把一批图放在浮动图形里
    # （mc:AlternateContent + wps:wsp 的 blipFill），它看不见，于是这些图不进
    # build/media，而 patches.mjs 又要按文件名引用它们（2-10 的八图图版）。
    # 所以整包 word/media 都解出来：文件名与 pandoc 的一致，重复的解压会覆盖同一份。
    New-Item -ItemType Directory -Force -Path "$media/media" | Out-Null
    $zip = [System.IO.Compression.ZipFile]::OpenRead($_.FullName)
    foreach ($e in $zip.Entries) {
      if ($e.FullName -like 'word/media/*' -and $e.Length -gt 0) {
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($e, (Join-Path "$media/media" ([System.IO.Path]::GetFileName($e.FullName))), $true)
      }
    }
    $zip.Dispose()
    "$id OK"
  }
  "--- media"
  Get-ChildItem build\media -Recurse -File | ForEach-Object { "$($_.FullName.Replace($root,'')) $($_.Length)" }
  "DONE"
} *>&1 | Out-File -Encoding utf8 $log
