# JX Skill Studio — HAND OFF v0.4 Alpha

Ngày: 01/10/2026. Bản giao: EXE Windows portable alpha, demo editor, workspace/validator, master build/report, nguồn và bằng chứng kiểm tra.

## Chạy bản Windows

Mở `releases/JXSkillStudio-0.4.0-win-x64/JXSkillStudio.exe`. Bản Full đã có `runtime/` và `ui/`, không cần SDK hoặc WebView2 cài sẵn. Giải nén toàn bộ thư mục vào nơi người dùng có quyền ghi; dữ liệu tự lưu nằm trong `Data/`. `--diagnose`, `--self-test` và `--discover` là chế độ headless cho kiểm tra kỹ thuật.

Nếu chỉ dùng demo HTML, các bước v0.3 bên dưới vẫn áp dụng. Bản EXE có thêm Mở workspace, Lưu workspace, tự lưu và trang Kiểm tra dữ liệu.

## Workspace và kiểm tra

1. Khi mở, ứng dụng đọc `Data/workspace.autosave.jxworkspace`; nếu lỗi sẽ thử `workspace.previous.jxworkspace` và báo rõ. Không có autosave hợp lệ thì bắt đầu workspace rỗng.
2. Chỉnh skill/đạn/công thức/icon như các bước bên dưới. Thay đổi được tự lưu sau khoảng 650 ms khi UI đã khôi phục.
3. Vào **Thay đổi & xuất → Kiểm tra dữ liệu**. Nhấp từng lỗi để quay về skill/cột. Lỗi active reference/cycle/Lua/encoding cần sửa trước khi gửi duyệt; warning vẫn cần review.
4. **Lưu workspace** mở file picker `.jxworkspace`; **Mở workspace** hiện preview, chỉ thay workspace sau khi xác nhận. **Xuất changeset** luôn ghi `deployable=false`.
5. Khi đóng, host chờ UI flush. Nếu tự lưu lỗi, dùng Lưu workspace; không chọn bỏ qua nếu cần giữ draft.

`snapshotId` ngăn mở nhầm draft trên bộ Client6.0 khác. Không sửa `data.js` bằng tay để vượt kiểm tra.

## Mở demo

Giải nén gói, mở **demo/index.html** bằng Edge/Chrome. Giữ toàn bộ thư mục demo cạnh nhau; animations chứa tài nguyên nạp khi chọn. Không cần server web; preview cần trình duyệt hỗ trợ DecompressionStream. Reload nếu đang mở bản v0.2.

## Thử tạo skill từ đầu

1. Bấm **Tạo skill mới**, nhập ID chưa dùng, tên, môn phái. Tên không điền sẵn từ skill đang chọn.
2. **Hiển thị:** đặt loại skill, nhánh, mô tả, cấp, vũ khí và icon.
3. **Cast & mục tiêu:** chọn action, CharClass, kiểu tiêu hao, tầm đánh, thời gian và mục tiêu. Dropdown có giải thích/nguồn bên dưới. CharClass 3 = Mộc.
4. Chọn action 9/10/11/13 để xem SPR nhân vật; chọn nam/nữ và tư thế vũ khí ở panel preview. Phát/dừng, đổi hướng, kéo từng frame. Action 14 hiện rõ chưa có mapping animation.
5. **Sát thương / cấp:** chọn thuộc tính tại LvlSetting; khóa riêng tự điền skill_<id>. Nhập P1/P2/P3 và tạo bảng mốc hoặc sửa literal, rồi bấm Tạo bảng số mới. Đây là giá trị thuộc tính, chưa là sát thương cuối lên mục tiêu.
6. **Đường đạn → Tạo đường đạn mới:** nhập ID/tên; khai báo kiểu chuyển động, tốc độ, vùng chạm, thời gian tồn tại. Chọn AnimFile2 hoặc pha khác; có list, giải thích và preview.
7. **Chọn & xem SPR…:** tìm theo skill/ID/path, chọn để xem trước, Dùng animation để áp dụng. Hủy giữ giá trị cũ. Tài nguyên thiếu có lý do cụ thể.
8. **Tầng → Tạo tầng skill mới:** chọn chiêu con hoặc sự kiện xuất chiêu/bay/chạm/tan biến. Mỗi tầng có ID và Lua riêng, cấu hình tiếp như skill mới. Cây tầng cho biết quan hệ; không phải thứ tự cast đã nghiệm thu.
9. **Icon & hiệu ứng:** chọn icon sẵn có, sửa path hoặc tải PNG/JPEG thử. Ảnh thử chưa chuyển SPR. StateSpecialId có SPR được xem bằng nút preview.
10. **Thay đổi & xuất:** xem diff, chạy kiểm tra và xuất JSON v0.4. Workspace có thể mở lại; changeset là gói before/after để duyệt, chưa là patch triển khai.

