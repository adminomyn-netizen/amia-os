// Đo sức khoẻ tiến trình máy chủ (không cần đăng nhập, không lộ dữ liệu): tiến trình chạy được bao lâu, RAM.
// Dùng để bắt việc hosting tự khởi động lại tiến trình (trang đang tải bị cắt → lỗi "Hệ thống đang chậm"), 10/11/2026.
export const dynamic = "force-dynamic";
const BAT_DAU = Date.now();
export function GET() {
  const m = process.memoryUsage();
  return Response.json({ pid: process.pid, chay_giay: Math.round(process.uptime()), mo_dun_giay: Math.round((Date.now() - BAT_DAU) / 1000), rss_mb: Math.round(m.rss / 1048576), heap_mb: Math.round(m.heapUsed / 1048576) }, { headers: { "cache-control": "no-store" } });
}
