# JX Skill Studio — MASTER REPORT

## Báo Cáo Thẩm Định & Rà Soát Toàn Diện Hệ Thống (Cập nhật 03/10/2026 · App 0.6.2)

Báo cáo này tổng hợp kết quả rà soát chi tiết toàn bộ phần mềm **JX Skill Studio**, đánh giá sâu về mặt kỹ thuật, trải nghiệm người dùng (UX), phân tích ưu - khuyết - lỗi, và định hình giải pháp kiến trúc để **người dùng chưa có kiến thức kỹ thuật vẫn có thể tự tay tạo chiêu thức VLTK hoàn chỉnh**.

---

## 1. Rà Soát Hiện Trạng Các Phân Hệ Tính Năng

| Phân hệ tính năng | Trạng thái hiện tại | Bản chất kỹ thuật & Dữ liệu |
| :--- | :--- | :--- |
| **1. Thư viện kỹ năng (Catalog)** | Hoạt động tốt | Đọc trực tiếp dữ liệu client gốc (`skills.txt`, `gamesetting.ini`). Lọc 13 môn phái, phân loại 170 skill có lệnh học thật trong snapshot server WSL, 288 skill theo script và nhóm nội bộ. Tìm kiếm theo tên (có/không dấu) và ID. |
| **2. Biên tập thuộc tính (113 cột)** | Hoạt động tốt (Pro) | 8 nhóm tab (`Hiển thị`, `Cast & mục tiêu`, `Sát thương / cấp`, `Tầng`, `Đường đạn`, `Icon & hiệu ứng`, `Cột gốc`, `Diff`). Dropdown có nhãn tiếng Việt giải thích mã enum (CharClass, SkillStyle, Target...). |
| **3. Bảng số Lua & Sát thương** | Hoạt động tốt | Quản lý 20 slot `LvlSetting`/`LvlData`. Evaluator đánh giá công thức nội suy/ngoại suy tuyến tính `floor-link` (`{{{1, P1}, {20, P2}}}`). Cho phép xem trước chỉ số tại cấp 1–1000. Có trình nhập mốc cấp 1 và cấp 20. |
| **4. Chuỗi tầng kỹ năng (Layers)** | Hoạt động tốt | Quản lý quan hệ `ChildSkillId`, `StartSkillId`, `FlySkillId`, `CollidSkillId`, `VanishedSkillId`. Cây phân cấp trực quan, chặn vòng lặp vô hạn và giới hạn độ sâu 8 tầng. |
| **5. Biên tập đường đạn (Missiles)** | Hoạt động tốt | 57 cột `missles.txt`, tạo đạn mới hoặc sửa đạn dùng chung. Cấu hình kiểu bay, vận tốc, bán kính va chạm, thời gian tồn tại `LifeTime`. |
| **6. Xem trước hoạt họa (SPR Preview)** | Hoạt động tốt (v0.6.2) | Catalog hiện có 3.550 SPR ready và 307.186 frame đã decode. Composite action đọc mapping `npcres` theo action/tư thế và ghép thân, đầu, tóc, vai/áo, hai tay, vũ khí, phi phong khi nguồn có sẵn; lớp thiếu hiển thị rõ trong timing. Có Play/Pause, hướng, scrub, tốc độ, interval action/effect và tùy chọn ghép effect cast. Mô phỏng WaitTime, TimePerCast, LifeTime ở 18 tick/s. |
| **7. Quản lý Workspace & Lưu trữ** | Hoạt động tốt | Host C# WinForms lưu atomic file vào `Data/workspace.autosave.jxworkspace`, cơ chế sao lưu `workspace.previous` và cách ly khi hỏng. Mở/Lưu tệp `.jxworkspace`. Xuất changeset JSON. |
| **8. Bộ kiểm tra dữ liệu (Validator)** | Rất chặt chẽ | Báo lỗi trùng ID (521), thiếu tham chiếu (broken link), vòng lặp liên kết, lỗi cú pháp/hàm Lua ngoài subset, ký tự điều khiển TSV, vi phạm bảng mã TCVN3, đường đạn/SPR thiếu, ảnh PNG chưa đổi thành SPR. |
| **9. Nhận diện tiến trình & WSL** | Read-only an toàn | Quét tiến trình Windows (`game.exe`, `game_offline.exe`), xác định root client; quét distro WSL Linux (`VLTK_Offline`) đọc `skills_table.lua`. Không đọc bộ nhớ RAM nhân vật, không ghi đè server. |
| **10. Tự cập nhật & Nhận diện** | Hoạt động tốt (v0.6.2) | Kiểm tra GitHub Releases `nqduy263/JxSkillEditor`, xác minh SHA-256 digest, tải ZIP Full và tự động cập nhật ngoài tiến trình. Icon Kim Long chính thức nhúng trực tiếp vào EXE, Taskbar và Web UI. |

