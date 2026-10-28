// Dựng "danh sách người" từ Lark (bảng 1.1 Quản lý nhân sự ∪ 2.1 Employee_Info) và ghép với nhan_vien của AMIA OS.
// Quy tắc ghép (không bao giờ gộp theo đoán): (1) mã MSC trong tên nhân viên SalonHero = mã Lark; (2) SĐT trùng DUY NHẤT;
// (3) tên chuẩn hoá trùng DUY NHẤT ở cả hai phía VÀ cùng cơ sở (AVI↔VINH, ADL↔DALAT). Còn lại → người MỚI, ghi vào danh sách "cần chị xác nhận".
import { docBang, chu, ngay, sdt, khongDau, tenSach, maTrongTen, nguoiLark, CN_THEO_DON_VI } from "./lib-hr.mjs";

export const HOM_NAY = "2026-10-28";

export function xayNguoi() {
  const b11 = docBang("1.1"), b21 = docBang("2.1"), b13 = docBang("1.3");
  const people = [];
  const byRec = new Map(), byOpen = new Map(), byMa = new Map();
  for (const r of b11) {
    const open = nguoiLark(r["✏️*Tk Lark NS"]);
    const p = {
      nguon: "1.1", rec: r.record_id, ma: chu(r["*Mã nhân viên"]), open, ten: chu(r["✏️*Họ và tên"]), r,
      sdt: sdt(chu(r["✏️Số điện thoại"])), email: chu(r["✏️Email"]),
      donVi: chu(r["Nơi làm việc"]), ngayVao: ngay(r["✏️Ngày vào làm"]), ngayCT: ngay(r["✏️Ngày lên chính thức"]), ngayNghi: ngay(r["✏️Ngày nghỉ việc"]),
    };
    people.push(p); byRec.set(p.rec, p); if (open) byOpen.set(open, p); if (p.ma) byMa.set(p.ma, p);
  }
  // Bảng 1.3 giữ mã cũ kiểu "MSC.CT-17.0001" → cũng trỏ về người (qua tài khoản Lark)
  for (const c of b13) {
    const p = byOpen.get(nguoiLark(c["✏️Họ tên nhân sự(*)"]));
    const m = chu(c["✏️Mã nhân viên"]);
    if (p && m) { (p.maCu ??= new Set()).add(m); byMa.set(m, p); }
  }
  // 2.1: người chỉ có ở danh bạ Lark (đa số đã nghỉ, còn dữ liệu chấm công)
  for (const r of b21) {
    const open = nguoiLark(r.user);
    if (open && byOpen.has(open)) { byOpen.get(open).r21 = r; continue; }
    const p = { nguon: "2.1", rec: null, ma: null, open, ten: chu(r.name), r: null, r21: r, sdt: sdt(chu(r.mobile)), email: chu(r.email), donVi: null, ngayVao: ngay(r.join_time), ngayCT: null, ngayNghi: null };
    people.push(p); if (open) byOpen.set(open, p);
  }
  for (const p of people) {
    p.tenKd = khongDau(p.ten);
    const cn = chu(p.r?.["Nơi làm việc"]) ?? chu(p.r21?.work_station); p.donVi = p.donVi ?? null; void cn;
  }
  return { people, byRec, byOpen, byMa };
}

/** Ghép với nhan_vien AMIA có sẵn. Trả { ghep: Map(person→{nv, ly_do}), canXacNhan: [...] }. */
export function ghepVoiAmia(P, nvAmia, cnMaTheoId) {
  const ghep = new Map(), canXacNhan = [];
  const tenCount = new Map(); for (const p of P.people) tenCount.set(p.tenKd, (tenCount.get(p.tenKd) ?? 0) + 1);
  const sdtCount = new Map(); for (const p of P.people) if (p.sdt) sdtCount.set(p.sdt, (sdtCount.get(p.sdt) ?? 0) + 1);
  const daDung = new Set();
  const them = (p, nv, ly) => { if (daDung.has(nv.id) || ghep.has(p)) return false; ghep.set(p, { nv, ly }); daDung.add(nv.id); return true; };
  const dsNv = nvAmia.filter((n) => !/^Kiểm tra .* Tula$/.test(n.ho_ten) && !n.lark_open_id);
  // (1) mã MSC
  for (const n of dsNv) { const m = maTrongTen(n.ho_ten); if (m && P.byMa.has(m)) them(P.byMa.get(m), n, "ma"); }
  // (2) SĐT
  for (const n of dsNv) { const s = sdt(n.dien_thoai); if (!s || daDung.has(n.id)) continue; const c = P.people.filter((p) => p.sdt === s); if (c.length === 1 && sdtCount.get(s) === 1) them(c[0], n, "sdt"); }
  // (3) tên + cơ sở
  const nvTen = new Map(); for (const n of dsNv) { const k = khongDau(tenSach(n.ho_ten)); nvTen.set(k, (nvTen.get(k) ?? 0) + 1); }
  for (const n of dsNv) {
    if (daDung.has(n.id)) continue;
    const k = khongDau(tenSach(n.ho_ten)); const c = P.people.filter((p) => p.tenKd === k && !ghep.has(p));
    const cn = cnMaTheoId.get(n.chi_nhanh_id) ?? null;
    if (c.length === 1 && tenCount.get(k) === 1 && nvTen.get(k) === 1) {
      const dv = chu(c[0].r?.["Nơi làm việc"]); const cnLark = dv ? CN_THEO_DON_VI[dv] : null;
      if (!cnLark || !cn || cnLark === cn) { them(c[0], n, "ten+co_so"); continue; }
    }
    canXacNhan.push({ nv: n.id, ten: n.ho_ten, ung_vien: c.map((x) => x.ma ?? x.open) });
  }
  return { ghep, canXacNhan };
}
