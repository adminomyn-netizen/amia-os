# Quy tắc giao diện AMIA OS — để MSC Group OS làm y hệt

Chị Lâm (31/10/2026): "đẩy hết quy tắc giao diện bao gồm tất cả những gì chị dặn, chỉ trừ logo và màu chủ đạo, sang cho bên MSC để làm y hệt".

**Phạm vi:** mọi thứ dưới đây MSC làm Y HỆT AMIA. **Chỉ KHÁC hai thứ:** (1) logo, (2) màu chủ đạo (màu chính, màu nhấn vàng đồng, màu nền menu tối). Giữ tên biến, giữ cách dùng, chỉ đổi giá trị màu thương hiệu thành của MSC (đã có ở `src/lib/thuong-hieu.ts` và `src/app/globals.css`, xem `docs/THAY-LOGO-MAU.md` của MSC).

Nguồn thật để chép: `/Users/phamtunglam/project___1140/amia-os` (đọc trực tiếp trên máy này).

---

## A. Điều chị dặn (theo thứ tự quan trọng)

1. **Y HỆT SalonHero cho phần kinh doanh; nhân viên chuyển sang không phải học lại.** Chữ, vị trí, nút, cách tính số giống. Chỗ phân vân: làm theo SalonHero và ghi một dòng vào danh sách "chị chỉnh sau", không dừng hỏi. (Áp cho AMIA; với MSC, tinh thần là: quen mắt, không bắt người dùng học lại.)
2. **Tối giản, thao tác đơn giản, quen như lướt Facebook** (chị Lâm + anh Phương Nam, 30/10). Giữ nguyên chức năng, chỉ làm cách bấm gọn, dễ hiểu. Mỗi trang MỘT việc chính, MỘT nút chính ở góc phải. Bảng gọn, ít cột. Dùng tab thay vì nhồi nhiều khối. Chữ đời thường, không thuật ngữ. Sửa/xoá nằm cuối dòng. Hộp nhập chỉ hỏi trường cần thiết.
3. **Nhân viên không được "phản kháng":** ít bước, ít chữ, ít nút. Phải ngang hoặc hơn Lark nhưng đơn giản dễ dùng.
4. **Responsive đủ mọi màn:** điện thoại, iPad dọc, iPad ngang, máy tính. Mượt, nhanh.
5. **Điện thoại:** bảng chuyển thành thẻ; ô chạm lớn (≥ 40 px); thanh tab dưới đáy; chừa vùng an toàn tai thỏ/thanh Home; ô nhập cỡ chữ 16 px để iOS không tự phóng to; không dùng menu dọc, dùng bảng "Thêm" kéo từ dưới lên.
6. **Ô nhập giờ phải là dạng chọn (dropdown), không gõ tay; ô chọn ngày, ô chọn danh sách đều theo bộ nhận diện**, không dùng `<select>` / `<input type="date">` / `<input type="time">` mặc định của trình duyệt.
7. **Ô số: bấm vào là chọn hết nội dung để gõ đè ngay** (dùng `CHON_HET`).
8. **Danh sách dài (> 7 mục) tự có ô gõ tìm**, mục có nhóm thì gom theo nhóm (kiểu chọn nhân viên của SalonHero).
9. **Bot chat ở góc:** chỉ giới thiệu "Em là Tula, trợ lý AI" (không ghi "của chị Lâm"), tự nổi tin nhắc chỗ popup dưới avatar nhảy lên chào kiểu "Xin chào, cần hỗ trợ hãy chat ở đây". Chép `components/chat/ChatNoi.tsx` + khối `.tula-*` trong globals.css (đổi màu theo MSC).
10. **Bảng xếp hạng:** dùng kiểu bục 1-2-3 (`BangXepHangDep`).
11. **Tab ảnh/danh sách nặng phải nhanh:** tải ảnh thu nhỏ trước, tải lười phần còn lại, mở ảnh phóng to tức thì (tải trước ảnh kế bên); 5 ảnh đầu tải ưu tiên cao.
12. **Chứng cứ nghiệm thu là ảnh chụp màn hình THẬT**, không dựng ảnh bằng code rồi ghi như kết quả máy. Báo thẳng điều chưa nhìn thấy tận mắt ("chưa mở giao diện thật để nhìn").
13. **Văn phong:** tiếng Việt đời thường, ngắn, xưng đúng; không giọng máy móc.

