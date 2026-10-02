# Runtime của bản 0.4.0

Windows 11 x64 là môi trường mục tiêu của alpha. Gói Full có .NET 8.0.31 self-contained và WebView2 Fixed Runtime 154.0.4258.48 x64. Giữ nguyên thư mục runtime; không chép runtime từ Edge/EdgeWebView cài sẵn.

Nguồn: [Microsoft WebView2 download](https://developer.microsoft.com/en-us/microsoft-edge/webview2/). Link CAB được lấy từ trang chính thức ngày 01/10/2026:

[Microsoft.WebView2.FixedVersionRuntime.154.0.4258.48.x64.cab](https://msedge.sf.dl.delivery.mp.microsoft.com/filestreamingservice/files/621dd012-b3d6-4b8b-a6b7-fc3938bfe9d4/Microsoft.WebView2.FixedVersionRuntime.154.0.4258.48.x64.cab)

- Lưu tại `.downloads/Microsoft.WebView2.FixedVersionRuntime.154.0.4258.48.x64.cab` dưới SkillStudio.
- Kích thước: 307.904.013 byte.
- SHA256: `E2356456A8F02E606A731CD7646A604ED3676A9E392BD867B0207A8C3DC2D4F4`.
- msedgewebview2.exe trong CAB: chữ ký Authenticode **Valid**, Microsoft Corporation, đã kiểm tra.
- Hash là giá trị đo từ tệp tải được, không phải hash Microsoft công bố. Chữ ký executable được kiểm riêng.
- Không cài runtime vào Windows; host dùng thư mục runtime cạnh EXE.

Theo [hướng dẫn phân phối Microsoft](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution), Fixed Runtime cần được cập nhật cùng ứng dụng. Windows 10 có yêu cầu ACL riêng từ runtime 120; alpha này chưa nghiệm thu Windows 10 và không tự đổi ACL máy người dùng.

Build: `./native/build-portable.ps1 -Restore`, cần SDK .NET 8 và Node cho các tools kiểm tra. Dependency NuGet có packages.lock.json; giữ nguyên version khi tái lập. Gói source không chứa caches NuGet, CAB hay runtime đã giải nén.

[.NET support policy](https://dotnet.microsoft.com/en-us/platform/support/policy): .NET 8 hết hỗ trợ ngày 10/11/2026. Chuyển host sang .NET 10 LTS và kiểm tra lại runtime trước phát hành dài hạn.
