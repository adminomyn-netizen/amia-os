---
name: ags
description: Bộ lệnh `ags` của AgentSEE — mở để xem danh sách lệnh và từ khoá kích hoạt từng việc (xem/mở file, chat giữa agent, ABA duyệt web, Zalo, giọng nói, ý tưởng, addon…).
---

## AGS — bạn đang chạy BÊN TRONG AgentSEE, không phải terminal thường

Bạn KHÔNG chạy trong một terminal trần. Người dùng giao việc cho bạn qua giao diện **WEB/APP của
AGS (AgentSEE)**; AGS nhận lời họ rồi mới SPAWN tiến trình CLI của bạn và tiêm lời đó vào. AGS
đứng GIỮA người dùng và bạn — mọi lời qua lại đều đi qua nó, nên người dùng có rất nhiều tệp
lệnh/skill do AGS cung cấp mà một terminal thường không có.

**Khi lời người dùng dính tới một tác vụ dưới đây, chạy `/Applications/AGS.app/Contents/MacOS/ags <lệnh> -h` (hoặc
`--help`/`help`) để lấy hướng dẫn MỚI NHẤT rồi làm theo** — đừng đoán, đừng tự viết script khi đã
có lệnh. Gọi bằng ĐƯỜNG DẪN ĐẦY ĐỦ (lệnh `ags` trần thường không có trong PATH): `/Applications/AGS.app/Contents/MacOS/ags`

### Danh sách lệnh

**Xem file**
+ Mô tả: bung file/ảnh/video/PDF/markdown/mã nguồn lên MÀN HÌNH người dùng để họ NHÌN thấy (đừng đọc đường dẫn, đừng cat ra terminal)
+ Kích hoạt khi prompt có: mở ra, cho tao xem, coi, show, preview, xem ảnh, xem video, xem báo cáo
+ Xem hướng dẫn: `ags view -h`

**Hỏi người dùng**
+ Mô tả: hỏi người dùng bằng một trang nhập liệu bung lên web
+ Kích hoạt khi prompt có: dựng form, khảo sát, thu thập dữ liệu, điền thông tin, hỏi ý người dùng
+ Xem hướng dẫn: `ags form -h`

**Chat giữa agent**
+ Mô tả: chat qua lại, giao việc giữa các Agent CLI qua trung gian AGS (cùng máy hoặc máy khác)
+ Kích hoạt khi prompt có: chat, nhắn agent, nhắn máy khác, làm việc nhóm, giao việc, chờ trả lời
+ Xem hướng dẫn: `ags chat -h`

**Báo tiến độ việc**
+ Mô tả: báo tiến độ việc được agent/người khác giao
+ Kích hoạt khi prompt có: mã việc, ai giao việc cho tôi, báo tiến độ
+ Xem hướng dẫn: `ags task -h`

**Đọc lại lượt cũ**
+ Mô tả: đọc lại lượt cũ trong CHÍNH cuộc chat này (host tự bóc lời qua lại)
+ Kích hoạt khi prompt có: nãy nói gì, tóm lại chuyện vừa bàn, đọc lại lượt cũ
+ Xem hướng dẫn: `ags qa -h`

**Đọc/gõ màn hình chat**
+ Mô tả: đọc chữ màn hình một cuộc chat và gửi phím thật (Esc, Enter trống, mũi tên) — dùng `ags keys` để gõ
+ Kích hoạt khi prompt có: xem màn hình chat, đọc màn hình, gửi phím, bấm Esc, bấm Enter, kẹt menu, ags screen, ags keys
+ Xem hướng dẫn: `ags screen -h`

**Bảng phải**
+ Mô tả: đổ nội dung ra bảng phải (sidebar) cho người dùng xem
+ Kích hoạt khi prompt có: bảng phải, sidebar, đổ nội dung sang bên
+ Xem hướng dẫn: `ags sidebar -h`

**Addon trên máy**
+ Mô tả: xem máy có addon nào và gọi tool của chúng (việc gì addon làm được thì ĐỪNG tự viết script; tìm/cài thêm addon: `ags addon`)
+ Kích hoạt khi prompt có: máy này làm được gì, có app nào, gọi app, dùng addon, dùng mini-app
+ Xem hướng dẫn: `ags tools -h`

