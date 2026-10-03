# JX Skill Studio — MASTER BUILD

## Trạng thái triển khai P0/P1 — 03/10/2026

- **P0 profile audit đã chạy:** `tools/profile-audit.cjs` tạo manifest/hash cho các root đang dùng, 31 PAK, bảng skill/missile, enum và snapshot WSL. Artifact: `evidence/profile-audit.json` (profile hiện tại `jx6-client6-150d9cf4f9893186`).
- **P0 gate đã đạt:** root và source hash đầy đủ; schema skill/missile là 113/57 cột; duplicate `SkillId=521` vẫn là cảnh báo; PAK precedence, giới hạn ID, action 14, timing live và license vẫn giữ `unknown/review`.
- **P1 byte-preserving TSV đã bắt đầu:** `tools/raw-tsv.cjs` giữ byte span, ô rỗng, thứ tự và CRLF; `tools/check-raw-tsv.cjs` xác nhận round-trip không chỉnh sửa giữ nguyên byte và từ chối TAB/LF/CR/NUL hoặc Unicode không biểu diễn được trong Latin-1. Artifact: `evidence/raw-tsv-checks.json`.
- Các bước này chỉ đọc snapshot và ghi evidence trong `SkillStudio`; chưa SSH, chưa đọc memory, chưa ghi Client/Server và changeset vẫn `deployable=false`.

## Cập nhật v0.4 Alpha — EXE portable, workspace, validator

Host `JXSkillStudio.exe` dùng WinForms + WebView2, origin nội bộ và bridge typed allowlist. Bản Full self-contained win-x64 kèm WebView2 Fixed Runtime 154.0.4258.48; bản Lite có thể dùng Evergreen. `Data/` lưu workspace UTF-8 atomically, có previous/quarantine/recovery; snapshotId ngăn mở nhầm bộ nguồn.

Mở changeset v0.3 chỉ áp dụng diff trước/sau đã khớp source. Validator kiểm required fields, duplicate 521, active references/cycles/depth, numeric Lua subset, formula hash/byte span, missing SPR, PNG/JPEG thử, TCVN3/Latin-1 và TSV control. Discovery chỉ đọc process path + skills header + WSL; chưa SSH, memory hoặc game writes. Tests: 45 demo, 25 workspace, native self-test/diagnostics/discovery. GUI layout chưa nghiệm thu.

Xem `REVISION_04.md`, `native/RUNTIME.md`, `THIRD_PARTY.md`. .NET 8 hết hỗ trợ 10/11/2026; chuyển .NET 10 trước release dài hạn.

## Lịch sử v0.3 — tạo mới, lựa chọn có giải thích, SPR thật

Bản demo hiện tại: tạo skill từ đầu, khai báo Lua riêng, tạo đường đạn/tầng mới, dropdown có nguồn, preview frame SPR. Xem REVISION_03.md và HANDOFF.md. Các ước lượng bên dưới áp dụng cho sản phẩm Windows đầy đủ.

- Tạo mới không phụ thuộc skill đang chọn. ID/name/faction riêng; gameplay và tài nguyên do người dùng khai báo. Model newSkill/newMissile và export v0.3 phân biệt insert với update.
- Action, CharClass, SkillStyle, MslsGenerate, MisslesForm, MoveKind, FollowKind, trạng thái và liên kết có list + giải thích. Unknown được giữ nguyên mã. CharClass=3 là Mộc theo template client.
- CharAnimId=14 không có mapping trong bảng NpcAction 0–13; không mặc định gán một animation. Gate trước sản xuất: xác minh enum engine và giới hạn của từng build.
- Đã port read-only PACK/hash/UCL/SPR, đóng gói tài nguyên nạp khi chọn; snapshot 0.6.2 có 3.550 SPR ready, 429 unavailable và 307.186 frame. Resource inventory lưu lỗi cụ thể.
- Preview action ghép composite theo mapping `npcres`: thân, đầu, tóc, vai/áo, hai tay, vũ khí và phi phong khi SPR có sẵn; chọn SPR có preview trước áp dụng, play/pause, hướng, scrub, tốc độ và interval. Có tùy chọn ghép effect cast và dòng timing. Đây vẫn là mô phỏng 2D, chưa phải cast gameplay/equipment live.
- P3 bổ sung tạo bảng mốc P1/P2/P3 mới, Lua key riêng, tạo SkillId cho tầng và MissleId cho đường đạn, kiểm liên kết/ID và insert-plan; backend phải sinh Lua 4 hoàn chỉnh, lệnh học, codec và rollback.
- P4 còn lại: container chưa hỗ trợ, tài nguyên thiếu, render order/equipment/horse, xác minh units/Interval và hành vi engine.
- 41 kiểm tra logic/UI-handler + 5 nhóm resource đã qua. Frame contact sheet đã được xem; chưa QA layout trình duyệt vì file:// bị policy chặn. Gói xuất vẫn deployable=false.

