import Link from "next/link";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { gioVN, homNayHCM, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { LOI_CC } from "@/lib/nhan-su";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { caCuaNgayChiTiet } from "@/lib/ca-lam";
import { KhungChamCong } from "@/components/nhan-su/KhungChamCong";
import { chamCongVao, chamCongRa, nhapCongThuCong, khoaThangCong } from "../actions";

const thangKe = (t: string, n: number) => { const [y, m] = t.split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`; };

export default async function TrangChamCong({ searchParams }: { searchParams: Promise<{ tab?: string; thang?: string }> }) {
  const nd = await yeuCauNoiBo();
  const xem = coQuyen(nd, "cong.xem"), sua = coQuyen(nd, "cong.sua");
  const TAB = [{ ma: "cua-toi", ten: "Của tôi" }, ...(xem ? [{ ma: "bang-cong", ten: "Bảng công" }, { ma: "tong-hop", ten: "Tổng hợp tháng" }] : [])];
  const sp = await searchParams;
  const tab = TAB.some((x) => x.ma === sp.tab) ? sp.tab! : "cua-toi";
  const hom = homNayHCM();
  const thang = /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.thang ?? "") ? sp.thang! : hom.slice(0, 7);
  const [nam, th] = thang.split("-").map(Number);
  const dau = `${thang}-01`, cuoi = `${thangKe(thang, 1)}-01`;
  const db = sb();
  const [{ data: nv }, { data: khoa }] = await Promise.all([db.from("nhan_vien").select("id, ho_ten, ma_nv, chi_nhanh_id, khung_lam_viec").order("ho_ten"), db.from("bang_cong_thang").select("khoa").eq("nam", nam).eq("thang", th).maybeSingle()]);
  const ten = new Map((nv ?? []).map((n) => [n.id, n]));
  const trongPhamVi = (id: string) => !nd.chiNhanhId || ten.get(id)?.chi_nhanh_id === nd.chiNhanhId;
  const dangKhoa = !!khoa?.khoa;
  const dieuHuong = (
    <div className="mb-4 flex items-center gap-4 text-[14px]">
      <Link href={`/nhan-su/cham-cong?tab=${tab}&thang=${thangKe(thang, -1)}`} className="text-muc-3 hover:text-muc">← Tháng trước</Link>
      <span className="font-medium text-muc">Tháng {th}/{nam}</span>
      <Link href={`/nhan-su/cham-cong?tab=${tab}&thang=${thangKe(thang, 1)}`} className="text-muc-3 hover:text-muc">Tháng sau →</Link>
      {dangKhoa && <NhanTrangThai kieu="cho">Đã khoá công</NhanTrangThai>}
    </div>
  );

  let noiDung: React.ReactNode;
  if (tab === "cua-toi") {
    const [{ data: cc }, { data: du }] = await Promise.all([
      db.from("cham_cong").select("*").eq("nhan_vien_id", nd.nhanVienId).gte("ngay", dau).lt("ngay", cuoi).order("ngay", { ascending: false }),
      db.rpc("so_du_phep", { p_nv: nd.nhanVienId, p_nam: nam }),
    ]);
    const homNay = (cc ?? []).find((c) => c.ngay === hom);
    const { ca, lyDo: lyDoKhongCa } = await caCuaNgayChiTiet(nd.nhanVienId, hom);
    const tongCong = (cc ?? []).reduce((a, c) => a + Number(c.cong), 0);
    noiDung = (
      <>
        <KhungChamCong ngay={ngayVN(hom)} lyDoKhongCa={lyDoKhongCa}
          ca={ca ? { ten: ca.ten, vao: ca.gio_vao, ra: ca.gio_ra, dungSai: ca.dung_sai_phut } : null}
          vao={homNay?.vao ? { gio: gioVN(homNay.vao), trePhut: homNay.tre_phut } : null}
          ra={homNay?.ra ? { gio: gioVN(homNay.ra), veSomPhut: homNay.ve_som_phut } : null}
          nutVao={<NutHop nhan="Chấm công vào" tieuDe="Chấm công vào" xacNhan="Ghi giờ vào làm bằng giờ hiện tại?" action={chamCongVao} nhanLuu="Chấm công vào" />}
          nutRa={<NutHop kieu="phu" nhan="Chấm công ra" tieuDe="Chấm công ra" xacNhan="Ghi giờ tan ca bằng giờ hiện tại?" action={chamCongRa} nhanLuu="Chấm công ra" />} />
        <HangChiSo muc={[{ nhan: "Công tháng này", so: soVN(tongCong) }, { nhan: "Ngày đi trễ", so: String((cc ?? []).filter((c) => c.tre_phut > 0).length) }, { nhan: "Phép năm còn lại", so: soVN(du), ghiChu: "ngày" }]} />
        <div className="mt-6" />
        {dieuHuong}
        <Bang duLieu={cc ?? []} khoa={(r) => r.id} trong="Chưa có chấm công trong tháng này."
          cot={[
            { nhan: "Ngày", chinh: true, hienThi: (r) => ngayVN(r.ngay) }, { nhan: "Vào", hienThi: (r) => gioVN(r.vao) }, { nhan: "Ra", hienThi: (r) => gioVN(r.ra) },
            { nhan: "Công", phai: true, hienThi: (r) => soVN(r.cong) }, { nhan: "Trễ (phút)", phai: true, hienThi: (r) => (r.tre_phut ? <span className="text-canh-bao">{r.tre_phut}</span> : "") },
            { nhan: "Về sớm (phút)", phai: true, hienThi: (r) => (r.ve_som_phut ? <span className="text-canh-bao">{r.ve_som_phut}</span> : "") },
            { nhan: "Ghi chú", hienThi: (r) => [r.phuong_thuc === "thu_cong" ? "Nhập tay" : "", r.loi ? LOI_CC[r.loi] : "", r.ghi_chu ?? ""].filter(Boolean).join(" · ") },
          ]} />
      </>
    );
  } else if (tab === "bang-cong") {
    const { data: cc } = await db.from("cham_cong").select("*").gte("ngay", dau).lt("ngay", cuoi).order("ngay", { ascending: false }).limit(1500);
    const ds = (cc ?? []).filter((c) => trongPhamVi(c.nhan_vien_id));
    const truong: Truong[] = [
      { ten: "nhan_vien_id", nhan: "Nhân viên", loai: "chon", batBuoc: true, luaChon: (nv ?? []).filter((n) => trongPhamVi(n.id) && n.khung_lam_viec !== "khong_cham_cong").map((n) => ({ gia_tri: n.id, nhan: `${n.ho_ten} (${n.ma_nv})` })) },
      { ten: "ngay", nhan: "Ngày", loai: "ngay", batBuoc: true }, { ten: "gio_vao", nhan: "Giờ vào (08:00)", loai: "chu" }, { ten: "gio_ra", nhan: "Giờ ra (17:30)", loai: "chu" },
      { ten: "ghi_chu", nhan: "Lý do nhập tay", loai: "chu", rong: true },
    ];
    noiDung = (
      <>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">{dieuHuong}{sua && !dangKhoa && <NutHop nhan="Nhập công thủ công" tieuDe="Nhập công thủ công" moTa="Ghi đè bản ghi chấm công của ngày đó. Tháng đã khoá thì không nhập được." truong={truong} action={nhapCongThuCong} giaTri={{ ngay: hom }} />}</div>
        <Bang duLieu={ds} khoa={(r) => r.id} trong="Chưa có chấm công trong tháng này."
          cot={[
            { nhan: "Ngày", chinh: true, hienThi: (r) => ngayVN(r.ngay) }, { nhan: "Nhân viên", hienThi: (r) => <span className="text-muc">{ten.get(r.nhan_vien_id)?.ho_ten}</span> },
            { nhan: "Vào", hienThi: (r) => gioVN(r.vao) }, { nhan: "Ra", hienThi: (r) => gioVN(r.ra) }, { nhan: "Công", phai: true, hienThi: (r) => soVN(r.cong) },
            { nhan: "Trễ", phai: true, hienThi: (r) => (r.tre_phut ? `${r.tre_phut}'` : "") }, { nhan: "Về sớm", phai: true, hienThi: (r) => (r.ve_som_phut ? `${r.ve_som_phut}'` : "") },
            { nhan: "Phương thức", hienThi: (r) => (r.phuong_thuc === "thu_cong" ? "Nhập tay" : "Web") },
          ]} />
      </>
    );
  } else {
    const [{ data: th2 }, { data: cc }, { data: muc }] = await Promise.all([
      db.rpc("tong_hop_cong", { p_nam: nam, p_thang: th, p_cn: (nd.chiNhanhId ?? undefined) as string }),
      db.from("cham_cong").select("nhan_vien_id, tre_phut, ve_som_phut").gte("ngay", dau).lt("ngay", cuoi),
      db.from("muc_phat_cham_cong").select("*"),
    ]);
    const phat = (loai: string, phut: number) => (muc ?? []).find((m) => m.loai === loai && phut >= m.tu_phut && (m.den_phut == null || phut <= m.den_phut))?.so_tien ?? 0;
    const phatNv = new Map<string, number>();
    for (const c of cc ?? []) phatNv.set(c.nhan_vien_id, (phatNv.get(c.nhan_vien_id) ?? 0) + (c.tre_phut > 0 ? phat("tre", c.tre_phut) : 0) + (c.ve_som_phut > 0 ? phat("ve_som", c.ve_som_phut) : 0));
    const ds = [...(th2 ?? [])].sort((a, b) => (ten.get(a.nhan_vien_id)?.ho_ten ?? "").localeCompare(ten.get(b.nhan_vien_id)?.ho_ten ?? "", "vi"));
    noiDung = (
      <>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          {dieuHuong}
          {sua && <NutHop kieu={dangKhoa ? "phu" : "chinh"} nhan={dangKhoa ? "Mở khoá tháng" : "Khoá tháng"} tieuDe={dangKhoa ? "Mở khoá công tháng" : "Khoá công tháng"} xacNhan={dangKhoa ? `Mở khoá công tháng ${th}/${nam}?` : `Khoá công tháng ${th}/${nam}? Sau khi khoá, không ai sửa được chấm công của tháng này.`} action={khoaThangCong} an={{ nam: String(nam), thang: String(th), khoa: dangKhoa ? "0" : "1" }} nhanLuu={dangKhoa ? "Mở khoá" : "Khoá tháng"} />}
        </div>
        <Bang duLieu={ds} khoa={(r) => r.nhan_vien_id} trong="Không có nhân viên nào."
          cot={[
            { nhan: "Nhân viên", chinh: true, hienThi: (r) => <span className="text-muc">{ten.get(r.nhan_vien_id)?.ho_ten}</span> },
            { nhan: "Công chuẩn", phai: true, hienThi: (r) => soVN(r.cong_chuan) }, { nhan: "Đi làm", phai: true, hienThi: (r) => soVN(r.cong_di_lam) },
            { nhan: "Phép", phai: true, hienThi: (r) => soVN(r.phep_co_luong) }, { nhan: "Lễ", phai: true, hienThi: (r) => soVN(r.nghi_le) }, { nhan: "Công tác/online", phai: true, hienThi: (r) => soVN(r.cong_tac) },
            { nhan: "Không lương", phai: true, hienThi: (r) => soVN(r.nghi_khong_luong) }, { nhan: "Vắng", phai: true, hienThi: (r) => (r.ngay_vang ? <span className="text-loi">{r.ngay_vang}</span> : "0") },
            { nhan: "Trễ (lần/phút)", phai: true, hienThi: (r) => (r.so_lan_tre ? `${r.so_lan_tre} / ${r.phut_tre}` : "") }, { nhan: "Về sớm", phai: true, hienThi: (r) => (r.so_lan_ve_som ? `${r.so_lan_ve_som} / ${r.phut_ve_som}` : "") },
            { nhan: "OT (giờ)", phai: true, hienThi: (r) => (Number(r.ot_gio) ? soVN(r.ot_gio) : "") }, { nhan: "Công tính lương", phai: true, hienThi: (r) => <b>{soVN(r.cong_tinh_luong)}</b> },
            { nhan: "Phạt gợi ý", phai: true, hienThi: (r) => (phatNv.get(r.nhan_vien_id) ? tienVN(phatNv.get(r.nhan_vien_id)) : "") },
          ]} />
        <p className="mt-3 text-[12px] text-muc-3">Công: đủ hai lượt vào/ra = 1, thiếu một lượt = 0,5. Phép, lễ, công tác tính trọn công. Phạt trễ/về sớm chỉ là gợi ý theo bảng mức phạt (chờ chị Lâm xác nhận bảng nào đang hiệu lực), không tự trừ lương. Vắng = ngày có lịch làm mà không chấm công và không có phiếu nghỉ đã duyệt.</p>
      </>
    );
  }
  return (
    <div>
      <Link href="/nhan-su" className="text-[13px] text-muc-3 hover:text-muc">← Nhân sự</Link>
      <TieuDeTrang tieuDe="Chấm công" phu="Chấm công vào/ra bằng giờ hiện tại, xem bảng công và tổng hợp tháng. Quên chấm công hoặc đi trễ có lý do: tạo phiếu Điều chỉnh công ở Quản lý ngày nghỉ." />
      <Tab muc={TAB} dang={tab} goc="/nhan-su/cham-cong" them={`&thang=${thang}`} />
      {noiDung}
    </div>
  );
}
