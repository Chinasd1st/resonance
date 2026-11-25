$ErrorActionPreference = 'Continue'
$root = 'C:\Users\omen\Desktop\Documents\Printing\Resonance'
Set-Location $root
$log = "$root\scripts\convert.log"
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