## Lịch sử v0.2 — 01/10/2026, sau phản hồi dữ liệu skill

Trạng thái mới nhất của demo và phạm vi nghiệm thu ở HANDOFF.md / REVISION_02.md; các ước lượng bên dưới vẫn dành cho sản phẩm Windows đầy đủ.

- Nguồn tên chuyển sang Client6.0/settings/skills.txt raw bytes TCVN3, không dùng skills_full_db.json. Nhãn Attrib/EqtLimit đọc gamesetting.ini. Faction INI có 13 tên, không giả định tất cả đã bật.
- Phân biệt 170 skill có AddMagic trong các hàm add_* của snapshot server WSL, 288 skill thuộc script môn phái chưa chứng minh được học, và nhóm nội bộ/chưa xác định. Không gộp tên có trong bảng tổng thành skill nhân vật.
- Đã xác minh executable path của game.exe/game_offline.exe và cwd của jx_linux_y. Snapshot chỉ đọc, không xác minh nội dung RAM hoặc pack precedence.
- Editor hiện có đầy đủ 113 cột skill, 57 cột missile: nhóm hiển thị, combat/cast, tầng/event, assets, raw. Có 20 cặp LvlSetting/LvlData.
- Đã có parser token để tìm bảng SKILLS có byte span; evaluator bảng số P1/P2/P3 (floor/Link, nội suy và ngoại suy). Biểu thức/hàm ngoài subset giữ unknown; đây chưa là Lua 4 sandbox sản xuất.
- Chuỗi tầng từ ChildSkillId và event bảng/Lua; phân biệt ID missile với ID skill theo profile tham khảo; giữ cờ event tắt, chặn vòng lặp/depth 8. Không gọi đây là cast engine đã nghiệm thu.
- Thay SkillIcon bằng asset có sẵn hoặc đường dẫn SPR; tải PNG/JPEG là preview asset cần chuyển SPR. Missile/Lua là tài nguyên dùng chung, có diff và danh sách tác động.
- P0 bổ sung gate bắt buộc: trùng ID 521, thiếu ID trong bảng học (Hoa Sơn), chênh nguồn live/local, xác minh thứ tự PAK và loose override. Cấm tự chọn last-wins làm quy tắc ghi game.
- P3 bổ sung gate: clone template có ID không trùng catalog; tạo lệnh học, profile ID limit và clone tài nguyên dùng chung vẫn là việc backend cần làm. JSON v0.2 luôn deployable=false.

## Phương án sản phẩm đầy đủ

Ngày: 01/10/2026 · Phiên bản phương án: 0.1 · Mục tiêu đầu tiên: JX Linux 6.0 + Client6.0 trong workspace này.

## 1. Phạm vi và định nghĩa hoàn thành

Xây dựng phần mềm Windows portable tạo và chỉnh sửa skill, quản lý tất cả môn phái tìm thấy trong bản dữ liệu, kết nối server qua SSH/SFTP hoặc WSL và nhận diện client Windows qua tiến trình/thư mục. Không giả định các server cùng một schema.

Ba mức sản phẩm:

1. **Demo hiện tại (v0.3):** danh mục từ bảng client, tạo/sửa skill và tài nguyên draft, danh sách có nguồn, giải mã PAK/SPR snapshot, preview animation và xuất JSON. Chưa có SSH/backend ghi game, thực thi Lua 4 đầy đủ hoặc cast engine.
2. **MVP:** snapshot dữ liệu thật; đọc PAK/SPR; preview frame; editor schema và công thức; xuất patch đồng bộ server/client; kiểm tra và rollback tại staging.
3. **V1:** SSH tự khám phá có profile, sandbox Lua 4, dependency graph, preview cast có tài nguyên nhân vật, triển khai có nhật ký và nghiệm thu game thật.

“Y như trong game” chia thành: nội dung tooltip, số liệu theo cấp/ngữ cảnh nhân vật, hình ảnh/font/layout, animation tài nguyên, và hành vi engine. Chỉ gắn nhãn Đã đối chiếu game khi có bằng chứng cho từng phiên bản và ngữ cảnh; không suy từ việc mở được SPR.

## 2. Kiến trúc đề xuất

```text
Windows host C# + WPF
  ├─ WebView2 UI: danh mục / editor / tooltip / timeline / diff
  ├─ Discovery: process path, local roots, WSL, saved SSH endpoints
  ├─ Connectors: LocalFs | WSL | SSH/SFTP
  ├─ Snapshot store + manifest SHA-256 + catalog SQLite
  ├─ JX6 adapter: TSV/INI raw bytes, Lua syntax tree, PAK index, SPR frames
  ├─ Resolver: skill → Lua settings → missile/event/child → assets
  ├─ Preview: tooltip evaluator + sprite timeline + context model
  ├─ Validator: references, encoding, IDs, cycles, schema, engine limits
  └─ Patch coordinator: plan → stage → backup → apply → verify → recover
Isolated worker: untrusted PAK/SPR and Lua evaluation with timeout/memory limits
Optional x86 helper: only for build-specific runtime integration
```

