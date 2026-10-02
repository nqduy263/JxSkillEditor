# Revision 0.5 — preview hiệu ứng skill

Ngày 02/10/2026. Skill được chọn nay tự resolve `PreCastSpr`, `ChildSkillId` và các liên kết sự kiện đang bật tới missile/SPR. Giao diện đặt action nhân vật và hiệu ứng skill ở hai khung riêng. Có danh sách pha, interval xem thử (ms/frame) và mô phỏng chờ cast từ `WaitTime` với giả định 18 tick/s. Bản xem thử không mô phỏng đầy đủ pipeline hiệu ứng, đồng bộ thân/đạn, va chạm hoặc damage trong engine live.

Ví dụ xác nhận: SkillId 14 `Hàng Long Bất Vũ` trong `Client6.0/settings/skills.txt` trỏ ChildSkillId 66; missile 66 trong `Client6.0/settings/missles.txt` gắn `AnimFile2=\spr\skill\ÉÙÁÖ\sl_03_ÐÐÁú²»Óê.spr`. SPR giải mã từ `Client6.0/skills.pak`, 15 frame, interval header 50 ms.

Nguồn dữ liệu: `skills.txt` cho tên, mô tả, đường dẫn icon, action, timing và liên kết; `missles.txt` cho animation/đường đạn; `package.ini` cho danh sách PAK; SPR thực từ PAK; `script/skill/*.lua` cho công thức cấp; `gamesetting.ini` cho nhãn thuộc tính và giới hạn vũ khí; `npcres/npc¶¯×÷±í.txt` và bảng pose cho animation nhân vật. Icon PNG của demo là cache `Simcity/web/assets/skill_icons`, chưa đối chiếu mọi icon SPR trong PAK. `demo/data.js` và `demo/choices.js` là snapshot được build từ nguồn này.

Kiểm tra: `node tools/check-demo.cjs` 48 checks; `node tools/check-workspace.cjs` 25 checks; `node tools/check-resources.cjs` 5 nhóm, 626 SPR ready. Chưa QA giao diện bằng browser và chưa đối chiếu timing với engine live. Không ghi file game; export vẫn deployable=false.
