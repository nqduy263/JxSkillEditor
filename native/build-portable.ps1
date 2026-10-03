param([switch]$Restore)
$ErrorActionPreference = 'Stop'
$studioRoot = Split-Path -Parent $PSScriptRoot
$env:DOTNET_CLI_HOME = Join-Path $studioRoot '.build-home'
$env:NUGET_HTTP_CACHE_PATH = Join-Path $studioRoot '.http-cache'
$env:DOTNET_CLI_TELEMETRY_OPTOUT = '1'
$env:DOTNET_GENERATE_ASPNET_CERTIFICATE = 'false'
$project = Join-Path $PSScriptRoot 'SkillStudio.App/SkillStudio.App.csproj'
$releaseRoot = Join-Path $studioRoot 'releases'
$release = Join-Path $releaseRoot 'JXSkillStudio-0.6.2-win-x64'
if (!(Test-Path -LiteralPath $releaseRoot)) { New-Item -ItemType Directory -Path $releaseRoot -Force | Out-Null }
$resolvedReleaseRoot = [IO.Path]::GetFullPath((Resolve-Path -LiteralPath $releaseRoot).Path).TrimEnd('\') + '\'
$resolvedRelease = [IO.Path]::GetFullPath($release)
if (!$resolvedRelease.StartsWith($resolvedReleaseRoot, [StringComparison]::OrdinalIgnoreCase)) { throw 'Release path escaped releases directory.' }
if (Test-Path -LiteralPath $release) { Remove-Item -LiteralPath $release -Recurse -Force }
if ($Restore) {
    dotnet restore $project --locked-mode --configfile (Join-Path $PSScriptRoot 'NuGet.Config') --nologo
    if ($LASTEXITCODE -ne 0) { throw 'Restore failed' }
}
dotnet publish $project --no-restore --configuration Release --output $release --nologo
if ($LASTEXITCODE -ne 0) { throw 'Publish failed' }
$cab = Join-Path $studioRoot '.downloads/Microsoft.WebView2.FixedVersionRuntime.154.0.4258.48.x64.cab'
if (!(Test-Path -LiteralPath $cab)) { throw 'Thiếu CAB runtime. Xem native/RUNTIME.md để tải đúng nguồn/hash.' }
if ((Get-FileHash -LiteralPath $cab -Algorithm SHA256).Hash -ne 'E2356456A8F02E606A731CD7646A604ED3676A9E392BD867B0207A8C3DC2D4F4') { throw 'Runtime CAB hash mismatch' }
$expanded = Join-Path $studioRoot '.runtime'
$fixed = Join-Path $expanded 'Microsoft.WebView2.FixedVersionRuntime.154.0.4258.48.x64'
if (!(Test-Path -LiteralPath (Join-Path $fixed 'msedgewebview2.exe'))) {
    New-Item -ItemType Directory -Path $expanded -Force | Out-Null
    & "$env:SystemRoot/System32/expand.exe" '-F:*' $cab $expanded > (Join-Path $studioRoot '.downloads/expand-log.txt')
    if ($LASTEXITCODE -ne 0) { throw 'Extract runtime failed' }
}
$signature = Get-AuthenticodeSignature -LiteralPath (Join-Path $fixed 'msedgewebview2.exe')
if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notlike '*Microsoft Corporation*') { throw 'Runtime signature invalid' }
$runtimeTarget = Join-Path $release 'runtime'
New-Item -ItemType Directory -Path $runtimeTarget -Force | Out-Null
Get-ChildItem -LiteralPath $fixed | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $runtimeTarget -Recurse -Force }
$docsTarget = Join-Path $release 'docs'
New-Item -ItemType Directory -Path $docsTarget -Force | Out-Null
foreach ($name in @('MASTER_BUILD.md','MASTER_REPORT.md','HANDOFF.md','REVISION_07.md','REVISION_08.md','THIRD_PARTY.md')) { Copy-Item -LiteralPath (Join-Path $studioRoot $name) -Destination $docsTarget -Force }
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'RUNTIME.md') -Destination $docsTarget -Force
Copy-Item -LiteralPath (Join-Path $studioRoot 'README.md') -Destination $release -Force
Copy-Item -LiteralPath (Join-Path $studioRoot 'licenses') -Destination $docsTarget -Recurse -Force
$evidenceTarget = Join-Path $release 'evidence'
New-Item -ItemType Directory -Path $evidenceTarget -Force | Out-Null
foreach ($name in @('demo-checks.json','workspace-checks.json','resource-checks.json','native-checks.json','native-diagnostics.json','native-discovery.json')) { Copy-Item -LiteralPath (Join-Path $studioRoot ('evidence/' + $name)) -Destination $evidenceTarget -Force }
Write-Output ('Portable ready: ' + $release)
