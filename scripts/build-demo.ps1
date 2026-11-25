# 生成带水印的 demo 版 PDF（右键 →「使用 PowerShell 运行」，或双击 build-demo.cmd）
#   - 不给参数：拿现有的 dist/resonance-print-rgb.pdf 压水印，几秒出结果
#   - 传 -Rebuild：先重新排版全书（约 2 分钟），再压水印
param([switch]$Rebuild, [switch]$NoOpen)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)

# Python（pypdf）——装在本机用户目录时没进 PATH，手动补上
foreach ($v in 'Python312', 'Python313', 'Python311') {
  $p = Join-Path $env:LOCALAPPDATA "Programs\Python\$v"
  if (Test-Path $p) { $env:PATH = "$p;$env:PATH"; break }
}

$argv = @('scripts/build-demo.mjs')
if ($Rebuild) { $argv += '--rebuild' }
if ($NoOpen) { $argv += '--no-open' }

node @argv
if ($LASTEXITCODE -ne 0) { throw "生成失败（exit $LASTEXITCODE）" }
if (-not $NoOpen) { Start-Process (Join-Path $PWD 'dist\resonance-demo.pdf') }
