import "server-only";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sb } from "@/lib/db";

// Kho ảnh khách. Có đủ biến R2_* thì dùng Cloudflare R2 (kho riêng tư, chỉ cấp link ký có hạn); không thì dùng bucket riêng tư của Supabase (chạy máy dev).
// Ảnh luôn là dữ liệu sức khoẻ: không có link công khai, mọi lần xem đều qua link ký 1 giờ do server cấp sau khi kiểm quyền.
const BUCKET_SUPABASE = "khach-anh";

function r2() {
  const { R2_ACCOUNT_ID: acc, R2_ACCESS_KEY_ID: id, R2_SECRET_ACCESS_KEY: key, R2_BUCKET: bucket } = process.env;
  if (!acc || !id || !key || !bucket) return null;
  return { bucket, client: new S3Client({ region: "auto", endpoint: `https://${acc}.r2.cloudflarestorage.com`, credentials: { accessKeyId: id, secretAccessKey: key } }) };
}

export const dangDungR2 = () => r2() !== null;

export async function luuAnh(duong: string, noiDung: Buffer, contentType: string): Promise<boolean> {
  const k = r2();
  if (k) {
    try { await k.client.send(new PutObjectCommand({ Bucket: k.bucket, Key: duong, Body: noiDung, ContentType: contentType })); return true; } catch { return false; }
  }
  const { error } = await sb().storage.from(BUCKET_SUPABASE).upload(duong, noiDung, { contentType, upsert: false });
  return !error;
}

export async function xoaAnh(duong: string): Promise<void> {
  const k = r2();
  if (k) { await k.client.send(new DeleteObjectCommand({ Bucket: k.bucket, Key: duong })).catch(() => {}); return; }
  await sb().storage.from(BUCKET_SUPABASE).remove([duong]);
}

/** Link xem ảnh có hạn. Trả map đường dẫn → link; ảnh không cấp được link thì vắng mặt trong map. */
export async function linkAnh(duongs: string[], giay = 3600): Promise<Map<string, string>> {
  const ra = new Map<string, string>();
  const k = r2();
  if (k) {
    await Promise.all(duongs.map(async (d) => { try { ra.set(d, await getSignedUrl(k.client, new GetObjectCommand({ Bucket: k.bucket, Key: d }), { expiresIn: giay })); } catch { /* bỏ qua ảnh lỗi */ } }));
    return ra;
  }
  const { data } = await sb().storage.from(BUCKET_SUPABASE).createSignedUrls(duongs, giay);
  for (const x of data ?? []) if (x.path && x.signedUrl) ra.set(x.path, x.signedUrl);
  return ra;
}
