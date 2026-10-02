using System.Text;
using System.Text.Json;

namespace JXSkillStudio;

internal sealed class WorkspaceStore
{
    internal const int MaxBytes = 32 * 1024 * 1024;
    internal readonly string Root;
    internal string Autosave => Path.Combine(Root, "workspace.autosave.jxworkspace");
    internal string Previous => Path.Combine(Root, "workspace.previous.jxworkspace");
    private readonly SemaphoreSlim writeLock = new(1);

    internal WorkspaceStore(string root)
    {
        Root = Path.GetFullPath(root);
        Directory.CreateDirectory(Root);
        RejectReparsePath(Root);
    }

    internal static void RejectReparsePath(string path)
    {
        for (var item = new DirectoryInfo(Path.GetDirectoryName(Path.GetFullPath(path))!); item != null; item = item.Parent)
            if (item.Exists && (item.Attributes & FileAttributes.ReparsePoint) != 0)
                throw new IOException("Thư mục lưu có liên kết chuyển hướng; hãy chọn thư mục thường.");
        if ((Directory.Exists(path) || File.Exists(path)) && (File.GetAttributes(path) & FileAttributes.ReparsePoint) != 0)
            throw new IOException("Không ghi qua liên kết chuyển hướng.");
    }

    internal static JsonElement Validate(string json, bool allowLegacy = false)
    {
        if (Encoding.UTF8.GetByteCount(json) > MaxBytes) throw new InvalidDataException("Workspace vượt giới hạn 32 MB.");
        using var doc = JsonDocument.Parse(json, new JsonDocumentOptions { MaxDepth = 64 });
        var root = doc.RootElement;
        if (root.ValueKind != JsonValueKind.Object || !root.TryGetProperty("format", out var format)) throw new InvalidDataException("Thiếu định dạng workspace.");
        var f = format.GetString();
        if (f != "jx-skill-studio-workspace/v1" && !(allowLegacy && f is "jx-skill-studio-draft/v0.3" or "jx-skill-studio-draft/v0.4")) throw new InvalidDataException("Phiên bản workspace không được hỗ trợ.");
        foreach (var name in new[] { "skills", "missiles", "formulas", "assets" })
        {
            if (!root.TryGetProperty(name, out var array) || array.ValueKind != JsonValueKind.Array || array.GetArrayLength() > 10000)
                throw new InvalidDataException("Danh sách không hợp lệ: " + name);
        }
        return root.Clone();
    }

    internal static string ReadLimited(string path)
    {
        if (new FileInfo(path).Length > MaxBytes) throw new InvalidDataException("Tệp vượt giới hạn 32 MB.");
        using var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read);
        if (stream.Length > MaxBytes) throw new InvalidDataException("Tệp vượt giới hạn 32 MB.");
        using var reader = new StreamReader(stream, new UTF8Encoding(false, true), false);
        return reader.ReadToEnd().TrimStart('\uFEFF');
    }

    internal object ReadAutosave()
    {
        if (!File.Exists(Autosave))
        {
            if (File.Exists(Previous)) return new { workspace = (JsonElement?)Validate(ReadLimited(Previous)), recovered = true, warning = "Không có bản hiện tại; đã phục hồi bản tự lưu trước đó." };
            return new { workspace = (JsonElement?)null, recovered = false, warning = (string?)null };
        }
        try { return new { workspace = (JsonElement?)Validate(ReadLimited(Autosave)), recovered = false, warning = (string?)null }; }
        catch (Exception e) when (e is IOException or JsonException or InvalidDataException or DecoderFallbackException)
        {
            if (!File.Exists(Previous)) throw new InvalidDataException("Bản tự lưu lỗi, chưa có bản trước để phục hồi. Tệp hiện tại được giữ nguyên.", e);
            return new { workspace = (JsonElement?)Validate(ReadLimited(Previous)), recovered = true, warning = "Đã đọc bản tự lưu trước đó; bản hiện tại bị lỗi và vẫn được giữ để phục hồi." };
        }
    }

    internal async Task<object> WriteAutosaveAsync(string json)
    {
        Validate(json);
        await writeLock.WaitAsync();
        try
        {
            if (File.Exists(Autosave))
            {
                try { Validate(ReadLimited(Autosave)); }
                catch (Exception e) when (e is IOException or JsonException or InvalidDataException or DecoderFallbackException)
                {
                    RejectReparsePath(Autosave);
                    File.Move(Autosave, Path.Combine(Root, "workspace.corrupt_" + DateTime.UtcNow.ToString("yyyyMMdd_HHmmss_fff") + ".jxworkspace"));
                }
            }
            AtomicWrite(Autosave, json, Previous);
            return new { savedAt = DateTimeOffset.Now, path = Autosave };
        }
        finally { writeLock.Release(); }
    }

    internal static void AtomicWrite(string path, string json, string? backup = null)
    {
        var target = Path.GetFullPath(path);
        var directory = Path.GetDirectoryName(target)!;
        Directory.CreateDirectory(directory);
        RejectReparsePath(target);
        if (backup != null) RejectReparsePath(backup);
        var temp = Path.Combine(directory, ".jxwrite_" + Guid.NewGuid().ToString("N") + ".tmp");
        try
        {
            var bytes = new UTF8Encoding(false, true).GetBytes(json);
            using (var stream = new FileStream(temp, FileMode.CreateNew, FileAccess.Write, FileShare.None, 65536, FileOptions.WriteThrough))
            { stream.Write(bytes); stream.Flush(true); }
            if (File.Exists(target)) File.Replace(temp, target, backup); else File.Move(temp, target);
        }
        finally { if (File.Exists(temp)) File.Delete(temp); }
    }
}