Các tài nguyên được người tạo chọn có thể dùng chung với skill cũ. Đường đạn/bảng Lua mới được ghi isNew riêng; sửa tài nguyên đã có vẫn tác động mọi tham chiếu tới tài nguyên đó.

## Danh mục skill cũ

Mặc định “Có lệnh học môn phái”: 170 skill có AddMagic trong snapshot add_* server WSL. Thiếu Lâm có #4 Côn pháp, #6 Đao pháp, #8 Quyền Pháp; ID 3 tên gốc “Thiếu Lâm Kiếm pháp” vẫn ở nhóm nội bộ/chưa phân phái. Không sửa tên nguồn hoặc trộn tầng/NPC vào danh sách môn phái.

1.236 dòng / 1.235 ID; ID 521 trùng dòng 522/523. Giữ cảnh báo duplicate; chưa kết luận cách engine xử lý. 441 missile, 227 script, 978 icon PNG ghép được. 288 skill phân phái theo script chưa chứng minh được học. Chưa bao phủ mọi lệnh học qua sách/nhiệm vụ/GM.

## Bằng chứng và giới hạn

- evidence/inventory.json, faction-catalog.json: hash bảng nguồn, tên client và phân loại.
- evidence/live-source.json: lần quan sát process/root và snapshot WSL.
- evidence/resource-inventory.json: hash nguồn enum, coverage, thiếu tài nguyên, header bất thường.
- evidence/resource-checks.json: 3.550 SPR ready / 429 unavailable, 307.186 frame; kiểm payload, decoder và composite layer references.
- evidence/demo-checks.json: 48 kiểm tra logic/UI handler.
- evidence/animation-contact-sheet.png: mẫu frame ghép nhiều lớp action + missile #136, không phải ảnh chụp UI.
- REVISION_03.md: giải thích mã action 14 và CharClass 3.

Có 3.550 SPR ready và 429 path unavailable trong snapshot; không thay bằng hiệu ứng giả. Action 0–13 dựa trên thứ tự bảng NpcAction; 14 chưa có mapping. Preview ghép các component sẵn có theo action/tư thế, hiện lớp thiếu và timing; chưa đối chiếu render order trang bị/ngựa live hoặc engine cast.

PAK precedence, tooltip/cast trong game và giới hạn ID vẫn chưa nghiệm thu. Browser tích hợp đã chặn file:// ở lượt trước, nên chưa QA layout/font/download trên trình duyệt thật; không đi vòng policy. Cần nghiệm thu Edge/Chrome tại 1280×720 và 1920×1080, DPI 100/125/150%.

Không chỉnh dữ liệu game. Chưa có SSH backend, ghi Lua/TSV/PAK hoặc triển khai. deployable=false. GUI thật chưa QA trong phiên này; chạy tại máy người dùng để kiểm DPI/layout. Backup bản trước: SkillStudio.bak_20261001_221610.

## Tái lập

Từ workspace root:

```powershell
node SkillStudio/tools/build-demo.cjs
node SkillStudio/tools/build-resources.cjs
node SkillStudio/tools/check-demo.cjs
node SkillStudio/tools/check-workspace.cjs
node SkillStudio/tools/check-resources.cjs
node --check SkillStudio/demo/app.js
node --check SkillStudio/demo/animation.js
node SkillStudio/tools/checksums.cjs
```

Builder đọc Client6.0, bảng TCVN3 ở Simcity/tcvn3.py, PNG đã trích và snapshot live trong evidence. Resource builder chỉ đọc PAK; không tự truy cập WSL hay sửa game. animations là tài nguyên của bộ client hiện tại, dành cho bản demo nội bộ.

## Ưu tiên xây bản Windows

