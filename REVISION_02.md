# Sửa dữ liệu và mở rộng editor — v0.2

## Vấn đề đã xác định

Demo v0.1 dùng cache JSON tổng hợp và không phân biệt skill nhân vật với các dòng kỹ thuật. ID 3 “Thiếu Lâm Kiếm pháp” tồn tại ở dòng 4 của client skills.txt, đường dẫn Lua saolin/… khác shaolin.lua. ID này không có AddMagic trong add_sl của bảng học khảo sát. ID 5/7 và nhiều dòng (##) cũng không được chứng minh là skill đang học. Giải pháp: giữ raw row để tra cứu, loại khỏi danh sách môn phái mặc định, dùng mapping có nguồn. Không bịa tên thay thế.

Danh sách Thiếu Lâm có lệnh học gồm #4 Côn pháp, #6 Đao pháp, #8 Quyền Pháp và #10/11/14/15/16/19/20/21/271/273/318/319/321; tên lấy nguyên văn TCVN3 từ client. Danh sách từng phái ở evidence/faction-catalog.json.

Những sai lệch khác tránh được:

- Weapon -1 trong gamesetting.ini là Tay không; cache cũ ghi Không hạn chế.
- ID 549 thuộc script partner/resistance, ID 1010 thuộc jingangbuhuaishendan; không dùng danh sách hardcode từ script trích xuất cũ để gán vào Thiếu Lâm.
- Trùng SkillId 521 ở dòng 522/523; demo cảnh báo, chưa xác minh last-wins của engine.
- Lua shaolin_quanfa có hai addphysicsdamage_p; định nghĩa cuối cấp 20 cho P1=215, không dùng dòng trước 415. Parser có byte span và duplicate count.
- Client và server_moi khác snapshot live; đã kiểm tra process path/cwd và lấy bảng học từ server đang chạy.

## Các nhóm chỉnh sửa đã thêm

| Nhóm | Trường và thao tác |
|---|---|
| Hiển thị | SkillName, Property, SkillDesc markup, Attrib từ gamesetting, ReqLevel/MaxLevel, ShowAddition/ShowEvent, LevelUpScript |
| Cast/mục tiêu | AttackRadius, CostValue/SkillCostType, TimePerCast/OnHorse, WaitTime, CharAnimId, DoHurt, melee/physical/AR, mọi Target flag, EqtLimit/HorseLimit |
| Theo cấp/sát thương | 20 LvlSetting/LvlData, LvlSetScript, resolve SKILLS[key][property], raw literal editor, P1/P2/P3, source/hash/byte span, unknown thay vì số 0 giả |
| Tầng | ChildSkillId/Level/Num, BaseSkill/ByMissle, MslsGenerate/Data, MisslesForm, Param1/2, start/fly/collide/vanish flags/IDs, event level; cây liên kết có vòng lặp/độ sâu |
| Missile | 57 cột: MoveKind/FollowKind, Speed/LifeTime/Zspeed/Zacc, CollidRange/IsRangeDmg/DmgRange/DmgInterval, flags va chạm, AnimFile/SndFile 1..4/B1..B4, loop/frame/light |
| Icon/hiệu ứng | SkillIcon path, icon picker có tài nguyên nguồn, PNG/JPEG preview, PreCastSpr, sounds nam/nữ, StateSpecialId/Priority, Aura/shadow |
| Tạo/sửa | Clone ID/tên, kiểm trùng, sửa toàn bộ cột, diff, undo, changeset các file/tài nguyên dùng chung |

Phân biệt bảng gốc và override theo cấp. Tầm đánh/tiêu hao/số đạn/tốc độ không được giả định chỉ nằm ở một cột. Các con số sát thương là thuộc tính skill, chưa là damage cuối lên người/quái.

## Bằng chứng live chỉ đọc

- game.exe PID 51800, game_offline.exe PID 28984: Client6.0 tại workspace.
- jx_linux_y PID 2429: cwd `/home/jxser_bachkim_6.0/server1` trong VLTK_Offline.
- Bảng học live SHA-256: `4f8d9e3557b2d6e802558cae6804b4855effe511d901cc407526b32377b4533a`.
- Bảng skill live SHA-256: `02ae1f5dfe8b5f3647ead508fe27190e7eb34d893b3568114be5c641d7cf1d68`.

PID là quan sát tại thời điểm kiểm tra, có thể đổi sau restart. Snapshot chưa chứng minh nội dung RAM hoặc thứ tự nạp PAK. Lệnh học có điều kiện; không có nghĩa nhân vật online hiện đã học.

## Kiểm chứng

tools/check-demo.cjs kiểm tra tên mọi ID so với byte nguồn, nhóm Thiếu Lâm không lẫn ID 3/5/7/17, nhãn vũ khí client, schema đầy đủ, interpolation/extrapolation, P1/P3 có index, từ chối execute biểu thức, duplicate Lua, child missile/event, form/diff/icon/clone/export/undo. Kết quả cuối ở evidence/demo-checks.json; không gọi là nghiệm thu browser hoặc engine.

Đã sao lưu toàn bộ SkillStudio trước sửa. Không thay đổi file Server/Client.
