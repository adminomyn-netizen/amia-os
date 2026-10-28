# Đồng bộ đêm SalonHero → AMIA OS (đến 15/11/2026)

SalonHero còn nhận dữ liệu tới 15/11/2026 14:57; AMIA đã nạp bản chụp 28/10. Script `scripts/chuyen-salonhero/dong-bo-dem.mjs` kéo PHẦN THAY ĐỔI về, idempotent theo `sh_id`, mã đợt `SH-DB-<yyyymmdd>`.

## Việc script làm (một lần chạy = một giao dịch)
1. Xuất từ SalonHero bằng **tab MỚI** của ABA (`window_new`, chỉ gọi hàm đọc; tự đóng tab khi xong; không đụng tab đang dùng). Pha `ds`: danh sách hoá đơn `[mốc−35 ngày, hôm nay+1)`, lịch hẹn `[mốc−35 ngày, +8 tháng)`, cả danh sách khách và thẻ, nhắc chăm sóc mới/đổi. Pha `ct`: chi tiết hoá đơn mới/đổi/lệch trạng thái, khách mới/đổi/lệch, thẻ của khách có thẻ đổi và thẻ AMIA còn số dư mà đã biến khỏi danh sách SalonHero. Lấy dữ liệu tối đa 3 yêu cầu song song. `end_date` của SalonHero KHÔNG gồm ngày đó → luôn dùng khoảng nửa mở.
2. Nạp vào AMIA theo thứ tự: khách → thẻ → hoá đơn → lịch hẹn → nhắc, cùng logic các `buoc1/1b/2/3/4` (mã khách/thẻ/hoá đơn, quy đổi chi nhánh, thu ngân, hoa hồng gốc, người hưởng…).
   - mới → thêm; đã có → so sánh, **chỉ sửa khi SalonHero đã đổi**; không có gì đổi thì không ghi.
   - hoá đơn đổi/huỷ/thu nợ sau: xoá dòng + thanh toán LỊCH SỬ của hoá đơn đó rồi dựng lại từ SalonHero; hoá đơn bị huỷ ở SalonHero thì chuyển `huy` (bỏ qua trigger chặn huỷ đơn lịch sử, chỉ trong đúng câu lệnh đó).
   - lịch đổi trạng thái/giờ/dịch vụ → cập nhật dòng lịch sử; thẻ đổi số dư → thêm 1 dòng sổ cái `dieu_chinh` (không sửa dòng cũ).
3. Đối chiếu ngay trong giao dịch với SalonHero: khách thiếu, số HĐ + tổng tiền HĐ (sau trừ thẻ) + nợ **từng ngày** (bảng doanh thu ngày), lịch theo tháng × trạng thái, số dư thẻ, mục xuất lỗi, xung đột.
4. **Mặc định CHẠY THỬ (ROLLBACK).** `--that` mới commit, và chỉ khi (a) có bản sao lưu `…truoc-dong-bo-…` tạo trong 3 giờ qua, (b) đối chiếu không lệch, (c) không xung đột.

## Không đụng dữ liệu tạo trong app
Chỉ xử lý dòng có `sh_id`. Dòng có `sh_id` mà bị sửa trong app = XUNG ĐỘT → bỏ qua và liệt kê (script chặn `--that` khi còn xung đột, người xử lý quyết):
- khách/lịch có `cap_nhat_luc` mới hơn lần đồng bộ trước (khách: vẫn cập nhật các chỉ số gốc hạng/điểm/tổng chi, không đè phần mô tả);
- hoá đơn có thanh toán, dòng hàng hoặc thẻ tạo trong app;
- thẻ có dòng sổ cái do app tạo (vd khách dùng thẻ ở hoá đơn AMIA);
- nhắc đã đổi trạng thái trong app.
Hoá đơn tạo trong app (HD00000x, `sh_id` rỗng) không bao giờ bị chạm. Không xoá khách/hoá đơn/lịch nào.

## Cách chạy mỗi đêm (KHÔNG tự chạy ghi DB thật — Tula quyết có đặt lịch hay không)
```bash
cd /Users/phamtunglam/project___1140/amia-os
export PW="$(security find-generic-password -s amia-os-db-password -w)"
NGAY=$(date +%Y%m%d)
# 1) chạy thử (xuất từ SalonHero + nạp thử + đối chiếu, rollback). In thư mục xuất: sao-luu/dong-bo-<ngày>-<giờ>/
node scripts/chuyen-salonhero/dong-bo-dem.mjs
# 2) nếu "đối chiếu SẠCH": sao lưu rồi ghi thật, dùng lại đúng bản xuất đó
node scripts/chuyen-salonhero/sao-luu-db.mjs truoc-dong-bo-$NGAY
node scripts/chuyen-salonhero/dong-bo-dem.mjs --thu-muc sao-luu/dong-bo-<ngày>-<giờ> --that
# 3) kiểm dung lượng (<350MB) và đối chiếu lại các ngày vừa đổ
node scripts/chuyen-salonhero/kiem-dung-luong.mjs
```
Mốc lần sau tự lấy từ `sao-luu/dong-bo-moc.json` (ghi sau mỗi `--that` thành công; nhật ký ở `sao-luu/dong-bo-nhat-ky.ndjson`). Muốn đồng bộ lại từ ngày cũ: `--tu 2026-10-28`. Ngày 15/11 chạy lần cuối với `--den 2026-11-15` sau 14:57.

Tự kiểm (luôn rollback): `--thu-muc <thư mục xuất> --tu-kiem` — giả lập "mất" vài hoá đơn/lịch/thẻ và đổi vài dòng trong giao dịch rồi cho đồng bộ vá lại; đối chiếu phải về sạch.

## Giới hạn đã biết (chưa làm trong bản này)
- Không đồng bộ danh mục (dịch vụ, sản phẩm, gói thẻ, nhân viên) mới tạo ở SalonHero sau 28/10: dòng hàng/thẻ/lịch trỏ tới danh mục chưa có sẽ được đếm (`dong_khong_co_danh_muc`, `khong_co_goi`, `dv_khong_khop`) để người xử lý bổ sung danh mục rồi chạy lại.
- Hoá đơn lịch sử không trừ kho (như đợt 28/10); kho, nhóm khách và sổ điểm thưởng (buoc5/buoc6) không chạy lại — chỉ cập nhật cột gốc `diem_goc`, `hang_goc`.
- Khách đã bị xoá khỏi danh sách SalonHero (còn thẻ) không được dựng lại; lịch/nhắc của khách không có ở AMIA bị bỏ qua và trừ khỏi đối chiếu.
- Hoá đơn nháp (DRAFT) không nạp.
- Thẻ đã dùng hết/hết hạn từ trước mốc không được hỏi lại.