## B. Bộ kiểm tự động (chép nguyên)

`scripts/kiem-tra-thiet-ke.mjs` + `.kiem-tra-thiet-ke-cho-phep.json` (MSC đã có bản của mình; so với AMIA và bổ sung đủ quy tắc). Chạy trước mỗi lần đẩy. **Cấm:**
- Bo góc lớn đồng loạt (`rounded-2xl/3xl/full`) — dùng `rounded-nho` (8), `rounded-the` (10), `rounded-vua` (12), `rounded-hop` (14), `rounded-tag` (5).
- Bóng nặng, mờ kính (`shadow-lg/xl/2xl`, `backdrop-blur`, `blur-`).
- Emoji trong giao diện.
- Phông Inter/Arial/Poppins. **Phông là Roboto** (đúng SalonHero), subset latin + latin-ext + vietnamese, trọng lượng 400/500/700.
- Dải màu ngoài bảng màu thương hiệu (tím, xanh lam, hồng...). Màu nhấn số liệu chỉ dùng năm sắc `sac-luc/xanh/tim/cam/hong`.
- `<select>`, `type="date"` mặc định (dùng `Chon`, `NgayChon`, `GioChon`).
- Văn phong cấm: "Chào mừng bạn đến với", "Oops", "Lorem ipsum", "John Doe", "Acme", "Đã xảy ra lỗi!".

## C. Token và quy ước CSS (tên giữ nguyên, giá trị màu thương hiệu của MSC)

Chép khung `src/app/globals.css` của AMIA; thay các biến thương hiệu: `--nhan`, `--nhan-dam`, `--nhan-nhat`, `--vang*`, `--dat*`, `--espresso*`, `--menu*`, các gradient, `--sac-luc*`. Phần còn lại GIỮ NGUYÊN:
- Nền giấy ngà ấm (`--giay`, `--giay-sang`, `--giay-tram`), chữ mực (`--muc`, `--muc-2`, `--muc-3`), viền (`--vien`, `--vien-dam`), lỗi/cảnh báo (`--loi*`, `--canh-bao*`). Chữ trên nền luôn đạt tương phản ≥ 4,5:1 (kiểm cả bản tối).
- `html { font-size: 15px }`, `line-height: 1.55`, `font-variant-numeric: tabular-nums` (số thẳng hàng).
- **Chiều sâu:** nhiều lớp bóng mềm (`--bong-1/2/3`) + vệt sáng viền trên (`--sang-vien`); thẻ nổi `.the-noi` có vệt màu mảnh 3 px ở trên cùng, nhấc nhẹ 3 px khi rê chuột (`.the-noi-nang`). Không mờ kính, không bóng nặng.
- Nút chính `.nut-vang` (dải màu thương hiệu, chữ trắng, bóng trong). Ô nhập cao 44 px, viền `--vien-dam`, focus có vòng `ring-2`. Nút phụ viền. Xem `components/ui/dinh-dang.ts` (`O_NHAP`, `O_NHIEU_DONG`, `NHAN_O`, `NUT_CHINH`, `NUT_PHU`, `NUT_CHU`, `NUT_CHU_NGUY`).
- Chuyển động ngắn, mượt: 140–220 ms ease-out; thẻ vào `nang-len` 480 ms; bảng thả xuống `hien-nhanh` 140 ms.
- **Sáng / Tối:** mặc định LUÔN sáng; chỉ tối khi người dùng bấm nút Tối trong menu tài khoản (lưu ở máy, `data-theme="dark"`). Bản tối chỉ đổi biến.
- Khung ứng dụng: thanh menu NGANG trên máy tính (nền tối thương hiệu, mục đang chọn gạch chân màu nhấn, bảng thả xuống là thẻ sáng; mục cuối gom vào "Thêm" khi hẹp); thanh tab dưới đáy trên điện thoại; đồng hồ đầu trang; chuông thông báo; ô tìm chung; menu người dùng; nút Sáng/Tối. Chép `components/layout/*`.
- Trang tổng quan của mỗi mục lớn là lưới **thẻ chức năng** (`TrangModule`): ô biểu tượng màu chính 42 px, tên, mô tả một dòng, mũi tên nhích khi rê chuột. Thẻ chưa làm hiện nhãn "Đang hoàn thiện" / "Sắp có" (thật thà), không giả vờ có.

