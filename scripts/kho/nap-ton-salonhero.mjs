// Nạp TỒN CUỐI SalonHero (chốt 28/10/2026) vào bảng kho_ton_sh_tham_chieu để trang /kho/chuan-hoa đối chiếu với sổ kho AMIA. CHỈ để tham chiếu, không đụng sổ kho.
// Nguồn: <thư-mục-xuất>/kho_bc_nhap_xuat_tham_chieu.json (khoá 8377_tatca = Vinh, 9202_tatca = Đà Lạt; endingInventory).
// Mặc định CHẠY THỬ (giao dịch rồi rollback, in số liệu); --that mới ghi. Chạy lại được (upsert theo chi nhánh + sh_id).
// Dùng: PW=$(security find-generic-password -s amia-os-db-password -w) node scripts/kho/nap-ton-salonhero.mjs sao-luu/salonhero-20261028-1753 [--that]
import { readFileSync } from "node:fs";
import { ketNoi, cnTheoLoc } from "../chuyen-salonhero/lib.mjs";

const thuMuc = process.argv[2]; if (!thuMuc || thuMuc.startsWith("--")) throw new Error("Thiếu thư mục xuất SalonHero");
const that = process.argv.includes("--that");
const ref = JSON.parse(readFileSync(`${thuMuc}/kho_bc_nhap_xuat_tham_chieu.json`, "utf8"));
const db = await ketNoi();
try {
  await db.query("begin");
  const cn = new Map((await db.query("select id, ma from public.chi_nhanh")).rows.map((r) => [r.ma, r.id]));
  const sp = new Map((await db.query("select id, sh_id from public.san_pham where sh_id is not null")).rows.map((r) => [Number(r.sh_id), r.id]));
  const truoc = (await db.query("select count(*)::int n from public.kho_ton_sh_tham_chieu")).rows[0].n;
  let ghi = 0, khongKhop = 0;
  for (const loc of ["8377", "9202"]) {
    const ma = cnTheoLoc(Number(loc));
    for (const x of ref[`${loc}_tatca`]) {
      const sid = sp.get(Number(x.id)) ?? null; if (!sid) khongKhop++;
      await db.query(
        `insert into public.kho_ton_sh_tham_chieu (chi_nhanh_id, sh_id, san_pham_id, ten_sh, ton_cuoi) values ($1,$2,$3,$4,$5)
         on conflict (chi_nhanh_id, sh_id) do update set san_pham_id = excluded.san_pham_id, ten_sh = excluded.ten_sh, ton_cuoi = excluded.ton_cuoi, nap_luc = now()`,
        [cn.get(ma), x.id, sid, x.name, x.endingInventory]);
      ghi++;
    }
  }
  const sau = (await db.query("select count(*)::int n from public.kho_ton_sh_tham_chieu")).rows[0].n;
  console.log({ che_do: that ? "that" : "thu", dong_truoc: truoc, dong_ghi: ghi, dong_sau: sau, khong_khop_san_pham: khongKhop });
  await db.query(that ? "commit" : "rollback");
} catch (e) { await db.query("rollback").catch(() => {}); throw e; } finally { await db.end(); }
