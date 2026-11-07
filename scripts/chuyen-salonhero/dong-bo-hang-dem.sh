#!/bin/bash
# Đồng bộ SalonHero → AMIA OS (giai đoạn chạy song song, tới 15/11/2026). launchd gọi 2 lượt/ngày (chị Lâm 06/11/2026: "đầu ngày, cuối ngày có dữ liệu mới nào kéo qua hết"):
#   23:15 cuối ngày: sao lưu TOÀN DB (luật 1 bản/đêm 23h-5h).   07:00 đầu ngày (tham số "sang"): chỉ sao lưu các bảng đồng bộ sẽ ghi (--bang, ≤8 bảng/lần).
# Thứ tự: cập nhật mã → 1 sao lưu toàn DB (đúng luật 1 bản/đêm 23h-5h) → chạy thử → nếu đối chiếu sạch thì ghi thật (xung đột chỉ liệt kê) → ghi báo cáo sáng.
# Báo cáo: sao-luu/dong-bo-bao-cao-<ngày>.md (đọc 07:30). Không in mật khẩu.
set -u
# chạy từ BẢN SAO: bước git reset bên dưới thay chính tệp này, bash đang đọc dở sẽ hỏng (6/11/2026 lượt kéo bù dừng câm)
if [ -z "${DB_BAN_SAO:-}" ]; then BS="${TMPDIR:-/tmp}/dong-bo-hang-dem.$$.sh"; cp "$0" "$BS"; DB_BAN_SAO=1 exec /bin/bash "$BS" "$@"; fi
export LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8  # launchd không có locale → cut cắt vỡ chữ có dấu trong báo cáo
export PATH="/Users/phamtunglam/.local/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"
cd /Users/phamtunglam/project___1140/amia-os/.claude/worktrees/tula-dongbo || exit 1
git fetch -q origin && git reset -q --hard origin/main
export PW="$(security find-generic-password -s amia-os-db-password -w)"
G=/Users/phamtunglam/project___1140/amia-os
LUOT="${1:-dem}"; NGAY=$(date +%Y%m%d); DUOI=""; [ "$LUOT" = "sang" ] && DUOI="-sang"
BC="$G/sao-luu/dong-bo-bao-cao-$NGAY$DUOI.md"; THU="$G/sao-luu/dong-bo-thu-$NGAY$DUOI.log"; THAT="$G/sao-luu/dong-bo-that-$NGAY$DUOI.log"
{ echo "# Đồng bộ SalonHero → AMIA $([ "$LUOT" = sang ] && echo 'đầu ngày' || echo 'đêm') $NGAY (bắt đầu $(date +%H:%M))"; } > "$BC"
# đo nhanh DB: chậm (đăng nhập > 3 s) thì chờ 2 phút, tối đa 6 lần, rồi vẫn chạy (script tự có giao dịch ngắn)
for i in 1 2 3 4 5 6; do
  r=$(node scripts/chuyen-salonhero/canh-db.mjs 2>/dev/null | tail -1)
  ms=$(echo "$r" | sed -n 's/.*"dn_ms":\([0-9]*\).*/\1/p'); ok=$(echo "$r" | grep -c '"dn":"ok"')
  [ "$ok" = "1" ] && [ "${ms:-99999}" -le 3000 ] && break; echo "- $(date +%H:%M) đăng nhập chậm (${ms:-?} ms), chờ 2 phút" >> "$BC"; sleep 120
done
if [ "$LUOT" = "sang" ]; then
  node scripts/chuyen-salonhero/sao-luu-db.mjs --bang=hoa_don,hoa_don_dong,khach_hang,lich_hen,lich_hen_dich_vu,thanh_toan,the_khach,the_so_cai truoc-dong-bo-$NGAY-sang-a 2>&1 | tail -1 >> "$BC"
  node scripts/chuyen-salonhero/sao-luu-db.mjs --bang=dong_hoa_hong_goc,dong_nhan_vien,khach_ghi_chu,khach_nhac,sh_gio_thanh_toan,so_quy,so_quy_nguoi_nhan_sh,nhan_vien truoc-dong-bo-$NGAY-sang-b 2>&1 | tail -1 >> "$BC"
else
  node scripts/chuyen-salonhero/sao-luu-db.mjs truoc-dong-bo-$NGAY 2>&1 | tail -2 >> "$BC"
fi
node scripts/chuyen-salonhero/dong-bo-dem.mjs --bo-qua-xung-dot --ghi-de > "$THU" 2>&1
if grep -q "CHẠY THỬ XONG" "$THU" && ! grep -q "CÓ LỆCH" "$THU"; then
  node scripts/chuyen-salonhero/dong-bo-dem.mjs --bo-qua-xung-dot --ghi-de --that > "$THAT" 2>&1
  echo "## Kết quả ghi thật" >> "$BC"; grep -E "ĐÃ GHI THẬT|DỪNG|HUỶ|LỆCH" "$THAT" | head -5 >> "$BC"
  echo '```' >> "$BC"; sed 's/\x1b\[[0-9;]*m//g' "$THAT" | grep -E "│ [0-9]+ +│" | cut -c1-200 >> "$BC"; echo '```' >> "$BC"
  # giờ thu thật của các lần khách trả tiền (bảng tra sh_gio_thanh_toan, migration 0251) — chỉ ghi bảng tra
  XQ=$(ls -dt "$G"/sao-luu/dong-bo-$NGAY-*/gio_thu.ndjson 2>/dev/null | head -1)
  [ -n "$XQ" ] && node scripts/chuyen-salonhero/gio-thanh-toan-sh.mjs --tep "$XQ" 2>&1 | tail -1 | sed 's/^/- giờ thu: /' >> "$BC"
else
  echo "## KHÔNG GHI: chạy thử có lệch/lỗi — xem $THU" >> "$BC"
  sed 's/\x1b\[[0-9;]*m//g' "$THU" | grep -E "LỆCH|DỪNG|Error|lỗi" | head -10 >> "$BC"
fi
# số dư thẻ tính sẵn (the_so_du, migration 0301) phải khớp sổ cái sau đồng bộ: hàm trả số thẻ phải sửa, mong đợi 0
node --input-type=module -e 'import { ketNoi } from "./scripts/chuyen-salonhero/lib.mjs"; const db = await ketNoi(); const r = await db.query("select public.tinh_lai_the_so_du() n"); console.log("- số dư thẻ tính sẵn phải sửa: " + r.rows[0].n + " (mong đợi 0)"); await db.end();' >> "$BC" 2>&1
echo "- kết thúc $(date +%H:%M)" >> "$BC"