## D. Bộ thành phần dùng chung (chép `src/components/ui/*`, `bieu-do/*`, `layout/*`)

`Table` (bảng kiểu biên tập: tiêu đề chữ hoa nhỏ, kẻ ngang mảnh, hàng 52 px; trên điện thoại thành thẻ qua `.bang-the` + `data-label` + `data-chinh`), `Tab`, `Chon`, `NgayChon`, `GioChon`, `OTien`, `Gat`, `Badge`, `NhanTrangThai`, `MucTrang`, `TieuDeTrang`, `Hop`/`BieuMau`, `HangChiSo`, `ThanhTrang`, `ThanhTyLe`, `NoiChiTiet` (rê chuột/Tab nhảy khung chi tiết), `NutXuatExcel`, biểu đồ (`BieuDoTron`, `CotDung`, `CotNgang`, `DuongMien`, `VongTienDo`). Màn mới phải dùng các thành phần này, KHÔNG tự viết lại kiểu khác.

Quy ước dùng: tiêu đề trang bằng `TieuDeTrang` (tên + một câu phụ + nút chính bên phải); nhóm nội dung bằng `MucTrang`; trạng thái bằng `NhanTrangThai` (xanh/cam/đỏ có chữ, không chỉ màu — người mù màu vẫn đọc được); tiền định dạng `tienVN`, ngày `ngayVN`, giờ múi Việt Nam.

## E. Cách làm một màn mới (quy trình)

1. Một việc chính cho cả trang; xác định nút chính. 2. Dùng thành phần dùng chung. 3. Chạy `npm run kiem-tra-thiet-ke`, `tsc`, `eslint`, `vitest`. 4. Thử trên điện thoại (bảng thành thẻ), iPad, máy tính. 5. Mở bằng trình duyệt thật hoặc chụp màn hình thật trước khi báo xong; điều gì chưa nhìn thì nói rõ. 6. Chỗ phân vân: làm theo hướng quen nhất rồi ghi một dòng để chị chỉnh sau.

## F. Việc MSC cần làm ngay

- Chép `components/ui`, `components/bieu-do`, `components/layout`, `components/chat`, phần CSS dùng chung, bộ kiểm thiết kế; đổi chỉ giá trị màu thương hiệu và logo của MSC.
- Dựng lại khung: thanh menu ngang + thẻ chức năng + tab dưới đáy điện thoại + sáng/tối, cho mọi trang hiện có (nhân sự, công việc, đào tạo, quản trị).
- Đổi mọi `<select>`/ô ngày/ô giờ mặc định sang `Chon`/`NgayChon`/`GioChon`; mọi bảng sang `Table` (thẻ trên điện thoại).
- Gộp commit (Vercel Hobby giới hạn deploy): chỉ gắn `[deploy]` ở commit cuối nhóm.
- Báo lại: danh sách trang đã đổi, trang nào còn khác AMIA, và cái gì chưa nhìn tận mắt.
