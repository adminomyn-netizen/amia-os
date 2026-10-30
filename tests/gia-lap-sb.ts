// Bộ giả lập tối thiểu của máy khách Supabase (bảng nằm trong bộ nhớ) cho test không cần DB thật.
// Hỗ trợ: select/eq/in/limit/order/or(bỏ qua)/maybeSingle, insert(+select), upsert(onConflict), update, delete; await trực tiếp trả { data, error }.
export type Dong = Record<string, unknown>;
export type KhoGia = Record<string, Dong[]>;

export function taoSbGia(kho: KhoGia, macDinh: Record<string, Dong> = {}) {
  let dem = 0;
  const from = (bang: string) => {
    const t = (kho[bang] ??= []);
    const loc: [string, unknown][] = [], tap: [string, unknown[]][] = [];
    let hd: "select" | "insert" | "upsert" | "update" | "delete" = "select", giaTri: Dong = {}, khoaXung: string[] = [], toiDa = Infinity;
    const khop = (r: Dong) => loc.every(([c, v]) => r[c] === v) && tap.every(([c, vs]) => vs.includes(r[c]));
    const chay = (): { data: Dong[]; error: null } => {
      if (hd === "select") return { data: t.filter(khop).slice(0, toiDa), error: null };
      if (hd === "insert") { const r = { id: `id-${++dem}`, ...macDinh[bang], ...giaTri }; t.push(r); return { data: [r], error: null }; }
      if (hd === "upsert") {
        const cu = t.find((r) => khoaXung.every((k) => r[k] === giaTri[k]));
        if (cu) { Object.assign(cu, giaTri); return { data: [cu], error: null }; }
        const r = { id: `id-${++dem}`, ...macDinh[bang], ...giaTri }; t.push(r); return { data: [r], error: null };
      }
      if (hd === "update") { const ds = t.filter(khop); ds.forEach((r) => Object.assign(r, giaTri)); return { data: ds, error: null }; }
      const ds = t.filter(khop); ds.forEach((r) => t.splice(t.indexOf(r), 1)); return { data: ds, error: null };
    };
    const b = {
      select: () => b, order: () => b, or: () => b,
      limit: (n: number) => { toiDa = n; return b; },
      eq: (c: string, v: unknown) => { loc.push([c, v]); return b; },
      in: (c: string, vs: unknown[]) => { tap.push([c, vs]); return b; },
      insert: (v: Dong) => { hd = "insert"; giaTri = v; return b; },
      upsert: (v: Dong, o?: { onConflict?: string }) => { hd = "upsert"; giaTri = v; khoaXung = (o?.onConflict ?? "id").split(","); return b; },
      update: (v: Dong) => { hd = "update"; giaTri = v; return b; },
      delete: () => { hd = "delete"; return b; },
      maybeSingle: async () => { const r = chay(); return { data: r.data[0] ?? null, error: null }; },
      then: (ok: (r: { data: Dong[]; error: null }) => unknown, ko?: (e: unknown) => unknown) => Promise.resolve(chay()).then(ok, ko),
    };
    return b;
  };
  return { from };
}
