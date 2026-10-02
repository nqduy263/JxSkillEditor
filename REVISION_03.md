# Revision 03 — Tạo skill mới và preview animation

Ngày: 01/10/2026. Phạm vi: SkillStudio, dữ liệu client/server chỉ đọc.
Backup trước sửa: SkillStudio.bak_20261001_214111.

## 1. Tạo mới

Nút **Tạo skill mới** nhận ID, tên, môn phái. Khởi tạo đủ 113 cột nhưng các thuộc tính gameplay, icon, animation và sát thương chờ người tạo khai báo; không lấy thông tin từ skill đang chọn. Các tham chiếu child/event bắt đầu ở 0. Đường dẫn Lua riêng là `\\script\\skill\\custom_<id>.lua`; mới là khai báo draft, chưa tạo file trong game.

- Định danh được kiểm tra nguyên dương và trùng ID trong catalog/draft. Giới hạn ID engine chưa xác minh.
- Tạo thuộc tính từ danh sách LvlSetting và khóa riêng skill_<id>; nhập P1/P2/P3 tại cấp 1 và cấp tối đa hoặc sửa bảng mốc.
- **Tạo đường đạn mới** tạo đủ 57 cột và gắn ChildSkillId vào ID missile mới. Hộp thoại ghi rõ thay thế liên kết trực tiếp hiện tại.
- **Tạo tầng skill mới** tạo SkillId riêng, chọn liên kết chiêu con / xuất chiêu / bay / va chạm / tan biến; tự bật cờ sự kiện tương ứng.
- Export v0.3 có creation=blank, isNew, dữ liệu missile mới, bảng Lua mới và môn phái do người dùng chọn. deployable=false.

## 2. Danh sách và giải thích

| Nhóm | Nguồn |
|---|---|
| CharClass, SkillStyle, MslsGenerate, MisslesForm, LRSkill, loại tiêu hao | Client6.0/settings/skilltemplate.txt |
| MoveKind, FollowKind | Client6.0/settings/missletemplate.txt; dịch nhãn GBK |
| EqtLimit, Attrib | Client6.0/settings/gamesetting.ini |
| Action 0–13 | npcres/npc¶¯×÷±í.txt; thứ tự từ 0, mapping theo bảng vũ khí nam/nữ |
| StateSpecialId | npcres/×´Ì¬Í¼ÐÎ¶ÔÕÕ±í.txt |
| Chiêu con và tầng sự kiện | SkillId/MissleId trong catalog + draft |
| Thuộc tính theo cấp | 20 cặp LvlSetting/LvlData và các bảng Lua đã đọc |

**CharClass=3 là Mộc**, theo thứ tự Vô hệ/Kim/Thủy/Mộc/Hỏa/Thổ trong template client.

**CharAnimId=14:** bảng NpcAction có 14 dòng, chỉ phủ mã 0–13. Mã 14 xuất hiện ở 137 dòng skill, gồm Thiếu Lâm Côn pháp. Có khả năng là mã không phát động tác, nhưng chưa có bằng chứng engine để khẳng định. Giao diện ghi “Không có dòng action tương ứng” và giải thích; không lấy một SPR của mã khác để thay thế.

Mã có trong dữ liệu nhưng chưa có enum đáng tin cậy được giữ trong list với nhãn chưa xác minh. Flag số 0/1 được trình bày Tắt/Bật; không dùng thứ tự Đúng/Sai mâu thuẫn ở missiletemplate để đảo nghĩa.

## 3. Animation thật

- Đọc chỉ mục PACK, hash đường dẫn raw Latin-1/GBK, UCL và một số container SPR nén frame. Dựa trên code cục bộ PakEngine.cs, SprTool.cs.
- Resolver snapshot ưu tiên loose rồi PAK đầu tiên theo package.ini; lưu PAK ứng viên, entry/hash path, hash SPR đã giải nén. Chưa xác nhận đây là thứ tự engine live.
- 667 đường dẫn duy nhất; **626 giải mã được, 41 chưa đọc được** (40 thiếu trong nguồn khảo sát, 1 container không hỗ trợ).
- Tổng **28.567 frame**, 612 SPR có nhiều frame trên một hướng; 144 SPR thân/đầu cho preview action nam/nữ.
- Play/Pause, hướng, scrub, tốc độ xem; giữ palette/alpha/frame offset/origin, phóng vừa khung.
- Action preview ghép thân và đầu chuẩn 001, đổi tư thế theo bảng vũ khí. Chưa ghép áo, tay, tóc, vũ khí/ngựa của nhân vật live; chưa tái tạo thứ tự render động từng hướng.
- PreCastSpr, AnimFile1–4/B1–B4 và StateSpecialId có đường dẫn SPR đều có preview.
- Chọn & xem SPR mở hộp thư viện: chọn để xem trước, bấm Dùng animation để áp dụng; Hủy giữ trường cũ.
- Một SPR có header 17 frame / 16 hướng: chuyển sang xem toàn bộ frame gốc, ghi rõ chưa tách hướng.
- Interval chỉ dùng làm nhịp xem tài nguyên; chưa khẳng định timing cast/missile theo game.

## 4. Kiểm tra và giới hạn

41 kiểm tra data/model/UI-handler qua Node VM và 5 nhóm kiểm tra resource thành công. Kiểm tất cả 626 payload đóng gói bằng SHA256, giải mã mọi frame; có kiểm tra dữ liệu hỏng, đổi hướng/scrub/play, ghép thân/đầu, tạo mới độc lập và undo tầng.

Ảnh evidence/animation-contact-sheet.png gồm các frame gốc của action Magic và đường đạn #136; đã xem để kiểm tra ảnh và alpha. Đây là kiểm tra decoder, không là screenshot UI hoặc bằng chứng game live.

Browser tích hợp đã chặn file:// từ lượt trước; không đổi bề mặt/trình duyệt để đi vòng. Chưa nghiệm thu layout, font, download trên Edge/Chrome thật. Cần người tiếp nhận mở demo trực tiếp trên máy.

Không chỉnh file game, không restart/reload server, không ghi SSH/PAK. Bản Windows portable/backend, lưu workspace bền vững/import JSON, dựng Lua đầy đủ và patch triển khai còn trong MASTER_BUILD.