---

## 2. Đánh Giá Toàn Diện: Ưu Điểm, Khuyết Điểm & Lỗi Tiềm Ẩn

### 2.1. Ưu Điểm Nổi Bật (Strengths)
1. **Độ trung thực dữ liệu tuyệt đối:**
   - Không bịa đặt dữ liệu hay làm đẹp giả tạo. Phân định rạch ròi nguồn gốc: tên từ client TCVN3, sát thương từ script Lua server WSL, phân loại môn phái đối chiếu hàm `AddMagic` thực tế.
   - Giữ nguyên các giá trị đặc thù của engine (như ID 3 Thiếu Lâm Kiếm pháp, ID trùng 521).
2. **Kiến trúc Portable an toàn & Bảo toàn tệp tin:**
   - Đóng gói trọn vẹn WinForms + WebView2 Fixed Runtime, chạy ngay không cần cài đặt.
   - Sandbox chặn 100% request ra internet ngoài luồng (trừ updater có kiểm tra SHA-256). Cơ chế atomic file write đảm bảo không bao giờ bị hỏng file workspace khi mất điện đột ngột.
3. **Trực quan hóa tài nguyên thật từ Game:**
   - Giải mã trực tiếp file nén `.pak` và định dạng sprite `.spr` của Kingsoft. Người dùng nhìn thấy chính xác hoạt họa chiêu thức và tư thế nhân vật chuẩn của game.
4. **Bộ kiểm tra (Validator) chuyên sâu:**
   - Ngăn chặn triệt để các lỗi kỹ thuật thường gây "crash server" hoặc "văng client" (như lệch codepage TCVN3, tab ẩn trong file TSV, vòng lặp sự kiện skill vô tận).

### 2.2. Khuyết Điểm & Rào Cản Trải Nghiệm (Weaknesses & UX Barriers)
1. **Rào cản học thuật quá lớn đối với người mới:**
   - Giao diện thiết kế theo tư duy của lập trình viên / data engineer: hiển thị 113 cột dữ liệu thô với các thuật ngữ khó hiểu như `CharAnimId`, `LvlSetting1..20`, `LvlData1..20`, `ChildSkillId`, `ByMissle`, `WaitTime (tick 18)`.
   - Một người không biết code VLTK khi mở phần mềm sẽ hoàn toàn bối rối, không biết bắt đầu từ đâu để tạo một chiêu thức cơ bản.
2. **Quy trình tạo chiêu bị phân mảnh:**
   - Để tạo một chiêu thức hoàn chỉnh có đạn bay và sát thương, người dùng phải tự tay thực hiện 4 công đoạn rời rạc:
     1. Tạo Skill cha ở tab Hiển thị.
     2. Sang tab Sát thương cấu hình `LvlSetting`, gán khóa `LvlData`, tự viết bảng số Lua `{{{1, 100}, {20, 1500}}}`.
     3. Sang tab Đường đạn bấm "Tạo đường đạn mới", cấu hình 57 cột của missile.
     4. Sang tab Tầng liên kết gán ID đường đạn vào `ChildSkillId` và bật cờ `ByMissle=1`.
   - Người mới gần như chắc chắn sẽ quên hoặc làm sai ít nhất 1 trong 4 bước này.
3. **Chưa có cơ chế 1-Click Patch thẳng vào Game:**
   - Ứng dụng hiện tại chỉ xuất file `.jxworkspace` và file JSON với cờ `deployable=false`. Người dùng vẫn phải biết cách dùng công cụ bên ngoài để chép đè vào `skills.txt`, copy vào server Linux và nạp lại server.
4. **Hiển thị sát thương trừu tượng:**
   - Tab sát thương chỉ trả về các số `P1, P2, P3` vô hồn, không giải thích thành chỉ số chiến đấu thực tế (ví dụ: `Gây 1.250 điểm sát thương Hỏa sát, làm chậm mục tiêu 40% trong 2.5 giây`).
