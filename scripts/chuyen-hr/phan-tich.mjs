// Phân tích CHỈ ĐỌC (không ghi DB, không in dữ liệu cá nhân): ghép người, độ phủ khoá nối, trùng khoá.
import { ketNoi, docBang, chu, ngay, nguoiLark } from "./lib-hr.mjs";
import { xayNguoi, ghepVoiAmia, HOM_NAY } from "./nguoi.mjs";
const P = xayNguoi();
console.log("người:", P.people.length, "(1.1:", P.people.filter(p=>p.nguon==="1.1").length, "| chỉ 2.1:", P.people.filter(p=>p.nguon==="2.1").length, ")");
const db = await ketNoi(); await db.query("begin read only");
const nv = (await db.query("select id, ho_ten, dien_thoai, chi_nhanh_id from public.nhan_vien")).rows;
const cn = new Map((await db.query("select id, ma from public.chi_nhanh")).rows.map(r=>[r.id,r.ma]));
await db.query("rollback"); await db.end();
const { ghep, canXacNhan } = ghepVoiAmia(P, nv, cn);
const c = {}; for (const g of ghep.values()) c[g.ly] = (c[g.ly]||0)+1;
console.log("ghép với AMIA:", ghep.size, c, "| nhan_vien AMIA không ghép:", canXacNhan.length);
// trạng thái
const b = {dang:0, nghi:0, khong_ro:0};
for (const p of P.people.filter(p=>p.nguon==="1.1")) { if (p.ngayNghi && p.ngayNghi<=HOM_NAY) b.nghi++; else if (chu(p.r["Trạng thái"])==="Đang làm") b.dang++; else b.khong_ro++; }
console.log("1.1 trạng thái:", b);
// độ phủ khoá nối ở các bảng khác (đếm người Lark không có trong danh sách)
const phu = (ma, truong, lay=(r)=>nguoiLark(r[truong])) => { const rows = docBang(ma); let thieu=0, rong=0; const lacId=new Set(); for (const r of rows){ const o=lay(r); if(!o) rong++; else if(!P.byOpen.has(o)) {thieu++; lacId.add(o);} } console.log(`bảng ${ma}: ${rows.length} dòng, rỗng khoá ${rong}, khoá lạ ${thieu} (${lacId.size} người)`); };
phu("1.8","Requester"); phu("3.2","Requester"); phu("3.5","Requester"); phu("3.1","Requester"); phu("3.4","Requester"); phu("2.6","Requester"); phu("3.3","🤖Họ và tên nhân sự"); phu("3.6","Nhân sự đăng ký"); phu("3.8","Nhân sự"); phu("5.1","Tên nhân sự"); phu("5.3","✏️Họ tên nhân viên"); phu("4.1","Họ và tên"); phu("4.4","🤖Họ và tên"); phu("2.3","Employee"); phu("2.5","🤖Họ và tên"); phu("1.3","✏️Họ tên nhân sự(*)"); phu("5.4","Người nhận"); phu("6.1","✏️Nhân sự sử dụng");
// 1.6: liên kết record 1.1 + trùng (người, ngày hiệu lực)
const r16 = docBang("1.6"); const k = new Map(); let khongNoi=0, thieuNgay=0;
for (const r of r16) { const rec=(r["✏️Mã nhân viên"]||[])[0]?.id; const p=P.byRec.get(rec); if(!p){khongNoi++;continue;} const d = ngay(r["✏️Ngày áp dụng"])??ngay(r["✏️Ngày cập nhật"]); if(!ngay(r["✏️Ngày áp dụng"])) thieuNgay++; const key=p.rec+"|"+d; k.set(key,(k.get(key)||0)+1); }
console.log("1.6:", r16.length, "dòng; không nối được người", khongNoi, "; thiếu ngày áp dụng (dùng ngày cập nhật)", thieuNgay, "; cặp (người,ngày) trùng", [...k.values()].filter(v=>v>1).length, "; người có >=1 dòng", new Set([...k.keys()].map(x=>x.split("|")[0])).size);
