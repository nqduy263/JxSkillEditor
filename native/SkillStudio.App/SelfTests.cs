using System.Text.Json;

namespace JXSkillStudio;

internal static class SelfTests
{
    internal static int Run(string[] args)
    {
        var outputIndex = Array.IndexOf(args, "--output");
        var output = outputIndex >= 0 && outputIndex + 1 < args.Length ? Path.GetFullPath(args[outputIndex + 1]) : Path.Combine(AppContext.BaseDirectory, "self-tests.json");
        var root = Path.Combine(Path.GetDirectoryName(output)!, "native-test-data", DateTime.UtcNow.ToString("yyyyMMdd_HHmmss_fff"));
        var checks = new List<string>();
        void Check(bool condition, string name) { if (!condition) throw new Exception(name); checks.Add(name); }
        try
        {
            var store = new WorkspaceStore(root);
            string Payload(string name) => JsonSerializer.Serialize(new { format = "jx-skill-studio-workspace/v1", snapshotId = "test", skills = new object[] { new { name } }, missiles = Array.Empty<object>(), formulas = Array.Empty<object>(), assets = Array.Empty<object>() });
            var one = Payload("Bản nháp tiếng Việt");
            var two = Payload("Bản nháp thứ hai");
            store.WriteAutosaveAsync(one).GetAwaiter().GetResult();
            Check(File.ReadAllText(store.Autosave) == one, "Autosave preserves UTF-8 workspace bytes");
            store.WriteAutosaveAsync(two).GetAwaiter().GetResult();
            Check(File.ReadAllText(store.Previous) == one && File.ReadAllText(store.Autosave) == two, "Atomic replacement keeps previous workspace");
            File.WriteAllText(store.Autosave, "{broken");
            var restored = JsonSerializer.SerializeToElement(store.ReadAutosave());
            Check(restored.GetProperty("recovered").GetBoolean() && restored.GetProperty("workspace").GetRawText() == one, "Corrupt autosave recovers prior version");
            store.WriteAutosaveAsync(two).GetAwaiter().GetResult();
            Check(Directory.GetFiles(root, "workspace.corrupt_*").Length == 1 && File.ReadAllText(store.Previous) == one, "Corrupt bytes are quarantined without replacing good backup");
            var before = File.ReadAllBytes(store.Autosave);
            bool invalid = false; try { store.WriteAutosaveAsync("{}").GetAwaiter().GetResult(); } catch (InvalidDataException) { invalid = true; }
            Check(invalid && before.SequenceEqual(File.ReadAllBytes(store.Autosave)), "Invalid workspace never overwrites saved data");
            File.Move(store.Autosave, Path.Combine(root, "held-current.jxworkspace"));
            var missing = JsonSerializer.SerializeToElement(store.ReadAutosave());
            Check(missing.GetProperty("recovered").GetBoolean() && missing.GetProperty("workspace").GetRawText() == one, "Missing current file recovers previous after interrupted quarantine/write");
            var invalidUtf8 = Path.Combine(root, "invalid-utf8.jxworkspace");
            File.WriteAllBytes(invalidUtf8, new byte[] { 0xff, 0xfe, 0x7b, 0x00 });
            bool rejectsEncoding = false; try { WorkspaceStore.ReadLimited(invalidUtf8); } catch (System.Text.DecoderFallbackException) { rejectsEncoding = true; }
            Check(rejectsEncoding, "Workspace reader rejects malformed UTF-8 instead of replacing bytes");
            Check(MainForm.IsUiOrigin("https://skillstudio.invalid/index.html") && !MainForm.IsUiOrigin("https://skillstudio.invalid.evil.test/") && !MainForm.IsUiOrigin("file:///C:/test.html") && !MainForm.IsUiOrigin("https://skillstudio.invalid:444/") && !MainForm.IsUiOrigin("https://user@skillstudio.invalid/"), "Bridge trusts only the exact local application origin");
            string Release(string version, string url, string? digest) => JsonSerializer.Serialize(new { draft = false, prerelease = false, tag_name = "v" + version, assets = new[] { new { name = $"JXSkillStudio-{version}-win-x64-Full.zip", browser_download_url = url, digest } } });
            var goodUrl = "https://github.com/nqduy263/JxSkillEditor/releases/download/v0.7.0/JXSkillStudio-0.7.0-win-x64-Full.zip";
            var goodDigest = "sha256:" + new string('A', 64);
            Check(UpdateService.ParseRelease(Release("0.7.0", goodUrl, goodDigest))?.Version == Version.Parse("0.7.0"), "Updater finds newer signed-digest release");
            Check(UpdateService.ParseRelease(Release("0.6.2", goodUrl, goodDigest)) == null, "Updater keeps current version when no newer release exists");
            bool badOrigin = false; try { UpdateService.ParseRelease(Release("0.7.0", goodUrl.Replace("github.com", "github.com.evil.test"), goodDigest)); } catch (InvalidDataException) { badOrigin = true; }
            Check(badOrigin, "Updater rejects asset outside official GitHub repository");
            bool badDigest = false; try { UpdateService.ParseRelease(Release("0.7.0", goodUrl, null)); } catch (InvalidDataException) { badDigest = true; }
            Check(badDigest, "Updater refuses releases without SHA-256 digest");
            Check(!Directory.GetFiles(root, ".jxwrite_*").Any(), "Atomic writes leave no partial temp files");
            WorkspaceStore.AtomicWrite(output, JsonSerializer.Serialize(new { checkedAt = DateTimeOffset.Now, passed = checks.Count, checks, fixtureRoot = root, guiTested = false }, new JsonSerializerOptions { WriteIndented = true }));
            return 0;
        }
        catch (Exception e)
        {
            WorkspaceStore.AtomicWrite(output, JsonSerializer.Serialize(new { checkedAt = DateTimeOffset.Now, passed = checks.Count, checks, error = e.ToString(), fixtureRoot = root }));
            return 1;
        }
    }
}
