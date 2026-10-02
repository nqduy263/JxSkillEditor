param([Parameter(Mandatory=$true)][string]$Version)
$ErrorActionPreference = 'Stop'
$studio = Split-Path -Parent $PSScriptRoot
$assetName = "JXSkillStudio-$Version-win-x64-Full.zip"
$assetPath = Join-Path $studio "releases/$assetName"
if (!(Test-Path -LiteralPath $assetPath)) { throw "Missing $assetName" }
$credentialLines = "protocol=https`nhost=github.com`n`n" | git credential fill
$secretLine = $credentialLines | Where-Object { $_ -like 'password=*' } | Select-Object -First 1
if (!$secretLine) { throw 'GitHub credential unavailable' }
$token = $secretLine.Substring(9)
$credentialLines = $null
$client = [System.Net.Http.HttpClient]::new()
$client.Timeout = [Threading.Timeout]::InfiniteTimeSpan
$client.DefaultRequestHeaders.UserAgent.ParseAdd('JXSkillStudioRelease/1.0')
$client.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer',$token)
$client.DefaultRequestHeaders.Accept.ParseAdd('application/vnd.github+json')
$token = $null
function SendJson([string]$method,[string]$url,[object]$body) {
    $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::new($method),$url)
    if ($null -ne $body) { $request.Content = [System.Net.Http.StringContent]::new(($body | ConvertTo-Json -Depth 10),'utf8','application/json') }
    try {
        $response = $client.SendAsync($request).GetAwaiter().GetResult()
        $raw = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        if (!$response.IsSuccessStatusCode) { throw "GitHub API $($response.StatusCode): $raw" }
        return $raw | ConvertFrom-Json
    } finally { $request.Dispose(); if ($response) { $response.Dispose() } }
}
try {
    $tag = "v$Version"
    $api = 'https://api.github.com/repos/nqduy263/JxSkillEditor'
    $release = $null
    $lookup = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Get,"$api/releases/tags/$tag")
    try {
        $reply = $client.SendAsync($lookup).GetAwaiter().GetResult()
        if ($reply.IsSuccessStatusCode) { $release = ($reply.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json) }
        elseif ([int]$reply.StatusCode -ne 404) { throw "Release lookup failed: $($reply.StatusCode)" }
    } finally { $lookup.Dispose(); if ($reply) { $reply.Dispose() } }
    if (!$release) {
        $notes = "JX Skill Studio $Version portable Windows. Includes startup GitHub update check, SHA-256 verification, in-place update with Data preservation and automatic restart. See REVISION_06.md."
        $release = SendJson 'POST' "$api/releases" @{ tag_name=$tag; target_commitish='main'; name="JX Skill Studio $Version"; body=$notes; draft=$false; prerelease=$false }
    }
    if ($release.tag_name -ne $tag) { throw 'Release tag mismatch' }
    $asset = @($release.assets | Where-Object { $_.name -eq $assetName }) | Select-Object -First 1
    $expected = (Get-FileHash -LiteralPath $assetPath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($asset) {
        if ($asset.digest -ne "sha256:$expected") { throw 'Existing release asset digest mismatch' }
    } else {
        $upload = $release.upload_url.Split('{')[0] + '?name=' + [Uri]::EscapeDataString($assetName)
        if (!$upload.StartsWith('https://uploads.github.com/repos/nqduy263/JxSkillEditor/releases/',[StringComparison]::OrdinalIgnoreCase)) { throw 'Unexpected upload URL' }
        $file = [IO.File]::OpenRead($assetPath)
        $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Post,$upload)
        $request.Content = [System.Net.Http.StreamContent]::new($file)
        $request.Content.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::new('application/zip')
        try {
            $response = $client.SendAsync($request).GetAwaiter().GetResult()
            $raw = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
            if (!$response.IsSuccessStatusCode) { throw "GitHub asset upload $($response.StatusCode): $raw" }
            $asset = $raw | ConvertFrom-Json
        } finally { $request.Dispose(); if ($response) { $response.Dispose() }; $file.Dispose() }
        if ($asset.digest -ne "sha256:$expected") { throw 'Uploaded asset digest mismatch' }
    }
    Write-Output $release.html_url
    Write-Output $asset.browser_download_url
    Write-Output ("sha256:$expected")
} finally { $client.Dispose() }
