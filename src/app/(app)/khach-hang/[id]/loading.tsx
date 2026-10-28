/** Khi đổi khách chỉ cột hồ sơ bên phải hiện khung chờ, danh sách bên trái đứng yên. */
export default function DangTaiHoSo() {
  return (
    <div aria-busy="true" aria-label="Đang tải hồ sơ" className="space-y-3">
      <div className="h-24 animate-pulse rounded-the bg-giay-tram" />
      <div className="h-10 animate-pulse rounded-nho bg-giay-tram" />
      <div className="h-72 animate-pulse rounded-the bg-giay-tram" />
    </div>
  );
}
