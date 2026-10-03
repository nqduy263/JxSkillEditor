# Revision 07 / App 0.6.1 — giao diện nhận diện và release cập nhật

Ngày 03/10/2026. Bản `0.6.1` đồng bộ phiên bản trong native host, manifest, demo browser và build portable. Giao diện dùng logo `demo/icon.png`; EXE và cửa sổ Windows dùng `native/SkillStudio.App/app.ico`. Các nguồn icon kích thước 16–512 được giữ trong `resources/icons` để tái tạo hoặc thay đổi nhận diện sau này.

Gói được đóng theo quy ước `JXSkillStudio-0.6.1-win-x64-Full.zip`. GitHub Release tag `v0.6.1` là bản cao hơn `v0.6.0`, vì vậy bản 0.6.0 sẽ phát hiện qua `releases/latest`, hỏi Yes/No và chỉ cài sau khi kiểm SHA-256. Workspace `Data/` không nằm trong ZIP và được giữ khi updater thay tệp.

Kiểm tra cần chạy trước phát hành: `node tools/check-demo.cjs`, `node tools/check-workspace.cjs`, `node tools/check-resources.cjs`, `pwsh -File tools/check-updater.ps1`, `pwsh -File native/build-portable.ps1`, self-test native và `tools/publish-release.ps1 -Version 0.6.1`.

Giới hạn vẫn giữ nguyên: chưa QA layout GUI bằng browser trong môi trường này, chưa thử nâng cấp thật giữa hai máy Windows, và preview cast là mô phỏng theo dữ liệu snapshot client chứ chưa xác nhận toàn bộ timing engine live.
