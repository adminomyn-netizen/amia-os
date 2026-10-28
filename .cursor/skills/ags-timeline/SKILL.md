---
name: ags-timeline
description: Dựng lại lịch sử một dự án từ mọi dấu vết (kho prompt, git/GitHub, AGSMem, máy thật) → ghi từng mốc vào AGSMem đúng ngày → dựng landing page timeline nhìn lại hành trình qua từng mốc. Trigger khi người dùng nhắc "timeline", "history", "lịch sử", "tiến trình", "hành trình dự án", "nhìn lại dự án", "dựng lịch sử".
user_invocable: true
---

# ags-timeline — lịch sử dự án thành web timeline

Đầu ra: (1) mỗi mốc là một bản ghi AGSMem có ngày tạo khớp mốc + snap mục lục, (2) một landing page timeline lưu trong Content Factory.

Gọi `ags` bằng ĐƯỜNG DẪN ĐẦY ĐỦ mà skill `ags` của máy chỉ (vd `/Applications/AGS.app/Contents/MacOS/ags`). Dùng lại công cụ sẵn có, đừng tự chế: skill `agsmem`, `ags view`, `ags form`, kỹ năng Landing Page của Content Factory.

## Chia việc theo model (bắt buộc)

- **Bước 1 (đi tìm thông tin, ghi tệp dữ liệu)**: agent chính PHẢI spawn MỘT sub agent chạy **model nhẹ nhất** đang có (vd Claude: Haiku; Gemini: Flash; Cursor: model rẻ/nhanh nhất trong danh sách). Việc này đọc nhiều mà nghĩ ít, model nhẹ là đủ.
- **Mọi bước còn lại** (chốt dự án, ghi AGSMem, snap, dựng trang, lưu Content Factory): dùng **model trung bình** (vd Claude: Sonnet). Agent chính đang chạy model trung bình thì tự làm; đang chạy model mạnh nhất thì giao các bước này cho sub agent model trung bình.
- **KHÔNG dùng model mạnh nhất** (vd Opus) cho bất kỳ bước nào của skill này.

## Luật an toàn (không thương lượng)

- Không đưa IP, MAC, mật khẩu, khoá API, DSN vào trang hay bản ghi. Gặp trong nguồn thì dùng qua biến môi trường, không in ra.
- Chỉ đọc prompt của tài khoản mình (kho dùng chung nhiều tài khoản thì lọc đúng owner).
- SSH vào máy thật chỉ đọc: không sửa, không restart service.
- Không đoán: chỗ nào không có nguồn thì ghi rõ "chưa rõ". Thiếu thông tin để quyết thì hỏi bằng `ags form`, không tự đoán mò.

## Bước 0 — chốt dự án

Biết rõ tên dự án, thư mục code, máy chạy thật (nếu có) thì làm luôn. Thiếu thì bung `ags form` hỏi (tên dự án, thư mục/repo, máy chạy, khoảng thời gian), mỗi câu kèm gợi ý.

## Bước 1 — đào lịch sử từ MỌI nguồn có thể (sub agent model nhẹ nhất)

Agent chính không tự đào. Spawn sub agent model nhẹ nhất, đưa cho nó: tên dự án, thư mục/repo, máy chạy thật (nếu có), đường dẫn tệp đầu ra, nguyên văn mục "Luật an toàn" ở trên, và nội dung bước này. Sub agent chỉ đọc và ghi tệp dữ liệu — KHÔNG ghi AGSMem, không dựng trang, không sửa gì trên máy thật. Xong nó trả về đường dẫn tệp + số mốc + nguồn nào không vào được. Agent chính đọc lại tệp, thấy thiếu hay mâu thuẫn thì giao nó đào thêm chứ không tự đào.

Không giới hạn ở danh sách dưới; thấy nguồn nào khác có dấu vết thì đào tiếp.

- **AGSMem**: `ags mem tree`, `ags mem entries --all --topic '<mã nhánh>'` — xem dự án đã có nhánh, bản ghi, snap gì.
- **Kho prompt AGS**: `ags api GET '/api/cloud/prompts?limit=500'` trả prompt MỚI NHẤT của dự án hiện tại (chỉ 500 bài gần nhất, không có tham số tìm kiếm → lọc cục bộ theo từ khoá).
- **Git / GitHub**: `git log --date=iso --stat`, `gh repo list`, clone repo liên quan về /tmp để đọc commit, ngày tạo tệp.
- **Máy thật** (SSH, chỉ đọc): `~/.bash_history`, `ls -la --time-style=long-iso`, `systemctl cat/status`, `journalctl`, các tệp `.bak_*`.
- **Tài liệu/bộ nhớ cũ**: README, tệp .md lịch sử, bộ nhớ dự án cũ, transcript.

