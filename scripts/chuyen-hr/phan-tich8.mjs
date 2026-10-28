import { docBang, chu, nguoiLark } from "./lib-hr.mjs";
import { xayNguoi } from "./nguoi.mjs";
const P = xayNguoi();
const a=docBang("4.1"); const bad=a.filter(r=>chu(r["Năm"])&&!nguoiLark(r["Họ và tên"])&&!P.byMa.get(chu(r["Mã nhân viên"])));
console.log("4.1 không nối:",bad.length,"mã mẫu:",[...new Set(bad.map(r=>chu(r["Mã nhân viên"])))].slice(0,12).join(","));
const t=docBang("4.5"); console.log("4.5 keys",Object.keys(t[0]).join("|"),"| mẫu mã:",[...new Set(t.map(r=>JSON.stringify(r["🤖Mã Nhân viên"])))].slice(0,5).join(","), "| tên mẫu kiểu:", JSON.stringify(t[0]["Tên nhân viên"]).length);
const b=docBang("4.4"); console.log("4.4 không tên:",b.filter(r=>!nguoiLark(r["🤖Họ và tên"])).length);
