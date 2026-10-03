param([switch]$KeepOpen)
$ErrorActionPreference = 'Stop'
$studio = Split-Path -Parent $PSScriptRoot
$exe = Join-Path $studio 'releases/JXSkillStudio-0.6.2-win-x64/JXSkillStudio.exe'
if (!(Test-Path -LiteralPath $exe)) { throw "Portable EXE missing: $exe" }
$started = Start-Process -FilePath $exe -PassThru
try {
    $deadline = (Get-Date).AddSeconds(15)
    do {
        Start-Sleep -Milliseconds 250
        $started.Refresh()
    } while (!$started.HasExited -and $started.MainWindowHandle -eq 0 -and (Get-Date) -lt $deadline)
    if ($started.HasExited) { throw "Portable EXE exited with code $($started.ExitCode)" }
    if ($started.MainWindowHandle -eq 0) { throw 'Portable EXE did not expose a main window within 15 seconds' }
    if (!$started.Responding) { throw 'Portable EXE main window is not responding' }
    $result = [ordered]@{
        checkedAt = (Get-Date).ToUniversalTime().ToString('o')
        executable = $exe
        processId = $started.Id
        mainWindowHandle = [int64]$started.MainWindowHandle
        responding = $started.Responding
        visualQa = 'not-available-in-current-computer-use-session'
        pass = $true
    }
    $out = Join-Path $studio 'evidence/native-smoke-checks.json'
    $result | ConvertTo-Json | Set-Content -LiteralPath $out -Encoding utf8
    $result | ConvertTo-Json
} finally {
    if (!$KeepOpen -and !$started.HasExited) { $started.CloseMainWindow(); Start-Sleep -Milliseconds 500; if (!$started.HasExited) { $started.Kill() } }
}
