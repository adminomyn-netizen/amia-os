import { docBang, chu, so } from "./lib-hr.mjs";
const t=docBang("3.3"); console.log("3.3 'đã dùng trước đó' >0:", t.filter(r=>so(r["✏️Số phép đã dùng trước đó"])>0).length, "phép tồn:", t.filter(r=>so(r["✏️Phép tồn"])>0).length, "Phép năm:", JSON.stringify([...new Set(t.map(r=>chu(r["Phép năm"])))]).slice(0,100));
const h=docBang("10.6"); console.log("10.6 keys:", Object.keys(h[0]).join("|"));
const o=docBang("10.5"); console.log("10.5 keys eq 3.1:", Object.keys(o[0]).join("|")===Object.keys(docBang("3.1")[0]).join("|"));
console.log("3.9 ngày lễ 9.3:", docBang("9.3").map(r=>String(r["Ngày nghỉ lễ"]).slice(0,10)).join(","));
