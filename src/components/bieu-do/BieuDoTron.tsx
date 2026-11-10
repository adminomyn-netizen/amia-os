import { MAU_BIEU_DO, type Diem } from "./mau";
import { HINH_CHUAN, HINH_MONG, phanTramChu, type KhucTron } from "./hinh-cung";
import { TronTuongTac } from "./TronTuongTac";

/**
 * Biểu đồ tròn (banh = đặc, vong = rỗng có số tổng ở giữa, mong = vòng dày của trang chủ). Chạy ở máy chủ: tính sẵn chữ
 * (số tiền, phần trăm, câu cho trình đọc) rồi đưa cho phần tương tác ở trình duyệt, nên hàm định dạng truyền vào không bị lọt sang đó.
 * Rê chuột / chạm vào khúc hoặc dòng chú giải để xem số tiền và phần trăm của khúc đó.
 */
export function BieuDoTron({ duLieu, kieu = "vong", nhanTam, dinhDang = (n: number) => n.toLocaleString("vi-VN"), dinhDangTam, dinhDangGon, tamChinh, ten, trong = "Chưa có dữ liệu để vẽ." }: {
  duLieu: Diem[];
  kieu?: "banh" | "vong" | "mong";
  nhanTam?: string;
  /** Định dạng số trong khung chi tiết và câu đọc màn hình (số đầy đủ). */
  dinhDang?: (n: number) => string;
  /** Số ở tâm vòng (nên gọn để nằm trọn trong vòng); mặc định dùng dinhDang. */
  dinhDangTam?: (n: number) => string;
  /** Số ở chú giải bên cạnh (nên gọn cho vừa màn hẹp); mặc định dùng dinhDang. */
  dinhDangGon?: (n: number) => string;
  /** Chữ ở tâm vòng thay cho tổng (vd phần trăm đã chấm công); khi tổng bằng 0 vẫn vẽ vòng rỗng kèm chữ này. */
  tamChinh?: string;
  ten: string;
  /** Câu hiện khi không có số liệu nào để vẽ. */
  trong?: string;
}) {
  const ds = duLieu.filter((d) => d.gia_tri > 0);
  const tong = ds.reduce((s, d) => s + d.gia_tri, 0);
  const hinh = kieu === "mong" ? HINH_MONG : HINH_CHUAN(kieu === "vong");
  const coTam = kieu !== "banh";
  const bocCuc = kieu === "mong" ? "mong" : "chuan";
  if (tong <= 0) {
    // Tâm vòng có chữ riêng (vd 0% đã chấm công) thì vẫn vẽ vòng rỗng để khung không nhảy; còn lại chỉ báo chưa có dữ liệu.
    if (tamChinh == null || !coTam) return <p className="py-8 text-center text-[14px] text-muc-3">{trong}</p>;
    return <TronTuongTac khuc={[]} hinh={hinh} ten={ten} tamChinh={tamChinh} tamPhu={nhanTam} bocCuc={bocCuc} bong={kieu !== "mong"} trong={trong} />;
  }
  const gon = dinhDangGon ?? dinhDang;
  const khuc: KhucTron[] = ds.map((d, i) => {
    const truoc = ds.slice(0, i).reduce((t, x) => t + x.gia_tri, 0);
    const a0 = (truoc / tong) * 2 * Math.PI, a1 = ((truoc + d.gia_tri) / tong) * 2 * Math.PI, pt = phanTramChu((d.gia_tri / tong) * 100), tien = dinhDang(d.gia_tri);
    return { nhan: d.nhan, mau: d.mau ?? MAU_BIEU_DO[i % MAU_BIEU_DO.length], a0, a1, tien, gon: gon(d.gia_tri), pt, doc: `${d.nhan}: ${tien}, ${pt}`, href: d.href };
  });
  const giua = tamChinh ?? (dinhDangTam ?? dinhDang)(tong);
  return <TronTuongTac khuc={khuc} hinh={hinh} ten={ten} tamChinh={coTam ? giua : undefined} tamPhu={coTam ? nhanTam : undefined} bocCuc={bocCuc} bong={kieu !== "mong"} />;
}
