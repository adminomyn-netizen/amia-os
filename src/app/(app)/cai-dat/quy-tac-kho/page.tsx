import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Boxes } from "lucide-react";
import { docChanHetTon, KHOA_CHAN_HET_TON } from "@/lib/quy-tac-kho";
import { luuQuyTacKho } from "./actions";
import { QuyTacKhoForm } from "./QuyTacKhoForm";

export default async function TrangQuyTacKho() {
  const nd = await yeuCauQuyen("danhmuc.xem");
  const { data } = await sb().from("cau_hinh").select("gia_tri").eq("khoa", KHOA_CHAN_HET_TON).maybeSingle();
  return (
    <div>
      <TieuDeNoi icon={Boxes} quayLai={{ href: "/cai-dat", nhan: "Cài đặt" }} tieuDe="Quy tắc kho & hạn dùng" phu="Chặn bán khi hết tồn và các quy tắc hạn dùng đang áp dụng." />
      <QuyTacKhoForm dau={docChanHetTon(data?.gia_tri)} sua={coQuyen(nd, "hethong.phanquyen")} luu={luuQuyTacKho} />
    </div>
  );
}
