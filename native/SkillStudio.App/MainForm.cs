using System.Text.Json;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace JXSkillStudio;

internal sealed class MainForm : Form
{
    private const string Origin = "https://skillstudio.invalid";
    private readonly WebView2 browser = new() { Dock = DockStyle.Fill, DefaultBackgroundColor = Color.FromArgb(9, 20, 17) };
    private readonly WorkspaceStore store;
    private bool ready, closeReady, closePending, updateChecked;
    private PreparedUpdate? preparedUpdate;
    private readonly System.Windows.Forms.Timer closeTimer = new() { Interval = 6000 };
    internal MainForm(WorkspaceStore store)
    {
        this.store = store;
        Text = "JX Skill Studio · " + UpdateService.CurrentVersion;
        Width = 1520; Height = 980; MinimumSize = new Size(960, 640);
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = Color.FromArgb(9, 20, 17);
        try
        {
            var iconPath = Path.Combine(AppContext.BaseDirectory, "app.ico");
            if (File.Exists(iconPath)) Icon = new Icon(iconPath);
            else Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
        }
        catch { }
        Controls.Add(browser);
        Shown += async (_, _) => await InitializeAsync();
        FormClosing += OnClosing;
        FormClosed += (_, _) => { closeTimer.Dispose(); browser.Dispose(); };
        closeTimer.Tick += (_, _) =>
        {
            closeTimer.Stop(); closePending = false;
            if (MessageBox.Show(this, "Chưa nhận được xác nhận lưu bản nháp. Đóng ứng dụng lúc này?", "JX Skill Studio", MessageBoxButtons.YesNo, MessageBoxIcon.Warning) == DialogResult.Yes)
            {
                try
                {
                    if (preparedUpdate != null) UpdateService.LaunchInstaller(preparedUpdate, AppContext.BaseDirectory, Environment.ProcessId);
                    closeReady = true; Close();
                }
                catch (Exception error)
                {
                    preparedUpdate = null;
                    MessageBox.Show(this, "Không thể khởi động trình cập nhật: " + error.Message, "Cập nhật không thành công", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }
            }
        };
    }

    internal static bool IsUiOrigin(string value) => Uri.TryCreate(value, UriKind.Absolute, out var uri) && uri.Scheme == "https" && uri.Host == "skillstudio.invalid" && uri.Port == 443 && string.IsNullOrEmpty(uri.UserInfo);

    private async Task CheckForUpdatesAsync()
    {
        var accepted = false;
        try
        {
            var release = await UpdateService.CheckAsync();
            if (release == null || IsDisposed) return;
            var answer = MessageBox.Show(this,
                $"Đã có JX Skill Studio {release.Version}.\n\nYes: tải, cài vào thư mục portable hiện tại và mở lại bản mới. Workspace trong Data được giữ nguyên.\nNo: tiếp tục dùng bản {UpdateService.CurrentVersion}.",
                "Có phiên bản mới", MessageBoxButtons.YesNo, MessageBoxIcon.Information);
            if (answer != DialogResult.Yes) return;
            accepted = true;
            Text = $"Đang tải bản {release.Version} · 0%";
            var progress = new Progress<long>(value => Text = $"Đang tải bản {release.Version} · {value / 1_000_000} MB");
            preparedUpdate = await UpdateService.DownloadAsync(release, AppContext.BaseDirectory, (received, _) => ((IProgress<long>)progress).Report(received));
            Text = "Đã xác minh SHA-256 · đang lưu workspace và cập nhật";
            Close();
        }
        catch (Exception error)
        {
            if (IsDisposed) return;
            preparedUpdate = null;
            Text = "JX Skill Studio · " + UpdateService.CurrentVersion;
            if (accepted) MessageBox.Show(this, "Không hoàn tất cập nhật: " + error.Message + "\n\nBạn có thể tiếp tục dùng bản hiện tại.",
                "Cập nhật không thành công", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }
    }

    private async Task InitializeAsync()
    {
        try
        {
            var ui = Path.Combine(AppContext.BaseDirectory, "ui");
            if (!File.Exists(Path.Combine(ui, "index.html"))) throw new FileNotFoundException("Thiếu ui/index.html; hãy giải nén toàn bộ gói ứng dụng.");
            var fixedPath = Path.Combine(AppContext.BaseDirectory, "runtime");
            var environment = await CoreWebView2Environment.CreateAsync(File.Exists(Path.Combine(fixedPath, "msedgewebview2.exe")) ? fixedPath : null, Path.Combine(store.Root, "WebView2"));
            await browser.EnsureCoreWebView2Async(environment);
            var core = browser.CoreWebView2;
            core.Settings.AreHostObjectsAllowed = false;
            core.Settings.AreDevToolsEnabled = false;
            core.Settings.AreDefaultContextMenusEnabled = false;
            core.Settings.AreDefaultScriptDialogsEnabled = false;
            core.Settings.IsStatusBarEnabled = false;
            core.Settings.IsWebMessageEnabled = true;
            core.SetVirtualHostNameToFolderMapping("skillstudio.invalid", ui, CoreWebView2HostResourceAccessKind.Deny);
            core.NavigationStarting += (_, e) => { e.Cancel = !IsUiOrigin(e.Uri) || new Uri(e.Uri).AbsolutePath != "/index.html"; };
            core.FrameNavigationStarting += (_, e) => e.Cancel = true;
            core.NewWindowRequested += (_, e) => e.Handled = true;
            core.PermissionRequested += (_, e) => e.State = CoreWebView2PermissionState.Deny;
            core.DownloadStarting += (_, e) => e.Cancel = true;
            core.AddWebResourceRequestedFilter("*", CoreWebView2WebResourceContext.All);
            core.WebResourceRequested += (_, e) =>
            {
                if (!IsUiOrigin(e.Request.Uri) && !e.Request.Uri.StartsWith("data:") && !e.Request.Uri.StartsWith("blob:"))
                    e.Response = environment.CreateWebResourceResponse(Stream.Null, 403, "External requests disabled", "Content-Type: text/plain");
            };
            core.WebMessageReceived += OnMessage;
            core.Navigate(Origin + "/index.html");
        }
        catch (Exception e)
        {
            var message = "Không mở được giao diện: " + e.Message + "\n\nGói Lite cần WebView2 Runtime. Gói Full dùng thư mục runtime đi kèm.";
            MessageBox.Show(this, message, "JX Skill Studio", MessageBoxButtons.OK, MessageBoxIcon.Error);
            closeReady = true; Close();
        }
    }

    private void Reply(string id, object? result, string? error = null)
    {
        if (!IsDisposed && browser.CoreWebView2 != null && IsUiOrigin(browser.CoreWebView2.Source))
            browser.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new { id, ok = error == null, result, error }));
    }

