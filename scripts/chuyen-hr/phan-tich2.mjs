import { docBang, chu, ngay, nguoiLark } from "./lib-hr.mjs";
import { xayNguoi, HOM_NAY } from "./nguoi.mjs";
const P = xayNguoi();
const kr = P.people.filter(p=>p.nguon==="1.1" && !(p.ngayNghi && p.ngayNghi<=HOM_NAY) && chu(p.r["Trạng thái"])!=="Đang làm");
const r16 = docBang("1.6"); const tt16 = new Map(); for (const r of r16) { const p=P.byRec.get((r["✏️Mã nhân viên"]||[])[0]?.id); if(p) tt16.set(p, chu(r["✏️Trạng thái(*)"])); }
const cc = docBang("2.3"); const cuoi = new Map(); for (const r of cc) { const o=nguoiLark(r.Employee); const d=ngay(r.Date); if(o&&d&&(!cuoi.get(o)||d>cuoi.get(o))) cuoi.set(o,d); }
let a=0,b=0,c2=0,d=0,e=0;
for (const p of kr) { if (tt16.get(p)==="Đang làm") a++; const l=cuoi.get(p.open); if (l && l>="2026-09-01") b++; if(!p.ngayVao) c2++; if(p.ngayNghi) d++; if(!p.open) e++; }
console.log("khong_ro:",kr.length,"| 1.6 Đang làm:",a,"| có công từ 9/2026:",b,"| thiếu ngày vào:",c2,"| ngày nghỉ tương lai:",d,"| không tk Lark:",e);
const ct = P.people.filter(p=>p.nguon==="1.1" && chu(p.r["Trạng thái"])==="Đang làm" ); const nl=ct.filter(p=>p.ngayNghi&&p.ngayNghi>HOM_NAY).length; console.log("Đang làm có ngày nghỉ tương lai",nl);
const dates = cc.map(r=>ngay(r.Date)).filter(Boolean).sort(); console.log("2.3 từ",dates[0],"đến",dates.at(-1));
const rec = docBang("2.4"); console.log("2.4 mẫu khoá:", Object.keys(rec[0]).join("|"));
