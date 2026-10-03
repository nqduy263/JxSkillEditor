# JX Skill Studio — MASTER REPORT

## Trạng thái mới nhất — v0.4 Alpha

Đã có host Windows chạy thật, workspace v1 lưu/mở/tự phục hồi, validator draft và discovery read-only. Bản Full self-contained win-x64 dùng WebView2 Fixed Runtime 154.0.4258.48; bản Lite dùng Evergreen nếu máy đã cài. `guiTested=false`: chưa tuyên bố QA layout GUI.

45 kiểm tra demo/import UI mock, 25 kiểm tra workspace/validator/bridge, native self-test và diagnostics đã qua. Discovery ngoài sandbox thấy `game.exe`, `game_offline.exe`, header `SkillId` và WSL `VLTK_Offline` Running 2. Discovery không đọc memory hay ghi file game.

Workspace gắn `snapshotId` theo hash nguồn; bản v0.3 import chỉ áp dụng diff có `before` khớp, công thức kiểm hash + byte span, ảnh giới hạn base64 PNG/JPEG. Validator báo lỗi missing reference/cycle/Lua/encoding/asset nhưng `deployable=false`.

Chi tiết cập nhật: `REVISION_04.md`, `evidence/workspace-checks.json`, `evidence/native-checks.json`, `evidence/native-diagnostics.json`, `evidence/native-discovery.json`.

### Giới hạn alpha

Chưa nghiệm thu GUI thật, PAK precedence, tooltip/cast live, SSH/SFTP, Lua 4 đầy đủ, ghi patch, engine enum/ID limit hoặc Windows 10 Fixed Runtime ACL. Không tự áp dụng changeset. Runtime và lifecycle xem `native/RUNTIME.md`; .NET 8 hết hỗ trợ 10/11/2026.

## Lịch sử — v0.3

Đã thay luồng tạo từ mẫu bằng **Tạo skill mới từ đầu**. Người tạo nhập ID, tên, môn phái rồi chọn action, thuộc tính, mục tiêu, sát thương, tầng và tài nguyên. Có tạo bảng Lua riêng, đường đạn mới và tầng SkillId mới.

Dropdown hiển thị mã, tên, giải thích và nguồn. CharClass=3 là Mộc theo skilltemplate.txt. Action 0–13 dựa trên bảng NpcAction; 14 không có dòng mapping, chưa xác minh ý nghĩa sentinel ở engine. Giao diện giữ đúng mức bằng chứng.

**Animation đã hoạt động ở mức tài nguyên:** 626/667 SPR giải mã được, 28.567 frame; play/pause, hướng, kéo frame và tốc độ. Action preview ghép thân/đầu chuẩn 001 nam/nữ theo tư thế vũ khí. Hộp chọn SPR xem trước rồi áp dụng. 40 path chưa tìm thấy, 1 container chưa hỗ trợ; 1 SPR header 17 frame/16 hướng dùng chế độ frame gốc và có giải thích.

41 kiểm tra model/data/UI-handler và 5 nhóm kiểm tra tài nguyên đã qua; SHA256 của mọi payload đóng gói khớp snapshot. Đã xem ảnh contact sheet của action Magic và missile #136. Chưa nghiệm thu layout trình duyệt, timing cast, trang bị live hay PAK precedence.

Sản phẩm hiện tại đã có EXE portable alpha; chưa có SSH backend hoặc patch ghi game. JSON vẫn deployable=false. Backup trước sửa: SkillStudio.bak_20261001_221610. Chi tiết ở REVISION_04.md, HANDOFF.md và evidence/resource-checks.json.

## Lịch sử — v0.2

Các số liệu cache và demo v0.1 ở phần lịch sử bên dưới đã được thay thế. Xem REVISION_02.md để biết bằng chứng sửa lỗi.

Demo v0.2 dùng **bảng client gốc**, không dùng cache web: 1.236 dòng / 1.235 ID skill, 441 missile, 113/57 cột, 227 script tham chiếu tìm được, 978 records ghép PNG. Mặc định hiển thị 170 skill có lệnh học theo snapshot server WSL; 288 skill theo script và nhóm nội bộ nằm ở phạm vi riêng. Số 170 không phải toàn bộ skill có thể học qua mọi nhiệm vụ/sách/GM.

