#!/bin/bash
# Đồng bộ SalonHero → AMIA OS mỗi đêm (giai đoạn chạy song song, tới 15/11/2026). launchd gọi lúc 23:15.
# Thứ tự: cập nhật mã → 1 sao lưu toàn DB (đúng luật 1 bản/đêm 23h-5h) → chạy thử → nếu đối chiếu sạch thì ghi thật (xung đột chỉ liệt kê) → ghi báo cáo sáng.
# Báo cáo: sao-luu/dong-bo-bao-cao-<ngày>.md (đọc 07:30). Không in mật khẩu.
set -u
export PATH="/Users/phamtunglam/.local/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"
cd /Users/phamtunglam/project___1140/amia-os/.claude/worktrees/tula-dongbo || exit 1
git fetch -q origin && git reset -q --hard origin/main
export PW="$(security find-generic-password -s amia-os-db-password -w)"
G=/Users/phamtunglam/project___1140/amia-os
NGAY=$(date +%Y%m%d); BC="$G/sao-luu/dong-bo-bao-cao-$NGAY.md"; THU="$G/sao-luu/dong-bo-thu-$NGAY.log"; THAT="$G/sao-luu/dong-bo-that-$NGAY.log"
{ echo "# Đồng bộ SalonHero → AMIA đêm $NGAY (bắt đầu $(date +%H:%M))"; } > "$BC"
# đo nhanh DB: chậm (đăng nhập > 3 s) thì chờ 2 phút, tối đa 6 lần, rồi vẫn chạy (script tự có giao dịch ngắn)
for i in 1 2 3 4 5 6; do
  r=$(node /private/tmp/claude-501/-Users-phamtunglam-project---1140/962d4706-11d1-48bf-b1f9-52cc608d2895/scratchpad/canh.mjs 2>/dev/null | tail -1)
  ms=$(echo "$r" | sed -n 's/.*"dn_ms":\([0-9]*\).*/\1/p'); ok=$(echo "$r" | grep -c '"dn":"ok"')
  [ "$ok" = "1" ] && [ "${ms:-99999}" -le 3000 ] && break; echo "- $(date +%H:%M) đăng nhập chậm (${ms:-?} ms), chờ 2 phút" >> "$BC"; sleep 120
done
node scripts/chuyen-salonhero/sao-luu-db.mjs truoc-dong-bo-$NGAY 2>&1 | tail -2 >> "$BC"
node scripts/chuyen-salonhero/dong-bo-dem.mjs --bo-qua-xung-dot > "$THU" 2>&1
if grep -q "CHẠY THỬ XONG" "$THU" && ! grep -q "CÓ LỆCH" "$THU"; then
  node scripts/chuyen-salonhero/dong-bo-dem.mjs --bo-qua-xung-dot --that > "$THAT" 2>&1
  echo "## Kết quả ghi thật" >> "$BC"; grep -E "ĐÃ GHI THẬT|DỪNG|HUỶ|LỆCH" "$THAT" | head -5 >> "$BC"
  echo '```' >> "$BC"; sed 's/\x1b\[[0-9;]*m//g' "$THAT" | grep -E "│ [0-9]+ +│" | cut -c1-200 >> "$BC"; echo '```' >> "$BC"
else
  echo "## KHÔNG GHI: chạy thử có lệch/lỗi — xem $THU" >> "$BC"
  sed 's/\x1b\[[0-9;]*m//g' "$THU" | grep -E "LỆCH|DỪNG|Error|lỗi" | head -10 >> "$BC"
fi
echo "- kết thúc $(date +%H:%M)" >> "$BC"