5. **Duyệt hiệu ứng SPR còn thủ công:**
   - Danh sách SPR hiển thị theo đường dẫn nội bộ tiếng Trung / Mojibake (`sl_03_ÐÐÁú²»Óê.spr`), người dùng không thể biết đó là chưởng rồng, tia sét, đao khí hay bão tuyết nếu không bấm vào xem từng cái một.

### 2.3. Lỗi Kỹ Thuật & Rủi Ro Tiềm Ẩn Cần Khắc Phục (Bugs & Safety Risks)
1. **Rủi ro xung đột ID khi nhập thủ công (ID Collision Risk):**
   - Khi bấm "Tạo skill mới", phần mềm yêu cầu nhập `ID mới`. Nếu người dùng gõ trùng ID có sẵn hoặc vượt ngưỡng tối đa mà game engine hỗ trợ (ví dụ > 1024 hoặc tùy core server), game sẽ hỏng cấu trúc dữ liệu.
2. **Rủi ro lệch đồng bộ Client - Server (Desync Vulnerability):**
   - Tên skill và SPR nằm ở Client, nhưng logic sát thương nằm ở file Lua Server. Nếu tạo skill ở client mà không đồng bộ bảng Lua tương ứng lên server thì khi vào game bấm chiêu sẽ không có tác dụng.
3. **Lỗi mã hóa đường dẫn SPR tùy nhập (Path Encoding Bug):**
   - Nếu người dùng copy-paste một đường dẫn SPR có ký tự Unicode tiếng Việt hoặc ký tự đặc biệt, validator sẽ văng lỗi `path-encoding` (ngoài dải Latin-1/GBK) nhưng không có công cụ tự động làm sạch hoặc chuyển đổi.
4. **Mô phỏng đạn đa tia chưa đầy đủ (Multi-projectile Simulation Gap):**
   - Module `cast.js` hiện tại chỉ mô phỏng đường bay của 1 tia đạn đơn lẻ. Với các chiêu thức bắn hình quạt (5 tia, 9 tia) hoặc xoay vòng tròn xung quanh nhân vật (như Vô Ngã Vô Kiếm, Vạn Kiếm Quy Tông), màn hình preview chưa phản ánh đúng quỹ đạo chùm.