ID 3 thật sự có tên “Thiếu Lâm Kiếm pháp” trong skills.txt nhưng không có ở hàm add_sl; lỗi demo v0.1 là trộn bảng tổng vào thư viện môn phái. Không sửa tên ID 3 thành một chiêu khác hoặc xóa khỏi dữ liệu gốc. Thiếu Lâm mặc định có Côn pháp #4, Đao pháp #6, Quyền Pháp #8 cùng các chiêu có lệnh học tương ứng.

Đã xác minh process path Client6.0 và cwd server WSL. Hash bảng học live khác bản sao server_moi, vì vậy dùng snapshot live_skills_table.lua mới. Giao diện và công thức vẫn chưa được đối chiếu với tooltip đang hiện trên màn game; pack precedence chưa được chứng minh.

Đã bổ sung form nhóm, toàn bộ cột raw, editor bảng số Lua theo cấp, cây tầng, editor missile, đổi icon và clone skill. Có 29 kiểm tra data/logic/handler thành công; kết quả ở evidence/demo-checks.json. Không phải nghiệm thu trình duyệt/engine. Không ghi dữ liệu game.

## Báo cáo khảo sát và lịch sử v0.1

Ngày khảo sát: 01/10/2026 (Asia/Saigon). Trạng thái: phương án + demo UI; chưa phải bản Windows editor sản xuất.

## Kết luận

Có thể xây phần mềm Windows portable như yêu cầu. Mức đọc/chỉnh dữ liệu và preview tài nguyên có nền tảng rõ trong workspace. Mức tự kết nối cần endpoint/credentials và fingerprint. Mức tooltip/cast khớp tuyệt đối không thể cam kết trước PoC và đối chiếu game; phần engine/native phải phụ thuộc profile cụ thể.

## Bằng chứng đã khảo sát

| Bằng chứng cục bộ | Quan sát | Điều chưa chứng minh |
|---|---|---|
| `bo_nho_AI/00_HUONG_DAN_TRUY_CAP_BO_NHO.md` và modules 01/04/05/06 | WSL/paths, encoding, Lua 4, quy tắc đồng bộ | Server đang chạy và root active hiện tại |
| `DevJX/TBJXStudio_@123/SourceCode/TBJXStudio/TBJXStudio.csproj` | WinExe .NET Framework 4.7.2; SkillDataStudio, PakEngine, SprPakManager, ProcessService, CharResRenderer | Build/runtime/giấy phép của toàn bộ mã cũ |
| `SkillDataStudio.cs` khoảng dòng 1516–1695 | LoadSpr và renderer tooltip lấy nhiều nguồn | Chính xác số liệu/layout so với game |
| `SkillDataStudio.cs` khoảng dòng 2983 | `Encoding.Default` và parser text/regex | An toàn với tất cả codepage/Lua phức tạp; cần thay bằng codec và parser đúng |
| `PakEngine.cs` đầu file | Hash path bytes GBK và UCL decoder | Tất cả loại compression/container và collision |
| `Client6.0/settings/skills.txt` header | Có SkillIcon, LvlSetScript, CharAnimId, event/cost/timing | Cách engine liên kết mọi trường, giới hạn ID |
| `Client6.0/settings/missles.txt` header | Đúng tên thực tế; tài nguyên animation và âm thanh | Precedence active và đủ tài nguyên mỗi skill |
| `Simcity/web/assets/skills_full_db.json` | Cache có tên Unicode, yêu cầu cấp, mô tả và stats | Cache có đồng bộ file đang chạy; không dùng làm authority |
| `Simcity/web/assets/skill_icons` | 1.209 file icon PNG tìm được lúc khảo sát | Mỗi icon đều đúng skill và phiên bản |
| `Simcity/web/assets/style.css` | Web tool có nền xanh lục đậm | Chưa đo contrast của toàn bộ giao diện cũ |
| `dotnet --list-sdks` | SDK 8.0.425 có trên máy khảo sát | Build bản mới chưa thực hiện |

