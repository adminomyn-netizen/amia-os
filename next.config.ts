import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dữ liệu phòng khám phải luôn mới theo từng lượt xem: dùng render động cổ điển.
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  // Nhân sự (hồ sơ, chấm công, lương, tuyển dụng...) đã chuyển sang MSC Group OS (31/10/2026).
  // Mã trang vẫn còn trong repo: muốn bật lại thì bỏ khối redirects này và thêm lại mục trong src/lib/module.ts + nav.tsx.
  async redirects() {
    return [
      { source: "/nhan-su", destination: "/da-chuyen-msc", permanent: false },
      { source: "/nhan-su/:path*", destination: "/da-chuyen-msc", permanent: false },
    ];
  },
};

export default nextConfig;