5. **Quyền ghi tệp trên Windows (Windows Permissions & UAC):**
   - Nếu người dùng giải nén phần mềm vào `C:\Program Files\`, tiến trình tự lưu và bộ tự cập nhật PowerShell sẽ bị Windows chặn quyền (Access Denied).

---

## 3. Đề Xuất Giải Pháp: "Thiết Kế Skill Cho Người Không Biết Gì"

Để bất kỳ game thủ hoặc admin nào mở phần mềm lên cũng có thể tạo được chiêu thức trong vòng 2 phút, hệ thống cần bổ sung chế độ **"Easy Studio / Skill Creation Wizard"** chạy song song với chế độ Pro hiện tại:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                        CHẾ ĐỘ GIAO DIỆN (MODE SWITCH)                    │
│      [⭐ DỄ HIỂU: TRỢ LÝ TẠO SKILL]        [⚙ CHUYÊN SÂU: PRO WORKBENCH]   │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
┌───────────────────────────┐                   ┌───────────────────────────┐
│   SKILL WIZARD 4 BƯỚC     │                   │   VIRTUAL COMBAT SANDBOX  │
│ 1. Chọn hệ & phong cách   │                   │ • Thử chiêu trên búp bê gỗ│
│ 2. Chọn thế đánh/action   │ ───────────────>  │ • Nảy số sát thương popup │
│ 3. Chọn hiệu ứng (Visual) │                   │ • Xem bán kính quét thật  │
│ 4. Kéo thanh trượt dame   │                   │ • Nghe âm thanh va chạm   │
└─────────────┬─────────────┘                   └───────────────────────────┘
              │
              ▼
┌───────────────────────────────────────────────────────────────────────────┐
│             HỆ THỐNG TỰ ĐỘNG HÓA NGẦM (ZERO-CONFIGURATION)               │
│  • Tự tìm ID an toàn kế tiếp (Auto-ID Allocator)                         │
│  • Tự sinh chuỗi liên kết: Skill cha ──> Missile ──> Event Collide       │
│  • Tự sinh mã nguồn Lua chuẩn (`script/skill/*.lua`)                     │
│  • 1-Click Game Deploy: Ghi thẳng vào Client/Server & Tạo lệnh học GM    │
└───────────────────────────────────────────────────────────────────────────┘
```

### Chi tiết 5 tính năng cốt lõi dành cho người mới:

#### 1. Skill Creation Wizard (Trợ lý sáng tạo võ công 4 bước):
- **Bước 1: Chọn Định Danh & Môn Phái:**
  - Nhập tên chiêu thức (ví dụ: *Cửu Thiên Long Kiếm*).
  - Chọn môn phái (Thiếu Lâm, Võ Đang, Cái Bang, Nga Mi...) -> Tự động gợi ý hệ ngũ hành tương ứng (Kim, Mộc, Thủy, Hỏa, Thổ).
  - Chọn phong cách: *Cận chiến*, *Bắn xa*, *Đánh lan diện rộng*, *Hỗ trợ/Hào quang*, hoặc *Bùa chú*.
- **Bước 2: Chọn Động Tác Nhân Vật (Action Gallery):**
  - Hiển thị danh sách động tác trực quan có nhãn tiếng Việt: *Chém mạnh*, *Đâm kiếm*, *Vung bổng*, *Chưởng hai tay*, *Niệm chú*, *Tụ khí*...
  - Nhân vật mẫu 3D/SPR xuất chiêu ngay lập tức khi người dùng click chọn.
- **Bước 3: Thư Viện Hiệu Ứng Trực Quan (Visual FX Gallery):**
  - Toàn bộ SPR được phân loại khoa học theo hệ và hình thái:
    - *Hệ Kim:* Kiếm khí vàng, đao chém hoàng kim, mưa ám khí, quầng sáng hộ thể.
    - *Hệ Mộc:* Độc vân xanh, bão phi đao, gai nhọn cuộn đất.
    - *Hệ Thủy:* Băng kiếm, mưa tuyết rơi, sóng nước cuộn trào, bông sen hộ thể.
    - *Hệ Hỏa:* Chưởng rồng lửa, cột lửa bốc, cầu lửa nổ tung, lốc lửa xoay.
    - *Hệ Thổ:* Cuồng lôi sét giật, đá nứt địa chấn, búa tạ rơi.
  - Người dùng bấm vào là thấy hiệu ứng phát sáng chuyển động ngay.
- **Bước 4: Cân Bằng Sát Thương Bằng Thanh Trượt (Intuitive Sliders):**
  - Không cần viết code Lua. Người dùng chỉ cần kéo thanh trượt:
    - *Sát thương cơ bản:* Kéo từ `100` (Cấp 1) đến `1.500` (Cấp 20).
    - *Thời gian hồi chiêu:* `0.5s` đến `10s`.
    - *Tỷ lệ hiệu ứng phụ:* Kéo % Làm chậm, Làm choáng, Bất tỉnh, Trúng độc.
  - Hệ thống tự sinh công thức Lua hợp lệ 100% và điền đủ 20 ô thuộc tính!

#### 2. Bộ Mẫu Chiêu Thức Kinh Điển (1-Click Presets / Clone):
- Cung cấp sẵn 10 mẫu chuẩn:
  1. *Cận chiến ngoại công đơn mục tiêu* (Như Đạt Ma Độ Giang / Tam Hoàn Cảo Nguyệt).
  2. *Bắn kiếm khí tầm xa xuyên thấu* (Như Vô Ngã Vô Kiếm).
  3. *Chưởng pháp nổ lan khi va chạm* (Như Phi Long Tại Thiên / Hàng Long Thập Bát Chưởng).
  4. *Mưa đòn rơi từ trên trời* (Như Lôi Động Cửu Thiên / Phong Sương Băng Ách).
  5. *Đạn nổ tỏa hình tròn 360 độ* (Như Băng Tâm Tiên Tử / Vạn Kiếm Quy Tông).
  6. *Hào quang bị động buff thuộc tính* (Như Tọa Vọng Vô Vi / Phật Quang Phổ Chiếu).
  7. *Bùa chú nguyền rủa diện rộng* (Như Đoạt Hồn Quyết / Đoạn Cốt Trảm).
  8. *Chiêu thức đặt bẫy nổ* (Như Cửu Cung Phi Tinh / Địa Lôi Môn).
  9. *Chiêu lướt nhanh áp sát* (Như Đoạn Hồn Thích / Ma Âm Phệ Phách).
  10. *Chiêu hộ thể hút sát thương* (Như Kim Chung Tráo / Nga Mi Hộ Thể).
- Người dùng chỉ cần bấm **"Dùng mẫu này"**, đổi tên và tinh chỉnh thông số.

#### 3. Đấu Trường Thử Nghiệm Ảo (Virtual Combat Sandbox):
- Bổ sung màn hình giả lập chiến đấu trực quan:
  - Có nhân vật người chơi đứng đối diện búp bê gỗ (Training Dummy).
  - Có nút "Tung Chiêu" hoặc gán phím chuột trái / chuột phải.
  - Khi bấm, nhân vật thực hiện động tác -> đường đạn bay ra -> phát nổ khi chạm búp bê -> búp bê giật nảy -> số sát thương nhảy lên (`-1.420`, `-3.200 Bạo Kích!`).
  - Người dùng thấy ngay tác phẩm của mình hoạt động như thế nào trước khi đưa vào game.

#### 4. Trình Cấp Phát ID Thông Minh (Auto-ID Allocator):
- Hệ thống tự động phân tích toàn bộ `skills.txt` và `missles.txt`, tự tìm khoảng trống ID an toàn tiếp theo (ví dụ: `Skill ID: 1236`, `Missile ID: 442`) và tự động gán.
- Người dùng không phải bận tâm về việc nhớ ID hay sợ trùng lặp.

#### 5. Cầu Nối Cài Đặt Vào Game 1-Click (Game Deployer):
- Nút bấm **"Áp Dụng Vào Game"**:
  - Tự động ghi đè file `skills.txt` và `missles.txt` trong thư mục client.
  - Tự động sinh file script Lua vào thư mục server `script/skill/`.
  - Tự động tạo một script lệnh GM hoặc NPC hỗ trợ: *"Học ngay kỹ năng vừa tạo"* để vào game test thử tức thì.

---

## 4. Kế Hoạch Triển Khai (Roadmap Chi Tiết)

| Phiên bản | Trọng tâm công việc | Thời gian dự kiến | Mục tiêu nghiệm thu |
| :--- | :--- | :--- | :--- |
| **v0.7.0** *(Easy Mode)* | • Triển khai **Skill Creation Wizard 4 bước**.<br>• Xây dựng **Visual FX Gallery** phân loại tiếng Việt theo ngũ hành.<br>• Tích hợp bộ **10 Preset mẫu kinh điển**.<br>• Tích hợp **Auto-ID Allocator** tự động tìm ID an toàn. | 2–3 tuần | Người dùng chưa biết gì có thể tạo 1 chiêu mới hoàn chỉnh dưới 2 phút trong giao diện mới. |
| **v0.8.0** *(Sandbox)* | • Triển khai **Virtual Combat Sandbox** có búp bê tập võ.<br>• Mô phỏng đường đạn đa tia (hình quạt, chùm, xoay tròn).<br>• Hiệu ứng nảy số sát thương (Floating Combat Text) và âm thanh. | 2–3 tuần | Thử nghiệm trực quan cảm giác đánh trúng mục tiêu ngay trên phần mềm. |
| **v0.9.0** *(Deployer)* | • Xây dựng module **1-Click Game Sync** ghi tệp client/server cục bộ.<br>• Trình sinh mã nguồn Lua chuẩn (`script/skill/*.lua`).<br>• Script GM tự động nạp skill cho nhân vật game offline. | 2 tuần | Bấm 1 nút là vào game offline có thể thi triển được chiêu thức mới tạo. |
| **v1.0.0** *(Production)* | • Tối ưu hóa toàn diện, tài liệu hướng dẫn bằng hình ảnh/video.<br>• Hỗ trợ cấu hình tùy biến cho nhiều bản server (JX Linux 6.0, JX Win, JX 8.0). | 1–2 tuần | Bản phát hành chính thức ổn định, dễ tiếp cận nhất cho cộng đồng modder VLTK. |

---

## 5. Kết Luận Báo Cáo

Phần mềm **JX Skill Studio** sở hữu một nền tảng kỹ thuật vô cùng vững chắc về khả năng đọc dữ liệu gốc, giải mã tài nguyên SPR thật và kiểm tra an toàn dữ liệu.

Bằng việc bổ sung tầng giao diện **Skill Wizard**, **Thư viện hiệu ứng trực quan**, và **Đấu trường ảo Sandbox**, phần mềm sẽ xóa bỏ hoàn toàn rào cản kỹ thuật phức tạp, trở thành công cụ sáng tạo võ công thân thiện, trực quan và mạnh mẽ nhất cho cộng đồng game Võ Lâm Truyền Kỳ.