    private async void OnMessage(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        string? id = null;
        try
        {
            if (!IsUiOrigin(e.Source) || !IsUiOrigin(browser.CoreWebView2.Source)) return;
            var json = e.WebMessageAsJson;
            if (json.Length > WorkspaceStore.MaxBytes) throw new InvalidDataException("Yêu cầu vượt giới hạn.");
            using var doc = JsonDocument.Parse(json, new JsonDocumentOptions { MaxDepth = 64 });
            var request = doc.RootElement;
            id = request.GetProperty("id").GetString();
            if (id == null || id.Length > 80) return;
            var action = request.GetProperty("action").GetString();
            var payload = request.TryGetProperty("payload", out var p) ? p : default;
            object? result;
            switch (action)
            {
                case "host.info":
                    ready = true;
                    result = new { version = UpdateService.CurrentVersion, mode = "Windows portable alpha", dataRoot = store.Root, webViewVersion = browser.CoreWebView2.Environment.BrowserVersionString, gameWriteEnabled = false };
                    if (!updateChecked) { updateChecked = true; BeginInvoke(new Action(async () => await CheckForUpdatesAsync())); }
                    break;
                case "workspace.readAutosave": result = store.ReadAutosave(); break;
                case "workspace.writeAutosave": result = await store.WriteAutosaveAsync(payload.GetRawText()); break;
                case "workspace.saveAs": result = SaveWorkspace(payload); break;
                case "workspace.open": result = OpenWorkspace(); break;
                case "draft.export": result = ExportDraft(payload); break;
                case "discovery.scan": result = await Discovery.ScanAsync(); break;
                case "host.closeReady":
                    if (!closePending) throw new InvalidOperationException("Không có yêu cầu đóng.");
                    closeTimer.Stop();
                    try { if (preparedUpdate != null) UpdateService.LaunchInstaller(preparedUpdate, AppContext.BaseDirectory, Environment.ProcessId); }
                    catch { closePending = false; preparedUpdate = null; throw; }
                    closeReady = true; Reply(id, new { closing = true }); Close(); return;
                case "host.closeFailed":
                    closeTimer.Stop(); closePending = false; preparedUpdate = null;
                    MessageBox.Show(this, "Chưa lưu được workspace. Hãy dùng Lưu workspace để giữ bản nháp trước khi đóng.", "JX Skill Studio", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    result = new { closing = false }; break;
                default: throw new InvalidOperationException("Thao tác không được hỗ trợ.");
            }
            Reply(id, result);
        }
        catch (Exception error)
        {
            if (id != null) Reply(id, null, error.Message);
        }
    }

    private object SaveWorkspace(JsonElement payload)
    {
        WorkspaceStore.Validate(payload.GetRawText());
        using var dialog = new SaveFileDialog { Title = "Lưu workspace", Filter = "JX Workspace (*.jxworkspace)|*.jxworkspace", DefaultExt = "jxworkspace", AddExtension = true, InitialDirectory = store.Root, FileName = "SkillWorkspace.jxworkspace" };
        if (dialog.ShowDialog(this) != DialogResult.OK) return new { canceled = true };
        if (!dialog.FileName.EndsWith(".jxworkspace", StringComparison.OrdinalIgnoreCase)) throw new InvalidDataException("Dùng phần mở rộng .jxworkspace.");
        var backup = File.Exists(dialog.FileName) ? dialog.FileName + ".bak_" + DateTime.Now.ToString("yyyyMMdd_HHmmss_fff") : null;
        WorkspaceStore.AtomicWrite(dialog.FileName, payload.GetRawText(), backup);
        return new { canceled = false, path = dialog.FileName };
    }

    private object OpenWorkspace()
    {
        using var dialog = new OpenFileDialog { Title = "Mở workspace hoặc changeset v0.3", Filter = "Workspace / draft (*.jxworkspace;*.json)|*.jxworkspace;*.json", InitialDirectory = store.Root, CheckFileExists = true };
        if (dialog.ShowDialog(this) != DialogResult.OK) return new { canceled = true };
        var payload = WorkspaceStore.Validate(WorkspaceStore.ReadLimited(dialog.FileName), allowLegacy: true);
        return new { canceled = false, workspace = payload, path = dialog.FileName };
    }

    private object ExportDraft(JsonElement payload)
    {
        if (payload.GetProperty("deployable").ValueKind != JsonValueKind.False) throw new InvalidDataException("Bản alpha chỉ xuất draft để duyệt.");
        using var dialog = new SaveFileDialog { Title = "Xuất changeset", Filter = "JSON (*.json)|*.json", DefaultExt = "json", AddExtension = true, InitialDirectory = store.Root, FileName = "jx-skill-draft-v06.json" };
        if (dialog.ShowDialog(this) != DialogResult.OK) return new { canceled = true };
        if (!dialog.FileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase)) throw new InvalidDataException("Dùng phần mở rộng .json.");
        WorkspaceStore.AtomicWrite(dialog.FileName, payload.GetRawText(), File.Exists(dialog.FileName) ? dialog.FileName + ".bak_" + DateTime.Now.ToString("yyyyMMdd_HHmmss_fff") : null);
        return new { canceled = false, path = dialog.FileName };
    }

    private void OnClosing(object? sender, FormClosingEventArgs e)
    {
        if (closeReady || !ready) return;
        e.Cancel = true;
        if (closePending) return;
        closePending = true; closeTimer.Start();
        browser.CoreWebView2.PostWebMessageAsJson("{\"event\":\"host.closing\"}");
    }
}
