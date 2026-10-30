import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayGioVN } from "@/lib/dinh-dang";
import { tenKenh } from "@/lib/tin-nhan";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { OTraLoi } from "@/components/hop-thu/OTraLoi";
import { danhDauDaDoc, traLoiKhach } from "./actions";

const BUOC = ["Nối Zalo OA hoặc Messenger ở Cài đặt, Zalo OA và SMS.", "Khách nhắn vào trang, tin hiện ở danh sách bên trái.", "Bấm vào một hội thoại để xem và trả lời."];
const TT_TIN = { da_nhan: "", cho_gui: "Chờ gửi", da_gui: "Đã gửi", loi: "Gửi lỗi" } as const;

/** Hộp thư đa kênh: tin khách nhắn qua Zalo OA, Messenger. Chưa có webhook công khai nên chỉ hiện tin đã được nhận về. */
export default async function TrangHopThu({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const nd = await yeuCauQuyen("mkt.xem");
  const traLoiDuoc = coQuyen(nd, "mkt.sua");
  const chon = (await searchParams).c ?? "";
  const db = sb();
  let q = db.from("hop_thu_hoi_thoai").select("*").order("tin_cuoi_luc", { ascending: false, nullsFirst: false }).limit(200);
  // Hội thoại đã gắn chi nhánh thì chỉ người chi nhánh đó (và người toàn công ty) thấy.
  if (nd.chiNhanhId) q = q.or(`chi_nhanh_id.is.null,chi_nhanh_id.eq.${nd.chiNhanhId}`);
  const [{ data: hts }, { data: kn }] = await Promise.all([q, db.from("ket_noi_ben_thu_ba").select("kenh, trang_thai").in("kenh", ["zalo_oa", "messenger"])]);
  const ds = hts ?? [], daNoi = new Set((kn ?? []).filter((k) => k.trang_thai === "da_noi").map((k) => k.kenh));
  const dang = ds.find((h) => h.id === chon) ?? null;

  if (ds.length === 0) {
    return (
      <div>
        <TieuDeTrang tieuDe="Hộp thư" phu="Trả lời khách nhắn qua Zalo OA và Messenger ở một chỗ." />
        {daNoi.size === 0 ? (
          <section className="max-w-[560px] rounded-the border border-vien p-5">
            <h2 className="nhan-muc">Bắt đầu trong 3 bước</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-[14px] text-muc-2">{BUOC.map((b) => <li key={b}>{b}</li>)}</ol>
            <Link href="/cai-dat/zalo-sms?tab=ket-noi" className="nut-vang mt-5 inline-flex h-10 items-center rounded-nho px-4 text-[14px]">Tới phần kết nối</Link>
          </section>
        ) : <p className="chu-tieu-de py-12 text-center text-[24px] text-muc-3">Chưa có khách nào nhắn tới.</p>}
      </div>
    );
  }

  let tin: { id: string; huong: string; noi_dung: string; trang_thai: string; tao_luc: string }[] = [];
  if (dang) {
    const { data } = await db.from("hop_thu_tin").select("id, huong, noi_dung, trang_thai, tao_luc").eq("hoi_thoai_id", dang.id).order("tao_luc", { ascending: false }).limit(100);
    tin = (data ?? []).reverse();
  }
  return (
    <div>
      <TieuDeTrang tieuDe="Hộp thư" phu="Trả lời khách nhắn qua Zalo OA và Messenger ở một chỗ." />
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <nav aria-label="Danh sách hội thoại" className={`${dang ? "hidden lg:block" : ""} max-h-[70vh] overflow-y-auto border-vien lg:border-r lg:pr-4`}>
          <ul className="divide-y divide-vien">
            {ds.map((h) => (
              <li key={h.id}>
                <Link href={`/marketing/hop-thu?c=${h.id}`} aria-current={h.id === dang?.id ? "page" : undefined} className={`block px-2 py-3 hover:bg-giay-tram ${h.id === dang?.id ? "bg-nhan-nhat" : ""}`}>
                  <div className="flex items-center justify-between gap-2"><span className="truncate text-[14px] font-medium text-muc">{h.ten_khach ?? "Khách chưa rõ tên"}</span>{h.chua_doc > 0 && <NhanTrangThai kieu="cho">{h.chua_doc} mới</NhanTrangThai>}</div>
                  <div className="mt-0.5 truncate text-[13px] text-muc-3">{h.tin_cuoi ?? "Chưa có tin"}</div>
                  <div className="mt-0.5 text-[12px] text-muc-3">{tenKenh(h.kenh)}{h.tin_cuoi_luc ? ` · ${ngayGioVN(h.tin_cuoi_luc)}` : ""}</div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <section className={`${dang ? "" : "hidden lg:block"} min-w-0`}>
          {!dang ? <p className="py-12 text-center text-[14px] text-muc-3">Chọn một hội thoại ở bên trái.</p> : (
            <div className="flex min-h-[50vh] flex-col">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0"><Link href="/marketing/hop-thu" className="text-[13px] text-muc-3 hover:text-muc lg:hidden">← Danh sách</Link>
                  <div className="truncate text-[16px] font-medium text-muc">{dang.ten_khach ?? "Khách chưa rõ tên"}</div>
                  <div className="text-[12.5px] text-muc-3">{tenKenh(dang.kenh)}{daNoi.has(dang.kenh) ? "" : " · kênh chưa nối"}</div></div>
              </div>
              <ul className="mb-3 max-h-[52vh] flex-1 space-y-2 overflow-y-auto">
                {tin.map((t) => (
                  <li key={t.id} className={`flex ${t.huong === "di" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-nho px-3 py-2 text-[14px] ${t.huong === "di" ? "bg-nhan-nhat text-nhan-dam" : "bg-giay-tram text-muc"}`}>
                      <div className="whitespace-pre-wrap break-words">{t.noi_dung}</div>
                      <div className="mt-1 text-[11.5px] text-muc-3">{ngayGioVN(t.tao_luc)}{t.huong === "di" && t.trang_thai !== "da_gui" ? ` · ${TT_TIN[t.trang_thai as keyof typeof TT_TIN] || ""}${daNoi.has(dang.kenh) ? "" : ", chưa gửi tới khách vì kênh chưa nối"}` : ""}</div>
                    </div>
                  </li>
                ))}
                {tin.length === 0 && <li className="py-8 text-center text-[14px] text-muc-3">Chưa có tin nào.</li>}
              </ul>
              <OTraLoi hoiThoaiId={dang.id} chuaDoc={dang.chua_doc} duocTraLoi={traLoiDuoc} traLoi={traLoiKhach} daDoc={danhDauDaDoc} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
