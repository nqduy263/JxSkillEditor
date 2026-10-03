using System.Diagnostics;
using System.IO.Compression;
using System.Net;
using System.Security.Cryptography;
using System.Text.Json;

namespace JXSkillStudio;

internal sealed record UpdateRelease(Version Version, Uri DownloadUrl, string Sha256);
internal sealed record PreparedUpdate(Version Version, string StageDirectory);

internal static class UpdateService
{
    internal const string CurrentVersion = "0.6.2";
    private const string Repository = "nqduy263/JxSkillEditor";
    private const long MaximumZipBytes = 1_500_000_000;
    private static readonly TimeSpan DownloadReadIdleTimeout = TimeSpan.FromSeconds(60);
    private static readonly HttpClient Http = CreateClient();

    private static HttpClient CreateClient()
    {
        var client = new HttpClient { Timeout = TimeSpan.FromMinutes(20) };
        client.DefaultRequestHeaders.UserAgent.ParseAdd("JXSkillStudio/" + CurrentVersion);
        client.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");
        return client;
    }

    internal static UpdateRelease? ParseRelease(string json)
    {
        using var document = JsonDocument.Parse(json);
        var root = document.RootElement;
        if (root.GetProperty("draft").GetBoolean() || root.GetProperty("prerelease").GetBoolean()) return null;
        var tag = root.GetProperty("tag_name").GetString() ?? "";
        if (!Version.TryParse(tag.TrimStart('v', 'V'), out var version) || version <= Version.Parse(CurrentVersion)) return null;
        var wanted = $"JXSkillStudio-{version}-win-x64-Full.zip";
        foreach (var asset in root.GetProperty("assets").EnumerateArray())
        {
            if (asset.GetProperty("name").GetString() != wanted) continue;
            var digest = asset.TryGetProperty("digest", out var d) ? d.GetString() : null;
            if (digest is not { Length: 71 } || !digest.StartsWith("sha256:", StringComparison.OrdinalIgnoreCase) ||
                !digest[7..].All(Uri.IsHexDigit)) throw new InvalidDataException("Release thiếu SHA-256 hợp lệ của gói cập nhật.");
            var url = new Uri(asset.GetProperty("browser_download_url").GetString()!);
            if (url.Scheme != Uri.UriSchemeHttps || url.Host != "github.com" ||
                !url.AbsolutePath.StartsWith($"/{Repository}/releases/download/", StringComparison.OrdinalIgnoreCase) ||
                !url.AbsolutePath.EndsWith("/" + wanted, StringComparison.Ordinal))
                throw new InvalidDataException("Đường dẫn tải release không thuộc repository chính thức.");
            return new UpdateRelease(version, url, digest[7..].ToUpperInvariant());
        }
        throw new InvalidDataException("Release mới chưa có gói Windows Full đúng phiên bản.");
    }

    internal static async Task<UpdateRelease?> CheckAsync()
    {
        using var limit = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        using var response = await Http.GetAsync($"https://api.github.com/repos/{Repository}/releases/latest", limit.Token);
        if (response.StatusCode == HttpStatusCode.NotFound) return null;
        response.EnsureSuccessStatusCode();
        return ParseRelease(await response.Content.ReadAsStringAsync(limit.Token));
    }

