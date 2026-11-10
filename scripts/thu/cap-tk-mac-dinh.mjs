// Cấp tài khoản đăng nhập mật khẩu mặc định 12345678 cho nhân viên đang làm (chị Lâm 10/11/2026), trừ tài khoản đăng nhập trong 7 ngày qua.
// Đăng nhập bằng 12345678 thì app tự bắt đổi mật khẩu (dang-nhap/actions.ts). Mặc định chạy thử; --that mới ghi.
import { createClient } from "@supabase/supabase-js";
import { ketNoi } from "../chuyen-salonhero/lib.mjs";
const THAT = process.argv.includes("--that"), MK = "12345678";
const ad = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } }).auth.admin;
const c = await ketNoi();
// Supabase chặn 12345678 (mật khẩu yếu) khi gửi dạng chữ; chị Lâm chỉ định mật khẩu này nên nạp dạng băm bcrypt (password_hash) — lần đầu vào app vẫn bắt đổi.
const { rows: [{ h: BAM }] } = await c.query("select extensions.crypt($1, extensions.gen_salt('bf', 10)) h", [MK]);
const { rows: nv } = await c.query(`select n.id, n.ho_ten, n.email, n.vai_tro, n.user_id, u.last_sign_in_at, u.email u_email
  from nhan_vien n left join auth.users u on u.id = n.user_id left join chi_nhanh cn on cn.id = n.chi_nhanh_id
  where n.hoat_dong and coalesce(cn.ten, '') not ilike '%đà lạt%' and coalesce(n.trang_thai_lam, 'dang_lam') = 'dang_lam' and coalesce(u.email, '') not like '%.invalid'`);
const { rows: daCo } = await c.query(`select lower(email) e from auth.users`);
const emailDaCo = new Set(daCo.map((x) => x.e));
const gan = (d) => d && new Date(d) > new Date(Date.now() - 7 * 864e5);
const kq = { tao: [], datLai: [], boGan: [], thieuEmail: [], trungEmail: [] };
for (const n of nv) {
  if (n.user_id) {
    if (gan(n.last_sign_in_at)) { kq.boGan.push(n.ho_ten); continue; }
    kq.datLai.push(n.ho_ten);
    if (THAT) { const { error } = await ad.updateUserById(n.user_id, { password_hash: BAM }); if (error) throw new Error(`${n.ho_ten}: ${error.message}`); await c.query("update nhan_vien set phai_doi_mat_khau = true where id = $1", [n.id]); }
    continue;
  }
  const email = (n.email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || /@gmai\.com$/.test(email)) { kq.thieuEmail.push(`${n.ho_ten} (${n.vai_tro})${email ? ` email sai: ${email}` : ""}`); continue; }
  if (emailDaCo.has(email)) { kq.trungEmail.push(`${n.ho_ten} <${email}>`); continue; }
  kq.tao.push(`${n.ho_ten} <${email}> ${n.vai_tro}`);
  if (THAT) {
    const { data, error } = await ad.createUser({ email, password_hash: BAM, email_confirm: true, app_metadata: { vai_tro: n.vai_tro }, user_metadata: { ho_ten: n.ho_ten } });
    if (error || !data.user) throw new Error(`${n.ho_ten}: ${error?.message}`);
    await c.query("update nhan_vien set user_id = $1, phai_doi_mat_khau = true where id = $2 and user_id is null", [data.user.id, n.id]);
    emailDaCo.add(email);
  }
}
console.log(THAT ? "ĐÃ GHI" : "CHẠY THỬ");
for (const [k, v] of Object.entries(kq)) console.log(`${k} (${v.length}):`, v.join("; "));
await c.end();