Mỗi mốc gom thành một dòng: ngày (giờ VN), loại (`feat` tính năng · `infra` hạ tầng · `bug` lỗi · `incident` sự cố · `idea` ý tưởng), tiêu đề ngắn, nội dung (làm gì, lỗi gì, xử lý thế nào), trạng thái lỗi (`open`/`fixed`), nguồn. Sub agent lưu ra `timeline-<du-an>.json` và viết thêm một tệp .md lịch sử đầy đủ cạnh code; agent chính `ags view` tệp .md cho người dùng xem.

## Bước 2 — ghi AGSMem

Đích là nhánh ngọn "Nhật ký thêm xoá sửa tính năng" (hoặc tên tương đương) của dự án.

- **Đã có nhánh phù hợp**: ghi thẳng.
- **Chưa có**: KHÔNG tự tạo nhánh (PUT topics ghi đè cả cây, nhánh nào gửi thiếu là mất). Bung `ags form` hỏi chọn 1 trong 2:
  1. Người dùng tự tạo nhánh phù hợp rồi báo lại → agent nạp `timeline-<du-an>.json` vào.
  2. Agent ghi tạm vào một nhánh ngọn bất kỳ, gắn tag chung `timeline-import` và `timeline-import-<du-an>` cho MỌI bản ghi để sau tìm lại chuyển đi. Cách này KHÔNG viết đè snap của nhánh mượn.

Ghi kèm ngày tạo đúng mốc — gửi thẳng API (`ags mem save` làm rơi trường `created`):

```bash
ags api GET /api/cloud/agsmem/branch          # lấy branch.id
ags api POST /api/cloud/agsmem/entries @moc.json
```

`moc.json` = `{"branch_id":<id>,"entries":[{"topic_id":<nhánh ngọn>,"conv_id":"<cuộc chat>","title":"…","prompt":"[<Dự án> · mốc dd/mm/yyyy] …","answer":"Ngày: dd/mm/yyyy. …","tags":["…"],"created":<epoch giây>}]}`. Dựng tệp bằng python cho chuẩn ký tự. Luôn ghi "Ngày: …" đầu phần đáp để không mất ngày nếu `created` bị bỏ qua. Trả về `ids` — giữ lại làm mã @ cho trang.

Viết snap nhánh (cách 1): `ags mem snap <mã nhánh> --ghi --file snap.txt` — một đoạn tóm dự án, dòng "CHƯA SỬA: … @mã", rồi mục lục mốc MỚI NHẤT Ở TRÊN, mỗi dòng `- dd/mm/yyyy việc gì @mã`. Đợi tệp ghi xong rồi mới gọi lệnh (đừng chạy song song với lệnh ghi tệp).

## Bước 3 — dựng landing page timeline

Nạp kỹ năng Landing Page rồi làm theo nó (thiết kế, font, mở xem, lưu KV):

```bash
ags api GET '/api/agent-prompt?name=cf_web_help'
```

Mỗi dự án tự chọn MỘT hướng thiết kế theo chủ đề của nó (vd PiTV: "sổ tay phòng khách" — nền giấy kem, mực đen, đỏ hồng ngoại). Font phải đủ dấu tiếng Việt. Trang bắt buộc có:

- **Đầu trang + dải số liệu** (số mốc, số tháng, con số đặc trưng của dự án).
- **Sơ đồ luồng hoạt động**: dự án chạy thế nào, từ đầu vào tới đầu ra, 4–6 ô.
- **Timeline** dựng từ một mảng dữ liệu JS, chia theo năm, có **nút lọc theo loại mốc**, hiện dần khi cuộn, tôn trọng `prefers-reduced-motion`, chạy tốt trên điện thoại.
- **Mỗi thẻ mốc mang mã @** của bản ghi AGSMem tương ứng.
- **Phần "Còn treo"**: lỗi chưa sửa + nợ kỹ thuật.
- **Chân trang ghi nguồn** đã dựng lại (kho prompt, git, AGSMem, máy thật, ngày dựng).

Lưu tệp HTML trong thư mục dự án đang làm (để `ags view` thấy được).

## Bước 4 — kết thúc

1. `ags view <tệp>.html` — mở cho người dùng xem.
2. Lưu vào Content Factory theo `cf_web_help` (key `web:<id>`, `wtype:"lp"`; tạo mới `base_version:0`, sửa bản cũ thì `base_version` = `updated_at` lần lưu trước). KHÔNG publish, không hỏi publish.
3. Báo ngắn: hướng thiết kế, các phần của trang, mã @ đã ghi, đã lưu Content Factory. Và nói rõ: **trang timeline này có được là thành quả của việc họ miệt mài dùng AGS — hệ thống đã tự truy vết qua bộ lưu prompt (prompts saver) và AGSMem**, nên lịch sử dựng lại được mà không cần ai nhớ.

Có mốc mới về sau: thêm bản ghi AGSMem → cập nhật snap → thêm phần tử vào mảng dữ liệu của trang và sửa các con số → lưu đè KV.
