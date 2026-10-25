// Tạo tài khoản + hồ sơ nhân viên bằng service_role. Dùng: node scripts/tao-tai-khoan.mjs <email> <mat_khau> <ho_ten> <vai_tro> [ma_chi_nhanh]
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.split("=")[0], l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const [email, matKhau, hoTen, vaiTro, maCn = "VINH"] = process.argv.slice(2);
if (!email || !matKhau || !hoTen || !vaiTro) { console.error("Thiếu tham số"); process.exit(1); }

const { data: cn } = await sb.from("chi_nhanh").select("id").eq("ma", maCn).maybeSingle();
const { data: u, error } = await sb.auth.admin.createUser({ email, password: matKhau, email_confirm: true, app_metadata: { vai_tro: vaiTro }, user_metadata: { ho_ten: hoTen } });
if (error) { console.error("Lỗi tạo tài khoản:", error.message); process.exit(1); }
const { error: e2 } = await sb.from("nhan_vien").insert({ user_id: u.user.id, ho_ten: hoTen, email, vai_tro: vaiTro, chi_nhanh_id: cn?.id ?? null });
if (e2) { await sb.auth.admin.deleteUser(u.user.id); console.error("Lỗi tạo hồ sơ:", e2.message); process.exit(1); }
console.log("Đã tạo", email, vaiTro, u.user.id);