**Gọi API host**
+ Mô tả: gọi thẳng endpoint host cho việc chưa có lệnh tắt
+ Kích hoạt khi prompt có: gọi endpoint, việc lạ chưa có lệnh riêng
+ Xem hướng dẫn: `ags api -h`

**Cài phần mềm / agent CLI**
+ Mô tả: tự cài phần mềm/engine còn thiếu, hoặc cài + đăng ký agent CLI (Claude Code, Codex, Cursor, Kiro, Grok, Antigravity, OpenCode) vào AGS — đừng bắt người dùng đi cài
+ Kích hoạt khi prompt có: cài phần mềm, thiếu công cụ, chưa có engine, (cài / install / setup) kèm (claude / codex / cursor / kiro / grok / antigravity / opencode), (tích hợp / cấu hình / thêm / kết nối / gắn) kèm (claude / codex / cursor / kiro / grok / antigravity / opencode) kèm (vào ags / vô ags / với ags / cho ags / agentsee)
+ Xem hướng dẫn: `ags package -h`

**Bộ nhớ dự án**
+ Mô tả: bộ nhớ dự án dài hạn — cây tri thức, cách tra cho đúng và cách ghi vào nhánh
+ Kích hoạt khi prompt có: hôm trước chốt gì, ghi nhớ, bộ nhớ dự án, tra lâu dài
+ Xem hướng dẫn: `ags mem -h`

**Duyệt web tự động**
+ Mô tả: tự động hoá trình duyệt ĐÃ ĐĂNG NHẬP — Facebook (inbox/feed/đăng bài), TikTok, META.ai (hỏi/vẽ ảnh), tự lái trang, ghi tiếng/quay hình tab
+ Kích hoạt khi prompt có: ABA, ags aba, duyệt web tự động, lái trình duyệt, META.ai, hỏi Meta, Meta vẽ ảnh, Facebook, TikTok
+ Xem hướng dẫn: `ags aba -h`

**Zalo cá nhân / chatbot**
+ Mô tả: đọc/gửi tin Zalo cá nhân, dựng chatbot trả lời khách, trực nhóm
+ Kích hoạt khi prompt có: Zalo, chatbot, bot trả lời khách, trực nhóm, quét QR
+ Xem hướng dẫn: `ags zalo -h`

**Giọng nói / lồng tiếng**
+ Mô tả: đọc văn bản thành giọng nói (TTS), lồng tiếng, clone giọng
+ Kích hoạt khi prompt có: giọng nói, đọc thành file nghe, TTS, lồng tiếng, clone giọng
+ Xem hướng dẫn: `ags voice -h`

**Bé Mầm (não LLM)**
+ Mô tả: quản não gom nhiều tài khoản LLM, đổi model, API key
+ Kích hoạt khi prompt có: Bé Mầm, bé mầm mini, não, tài khoản LLM, đổi model, API key
+ Xem hướng dẫn: `ags bemam -h`

**Câu chèn mọi prompt**
+ Mô tả: câu tự chèn vào mỗi lời người dùng — prefix/suffix, tiết kiệm token, bộ nhớ tăng cường
+ Kích hoạt khi prompt có: chèn vào mọi prompt, prefix, suffix, thêm vào đầu, thêm vào đít, tiết kiệm token
+ Xem hướng dẫn: `ags affix -h`

**Hồ sơ thương hiệu**
+ Mô tả: xem/sửa hồ sơ thương hiệu, doanh nghiệp, sản phẩm, chiến dịch, lịch nội dung
+ Kích hoạt khi prompt có: hồ sơ thương hiệu, doanh nghiệp, sản phẩm, chiến dịch, lịch nội dung
+ Xem hướng dẫn: `ags brand -h`

**Ý tưởng viral / kinh doanh**
+ Mô tả: nộp việc lên máy chủ nghĩ ý tưởng rồi AGS dựng trang trả về danh sách
+ Kích hoạt khi prompt có: idea viral, campaign, xin ý tưởng, kinh doanh gì, làm gì bây giờ, khởi nghiệp
+ Xem hướng dẫn: `ags viral -h`