Demo có catalog provenance `Simcity/web/assets/skills_full_db.json`. Snapshot header/hash của client/server trong `evidence/inventory.json` là dữ liệu đọc file cục bộ, không đại diện bộ nhớ tiến trình live. Các thống kê demo được tính từ cache tại build.

Kết quả build: 1.215 records cache, 977 records ghép được PNG, 238 records chưa ghép được PNG. Thư mục có 1.209 file icon, không tương đương 1.209 skill đã ghép. Đếm dòng không rỗng sau header: client skills.txt 1.236, server skills.txt 1.216; missles.txt hai phía đều 441. Đây là số dòng raw, không phải số ID hợp lệ/duy nhất. Chênh lệch cache/client/server là lý do phải snapshot và đối chiếu trước triển khai; chưa xác định nguyên nhân hoặc phân loại chênh lệch ở lượt này.

## Tính khả thi theo yêu cầu

| Yêu cầu | Đánh giá | Giải pháp / tiêu chí |
|---|---|---|
| Portable Windows | Cao | Self-contained C# + fixed WebView2; nghiệm thu VM không SDK/admin |
| Auto detect client đang chạy | Cao có điều kiện | Executable path + root verification; quyền và nhiều instance cần fallback |
| Auto SSH server | Cao với profile | Không suy host key/mật khẩu; WSL hoặc saved endpoints, scan LAN có scope |
| Toàn bộ môn phái | Cao với schema được hỗ trợ | Catalog mọi row, mapping provenance; unknown/NPC/custom giữ riêng |
| Icon và tooltip gốc | Cao | PAK/SPR resolver + text codec + nguồn cột |
| Chỉ số tooltip theo cấp | Trung bình | Lua 4 evaluator + context; native dependencies phải đối chiếu |
| Tooltip pixel-perfect | Trung bình, cần PoC | Font gốc, color markup, renderer rules + ảnh game cùng DPI |
| Animation SPR | Cao với codec đúng | Frame/direction/palette/offset timeline |
| Cast đầy đủ y như game | Khó nhất | Ghép action/equipment/horse/missile/impact; validate trên staging |
| Tạo/chỉnh và đồng bộ | Cao có gate | AST/schema, dependency validation, backup, journal |
| Hot reload mọi thay đổi | Không đảm bảo | Capability matrix theo build; restart nếu engine không hỗ trợ |

Không có cơ sở cho tỷ lệ “100% trích xuất” ở thời điểm này. Coverage cần đo riêng: rows, faction mappings, Lua settings evaluated, references resolved, asset decode, game verified. Missing và unknown luôn là các cột báo cáo riêng; denominator là toàn bộ snapshot/profile đã nhận diện.

## Rủi ro và cách xử lý

| Rủi ro | Mức ảnh hưởng | Giải pháp | Dấu hiệu hoàn thành |
|---|---|---|---|
| Sai active root hoặc pack precedence | Cao | Fingerprint process/config + profile, compare resource thực tế | Game reference trùng asset nguồn |
| Encoding/GBK bị đổi byte | Cao | Raw bytes, TCVN3 map, round-trip, CRLF preservation | Golden byte corpus pass |
| Luồng Lua/custom native chưa hiểu | Cao | AST + isolated evaluator, unknown có nguồn | Engine sample comparison |
| Skill dùng chung missile/event | Cao | Reverse dependencies, impacted list, clone nếu cần | Không đổi ngoài phạm vi changeset |
| Server/client áp dụng lệch nhau | Cao | Stage hai phía, journal, maintenance activation | Hai manifest đúng + runtime verified |
| PAK hash thiếu filename/compression lạ | Trung bình–cao | Candidate dictionary, unsupported state, worker bounds | Không bỏ entry và không crash |
| Tool scan gây tải hoặc kết nối nhầm | Trung bình | Scoped discovery, timeout/rate limit, cancel, host keys | Scan dry-run kiểm chứng |
| Key/secret rò rỉ | Cao | OS credential store, redaction, profile export sạch | Secret scan artifacts/logs |
| Game crash khi ID/limit sai | Cao | Profile engine limits + staging trước deploy | Boundary cases pass |
| Portable quá nặng | Trung bình | Đo dung lượng; WPF native dự phòng | Clean-machine launch + footprint report |
| Tái sử dụng mã/tài nguyên chưa rõ quyền | Trung bình | License provenance tại P0, không phát tán game assets | LICENSES/SBOM và phạm vi phân phối |
| Native hook sai build | Rất cao | Ngoài MVP; nếu cần kiểm SHA-256 + ELF32 segment + profile | Build-specific review/test |