    internal static async Task<PreparedUpdate> DownloadAsync(UpdateRelease release, string appDirectory, Action<long, long?>? progress = null)
    {
        var updateRoot = Path.Combine(appDirectory, ".updates");
        Directory.CreateDirectory(updateRoot);
        var unique = Guid.NewGuid().ToString("N");
        var archive = Path.Combine(updateRoot, "download-" + unique + ".zip");
        var stage = Path.Combine(updateRoot, "stage-" + unique);
        void CleanupPartialUpdate()
        {
            try { if (File.Exists(archive)) File.Delete(archive); } catch { }
            try { if (Directory.Exists(stage)) Directory.Delete(stage, true); } catch { }
        }
        try
        {
            using var limit = new CancellationTokenSource(TimeSpan.FromMinutes(30));
            using (var response = await Http.GetAsync(release.DownloadUrl, HttpCompletionOption.ResponseHeadersRead, limit.Token))
            {
                response.EnsureSuccessStatusCode();
                if (response.Content.Headers.ContentLength > MaximumZipBytes) throw new InvalidDataException("Gói cập nhật vượt giới hạn 1,5 GB.");
                await using var source = await response.Content.ReadAsStreamAsync(limit.Token);
                await using var target = new FileStream(archive, FileMode.CreateNew, FileAccess.Write, FileShare.None);
                var buffer = new byte[128 * 1024]; long received = 0;
                while (true)
                {
                    using var readLimit = CancellationTokenSource.CreateLinkedTokenSource(limit.Token);
                    readLimit.CancelAfter(DownloadReadIdleTimeout);
                    int count;
                    try { count = await source.ReadAsync(buffer.AsMemory(), readLimit.Token); }
                    catch (OperationCanceledException) when (!limit.IsCancellationRequested)
                    { throw new TimeoutException("Máy chủ cập nhật không gửi dữ liệu trong 60 giây."); }
                    if (count == 0) break;
                    received += count;
                    if (received > MaximumZipBytes) throw new InvalidDataException("Gói cập nhật vượt giới hạn 1,5 GB.");
                    await target.WriteAsync(buffer.AsMemory(0, count), limit.Token);
                    progress?.Invoke(received, response.Content.Headers.ContentLength);
                }
            }
            await using var hashInput = File.OpenRead(archive);
            var actual = Convert.ToHexString(await SHA256.HashDataAsync(hashInput, limit.Token));
            if (!actual.Equals(release.Sha256, StringComparison.OrdinalIgnoreCase)) throw new InvalidDataException("SHA-256 gói cập nhật không khớp GitHub release.");
            var expectedFolder = $"JXSkillStudio-{release.Version}-win-x64";
            using (var zip = ZipFile.OpenRead(archive))
            {
                if (zip.Entries.Count > 30_000) throw new InvalidDataException("Gói cập nhật có quá nhiều tệp.");
                long expanded = 0;
                foreach (var entry in zip.Entries)
                {
                    var name = entry.FullName.Replace('\\', '/');
                    if (!name.StartsWith(expectedFolder + "/", StringComparison.Ordinal) ||
                        name.Split('/').Any(part => part is "." or ".." || part.Equals("Data", StringComparison.OrdinalIgnoreCase) || part.Equals(".updates", StringComparison.OrdinalIgnoreCase) || part.Equals(".git", StringComparison.OrdinalIgnoreCase)) ||
                        name.Contains(':')) throw new InvalidDataException("Gói cập nhật chứa đường dẫn không hợp lệ.");
                    expanded = checked(expanded + entry.Length);
                    if (expanded > 3_000_000_000) throw new InvalidDataException("Dung lượng giải nén vượt giới hạn 3 GB.");
                }
            }
            Directory.CreateDirectory(stage);
            ZipFile.ExtractToDirectory(archive, stage);
            var expected = Path.Combine(stage, expectedFolder);
            if (!File.Exists(Path.Combine(expected, "JXSkillStudio.exe")) ||
                !File.Exists(Path.Combine(expected, "ui", "index.html")) ||
                !File.Exists(Path.Combine(expected, "runtime", "msedgewebview2.exe")) ||
                !File.Exists(Path.Combine(expected, "updater.ps1")))
                throw new InvalidDataException("Gói cập nhật thiếu EXE, UI, runtime hoặc updater.");
            File.Delete(archive);
            return new PreparedUpdate(release.Version, expected);
        }
        catch (OperationCanceledException error)
        {
            CleanupPartialUpdate();
            throw new TimeoutException("Tải gói cập nhật quá thời gian cho phép.", error);
        }
        catch
        {
            CleanupPartialUpdate();
            throw;
        }
    }

    internal static void LaunchInstaller(PreparedUpdate update, string appDirectory, int processId)
    {
        var helper = Path.Combine(appDirectory, ".updates", "updater.ps1");
        File.Copy(Path.Combine(appDirectory, "updater.ps1"), helper, true);
        var powershell = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "WindowsPowerShell", "v1.0", "powershell.exe");
        if (!File.Exists(powershell)) throw new FileNotFoundException("Không tìm thấy Windows PowerShell trong System32.", powershell);
        var info = new ProcessStartInfo(powershell) { UseShellExecute = false, CreateNoWindow = true, WorkingDirectory = appDirectory };
        foreach (var arg in new[] { "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", helper,
            "-Stage", update.StageDirectory, "-Target", appDirectory, "-ProcessId", processId.ToString() }) info.ArgumentList.Add(arg);
        if (Process.Start(info) == null) throw new IOException("Không khởi động được updater.");
    }
}
