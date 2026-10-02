using System.Diagnostics;
using System.Text;
using System.Runtime.InteropServices;
using Microsoft.Win32.SafeHandles;

namespace JXSkillStudio;

internal static class Discovery
{
    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern SafeProcessHandle OpenProcess(uint access, bool inheritHandle, int processId);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool QueryFullProcessImageName(SafeProcessHandle process, uint flags, StringBuilder path, ref int size);

    private static string ExecutablePath(int processId)
    {
        using var handle = OpenProcess(0x1000, false, processId); // PROCESS_QUERY_LIMITED_INFORMATION; no memory read.
        if (handle.IsInvalid) throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
        var path = new StringBuilder(32768); var size = path.Capacity;
        if (!QueryFullProcessImageName(handle, 0, path, ref size)) throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
        return path.ToString();
    }

    internal static async Task<object> ScanAsync()
    {
        var clients = new List<object>();
        foreach (var name in new[] { "game", "game_offline", "s3client", "jxclient" })
        foreach (var process in Process.GetProcessesByName(name))
        using (process)
        {
            try
            {
                var executable = ExecutablePath(process.Id);
                var root = executable == null ? null : Path.GetDirectoryName(executable);
                var skills = root == null ? null : Path.Combine(root, "settings", "skills.txt");
                var schema = skills != null && File.Exists(skills) && File.ReadLines(skills, Encoding.Latin1).FirstOrDefault()?.Contains("SkillId\t") == true;
                clients.Add(new { process.Id, name, executable, root, schemaMatched = schema, error = (string?)null });
            }
            catch (Exception e) when (e is System.ComponentModel.Win32Exception or InvalidOperationException or IOException or UnauthorizedAccessException)
            { clients.Add(new { process.Id, name, executable = (string?)null, root = (string?)null, schemaMatched = false, error = "Không đọc được đường dẫn tiến trình: " + e.GetType().Name }); }
        }
        var wsl = await WslListAsync();
        return new { observedAt = DateTimeOffset.Now, clients, wsl, note = "Quét chỉ đọc; chưa nạp snapshot mới hoặc kết nối SSH." };
    }

    private static async Task<object> WslListAsync()
    {
        var executable = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows), "System32", "wsl.exe");
        if (!File.Exists(executable)) return new { available = false, text = "WSL chưa có trên máy." };
        using var process = new Process { StartInfo = new ProcessStartInfo(executable) { UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true, StandardOutputEncoding = Encoding.Unicode, StandardErrorEncoding = Encoding.Unicode } };
        process.StartInfo.ArgumentList.Add("--list"); process.StartInfo.ArgumentList.Add("--verbose");
        try
        {
            process.Start();
            var stdout = process.StandardOutput.ReadToEndAsync(); var stderr = process.StandardError.ReadToEndAsync();
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(8));
            await process.WaitForExitAsync(timeout.Token);
            var output = (await stdout).Replace("\0", "").Trim();
            var errors = (await stderr).Replace("\0", "").Trim();
            var detail = process.ExitCode == 0 ? output : string.Join("\n", new[] { output, errors }.Where(s => s.Length > 0));
            return new { available = process.ExitCode == 0, exitCode = process.ExitCode, text = detail.Length > 0 ? detail : "WSL không trả nội dung (exit code " + process.ExitCode + ")." };
        }
        catch (OperationCanceledException) { try { process.Kill(true); } catch { } return new { available = false, text = "WSL chưa trả lời sau 8 giây." }; }
        catch (System.ComponentModel.Win32Exception) { return new { available = false, text = "Không gọi được WSL trong quyền hiện tại." }; }
    }
}
