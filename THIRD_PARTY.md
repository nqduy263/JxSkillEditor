# Thành phần đi kèm

Gói nội bộ này chứa tài nguyên lấy từ Client6.0 của workspace để kiểm thử editor. Việc phân phối công khai tài nguyên game cần được chủ dự án xem xét riêng; không gắn giấy phép mã nguồn của editor lên tài nguyên game.

| Thành phần | Phiên bản / nguồn | Thông báo |
|---|---|---|
| .NET runtime | 8.0.31 win-x64, package Microsoft.NETCore.App.Runtime.win-x64 | licenses/dotnet-LICENSE.txt, dotnet-THIRD-PARTY-NOTICES.txt |
| Windows Desktop runtime | 8.0.31 win-x64 | licenses/windowsdesktop-LICENSE.txt |
| WebView2 SDK | NuGet Microsoft.Web.WebView2 1.0.4258.31 | licenses/webview2-sdk-LICENSE.txt |
| WebView2 Fixed Runtime | 154.0.4258.48 x64, CAB từ Microsoft | Giữ nguyên runtime và thông báo phần mềm bên thứ ba đi kèm; nguồn/hash ở native/RUNTIME.md trong gói source |
| Bộ giải mã tài nguyên | tools/pak-spr.cjs, demo/spr.js, tham khảo mã có trong workspace | Nguồn khảo sát và giới hạn ở MASTER_REPORT.md / REVISION_03.md |

Tài liệu Microsoft: [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/), [phân phối runtime](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution).