UI không được gọi shell trực tiếp. Bridge typed message, allowlist lệnh, schema input, request ID, cancellation và log đã che bí mật. Chỉ load UI nội bộ; chặn navigation ngoài, remote scripts và DevTools trong release. Worker giao tiếp qua named pipe có ACL người dùng hiện tại. Chọn x64 cho host; client game x86 không bắt buộc host x86 khi chỉ đọc file.

### Lựa chọn công nghệ

| Phương án | Điểm mạnh | Hạn chế | Quyết định |
|---|---|---|---|
| C# WPF + WebView2 Fixed Runtime | Tái sử dụng C#, giao diện tương tự web tool; runtime đi cùng ZIP | Dung lượng lớn hơn; cần cập nhật runtime định kỳ | Đề xuất V1 |
| C# WPF thuần | Không cần WebView2; thuận lợi native Windows | Tốn công dựng timeline/skin kiểu web | Dự phòng nếu ưu tiên dung lượng |
| Giữ WinForms .NET Framework 4.7.2 | Nhanh tận dụng TBJXStudio | Phụ thuộc framework máy đích; UI cũ và code ghép chặt | Dùng làm tham chiếu parser, không mặc định sản phẩm mới |
| Electron/Tauri | UI web thuận lợi | Thêm runtime hoặc cầu nối khác; không tự giải quyết parser JX | Chưa chọn |

Dùng .NET phiên bản được hỗ trợ tại lúc khởi tạo release; máy khảo sát có SDK 8.0.425. Pin NuGet và runtime trong lockfile, không suy SDK hiện có là lựa chọn dài hạn. SSH.NET là ứng viên, phải test thuật toán SSH trên CentOS cũ. Portable = giải nén thư mục ZIP và chạy không installer/admin; không bắt buộc một EXE. Có profiles/data/cache/logs/backups cạnh EXE, kiểm tra quyền ghi và dung lượng trước thao tác.

## 3. Tự khám phá và kết nối

1. Đọc profile đã lưu; kiểm tra endpoint và SSH host fingerprint đã tin cậy.
2. Local client: liệt kê ứng viên tiến trình và executable path; xác minh config, settings, data PAK; nhiều client thì cho chọn. Nếu thiếu quyền xem path, cho chọn thư mục.
3. WSL: liệt kê distro; xác minh candidate root bằng schema/settings và đường dẫn tiến trình jx_linux_y. Thông tin VLTK_Offline trong bộ nhớ là gợi ý, không là kết quả live.
4. SSH: host/port/key do profile cung cấp. Lần đầu cần xác nhận fingerprint; tự kết nối các lần sau nếu khớp. Không thể tự tìm mật khẩu. Quét LAN là tùy chọn trên dải người dùng chọn, có giới hạn concurrency/timeout/cancel; port game 5622/6666 không phải cổng SSH.
5. Kết nối bằng tài khoản ít quyền, SFTP đọc snapshot trước; không chạy script server lúc scan. Không đọc secrets từ process memory. Remote Windows client cần SSH được cấu hình hoặc companion riêng, không có SSH mặc định.
6. Tách trạng thái: discovered / authenticated / readable / writable / running / version-supported. Chạy game không đồng nghĩa editor có thể ghi hay reload.

Khóa riêng không sao chép vào ZIP; secret lưu bằng Windows credential storage/DPAPI hoặc hỏi mỗi phiên. Xuất profile loại bỏ secrets. Chuyển máy phải xác thực lại; ghi rõ giới hạn này của portable.

## 4. Mô hình dữ liệu và nguồn

SkillKey = versionProfile + sourceRoot + SkillId. Không dùng tên làm khóa. Mỗi giá trị có sourcePath, row/column hoặc byte span, hash, parserVersion và confidence (raw / resolved / evaluated / verified-in-game / unknown).

Entity: Skill, SkillLevelSetting, Missile, SkillEvent, SkillDependency, FactionBranch, AssetRef, SpriteFrame, CharacterContext, TooltipToken, Snapshot, ChangeSet, DeploymentJournal.

Nguồn thực tế tại workspace:

