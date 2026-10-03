# Revision 08 / App 0.6.2 — composite action và nhịp cast

Ngày 03/10/2026. Bản 0.6.2 tiếp tục từ release `v0.6.1` và không ghi đè tag cũ.

## Preview action

`tools/build-resources.cjs` đọc các bảng component trong `Client6.0/settings/npcres` và lưu mapping cùng action/frame cho:

- `Body`: thân nhân vật;
- `LeftHand`: tay trái;
- `RightHead`: tay phải theo tên cột gốc của client;
- `LeftWeapon`, `RightWeapon`: vũ khí theo tư thế;
- `Shoulder`, `Head`, `Hair`, `Mantle`: vai/áo, đầu, tóc và phi phong.

`demo/app.js` lọc từng path theo trạng thái giải mã. Canvas ghép các lớp sẵn sàng theo cùng frame và tâm SPR; lớp thiếu không bị thay bằng ảnh giả, mà được ghi trong `action-timing`. Action 14 vẫn được đánh dấu chưa có mapping vì bảng `NpcAction` chỉ có 0–13.

## Cast và interval

Preview có hai vùng độc lập:

- `Action nhân vật · composite`: chỉnh `Interval action` và bật tùy chọn ghép effect cast đang chọn;
- `Hiệu ứng skill / đường đạn`: chọn từng `PreCastSpr`/`AnimFileB*`, chỉnh `Interval hiệu ứng`.

Timing dùng `WaitTime`, `TimePerCast`, `LifeTime` theo giả định 18 tick/giây. Interval override tối thiểu 16 ms/frame và chỉ tác động preview, không tự ghi vào game.

## Update và startup

Native host tự kiểm tra GitHub Releases sau khi UI sẵn sàng. Nút `Kiểm tra cập nhật` gọi cùng một luồng có khóa chống chạy song song. Khi có release mới, hộp thoại nêu rõ:

- **Yes**: tải ZIP Full, kiểm SHA-256, giữ `Data/`, đóng bản hiện tại, chạy updater và mở bản mới;
- **No**: giữ bản hiện tại.

WebView2 startup có timeout 30 giây, log xoay tại `Data/native.log`, thử fixed runtime rồi system runtime và profile recovery riêng nếu profile cũ lỗi. Backup demo không được đưa vào thư mục `ui` của portable.

## Kiểm tra phát hành

```powershell
node tools/build-resources.cjs
node tools/check-demo.cjs
node tools/check-workspace.cjs
node tools/check-resources.cjs
pwsh -File tools/check-updater.ps1
dotnet build native/SkillStudio.App/SkillStudio.App.csproj --no-restore
pwsh -File native/build-portable.ps1
```

Snapshot vẫn là loose/PAK offline; chưa xác minh thứ tự PAK và renderer live của client. Changeset luôn `deployable=false`.
