param([Parameter(ValueFromRemainingArguments=$true)][string[]]$GitArgs)
$ErrorActionPreference = 'Stop'
$git = (Get-Command git -ErrorAction Stop).Source
$exec = (& $git --exec-path).Trim()
$candidates = @(
    (Join-Path $exec 'git-remote-https.exe'),
    (Join-Path (Split-Path (Split-Path $exec -Parent) -Parent) 'bin\git-remote-https.exe')
)
$helper = $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (!$helper) { throw "git-remote-https.exe not found. Checked: $($candidates -join '; ')" }
$env:GIT_EXEC_PATH = Split-Path -Parent $helper
Write-Verbose "Using HTTPS remote helper: $helper"
& $git @GitArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