- `Client6.0/settings/skills.txt`: header có SkillId, SkillIcon, PreCastSpr, CharAnimId, WaitTime, TimePerCast, LvlSetScript, SkillDesc; không có cột ScriptFile/MissleId như ví dụ khái quát trong bộ nhớ.
- `Client6.0/settings/missles.txt`: MissleId, LifeTime, Speed, DmgRange, AnimFile1…4 và các biến thể B, âm thanh.
- `server1/settings/skills.txt`, `server1/settings/missles.txt`, `script/skill/*.lua`: phải đọc và đối chiếu bằng adapter đúng profile; không liên kết missile bằng chỉ số cột đoán sẵn.
- `settings/faction`, cây học skill, nhiệm vụ mở skill, Lua include: xác minh môn phái/nhánh; skill NPC, GM, hidden và custom vào nhóm riêng.
- PAK: từ thứ tự nạp thực tế/config và loose overrides; không mặc định file ngoài luôn thắng. Bản sao `skills1`, `skill-goc`, `skill2` không mặc định active.

Import phải giữ nguyên raw bytes, header, cột lạ, comment, newline, thứ tự và ô rỗng. Unicode chỉ là lớp hiển thị. TCVN3 là bảng mã chữ cần ánh xạ riêng, Latin-1 là cách giữ byte 1:1, không phải converter tiếng Việt. Export kiểm tra decode/encode round trip; thay đổi tên không biểu diễn được phải báo lỗi. Client giữ CRLF; tên đường dẫn GBK/Mojibake theo đúng profile, giữ cả rawPathBytes và displayPath.

## 5. Chức năng màn hình

| Màn hình | Chức năng | Điều kiện |
|---|---|---|
| Kết nối | Discover local/WSL, SSH profiles, fingerprint, chọn active roots, scan progress | Đọc trước |
| Thư viện | Tất cả môn phái/nhánh, NPC/GM/custom/unmapped, tìm ID/tên, filter active/passive | Nguồn và coverage rõ |
| Editor | General, targeting, cost, range, cast, weapons/horse, flags; raw schema view | Không bỏ cột chưa biết |
| Theo cấp | Bảng cấp, đồ thị, công thức, context, linked support | Unknown nếu cần native API |
| Tooltip | Original text / formatted / evaluated / game reference | Không giả định pixel-perfect |
| Animation | Icon SPR, precast, character action, missile, impact, sound, hướng, scrub/play | Asset-missing rõ |
| Dependencies | Event, child skill, missile, effect/state, Lua include, reverse references | Phát hiện vòng lặp |
| Tạo skill | Khai báo từ đầu: ID riêng, môn phái/nhánh, action/target, bảng cấp riêng, tầng/missile mới, icon/SPR chọn có preview | ID/schema/references theo profile; không kế thừa ngầm |
| Đồng bộ | Server vs client diff, impacted files, staged patch, conflicts | Snapshot mới |
| Lịch sử | Backup, journal, export report, rollback | Hash trước/sau |

Giữ tick raw và đơn vị đổi riêng; profile hiện tại có 18 tick/giây nhưng không mặc định mọi cột đều cùng đơn vị. Cast phụ thuộc CharAnimId, equipment, horse, attack speed, action timing và engine; preview 2D chỉ mô phỏng phần đã giải được.

## 6. Lua và tài nguyên

Không thực thi Lua đọc từ server trong host. Parser token/AST giữ comment/byte span; sửa tối thiểu vùng AST. Parser regex hiện có chỉ là tham khảo. Evaluator Lua 4 worker: API whitelist và stub có loại dữ liệu rõ, không file/network/OS, instruction budget, memory cap, timeout; kết quả thiếu native context là unknown. Chuẩn cú pháp phải qua Lua 4 tương ứng, không qua Lua 5 rồi coi là hợp lệ.

PAK có hashed path: không bảo đảm phục hồi tất cả tên file từ hash. Xây candidate dictionary từ references; entry chưa xác định vẫn catalog theo ID/hash. Decoder kiểm tra bounds, kích thước giải nén, palette, alpha, frame offset, direction; chống allocation cực lớn và compression bomb. Cache theo container hash+entry hash+decoder version. Không sửa trực tiếp PAK trong MVP; xuất patch/loose override chỉ khi đã chứng minh precedence, nếu không tạo container patch theo format đã nghiệm thu.

## 7. Quy trình ghi và rollback

`Draft → Validated → Planned → Staged → BackedUp → Applying → Verified → Activated`.

