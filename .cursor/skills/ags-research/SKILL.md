---
name: ags-research
description: Điều phối agent nghiên cứu một vấn đề — Google đa ngữ → md có nguồn → AI phản biện (đính kèm md) → HTML tự chứa + ags view. Trigger khi "ags research", "nghiên cứu vấn đề", "research + vấn đề|chủ đề", "điều tra", "tra cứu sâu".
user_invocable: true
---

# ags research — nghiên cứu vấn đề end-to-end

Bạn là ĐIỀU PHỐI research: bung form, đảm bảo conv Research sống, giao việc cho agent Research qua `ags chat`, xem báo cáo, stop conv Research khi xong. Gọi `ags` bằng ĐƯỜNG DẪN ĐẦY ĐỦ: `/Applications/AGS.app/Contents/MacOS/ags`.
Tái dùng sẵn có — đừng tự chế: `ags form`, `ags chat`, `ags api`, `ags aba`, `ags view`, kịch bản `gemini-prompt` / `meta-prompt`.

## Bước 0 — form cấu hình

Viết `research-<slug>.jsonf` rồi `/Applications/AGS.app/Contents/MacOS/ags form research-<slug>.jsonf`. Form THOÁT NGAY — chờ tin update form rồi đọc lại tệp (`value`).

| name | type | mặc định / ghi chú |
|------|------|-------------------|
| `van_de` | textarea | **bắt buộc** — vấn đề cần research |
| `nn_ngoai` | checkbox | Có (suggest) — research thêm tiếng nước ngoài |
| `nn_list` | checkbox + `show_if` nn_ngoai | Nga, Trung, Pháp, Nhật, Hàn, Ấn Độ, Tây Ban Nha, Đức, Ý — **tất cả suggest** |
| `nn_khac` | text | rỗng — ngôn ngữ khác gõ tay |
| `top_n` | number | **20** — số trang top Google (bỏ quảng cáo) |
| `login_google` | radio | **Agent tự dùng ABA (phiên Google đã đăng nhập sẵn…)** (suggest) / Dừng lại, báo người dùng tự login rồi đọc tiếp |
| `ai_phan_bien` | checkbox | **Gemini** suggest; thêm Perplexity, ChatGPT, Grok, Claude, DeepSeek, Meta — **không** mặc định Perplexity |
| `agent_research` | radio | options = agent `dung_duoc:true` từ `/api/agents/lietke`, gợi ý `opencode` nếu có |
| `phien` | radio | **Tiếp nối phiên cũ** (suggest) / Luôn tạo mới / Phiên mới trên conv cũ |

Slug từ `van_de`: chữ thường không dấu, nối gạch, ≤60 ký tự.

### Nhánh `login_google` (bắt buộc)

Khi gặp trang login / captcha / consent Google trên tab ABA — theo giá trị radio form:

- **Agent tự dùng ABA (phiên Google đã đăng nhập sẵn…)** (mặc định / suggest) → KHÔNG báo người dùng, KHÔNG nhập user/pass. Dùng lại cookie phiên Google sẵn trong Edge ABA: mở/điều hướng lại URL đích trên tab ABA, `read_text` lại. Vẫn chặn → tối đa 1 lần thử / phiên ngôn ngữ; vẫn fail → bỏ trang, sang URL kế, ghi «bỏ qua — phiên Google ABA chưa đủ / captcha».
- **Dừng lại, báo người dùng tự login…** → báo người dùng đăng nhập/xong captcha trên đúng tab ABA (form ngắn hoặc tin rõ), chờ họ bấm «Xong» rồi `read_text` lại; tối đa 1 lần chờ / phiên ngôn ngữ; quá hạn → bỏ trang, ghi «bỏ qua — chưa login».

Không vượt captcha tự động.

## Bước 1 — đảm bảo conv Research

Tiền tố title: `[AGS Research]`.

1. `/Applications/AGS.app/Contents/MacOS/ags api GET /api/conversations/$AGS_CONV_ID` → `project_id` (pid của bạn = Điều phối).
2. `/Applications/AGS.app/Contents/MacOS/ags api GET '/api/conversations?project=<pid>'` → tìm conv title bắt đầu `[AGS Research]`; nhiều cái → lấy `last_prompt_at` mới nhất.
3. `/Applications/AGS.app/Contents/MacOS/ags api GET /api/agents/lietke` → agent `dung_duoc:true`. Conv chết nếu không thấy, hoặc `agent_id` không còn `dung_duoc`, hoặc `start` lỗi.
4. Theo `phien`:
   - **Tiếp nối phiên cũ** → `POST /api/conversations/<id>/start` (không `phien_moi`) trên conv còn sống + agent còn `dung_duoc`.
   - **Phiên mới trên conv cũ** → `POST .../start '{"phien_moi":true}'`.
   - **Luôn tạo mới** → `POST /api/conversations '{"project_id":<pid>,"agent_id":"<agent>","title":"[AGS Research] <slug ngắn>","start":true}'`.