**Lịch sử dự án**
+ Mô tả: dựng lại lịch sử dự án từ mọi dấu vết (prompt, git, AGSMem, máy thật) rồi ghi mốc vào AGSMem + dựng landing page timeline
+ Kích hoạt khi prompt có: timeline, history, lịch sử, nhật ký, nhật ký phát triển, lịch sử phát triển, tiến trình, hành trình dự án, nhìn lại dự án, dựng lịch sử
+ Xem hướng dẫn: `ags timeline -h`

**Lên plan rồi code (Planner ↔ Coder)**
+ Mô tả: điều phối hai agent: Planner lên plan-*.md có checklist + kiểm thử + tiêu chí hoàn thành, Coder code theo plan, mình soi và nghiệm thu
+ Kích hoạt khi prompt có: ags code, planner kèm coder, (kế hoạch / plan / lên plan / lập plan) kèm (code / lập trình / mã nguồn / source code / sửa mã / tính năng)
+ Xem hướng dẫn: `ags code -h`

**Nghiên cứu vấn đề**
+ Mô tả: điều phối agent research: Google đa ngữ → md có nguồn → AI phản biện → HTML + ags view
+ Kích hoạt khi prompt có: ags research, nghiên cứu vấn đề, research kèm (vấn đề / chủ đề), điều tra, tra cứu sâu
+ Xem hướng dẫn: `ags research -h`

**Video motion bằng code**
+ Mô tả: dựng video motion-design bằng code (HTML canvas → MP4 60fps có nhạc khớp beat) từ URL/brand/chủ đề, 37 kiểu, render qua trình duyệt (ABA) — khác Video Remotion của Content Factory
+ Kích hoạt khi prompt có: ags video, motion video, video motion, motion design, motion-design, video giới thiệu, video quảng cáo, video brand, kinetic typography, video từ url, render video từ html, explainer video
+ Xem hướng dẫn: `ags video -h`

**Slide thuyết trình (mặc định)**
+ Mô tả: MẶC ĐỊNH khi làm slide: dựng bộ slide thuyết trình bằng code (HTML trình chiếu → PDF/PNG/PPTX, xuất bản link nếu chọn) từ URL/tài liệu/chủ đề, 23 kiểu hoặc xoay vòng, vẽ qua trình duyệt (ABA) — khác Slide của Content Factory
+ Kích hoạt khi prompt có: ags slide, làm slide, tạo slide, slide thuyết trình, bài thuyết trình, pitch deck, slide deck, presentation, tóm tắt tài liệu thành slide, tóm tắt sách thành slide, slide từ url, xuất pptx
+ Xem hướng dẫn: `ags slide -h`


Không nhớ gì cả, hoặc muốn bảng lệnh đầy đủ: `/Applications/AGS.app/Contents/MacOS/ags help`.
⚠ Đừng đoán. Việc nào có bài chi tiết thì ĐỌC BÀI trước khi làm — bài có sẵn cách làm đúng và các bẫy đã gặp.

### Bốn luật phải nhớ (không có trong bài nào khác)

0. **Mã hex `#...` ở đầu là promptId, cứ bỏ qua.**

1. **Người dùng muốn XEM gì thì bung ra màn hình họ, đừng đọc đường dẫn.** "mở ra", "cho tao
   xem", "coi", "show", "preview" → `/Applications/AGS.app/Contents/MacOS/ags view --title "<tiêu đề>" <file>`. Đừng in đường
   dẫn bảo họ tự mở, đừng cat nội dung ra terminal.
   **LUÔN KÈM `--title`** — một câu nói rõ trong tệp có gì, vì danh sách lịch sử hiện tiêu đề này
   THAY cho tên tệp. ĐỪNG chép lại tên tệp ("bao-cao.html" là vô nghĩa với người đọc), hãy viết
   `--title "Báo cáo doanh thu tháng 9"`. `/Applications/AGS.app/Contents/MacOS/ags form` cũng vậy: `form --title "Hỏi cấu
   hình máy chủ" hoi.jsonf`.
2. **Cần hỏi người dùng: bắt buộc gọi `/Applications/AGS.app/Contents/MacOS/ags form`. Cấm hỏi trong terminal.**
3. **Cuộc chat của bạn nằm ở biến `AGS_CONV_ID`** — đọc lúc chạy, đừng nhớ số cũ.

- Thư viện video của học viên (danh sách/xem/sửa/xoá/đồng bộ): `ags video -h` mục "Thư viện video".
