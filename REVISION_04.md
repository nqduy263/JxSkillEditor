# Revision 04 — Windows portable alpha / workspace v0.4

Ngày: 01/10/2026 · Snapshot dữ liệu skill giữ nguyên nguồn v0.3.

## Đã xây

- Host Windows `JXSkillStudio.exe` bằng WinForms + WebView2, giao diện vẫn là HTML/CSS dark theme. UI chỉ load origin nội bộ `https://skillstudio.invalid/index.html`, chặn navigation/iframe/request ngoài, tắt DevTools/host object/download/permission.
- Bản Full self-contained win-x64 có .NET runtime và WebView2 Fixed Runtime 154.0.4258.48. Bản Lite có thể chạy với WebView2 Evergreen cài sẵn.
- Workspace v1: snapshotId ổn định từ hash các nguồn, autosave có debounce và ghi atomic, bản previous, quarantine tệp hỏng, khôi phục sau mất tệp hiện tại, UTF-8 strict, giới hạn 32 MB, chống đường dẫn reparse. Có mở changeset v0.3 theo diff before/after đã đối chiếu; không dùng lại full draft cũ để ghi đè tên nguồn.
- Native file picker: Lưu/Mở `.jxworkspace`, Xuất draft `.json`. Mở có preview và giữ bản đang làm đến khi người dùng xác nhận. Close handshake chờ UI flush.
- Validator v0.4: required fields cho skill mới, số nguyên và giới hạn hữu hạn, duplicate source ID 521, reference skill/missile, cycle/depth, Lua literal hỗ trợ, hash/byte span công thức, missing SPR, ảnh thử, TCVN3/Latin-1 và TSV control. Kết quả giữ `deployable=false`.
- Discovery read-only: process `game`, `game_offline`, `s3client`, `jxclient` qua `QueryFullProcessImageName`; kiểm header `SkillId`; `wsl.exe --list --verbose` timeout 8 giây. Không đọc memory, không SSH, không ghi game.

## Bằng chứng chạy

- `evidence/demo-checks.json`: 45 kiểm tra Node VM, model, UI handler, SPR player và import UI mock.
- `evidence/workspace-checks.json`: 25 kiểm tra workspace, legacy import, conflict, validation, persistence concurrency và typed bridge.
- `evidence/native-checks.json`: 9 kiểm tra native.
- `evidence/native-diagnostics.json`: X64, .NET 8.0.31, WebView2 Fixed 154.0.4258.48, UI present, `guiTested:false`.
- `evidence/native-discovery.json`: đã thấy `game.exe`, `game_offline.exe` tại Client6.0 với schema `SkillId`; WSL `VLTK_Offline` Running 2 khi chạy ngoài sandbox.

## Chưa nghiệm thu

- Chưa chạy GUI thật hoặc screenshot layout vì lượt trước policy chặn truy cập `file://`; cần người dùng mở EXE trên Windows và kiểm 1280×720, 1920×1080, DPI 100/125/150%.
- Chưa xác minh PAK/loose precedence, tooltip renderer live, cast timing, trang bị/ngựa, CharAnimId 14 trong binary, units/interval, giới hạn ID engine, duplicate 521 và thứ tự event trên server.
- Chưa có SSH/SFTP connector, live snapshot, Lua 4 full evaluator, ghi `.txt/.lua/.pak`, patch staging hoặc rollback. Không dùng changeset để sửa game.
- Runtime Fixed 154.0.4258.48 được ký Microsoft; Windows 10 ACL và update lifecycle chưa nghiệm thu. .NET 8 hết hỗ trợ 10/11/2026, cần chuyển .NET 10 trước release dài hạn.

## Tái lập

```powershell
node SkillStudio/tools/build-demo.cjs
node SkillStudio/tools/check-demo.cjs
node SkillStudio/tools/check-workspace.cjs
node SkillStudio/tools/check-resources.cjs
dotnet run --project SkillStudio/native/SkillStudio.App/SkillStudio.App.csproj -- --self-test --output SkillStudio/evidence/native-checks.json
pwsh -File SkillStudio/native/build-portable.ps1
```

Gói phát hành Full: `SkillStudio/releases/JXSkillStudio-0.4.0-win-x64/`. Gói source không nên bao gồm `.packages`, `.downloads`, `.runtime`, `bin/obj` hoặc fixture tự lưu.
