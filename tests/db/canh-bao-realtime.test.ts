/* eslint-disable @typescript-eslint/no-explicit-any -- kiểm thử đọc hàng SQL tuỳ ý */
import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

let db: PGlite;
const q = async (sql: string, p: unknown[] = []) => (await db.query<any>(sql, p)).rows;
beforeAll(async () => {
  db = await taoDbVoiMigration();
  await db.exec(`create table public.thu_nghiem (id int); create trigger bao_canh_bao_doi after insert or update or delete on public.thu_nghiem for each statement execute function public.bao_canh_bao_doi();`);
});

describe("chuông thông báo thời gian thực: tín hiệu từ DB", () => {
  it("cả 8 bảng nghiệp vụ liên quan đều có trigger báo thay đổi", async () => {
    const r = await q(`select c.relname from pg_trigger t join pg_class c on c.oid = t.tgrelid where t.tgname = 'bao_canh_bao_doi' and not t.tgisinternal and c.relname <> 'thu_nghiem' order by 1`);
    expect(r.map((x) => x.relname).sort()).toEqual(["buoi_thuc_hien", "hoa_don", "kho_so_cai", "lich_hen", "phieu_cap", "thanh_toan", "the_khach", "the_so_cai"]);
  });

  it("Realtime chưa bật/lỗi thì việc ghi dữ liệu vẫn thành công (không bao giờ chặn nghiệp vụ)", async () => {
    await db.query(`insert into public.thu_nghiem values (1), (2)`);
    expect((await q(`select count(*)::int n from public.thu_nghiem`))[0].n).toBe(2);
  });

  it("có Realtime: mỗi CÂU LỆNH bắn đúng một tín hiệu rỗng vào kênh canh-bao (không phải mỗi dòng)", async () => {
    await db.exec(`create schema realtime; create table realtime.nhat_ky (payload jsonb, event text, topic text, private boolean);
      create function realtime.send(payload jsonb, event text, topic text, private boolean default true) returns void language sql as $$ insert into realtime.nhat_ky values (payload, event, topic, private) $$;`);
    await db.query(`insert into public.thu_nghiem values (3), (4), (5)`);
    const r = await q(`select * from realtime.nhat_ky`);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ payload: {}, event: "doi", topic: "canh-bao", private: false });
  });

  it("hàm báo không gọi được từ trình duyệt (anon/authenticated)", async () => {
    const r = await q(`select has_function_privilege('anon', 'public.bao_canh_bao_doi()', 'execute') a, has_function_privilege('authenticated', 'public.bao_canh_bao_doi()', 'execute') b`);
    expect(r[0]).toEqual({ a: false, b: false });
  });
});