- Manifest tất cả file server/client, base/new SHA-256, raw encoding/newline, dependencies, profile/build hashes, phương án reload/restart, backup path và disk requirement.
- Trước ghi re-read hash; mismatch thì Conflict, không overwrite. Khóa workflow theo root; phát hiện editor khác bằng hash.
- Backup `.bak_yyyyMMdd_HHmmss` trước từng script/config; backup PAK nguyên bản nếu thay container. Xác minh backup hash và quyền restore.
- Stage upload tên tạm, verify hash; rename từng file có journal. Hai máy không có atomic transaction toàn cục: cần maintenance hoặc giữ activation tới khi đủ hai phía. Mất mạng giữa chừng chuyển RecoveryRequired, không báo thành công.
- Activate riêng theo capability đã kiểm chứng; không mặc định hot reload skills. Nếu phải restart, trình bày downtime và hướng dẫn đúng runbook. Không tự tắt server trong scan/import.
- Rollback cũng kiểm tra current hash; nếu có thay đổi sau deploy thì tạo conflict và hướng dẫn phục hồi có chọn lọc. Khôi phục file không đồng nghĩa runtime đã rollback; verify reload/restart và game riêng.

## 8. Kế hoạch thực hiện và nghiệm thu

Ước lượng cho 1 lập trình viên toàn thời gian + người vận hành hỗ trợ đối chiếu game. Ngày công là ước lượng kỹ thuật, chưa là cam kết lịch.

| Giai đoạn | Công việc | Ngày công | Cổng nghiệm thu |
|---|---|---:|---|
| P0 khảo sát | Fingerprint active build, schema, pack precedence, profile, corpus, license audit | 4–6 | Chọn được active roots; toàn bộ file nguồn có hash; báo cáo unknown |
| P1 nền tảng | Solution, worker IPC, snapshot, byte-preserving TSV/INI, converter | 6–9 | Import/export không sửa byte khi không edit; round trip tên/path |
| P2 catalog/resources | Faction graph, Lua refs, PAK UCL, SPR frames, search/cache | 8–12 | Mọi row được import hoặc có lỗi chỉ rõ; không mất skill chưa phân phái |
| P3 editor | Form schema/enum, tạo ID từ đầu, thêm tầng/missile/Lua, undo, diff, validate, patch export | 8–12 | Edit đúng span; dependency invalid chặn export triển khai |
| P4 preview | Tooltip tokens, level context, timeline, direction, character assembly | 8–15 | Bộ mẫu gồm mỗi phái, passive/buff, child/event và missing asset |
| P5 connections | SSH/SFTP, WSL, discovery, secrets, host keys, cancel/retry | 5–8 | Sai key/host hash/mất mạng xử lý đúng; không có secret trong log |
| P6 deploy/recovery | Backups, journal, conflict, two-root stage, rollback | 6–10 | Fault injection từng bước; phục hồi sau kill app và đứt SSH |
| P7 release | Game comparison, clean VM portable, DPI, perf, packaging | 5–8 | Release hash, no-admin/offline launch, evidence game |

Tổng 50–80 ngày công, khoảng 10–16 tuần làm việc; thêm 20–30% dự phòng nếu pack/cast chưa giải được. MVP đọc/chỉnh/xuất patch ưu tiên sau P0–P3 và phần preview cơ bản: khoảng 5–8 tuần. Các việc SSH và preview có thể đổi thứ tự theo độ rủi ro; không cần SSH để chứng minh parser.

Backlog ưu tiên: B01 active-profile detection; B02 raw parser; B03 TCVN3/path codecs; B04 snapshot/hashes; B05 catalog/factions; B06 resource resolver; B07 SPR player; B08 AST edits; B09 formula evaluator; B10 editor/undo/create-from-empty; B11 diff/validator; B12 SSH/WSL; B13 journal deploy/rollback; B14 game capture evidence; B15 release. B06 phụ thuộc B01/B04/B05; B09 phụ thuộc B08; B13 phụ thuộc B04/B11/B12; không bật ghi trước B13.

### Kiểm thử có ý nghĩa

- Corpus thật có bytes >127, ô trống, duplicate IDs, script Chinese paths, CRLF/LF, header reordered và schema lạ. So sánh byte đầu ra, không chỉ text.
- SPR/PAK: golden images, frames/directions/alpha, truncation, unsupported compression, oversize dimensions, corrupt offsets; decoder fail kín và không crash UI.
- Lua: constant/table/function/include/native context/cycles; cùng input so với kết quả engine trên staging, không tự bịa fallback 0.
- Gameplay: ít nhất một nhánh mỗi phái cộng melee/ranged/AOE/passive/aura/child/event/horse; test level 1/mid/max và các context đã nêu. Mỗi kết quả có screenshot/video, IDs, hashes và reviewer.
- Deploy: conflict, disk full, permission denied, lost SSH, process kill, one-side apply, rollback conflict. Không “success” nếu read-back/activation thiếu.
- Performance mục tiêu cần đo: catalog filter <150ms với 10.000 rows, warm open <5s trên SSD tham chiếu, UI không block >100ms; cold scan báo tiến độ/cancel và memory bounded. Không tuyên bố đã đạt.
- UI: 1280×720, 1920×1080, DPI 100/125/150/200%, bàn phím, reduced motion, text contrast ≥4.5:1, không chỉ dùng màu báo trạng thái.

