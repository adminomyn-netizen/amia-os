import type { MetadataRoute } from "next";

/** Cài lên màn hình chính điện thoại/máy tính: tên, màu và biểu tượng AMIA. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AMIA OS",
    short_name: "AMIA",
    description: "Phần mềm vận hành phòng khám AMIA",
    start_url: "/",
    display: "standalone",
    background_color: "#0a2b26",
    theme_color: "#0a2b26",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
