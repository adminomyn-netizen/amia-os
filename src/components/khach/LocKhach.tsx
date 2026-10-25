"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { O_NHAP } from "@/components/ui/dinh-dang";

const TAT_CA = { gia_tri: "", nhan: "Tất cả" };

/** Thanh lọc khách: đổi bộ lọc = đổi địa chỉ (?q=…&nguon=…), máy chủ tải lại đúng danh sách. Ô tìm kiếm chờ 350 ms sau lần gõ cuối. */
export function LocKhach({ nhanVien, nguon, trangThai, hang }: { nhanVien: LuaChon[]; nguon: LuaChon[]; trangThai: LuaChon[]; hang: LuaChon[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const lanDau = useRef(true);
  const dat = (k: string, v: string) => {
    const u = new URLSearchParams(sp.toString());
    if (v) u.set(k, v); else u.delete(k);
    u.delete("trang");
    router.push(`/khach-hang?${u}`);
  };
  useEffect(() => {
    if (lanDau.current) { lanDau.current = false; return; }
    const t = setTimeout(() => dat("q", q.trim()), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
      <div className="relative">
        <Search aria-hidden strokeWidth={1.6} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muc-3" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên, số điện thoại hoặc mã" aria-label="Tìm khách" className={`${O_NHAP} pl-9`} />
      </div>
      <Chon ariaLabel="Trạng thái" trong="Trạng thái" giaTri={sp.get("trang_thai") ?? ""} onDoi={(v) => dat("trang_thai", v)} luaChon={[{ ...TAT_CA, nhan: "Mọi trạng thái" }, ...trangThai]} />
      <Chon ariaLabel="Nguồn" trong="Nguồn" giaTri={sp.get("nguon") ?? ""} onDoi={(v) => dat("nguon", v)} luaChon={[{ ...TAT_CA, nhan: "Mọi nguồn" }, ...nguon]} />
      <Chon ariaLabel="Hạng" trong="Hạng" giaTri={sp.get("hang") ?? ""} onDoi={(v) => dat("hang", v)} luaChon={[{ ...TAT_CA, nhan: "Mọi hạng" }, ...hang]} />
      <Chon ariaLabel="Người phụ trách" trong="Người phụ trách" giaTri={sp.get("phu_trach") ?? ""} onDoi={(v) => dat("phu_trach", v)} luaChon={[{ ...TAT_CA, nhan: "Mọi người phụ trách" }, ...nhanVien]} />
    </div>
  );
}