## 9. Đóng gói và thiết kế

ZIP: exe host, worker, fixed WebView2 runtime, ui, adapters, schemas, profiles mẫu không secret, LICENSES/SBOM, README, SHA256SUMS. CI build từ tag/lockfile; release self-contained, không trimming trước khi test reflection/UI. Ký mã nếu có certificate, không coi chữ ký là yêu cầu để thử nội bộ. Không đóng gói tài nguyên game có bản quyền vào bản phân phối công khai.

Theme đề xuất **Obsidian Jade**: nền #091411, panel #10231D, jade #6DD9AD, gold #D8B77B, text #E6ECE7, muted #A5B6AC. Gần web tool xanh lục hiện tại nhưng giảm glow và nhiễu. Alternative **Midnight Bronze**: nền #10151E, panel #192231, bronze #D8B77B. Font Segoe UI, monospace cho ID/byte; nút 3D gradient nhẹ, viền sáng trên, bóng đáy 3px, pressed dịch 2px; disable/keyboard focus rõ. Bố cục: sidebar ngắn, thư viện trái, editor giữa, tooltip/preview phải, footer trạng thái. Responsive chuyển thành stack ở màn hẹp; app thật cho resize/dock panels.

## 10. Nguồn kỹ thuật chính thức

- .NET self-contained/single-file: https://learn.microsoft.com/en-us/dotnet/core/deploying/single-file/overview
- WebView2 distribution: https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution
- SSH.NET: https://github.com/sshnet/SSH.NET

WebView2 Fixed Runtime đi cùng thư mục là lựa chọn portable, cần quy trình cập nhật bản vá. Khóa dependency tại P0; tài liệu chính thức không thay thế kiểm thử JX riêng.

## Build 0.5.0

Chạy native/build-portable.ps1; gói mới ở releases/JXSkillStudio-0.5.0-win-x64. Xem REVISION_05.md.


## Build và phát hành 0.6.0

Mã nguồn được xuất bản tại https://github.com/nqduy263/JxSkillEditor. Build bằng native/build-portable.ps1, đóng ZIP Full với thư mục gốc JXSkillStudio-0.6.0-win-x64, gắn vào GitHub Release tag v0.6.0. Các bản sau dùng tên asset tương ứng để trình cập nhật nhận diện. Xem REVISION_06.md.

## Build và phát hành 0.6.1

Bản 0.6.1 thêm logo giao diện và biểu tượng EXE. Chạy `native/build-portable.ps1`, đóng ZIP Full với thư mục gốc `JXSkillStudio-0.6.1-win-x64`, sau đó chạy `tools/publish-release.ps1 -Version 0.6.1` để tạo GitHub Release. Bản 0.6.0 sẽ nhận diện tag mới qua API release. Xem REVISION_07.md.

## Build và phát hành 0.6.2

Bản 0.6.2 bổ sung composite action theo các bảng `npcres`: thân, đầu, tóc, vai/áo, hai tay, vũ khí và phi phong khi SPR có trong snapshot. Preview có tùy chọn ghép effect cast, hiển thị số lớp đã giải mã, mô phỏng WaitTime/TimePerCast/LifeTime và cho chỉnh interval riêng cho action/effect. Nút `Kiểm tra cập nhật` được giữ trong header; native host cũng tự kiểm tra khi khởi động và hỏi Yes/No trước khi tải. Chạy `node tools/build-resources.cjs`, các check, sau đó `native/build-portable.ps1`; gói mới nằm trong `releases/JXSkillStudio-0.6.2-win-x64` và không ghi đè `v0.6.1`. Xem REVISION_08.md.

---

## 11. Kiến trúc Easy Studio & Trợ lý tạo Skill cho người mới

Mục tiêu cốt lõi: **Giúp một người dùng không biết lập trình, không hiểu cấu trúc mã hóa VLTK vẫn có thể tự tay tạo chiêu thức hoàn chỉnh trong vòng 2 phút.**

Hệ thống bổ sung một lớp điều phối cấp cao (High-level Abstraction Layer) chạy song song với Pro Workbench hiện tại:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GIAO DIỆN NGƯỜI DÙNG (UI LAYER)                    │
│      [⭐ EASY MODE: SKILL CREATION WIZARD]     [⚙ PRO MODE: 113 RAW COLUMNS] │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
  ┌───────────────────────────┐                 ┌───────────────────────────┐
  │   WIZARD 4 BƯỚC ĐƠN GIẢN  │                 │  VIRTUAL COMBAT SANDBOX   │
  │ • Bước 1: Ý tưởng & Phái  │                 │ • Thử đòn trên Dummy Gỗ   │
  │ • Bước 2: Động tác xuất đòn│ ──────────────> │ • Popup số sát thương     │
  │ • Bước 3: Thư viện FX     │                 │ • Quỹ đạo chùm & góc quét │
  │ • Bước 4: Kéo thanh Dame  │                 │ • Âm thanh va chạm        │
  └─────────────┬─────────────┘                 └───────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ĐỘNG CƠ TỰ ĐỘNG HÓA (AUTO-SYNTHESIS ENGINE)              │
