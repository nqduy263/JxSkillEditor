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
- evidence/resource-checks.json: 626 SPR / 28.567 frame; kiểm payload và decoder.
- evidence/demo-checks.json: 41 kiểm tra logic/UI handler.
- evidence/animation-contact-sheet.png: mẫu frame ghép thân/đầu + missile #136, không phải ảnh chụp UI.
- REVISION_03.md: giải thích mã action 14 và CharClass 3.

Có 626/667 SPR đọc được. 40 path thiếu, 1 container chưa hỗ trợ; không thay bằng hiệu ứng giả. Action 0–13 dựa trên thứ tự bảng NpcAction; 14 chưa có mapping, giả thuyết không phát động tác chưa kiểm engine. Preview thân + đầu chuẩn 001; chưa ghép trang bị/ngựa live hoặc mô phỏng va chạm/timing.

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

