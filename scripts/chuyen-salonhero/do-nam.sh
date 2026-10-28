#!/bin/bash
# Chu trình đổ hóa đơn 1 năm: sao lưu → chạy thử → (không lệch) đổ thật → VACUUM FULL → đo dung lượng. Dùng: PW=… do-nam.sh <năm> <mã đợt>
set -e
N=$1; DOT=$2; D=sao-luu/salonhero-20261028-1753
node scripts/chuyen-salonhero/sao-luu-db.mjs truoc-hoa-don-$N | tail -1
OUT=$(node scripts/chuyen-salonhero/buoc2-hoa-don.mjs $D --tu $N-01 --den $N-12 --dot $DOT 2>&1)
echo "$OUT" | grep -E "Nguồn|Ngoại lệ|LỆCH|LỖI|CHẠY THỬ|Số hoá đơn hoàn thành|Tổng đã thu \(|Tổng còn nợ|Số dòng hàng|CỘNG" | cut -c1-200
if echo "$OUT" | grep -q -E "LỆCH|LỖI"; then echo "DỪNG: có lệch/lỗi ở chạy thử"; exit 2; fi
node scripts/chuyen-salonhero/buoc2-hoa-don.mjs $D --tu $N-01 --den $N-12 --dot $DOT --that 2>&1 | grep -E "LỆCH|GHI THẬT|HUỶ|LỖI" | cut -c1-200
node -e 'import("./scripts/chuyen-salonhero/lib.mjs").then(async ({ketNoi})=>{const db=await ketNoi();for (const t of ["hoa_don","hoa_don_dong","dong_nhan_vien","thanh_toan"]) await db.query(`vacuum full analyze public.${t}`);console.log("db_mb sau vacuum",(await db.query("select round((pg_database_size(current_database())/1048576.0)::numeric,1) m")).rows[0].m);await db.end();})'