5. Ghi `RID` = id conv Research.

## Bước 2 — giao Research: Google (gốc + đa ngữ) → md

Tệp ở **gốc dự án** của conv Research (path project / cwd session):

- `ags-research-<slug>.md`
- `ags-research-<slug>.html`

`/Applications/AGS.app/Contents/MacOS/ags chat <RID> --title "Research <slug>" "<lời giao>"` — lời giao phải có:

1. Vấn đề + cấu hình form (top_n, nn_list, login_google, …).
2. Dùng `/Applications/AGS.app/Contents/MacOS/ags aba` mở Google tìm prompt gốc → bấm top N trang **không phải quảng cáo** → `read_text` / đọc nội dung; trang lỗi/chặn → trang kế. Lặp lại sau khi **dịch** prompt sang từng ngôn ngữ đã chọn (dịch bằng `ags aba run` kịch bản `gemini-prompt`, hoặc Google Translate qua ABA).
3. Đủ thông tin → ghi `ags-research-<slug>.md`: chi tiết + **luôn dẫn nguồn URL**; mâu thuẫn → ghi cả hai phía.
4. Nguyên văn: "Đừng dùng công cụ hỏi lại — đầu bên kia là agent. Cần hỏi thì gom danh sách ghi log việc rồi done kèm danh sách."

Chờ `task done` từ Research. Kiểm file md tồn tại + có ≥1 URL.

## Bước 3 — AI phản biện (đính kèm md)

Với từng AI đã tick trong `ai_phan_bien`:

- **Gemini / Meta** (có wasm):  
  `/Applications/AGS.app/Contents/MacOS/ags aba run '{"aba":"gemini-prompt","params":{"prompt":"Đọc tệp đính kèm, kiểm chứng/xác nhận/bổ sung research. Trả kết luận + điểm cần sửa.","tep":["<đường tuyệt đối ags-research-<slug>.md>"],"nhet":{"cach":"file"},"chat_moi":true}}'`  
  (Meta: `"aba":"meta-prompt"`. Có tep → `nhet.cach` = `js`|`paste`|`file`, **không** `insert`/`human`/`keys` với Gemini.)
- **Perplexity / ChatGPT / Grok / Claude / DeepSeek** (chưa có wasm): lái ABA `do` thủ công — mở trang AI đó, upload/đính md nếu được, gửi prompt kiểm chứng, `read_text` câu trả lời. Không viết wasm mới.

Cập nhật `ags-research-<slug>.md` theo phản biện; ghi nguồn AI kèm **URL cuộc chat** (vd «Vấn đề 1, Gemini phản biện — https://…»).

## Bước 4 — gen HTML + báo Điều phối

Research (hoặc bạn nếu Research giao lại): sinh `ags-research-<slug>.html` **tự chứa** từ md final (một file, CSS/JS inline). `task done` kèm đường md + html + RID.

Bạn (Điều phối):

```bash
/Applications/AGS.app/Contents/MacOS/ags view --title "Research <slug>" <đường html>
/Applications/AGS.app/Contents/MacOS/ags api POST /api/conversations/<RID>/stop '{}'
```

Xác nhận stop: `/Applications/AGS.app/Contents/MacOS/ags api GET /api/conversations/<RID>` — không còn session đang chạy (`session_id` rỗng/null/thiếu, hoặc field tương đương “không running”).

## Bước 5 — báo người dùng

Tóm tắt ngắn: đường md/html, số nguồn, AI đã phản biện, RID đã stop. `ags view` đã bung thì chỉ cần nói đã mở.

## Ghi chú kỹ thuật ABA Google

- `/Applications/AGS.app/Contents/MacOS/ags aba do '{"action":"tab_new","args":{"url":"https://www.google.com/search?q=…","muc_dich":"kich-ban","bo_qua_tra":true}}'`
- Đọc trang: `read_text` / `js` — bỏ link quảng cáo.
- Captcha: theo nhánh `login_google` ở trên; **không** vượt captcha tự động.