1. Xác minh PAK/loose precedence, action 14, CharClass runtime, giới hạn ID và duplicate 521.
2. Profile enum có version/hash, mô tả tham số P1/P2/P3 và đơn vị theo engine; không gán nghĩa bằng phỏng đoán.
3. Lưu/import workspace, ID allocator, tạo Lua 4 hoàn chỉnh, lệnh học và validation tham chiếu.
4. Hoàn thiện SPR containers còn thiếu, worker giải mã có giới hạn, ghép trang bị/hướng/ngựa và đối chiếu cast.
5. Portable host, SSH/SFTP read snapshot, patch byte-preserving, backup/stage/journal/read-back/rollback.

## Bàn giao 0.5.0

Dùng releases/JXSkillStudio-0.5.0-win-x64/JXSkillStudio.exe. Preview mới có action và hiệu ứng skill riêng, chỉnh interval xem thử. Xem REVISION_05.md.


## Bàn giao 0.6.0

Chạy bản Full từ thư mục có quyền ghi. Ứng dụng tự kiểm tra GitHub Release mới. Yes cài và mở lại; No dùng bản cũ. Workspace trong Data/ không bị thay. Nếu cập nhật lỗi, xem .updates/update-error.txt và backup. Xem REVISION_06.md.

## Bàn giao 0.6.1

Chạy `releases/JXSkillStudio-0.6.1-win-x64/JXSkillStudio.exe` hoặc giải nén ZIP Full tương ứng. Bản có logo giao diện và icon EXE mới; cơ chế tự cập nhật vẫn giữ workspace trong `Data/`. Bản 0.6.0 sẽ hỏi cập nhật khi mở sau khi GitHub Release v0.6.1 được công bố. Xem REVISION_07.md.

---

## Bàn Giao Thẩm Định & Kế Hoạch Cho Người Mới (v0.6.2 → v0.7.0)

Ngày: 03/10/2026.

### 1. Trạng thái phần mềm bàn giao
- **Phiên bản thực thi:** `releases/JXSkillStudio-0.6.2-win-x64/JXSkillStudio.exe` (release trước 0.6.1 vẫn giữ để rollback).
- **Biểu tượng chính thức:** Concept 2 — Kim Long Hộ Kiếm & Ngũ Hành Skill đã được nhúng làm `ApplicationIcon` của file EXE, icon cửa sổ và logo giao diện.
- **Dữ liệu hoạt động:** 1.236 dòng skill client, 441 missile, 3.550 SPR ready (307.186 frames), 51.940 tham chiếu component action, bảng công thức Lua và 170 skill có lệnh học server WSL.

### 2. Kết quả rà soát cốt lõi
- **Ưu điểm:** Tính trung thực dữ liệu gốc cao, sandbox an toàn, bộ đọc SPR thật trực quan, bộ kiểm tra lỗi (Validator) chuyên sâu ngăn văng server.
- **Khuyết điểm:** Rào cản học thuật quá lớn (113 cột kỹ thuật, `LvlSetting`, `P1/P2/P3`), quy trình tạo chiêu phân mảnh qua 4 tab rời rạc, chưa có 1-click patch vào game, chưa có mô phỏng chiến đấu tương tác trực quan.
- **Lỗi/Rủi ro:** Nguy cơ xung đột ID khi nhập thủ công, rủi ro lệch đồng bộ Client-Server, lỗi mã hóa đường dẫn SPR tiếng Trung/Unicode, và giới hạn mô phỏng đạn đa tia/chùm.

### 3. Kế hoạch triển khai Easy Mode cho người mới
- **P0 (v0.7.0):** Triển khai **Skill Creation Wizard 4 bước**, **Kho 10 Preset mẫu kinh điển**, và **Trình cấp phát ID an toàn (Auto-ID Allocator)**.
- **P1 (v0.8.0):** Xây dựng **Virtual Combat Sandbox** có búp bê gỗ thử chiêu và popup nảy số sát thương.
- **P2 (v0.9.0):** Xây dựng **1-Click Game Deployer** tự ghi file game cục bộ và tạo lệnh học GM test ngay.

### 4. Tài liệu đi kèm
- `MASTER_REPORT.md`: Báo cáo rà soát toàn diện ưu, khuyết, lỗi và giải pháp chi tiết.
- `MASTER_BUILD.md`: Thiết kế kiến trúc Easy Studio, mô hình tự động hóa và roadmap kỹ thuật.
- `resources/icons/`: Bộ tài nguyên icon gốc đa định dạng và đa kích thước.

