# P0 Profile Audit — JX Linux 6.0 / Client6.0

Ngày bắt đầu: 03/10/2026.

P0 khóa phạm vi dữ liệu trước khi thêm SSH, deploy hoặc tuyên bố preview giống game. Audit chỉ đọc các root hiện có, không ghi client/server, không đọc bộ nhớ tiến trình và không khởi động lại dịch vụ.

## Cách tái lập

```powershell
node tools/profile-audit.cjs
```

Kết quả đầy đủ nằm ở [evidence/profile-audit.json](evidence/profile-audit.json). Script ghi hash theo luồng, nên không nạp toàn bộ PAK vào RAM.

## Profile mục tiêu

- Client: `Client6.0`, executable candidates `game.exe` và `game_offline.exe`.
- Server local: `Server 6.0/server_moi/jxser_bachkim_6.0/server1`.
- WSL snapshot: distro `VLTK_Offline`, root `/home/jxser_bachkim_6.0/server1`.
- Nguồn học skill đã chụp từ `script/global/skills_table.lua` và `settings/skills.txt` trong WSL.

## Đã khóa được

- Client có `settings/skills.txt`, `settings/missles.txt`, `package.ini`, template enum, faction và npcres.
- Server local có bảng skill/missile và thư mục Lua skill.
- `package.ini` hiện liệt kê 31 PAK theo thứ tự khai báo; report lưu tồn tại, kích thước và SHA-256 từng PAK.
- Bảng client hiện có 1.236 dòng, 1.235 ID; bảng server có bản riêng và được so sánh header/bytes.
- Evidence WSL được chụp lại trong cùng lượt audit; hash và thời điểm nằm trong `capturedSnapshot`.

## Cổng còn mở

1. **PAK precedence:** thứ tự trong `package.ini` chỉ là quan sát cấu hình; chưa chứng minh thứ tự lookup thực tế của engine và loose override.
2. **Giới hạn ID:** chưa có binary/profile evidence để kết luận ngưỡng an toàn cho SkillId/MissleId; Auto-ID chỉ được provisional.
3. **Duplicate 521:** giữ cảnh báo nguồn, không tự chọn last-wins.
4. **Phân loại phái:** 13 nhóm trong faction catalog không đồng nghĩa 13 phái người chơi; UI phải tách learned/script-only/NPC/unknown.
5. **Action 14 và cast:** chưa có mapping runtime; 18 tick/giây chỉ dùng cho mô phỏng có nhãn.
6. **License:** PAK/SPR của game chỉ dùng local/private evidence; không đưa vào public release nếu chưa có quyền.

P1 chỉ được mở sau khi profile này được dùng làm input cho parser byte-preserving và mọi giá trị chưa xác minh vẫn giữ trạng thái `unknown`.
