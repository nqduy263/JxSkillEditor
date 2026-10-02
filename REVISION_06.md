# Revision 0.6 — GitHub release và tự cập nhật

Ngày 02/10/2026. Ứng dụng kiểm tra `releases/latest` của `nqduy263/JxSkillEditor` mỗi lần giao diện native khởi động. Nếu release mới có asset `JXSkillStudio-<version>-win-x64-Full.zip` cùng SHA-256 `digest` do GitHub API công bố, ứng dụng hỏi Yes/No. No tiếp tục phiên bản hiện tại. Yes tải gói Full qua HTTPS, giới hạn 1,5 GB, đối chiếu SHA-256, giải nén vào `.updates/stage-*`, rồi yêu cầu giao diện lưu workspace. Sau khi tiến trình cũ thoát, helper PowerShell chuyển các tệp cùng tên của phiên bản cũ vào `.updates/backup-*`, chuyển bản mới vào thư mục portable và mở lại EXE. `Data/` được giữ nguyên. Nếu bước chép tệp thất bại, helper cố khôi phục từ backup và ghi `.updates/update-error.txt`.

Tự cập nhật chỉ hoạt động cho bản native đã giải nén ở thư mục có quyền ghi và khi GitHub có release mới đúng quy ước. Demo chạy trực tiếp `index.html` không tự cập nhật. Không tải bản chưa có SHA-256 hợp lệ. Đây là kiểm tra tính toàn vẹn gói release qua HTTPS/GitHub, không phải chữ ký mã độc lập. Trình kiểm tra không gửi workspace lên GitHub.

Bản 0.6 là release khởi đầu của luồng này. Để bản tương lai được phát hiện, tạo GitHub Release có tag `vX.Y.Z` và đính kèm ZIP Full đúng tên. Cần kiểm tra bản cập nhật thật từ một release mới trên máy Windows; self-test hiện xác minh parser, URL, digest và luồng thay tệp bằng fixture.