│  ├─ Auto-ID Allocator: Tìm ID an toàn tiếp theo cho Skill và Missile        │
│  ├─ Layer Synthesizer: Tự ghép Skill cha ──> Missile ──> Event Collide      │
│  ├─ Damage Curve Generator: Chuyển thanh trượt Min/Max thành bảng Lua 4     │
│  └─ TCVN3 Auto-Sanitizer: Tự làm sạch tên, mô tả và chuẩn hóa NFC           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   CẦU NỐI CÀI ĐẶT 1-CLICK (LOCAL GAME DEPLOYER)             │
│  ├─ Ghi đè file cục bộ: Client6.0/settings/skills.txt & missles.txt         │
│  ├─ Sinh mã nguồn Lua: server1/script/skill/<skill_id>.lua                  │
│  ├─ Tạo lệnh học tức thì: Thêm hàm AddMagic vào GM/NPC hỗ trợ thử nghiệm   │
│  └─ Cơ chế an toàn: Backup tự động trước khi ghi và Rollback 1 chạm         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.1. Chi tiết thiết kế Wizard 4 bước
1. **Bước 1 — Ý tưởng & Môn phái:**
   - Người dùng nhập tên chiêu thức (VD: *Cửu Long Thần Chưởng*).
   - Chọn môn phái trong danh sách 10 đại môn phái kinh điển. Hệ thống tự động gán ngũ hành tương sinh (Kim, Mộc, Thủy, Hỏa, Thổ) và vũ khí phù hợp.
   - Chọn kiểu đánh: Cận chiến (Melee), Tầm xa (Ranged), Đánh lan diện rộng (AoE), Hỗ trợ/Hào quang (Aura/Buff), hoặc Bùa chú (Curse/Debuff).
2. **Bước 2 — Động tác nhân vật (Action Gallery):**
   - Danh sách động tác trực quan có nhãn tiếng Việt dễ hiểu (*Chém mạnh, Đâm kiếm, Vung bổng, Chưởng hai tay, Niệm bùa, Tụ khí...*).
   - Khung xem trước động tác nhân vật tự động chạy hoạt họa SPR tương ứng.
3. **Bước 3 — Thư viện hiệu ứng trực quan (Visual FX Gallery):**
   - Phân loại toàn bộ 626 SPR theo hệ ngũ hành và hình thái trực quan:
     - *Hệ Kim:* Kiếm khí vàng, đao chém hoàng kim, mưa ám khí, quầng sáng hộ thể.
     - *Hệ Mộc:* Độc vụ xanh lá, phi tiêu bão vũ, dây gai gai góc cuộn đất.
     - *Hệ Thủy:* Băng kiếm, mưa tuyết rơi, sóng nước thanh lam, hoa sen hộ thể.
     - *Hệ Hỏa:* Rồng lửa cuộn, cột lửa bốc, cầu lửa nổ tung, lốc lửa xoay.
     - *Hệ Thổ:* Cuồng lôi sét giật, đá nứt địa chấn, búa tạ rơi từ trời.
   - Người dùng click vào là hiệu ứng phát sáng chuyển động ngay.
4. **Bước 4 — Cân bằng sát thương bằng thanh trượt (Intuitive Sliders):**
   - Thay thế việc viết code Lua phức tạp bằng các thanh kéo trực quan:
     - Sát thương cơ bản: Kéo từ cấp 1 (VD: 120 điểm) đến cấp 20 (VD: 1.800 điểm).
     - Thời gian hồi chiêu: 0.5s đến 10s.
     - Tỷ lệ hiệu ứng phụ: Kéo % Làm chậm, Làm choáng, Bất tỉnh, Trúng độc.
   - Hệ thống tự sinh công thức Lua hợp lệ 100% và điền đủ 20 ô thuộc tính `LvlSetting`/`LvlData`.

