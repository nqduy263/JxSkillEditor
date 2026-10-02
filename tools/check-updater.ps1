$ErrorActionPreference = 'Stop'
$studio = Split-Path -Parent $PSScriptRoot
$root = Join-Path $studio ('.test-updater-' + [guid]::NewGuid().ToString('N'))
$stage = Join-Path $root '.updates/stage-test/JXSkillStudio-0.7.0-win-x64'
try {
    New-Item -ItemType Directory -Path (Join-Path $root 'Data'),$stage -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $root 'JXSkillStudio.exe') -Value 'old'
    Set-Content -LiteralPath (Join-Path $root 'Data/workspace.jxworkspace') -Value 'user workspace'
    Set-Content -LiteralPath (Join-Path $stage 'JXSkillStudio.exe') -Value 'new'
    & (Join-Path $studio 'native/SkillStudio.App/updater.ps1') -Stage $stage -Target $root -ProcessId 999999 -NoLaunch
    if ((Get-Content (Join-Path $root 'JXSkillStudio.exe') -Raw).Trim() -ne 'new') { throw 'New EXE missing' }
    if ((Get-Content (Join-Path $root 'Data/workspace.jxworkspace') -Raw).Trim() -ne 'user workspace') { throw 'Workspace changed' }
    $backup = @(Get-ChildItem -LiteralPath (Join-Path $root '.updates') -Directory -Filter 'backup-*')
    if ($backup.Count -ne 1 -or (Get-Content (Join-Path $backup[0].FullName 'JXSkillStudio.exe') -Raw).Trim() -ne 'old') { throw 'Old EXE backup missing' }
    Write-Output 'Updater replacement, backup and Data preservation passed'
} finally {
    $full = [IO.Path]::GetFullPath($root)
    $prefix = [IO.Path]::GetFullPath($studio).TrimEnd('\') + '\.test-updater-'
    if (!$full.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe test cleanup path' }
    if (Test-Path -LiteralPath $full) { Remove-Item -LiteralPath $full -Recurse -Force }
}
