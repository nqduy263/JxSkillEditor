param(
    [Parameter(Mandatory=$true)][string]$Stage,
    [Parameter(Mandatory=$true)][string]$Target,
    [Parameter(Mandatory=$true)][int]$ProcessId,
    [switch]$NoLaunch
)
$ErrorActionPreference = 'Stop'
$targetPath = (Resolve-Path -LiteralPath $Target).Path.TrimEnd('\')
$stagePath = (Resolve-Path -LiteralPath $Stage).Path.TrimEnd('\')
$updates = Join-Path $targetPath '.updates'
if (!$stagePath.StartsWith(($updates + '\'), [StringComparison]::OrdinalIgnoreCase)) { throw 'Stage outside .updates' }
if (!(Test-Path -LiteralPath (Join-Path $stagePath 'JXSkillStudio.exe'))) { throw 'Stage missing EXE' }
$items = @(Get-ChildItem -LiteralPath $stagePath -Force)
foreach ($item in $items) {
    if ($item.Name -in @('Data','.updates','.git')) { throw ('Protected item in update: ' + $item.Name) }
}
try { Wait-Process -Id $ProcessId -Timeout 120 -ErrorAction Stop } catch {
    if (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue) { throw 'Application did not exit within 120 seconds' }
}
$backup = Join-Path $updates ('backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
$failed = Join-Path $updates ('failed-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
$installed = @()
try {
    foreach ($item in $items) {
        $dest = Join-Path $targetPath $item.Name
        if (Test-Path -LiteralPath $dest) { Move-Item -LiteralPath $dest -Destination (Join-Path $backup $item.Name) -Force }
        Move-Item -LiteralPath $item.FullName -Destination $dest -Force
        $installed += $item.Name
    }
    $exe = Join-Path $targetPath 'JXSkillStudio.exe'
    if (!(Test-Path -LiteralPath $exe)) { throw 'Updated EXE missing' }
    if (!$NoLaunch) { Start-Process -FilePath $exe -WorkingDirectory $targetPath }
    ('Installed at ' + (Get-Date -Format o)) | Set-Content -LiteralPath (Join-Path $updates 'last-update.txt') -Encoding UTF8
} catch {
    New-Item -ItemType Directory -Path $failed -Force | Out-Null
    foreach ($name in $installed) {
        $dest = Join-Path $targetPath $name
        if (Test-Path -LiteralPath $dest) { Move-Item -LiteralPath $dest -Destination (Join-Path $failed $name) -Force }
    }
    Get-ChildItem -LiteralPath $backup -Force | ForEach-Object {
        Move-Item -LiteralPath $_.FullName -Destination (Join-Path $targetPath $_.Name) -Force
    }
    $_.Exception.ToString() | Set-Content -LiteralPath (Join-Path $updates 'update-error.txt') -Encoding UTF8
    throw
}
