# JX Skill Studio v0.6.1 Alpha

Windows portable alpha: `releases/JXSkillStudio-0.6.1-win-x64/JXSkillStudio.exe`. Bản Full có runtime đi kèm; giải nén toàn bộ thư mục và chạy EXE.

Mở **demo/index.html** bằng Edge/Chrome, giữ nguyên toàn bộ thư mục demo (đặc biệt animations). Nếu đang mở bản cũ, reload trang.

## Có gì mới

- **Tạo skill mới từ đầu:** ID, tên, môn phái riêng; tự khai báo action, mục tiêu, icon, sát thương và hiệu ứng.
- Dropdown có giải thích và nguồn: action, CharClass, loại skill, cách sinh đạn, quỹ đạo, chiêu con và các tầng sự kiện.
- Tạo bảng số Lua riêng, đường đạn mới và tầng skill mới ngay trong editor.
- Preview SPR thật khi chọn: phát/dừng, chọn hướng, kéo frame, tốc độ xem; thân + đầu nhân vật chuẩn nam/nữ.
- 626/667 tham chiếu SPR giải mã được; 28.567 frame. 41 tài nguyên chưa đọc được được ghi rõ.

## Tài liệu

- MASTER_BUILD.md — kiến trúc và kế hoạch bản Windows portable.
- MASTER_REPORT.md — trạng thái, bằng chứng và rủi ro.
- HANDOFF.md — thao tác demo và tái lập.
- REVISION_03.md — thay đổi tạo mới, danh sách chọn, animation.
- evidence/demo-checks.json và evidence/resource-checks.json — kiểm tra logic và decoder.

EXE tự lưu workspace v1 vào `Data/`, có Mở/Lưu workspace, import v0.3 đã kiểm tra nguồn, validator liên kết/Lua/encoding/tài nguyên và discovery chỉ đọc process/WSL. Chưa có SSH write, patch game hoặc mô phỏng cast hoàn chỉnh; changeset luôn deployable=false. GUI thật chưa QA trong lượt này.

Tái lập kiểm tra: `node SkillStudio/tools/check-demo.cjs`, `node SkillStudio/tools/check-workspace.cjs`, `node SkillStudio/tools/check-resources.cjs`, `pwsh -File SkillStudio/native/build-portable.ps1`.

## Bản 0.5.0

Preview skill tự hiện SPR đường đạn theo liên kết nguồn, có pha, chờ cast mô phỏng và interval xem thử. Xem REVISION_05.md.


## Bản 0.6.0: cập nhật tự động

Bản native kiểm tra GitHub release khi mở. Nếu có bản mới, chọn Yes để tải, xác minh SHA-256, cài vào thư mục portable và mở lại; chọn No để dùng bản cũ. Giữ thư mục có quyền ghi; Data/ được bảo toàn. Xem REVISION_06.md.

## Bản 0.6.1: nhận diện ứng dụng

Đổi logo trong giao diện và biểu tượng EXE, đồng bộ phiên bản native/web/demo lên 0.6.1. Gói này là release mới để bản 0.6.0 tự phát hiện và đề nghị cập nhật.

