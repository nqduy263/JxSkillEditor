using System.Text.Json;
using Microsoft.Web.WebView2.Core;

namespace JXSkillStudio;

internal static class Program
{
    [STAThread]
    private static int Main(string[] args)
    {
        if (args.Contains("--self-test")) return SelfTests.Run(args);
        if (args.Contains("--discover"))
        {
            var result = Discovery.ScanAsync().GetAwaiter().GetResult();
            var outputIndex = Array.IndexOf(args, "--output");
            var outputPath = outputIndex >= 0 && outputIndex + 1 < args.Length ? args[outputIndex + 1] : Path.Combine(AppContext.BaseDirectory, "discovery.json");
            WorkspaceStore.AtomicWrite(outputPath, JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true }));
            return 0;
        }
        if (args.Contains("--diagnose"))
        {
            string? version = null, error = null;
            var fixedFolder = Path.Combine(AppContext.BaseDirectory, "runtime");
            try { version = CoreWebView2Environment.GetAvailableBrowserVersionString(File.Exists(Path.Combine(fixedFolder, "msedgewebview2.exe")) ? fixedFolder : null); }
            catch (Exception e) { error = e.Message; }
            var report = new { appVersion = "0.6.0", architecture = System.Runtime.InteropServices.RuntimeInformation.ProcessArchitecture.ToString(), netRuntime = Environment.Version.ToString(), webViewVersion = version, error, uiPresent = File.Exists(Path.Combine(AppContext.BaseDirectory, "ui", "index.html")), fixedRuntime = File.Exists(Path.Combine(fixedFolder, "msedgewebview2.exe")), guiTested = false };
            var index = Array.IndexOf(args, "--output");
            var output = index >= 0 && index + 1 < args.Length ? args[index + 1] : Path.Combine(AppContext.BaseDirectory, "diagnostics.json");
            WorkspaceStore.AtomicWrite(output, JsonSerializer.Serialize(report, new JsonSerializerOptions { WriteIndented = true }));
            return error == null ? 0 : 1;
        }
        ApplicationConfiguration.Initialize();
        try
        {
            var store = new WorkspaceStore(Path.Combine(AppContext.BaseDirectory, "Data"));
            using var lease = new FileStream(Path.Combine(store.Root, "workspace.lock"), FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None);
            Application.Run(new MainForm(store));
            return 0;
        }
        catch (Exception e)
        {
            MessageBox.Show("Không mở được workspace portable. Hãy giải nén vào thư mục có quyền ghi và đóng bản ứng dụng đang dùng cùng thư mục.\n\n" + e.Message, "JX Skill Studio", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
    }
}
