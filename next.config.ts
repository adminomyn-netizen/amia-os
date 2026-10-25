import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dữ liệu phòng khám phải luôn mới theo từng lượt xem: dùng render động cổ điển.
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
};

export default nextConfig;