Không cần patch ELF hay inject client để làm MVP. Runtime adapter nếu thực sự cần là workstream riêng sau PoC, không tự áp dụng hardcoded VA.

## Ước lượng và quyết định đề xuất

MVP khoảng 5–8 tuần; V1 khoảng 10–16 tuần với 1 dev toàn thời gian và người vận hành hỗ trợ, cộng dự phòng khi decoder hoặc cast chưa giải được. Không tính chi phí nhân sự vì chưa có đơn giá và quy mô nhóm. Chi phí phát hành có thể gồm chứng chỉ ký mã, máy test và lưu snapshot/backups; thời gian reverse engineering là biến số lớn nhất.

Go cho P0 và MVP. Go có điều kiện cho claim game-equivalent: phải giải được 3 bộ mẫu (skill trực tiếp, skill có child/event, buff/passive) trên build này. Nếu không giải được cast tổng hợp, vẫn phát hành editor với preview asset và gắn nhãn chưa đối chiếu; không thay hành vi game bằng mô phỏng rồi gọi là chính xác.

## Sản phẩm bàn giao lượt này

- MASTER_BUILD.md: kiến trúc, backlog, gate, timeline, đóng gói, validation/deploy.
- MASTER_REPORT.md: bằng chứng, tính khả thi, rủi ro, giới hạn.
- HANDOFF.md: hướng dẫn demo, trạng thái thật, bước tiếp theo và tiêu chí tiếp nhận.
- demo/index.html: demo độc lập, theme tối, nút 3D, catalog thật từ cache, icon có sẵn, draft/diff/export, màn kết nối/dependency/release mô phỏng.
- tools/build-demo.cjs: build tái lập catalog/demo từ dữ liệu cục bộ; chỉ ghi trong SkillStudio.
- evidence/inventory.json: hash/schema và coverage nguồn cục bộ.

Kết quả kiểm chứng demo cập nhật trong HANDOFF.md. EXE alpha đã build/self-test/diagnose; chưa kết nối SSH thật, chưa sửa hoặc triển khai file game trong lượt này.

Kiểm tra JS syntax thành công. 16 kiểm tra hành vi trong Node VM với DOM adapter tối thiểu thành công, bao gồm draft/tooltip/diff, input âm, tìm kiếm theo draft, clone/undo, theme, navigation, timeline, profile SSH mô phỏng và cờ export demoOnly/deployable=false. Đây không là kiểm thử trình duyệt thực. Browser tích hợp từ chối giao thức file:// theo URL policy; chưa QA hình ảnh/layout/download trên Edge/Chrome và không tìm cách vượt policy.

## Cập nhật 0.5.0

Preview hiệu ứng skill theo ChildSkillId và các tầng sự kiện; riêng #14 tới missile #66 AnimFile2. Timing là mô phỏng 18 tick/s. Xem REVISION_05.md.


## Cập nhật 0.6.0

Ứng dụng native đã có kiểm tra GitHub release khi mở, lựa chọn Yes/No, tải ZIP Full, xác minh digest SHA-256, lưu workspace, thay tệp ngoài tiến trình và mở lại. Xem REVISION_06.md cho điều kiện và giới hạn.

## Cập nhật 0.6.1

Đã đồng bộ logo/biểu tượng ứng dụng vào bản portable và phát hành thành phiên bản mới để kiểm tra đường nâng cấp từ 0.6.0. Tài nguyên biểu tượng được giữ trong `resources/icons`; bản web dùng `demo/icon.png`, native dùng `native/SkillStudio.App/app.ico`. Xem REVISION_07.md.