## Bàn giao 0.6.2

Chạy `releases/JXSkillStudio-0.6.2-win-x64/JXSkillStudio.exe` hoặc giải nén ZIP Full tương ứng. Preview action đọc composite từ catalog SPR: thân, đầu, tóc, vai/áo, tay, vũ khí và phi phong theo action/tư thế; lớp nào thiếu nguồn sẽ hiện trong dòng timing thay vì giả ảnh. Bật `Ghép hiệu ứng cast đang chọn vào action` để xem nhân vật cùng effect, chỉnh `Interval action` và `Interval hiệu ứng` để khớp nhịp frame. `Kiểm tra cập nhật` kiểm tra thủ công; native host vẫn tự kiểm tra lúc mở và Yes/No sẽ tải, xác minh SHA-256, thay portable rồi mở lại. Bản cũ và `Data/` được giữ nguyên.

## Tiếp tục sau 0.6.2 — P0/P1 read-only

Ngày 03/10/2026, profile đang dùng được chốt bằng `tools/profile-audit.cjs` và kiểm bằng `tools/check-profile.cjs`. Kết quả nằm ở `evidence/profile-audit.json` và `evidence/profile-checks.json`; profile `jx6-client6-8121c6020d56c86f` hiện ghi nhận 1.257 dòng skill client, 1.237 dòng skill server, 462 missile mỗi phía và 31 PAK có hash.

P1 đã thêm `tools/raw-tsv.cjs`: parser giữ raw byte/CRLF và byte span từng ô để chuẩn bị diff tối thiểu. `tools/check-raw-tsv.cjs` đạt 7/7 kiểm tra trên `Client6.0/settings/skills.txt`, gồm round-trip nguyên byte, duplicate 521 và chặn control byte/Unicode ngoài Latin-1. Kết quả ở `evidence/raw-tsv-checks.json`.

Dialog tạo skill/đường đạn/tầng dùng `JXModel.nextDraftId` để tính cả catalog và các draft đã tạo trong phiên. ID này là đề xuất provisional; validator vẫn yêu cầu kiểm giới hạn engine trước khi xuất.

P1 Lua span dùng `tools/raw-lua.cjs` và `tools/check-raw-lua.cjs`: kiểm 5/5 trên bảng `wudang_jianfa.addphysicsdamage_p`, thay literal trong buffer theo byte span, giữ comment/encoding và không chạy Lua. Artifact: `evidence/raw-lua-checks.json`.

P1 INI span dùng `tools/raw-ini.cjs` và `tools/check-raw-ini.cjs`: kiểm 5/5 trên `gamesetting.ini` và `skilltemplate.txt`, giữ section/key/value, newline và giá trị có dấu `=`. Artifact: `evidence/raw-ini-checks.json`.

Stage-only patch planner dùng `tools/staged-patch.cjs` và `tools/check-staged-patch.cjs`: kiểm 8/8 trên snapshot hiện hành, tạo kế hoạch thay ô TSV và span Lua có hash trước/sau, chặn duplicate ID, dòng mới, Lua mới và PNG chưa chuyển SPR. Planner không ghi Client/Server, không SSH và không thực thi Lua. Artifact: `evidence/staged-patch-checks.json`.

Apply adapter dùng `tools/apply-staged-patch.cjs`; mặc định dry-run, còn chế độ ghi yêu cầu cờ rõ ràng và luôn backup/journal/read-back/rollback. Kiểm thử sandbox tại `tools/check-apply-staged-patch.cjs`; chưa cho phép deploy live.

Các lệnh tái lập:

```powershell
node tools/profile-audit.cjs
node tools/check-profile.cjs
node tools/check-raw-tsv.cjs
node tools/check-raw-lua.cjs
node tools/check-raw-ini.cjs
node tools/check-staged-patch.cjs
node tools/check-apply-staged-patch.cjs
node tools/check-demo.cjs
node tools/check-workspace.cjs
node tools/check-resources.cjs
pwsh -File tools/check-updater.ps1
```

P0/P1 không ghi Client/Server, không kết nối SSH, không đọc memory và không thay đổi vòng đời service. PAK precedence, giới hạn ID, action 14 và cast timing live vẫn là cổng chưa nghiệm thu.

