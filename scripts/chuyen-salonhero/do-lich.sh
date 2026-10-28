#!/bin/bash
# Chu trình đổ lịch hẹn 1 khoảng: sao lưu → chạy thử → (không lệch) đổ thật → VACUUM FULL → đo. Dùng: PW=… do-lich.sh <từ yyyy-mm> <đến yyyy-mm> <mã đợt> <nhãn>
set -e
D=sao-luu/salonhero-20261028-1753; S=/private/tmp/claude-501/-Users-phamtunglam-project---1140/962d4706-11d1-48bf-b1f9-52cc608d2895/scratchpad/booking_months.json
node scripts/chuyen-salonhero/sao-luu-db.mjs truoc-lich-$4 | tail -1
OUT=$(node scripts/chuyen-salonhero/buoc3-lich-hen.mjs $D --tu $1 --den $2 --dot $3 --song $S 2>&1)
echo "$OUT" | grep -E "Nguồn|Sẽ ghi|LỆCH|LỖI|Chạy thử|tong_lech|khong_co_khach|dv_khong_khop|nv_khong_khop" | cut -c1-200
node scripts/chuyen-salonhero/buoc3-lich-hen.mjs $D --tu $1 --den $2 --dot $3 --song $S --that 2>&1 | grep -E "ĐÃ GHI|HỦY|LỖI|tong_lech" | cut -c1-200
node -e 'import("./scripts/chuyen-salonhero/lib.mjs").then(async ({ketNoi})=>{const db=await ketNoi();for (const t of ["lich_hen","lich_hen_dich_vu"]) await db.query(`vacuum full analyze public.${t}`);console.log("db_mb sau vacuum",(await db.query("select round((pg_database_size(current_database())/1048576.0)::numeric,1) m")).rows[0].m);await db.end();})'
