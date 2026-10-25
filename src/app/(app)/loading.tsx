export default function DangTai() {
  return (
    <div aria-busy="true" aria-label="Đang tải" className="space-y-4">
      <div className="h-10 w-64 animate-pulse rounded-nho bg-giay-tram" />
      <div className="h-24 animate-pulse rounded-nho bg-giay-tram" />
      <div className="h-64 animate-pulse rounded-nho bg-giay-tram" />
    </div>
  );
}