### 11.2. Kho mẫu chiêu thức kinh điển (1-Click Presets)
Tích hợp sẵn 10 Archetype mẫu:
1. *Cận chiến đơn mục tiêu* (Đạt Ma Độ Giang / Tam Hoàn Cảo Nguyệt).
2. *Kiếm khí tầm xa bắn xuyên thấu* (Vô Ngã Vô Kiếm / Thiên Ngoại Lưu Tinh).
3. *Chưởng pháp phát nổ khi va chạm* (Phi Long Tại Thiên / Hàng Long Thập Bát Chưởng).
4. *Mưa đòn rơi từ trên trời* (Lôi Động Cửu Thiên / Phong Sương Băng Ách).
5. *Đạn nổ tỏa hình tròn 360 độ* (Băng Tâm Tiên Tử / Vạn Kiếm Quy Tông).
6. *Hào quang bị động buff thuộc tính* (Tọa Vọng Vô Vi / Phật Quang Phổ Chiếu).
7. *Bùa chú nguyền rủa diện rộng* (Đoạt Hồn Quyết / Đoạn Cốt Trảm).
8. *Chiêu thức đặt bẫy nổ* (Cửu Cung Phi Tinh / Địa Lôi Môn).
9. *Chiêu lướt nhanh áp sát* (Đoạn Hồn Thích / Ma Âm Phệ Phách).
10. *Chiêu hộ thể hút sát thương* (Kim Chung Tráo / Nga Mi Hộ Thể).

### 11.3. Đấu trường thử nghiệm ảo (Virtual Combat Sandbox)
- Tích hợp một sàn đấu 2D Canvas có nhân vật người chơi đứng đối diện búp bê gỗ (Training Dummy).
- Cho phép nhấn phím Space hoặc Click chuột để xuất chiêu:
  - Nhân vật thực hiện động tác xuất đòn -> đường đạn bay ra -> phát nổ khi chạm búp bê.
  - Búp bê rung giật phản hồi va chạm.
  - Nhảy số sát thương nổi (*Floating Combat Text*: `-1.420`, `-3.200 Bạo Kích!`).
  - Cho phép kiểm tra cảm giác xuất chiêu thực tế trước khi đưa vào game.

### 11.4. Động cơ tự cấp phát ID an toàn (Auto-ID Allocator)
- Quét toàn bộ `skills.txt` và `missles.txt`, tự tìm khoảng trống ID an toàn tiếp theo (VD: `Skill ID: 1236`, `Missile ID: 442`).
- Triệt tiêu 100% nguy cơ trùng ID (ID Collision) hoặc vỡ mảng cấu trúc game.

### 11.5. Cầu nối cài đặt vào Game 1-Click (Local Game Deployer)
- Nút bấm **"Áp Dụng Vào Game"**:
  - Tự động ghi đè file `skills.txt` và `missles.txt` trong thư mục Client6.0.
  - Tự động sinh file script Lua vào thư mục Server `script/skill/`.
  - Tự động tạo một script lệnh GM hoặc NPC hỗ trợ: *"Học ngay kỹ năng vừa tạo"* để vào game test thử tức thì.
  - Tự động tạo bản sao lưu `.bak_yyyyMMdd_HHmmss` và nút Rollback 1 chạm.

---

## 12. Lộ trình phát triển mở rộng (Phased Roadmap v0.7 – v1.0)

| Phiên bản | Trọng tâm công việc | Thời gian dự kiến | Tiêu chí hoàn thành |
| :--- | :--- | :--- | :--- |
| **v0.7.0** *(Easy Mode)* | • Triển khai **Skill Creation Wizard 4 bước**.<br>• Xây dựng **Visual FX Gallery** phân loại tiếng Việt theo ngũ hành.<br>• Tích hợp bộ **10 Preset mẫu kinh điển**.<br>• Tích hợp **Auto-ID Allocator** tự động tìm ID an toàn. | 2–3 tuần | Người dùng chưa biết gì có thể tạo 1 chiêu mới hoàn chỉnh dưới 2 phút trong giao diện mới. |
| **v0.8.0** *(Sandbox)* | • Triển khai **Virtual Combat Sandbox** có búp bê tập võ.<br>• Mô phỏng đường đạn đa tia (hình quạt, chùm, xoay tròn).<br>• Hiệu ứng nảy số sát thương (Floating Combat Text) và âm thanh. | 2–3 tuần | Thử nghiệm trực quan cảm giác đánh trúng mục tiêu ngay trên phần mềm. |
| **v0.9.0** *(Deployer)* | • Xây dựng module **1-Click Game Sync** ghi tệp client/server cục bộ.<br>• Trình sinh mã nguồn Lua chuẩn (`script/skill/*.lua`).<br>• Script GM tự động nạp skill cho nhân vật game offline. | 2 tuần | Bấm 1 nút là vào game offline có thể thi triển được chiêu thức mới tạo. |
| **v1.0.0** *(Production)* | • Tối ưu hóa toàn diện, tài liệu hướng dẫn bằng hình ảnh/video.<br>• Hỗ trợ cấu hình tùy biến cho nhiều bản server (JX Linux 6.0, JX Win, JX 8.0). | 1–2 tuần | Bản phát hành chính thức ổn định, dễ tiếp cận nhất cho cộng đồng modder VLTK. |

