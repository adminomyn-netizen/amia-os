# Chuyển dữ liệu SalonHero → AMIA OS

SalonHero không có API; dữ liệu lấy bằng chính phiên đăng nhập sẵn của trình duyệt (ABA của AGS), gọi các service Angular của SalonHero rồi lưu JSON vào `sao-luu/salonhero/` (thư mục này chứa dữ liệu khách → nằm trong `.gitignore`, KHÔNG đưa lên git).

## Xuất (25/10/2026)
Trong tab `amia.salonhero.vn` (đã đăng nhập), chạy qua `ags aba do '{"action":"js",...}'` các lệnh sau rồi kéo từng đoạn ~300KB về:

| Tệp | Nguồn trong SalonHero |
|---|---|
| `khach.json` | `CustomerService.getCustomerList({limit:500, offset, search:"", merchant_id})` lặp tới hết (13.577) |
| `khach_chi_tiet.json` | `CustomerService.getCustomerById({customer_id})` cho từng khách (địa chỉ, ghi chú, nguồn, tổng chi, lần ghé cuối…) |
| `the.json` | `MemberCardService.getMemberCardList({}, true)` (= `/membercards/getAllMemberCards`) |
| `loai_the.json` | `CardService.getCardList()` |
| `dich_vu.json`, `san_pham.json` | `ProductService.getProductList({type:"SERVICE"/"PRODUCT", limit:5000, offset:0})` |
| `nhom.json` | `ProductService.getGroupList({})` |
| `nhan_vien.json` | `OperatorService.getOperatorList({merchant_id})` |
| `ton_kho.json` | `ProductInventoryService.getAllInventories()` |
| `no.json` | `Request.get("/report/getDebtOrdersList", {startDate:null,endDate:null,timeFilterType:"order_created_at"})` |
| `don_vi.json` | `$rootScope.product_unit_1/2` (bảng đơn vị, chỉ số bắt đầu từ 0) |

Không xuất bảng người dùng (có token đăng nhập).

## Nhập
```
PW=$(security find-generic-password -s amia-os-db-password -w) node scripts/nhap-salonhero/chay.mjs          # chạy thử, tự huỷ
PW=$(security find-generic-password -s amia-os-db-password -w) node scripts/nhap-salonhero/chay.mjs --that   # ghi thật
```
Chạy lại an toàn (mọi bản ghi có `sh_id` unique, gặp lại thì bỏ qua); kết thúc tự đối chiếu 6 chỉ số và huỷ nếu có số lệch.

## Quy tắc đã chọn
- **Không phát lại lịch sử hoá đơn** (sẽ trừ kho, sinh hoa hồng, thổi doanh thu). Chỉ chuyển số dư đầu kỳ.
- **Thẻ**: mỗi thẻ có 1 dòng "cấp" (số buổi gốc) + 1 dòng "điều chỉnh" (số buổi đã dùng) ⇒ còn lại khớp SalonHero; thẻ tiền = 1 dòng "cấp" bằng số dư hiện tại. Thẻ bị khoá / thu hồi ở SalonHero giữ nguyên trạng thái. Thẻ đã dùng hết không có trong nguồn xuất của SalonHero ⇒ không chuyển (không ảnh hưởng số dư).
- **Công nợ**: mỗi đơn còn nợ (= tổng − đã thu − đã thu nợ sau) thành 1 hoá đơn `la_so_du_dau` (không tính doanh thu, không tính chi tiêu khách, không huỷ được); thu nợ bình thường, tiền thu vào "thu nợ cũ".
- **Hạng khách**: giữ hạng SalonHero (`hang_goc`), hạng hiển thị = cao hơn giữa hạng này và hạng theo chi 12 tháng.
- **Khách đã bị xoá khỏi danh sách SalonHero nhưng còn thẻ**: dựng lại hồ sơ từ dữ liệu thẻ (có ghi chú cảnh báo) để không mất số dư.
- **SĐT**: trống ⇒ `KHONG-SDT-<id>`; trùng ⇒ thêm `-TRUNG<id>` + ghi chú; cần người rà. Mã khách trùng thêm `-<id>`.
- **Chi nhánh khách**: theo cơ sở tạo (`init_location_id`), không rõ ⇒ Vinh.
- Người phụ trách mặc định = tài khoản Chủ. Nguồn khách suy từ chữ SalonHero ("page/facebook/voucher" ⇒ mkt, "bạn bè giới thiệu" ⇒ khách cũ giới thiệu, còn lại ⇒ khác).
- Thẻ liệu trình không giới hạn buổi ở SalonHero (use_limit = 999999) giữ nguyên số đó.
- Thẻ chuyển sang KHÔNG khoá theo dịch vụ (SalonHero gắn thẻ với một "dịch vụ vỏ"); nhân viên chọn đúng dịch vụ khi trừ buổi.
- Chưa chuyển: lịch sử hoá đơn/đơn hàng, lịch hẹn, ảnh khách, điểm thưởng (chỉ lưu số), định mức vật tư, lương/hoa hồng.

## Chạy song song rồi chuyển lần cuối
- Bộ nhập chỉ THÊM bản ghi mới (theo `sh_id`); KHÔNG cập nhật số dư thẻ / công nợ của bản ghi đã nhập. Trong lúc chạy song song, SalonHero vẫn thay đổi, nên số dư bên AMIA OS sẽ dần lệch SalonHero.
- Trước khi tắt SalonHero: dừng nhập liệu bên SalonHero → xuất lại → xoá toàn bộ bản ghi có `sh_id` (và dữ liệu phát sinh trên chúng) hoặc dựng DB mới → chạy lại `chay.mjs --that` → đối chiếu. Đừng làm bước này khi bên AMIA OS đã có giao dịch thật chưa chốt cách xử lý.

## Ảnh khách
**Quyết định của chị Lâm (25/10/2026): tạm KHÔNG lưu ảnh khách trên AMIA OS.** Ảnh vẫn xem ở SalonHero trong thời gian chạy song song.
Số liệu để quyết định lại sau: 259.990 ảnh của 5.110 khách, trung bình ~1,6 MB/ảnh ⇒ khoảng 430 GB (danh sách ở `sao-luu/salonhero/anh.json`). Đã chuẩn bị sẵn: `src/lib/kho-anh.ts` (dùng Cloudflare R2 khi có biến `R2_*`, nếu không dùng kho Supabase) và `anh.mjs` (tải từ CDN công khai của SalonHero rồi đẩy lên R2, chạy tiếp được). Phương án rẻ hơn nếu cần: thu nhỏ còn ~300 KB/ảnh (~80 GB).
