import { docBang, chu, nguoiLark } from "./lib-hr.mjs";
const ds=(a)=>new Set(a);
const cmp=(n,a,b,ka,kb)=>{const A=ds(docBang(a).map(r=>chu(r[ka])));const B=docBang(b).map(r=>chu(r[kb]));console.log(n,"BOD",B.length,"trùng với bảng chính",B.filter(x=>A.has(x)).length,"| chỉ BOD",B.filter(x=>!A.has(x)).length);};
cmp("10.7~1.8","1.8","10.7","Request No.","Request No.");
cmp("10.5~3.1","3.1","10.5","Request No.","Request No.");
cmp("10.3~2.3","2.3","10.3","Result id","Result id");
cmp("10.4~2.4","2.4","10.4","Record id","Record id");
const u=(r)=>nguoiLark(r.user); const A=new Set(docBang("2.1").map(u)); const B=docBang("10.1").map(u); console.log("10.1~2.1 chỉ BOD",B.filter(x=>!A.has(x)).length);
const r18=docBang("1.8"); for (const k of ["Biên bản thỏa thuận nghỉ việc","Cam kết bảo mật chống cạnh tranh"]) { const c={}; for(const r of r18){const v=JSON.stringify(r[k]);c[v]=(c[v]||0)+1;} console.log(k,c); }
const r19=docBang("1.9"); for (const k of ["Bắt đầu có ý định nghỉ","Lý do chính nghỉ việc","Yếu tố giữ chân"]) {const c={}; for(const r of r19){const v=JSON.stringify(r[k]);c[v]=(c[v]||0)+1;} console.log(k,c);}
console.log(Object.keys(r19[0]).join("|"));
