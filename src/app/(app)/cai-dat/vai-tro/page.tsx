import Link from "next/link";
import { Check } from "lucide-react";
import { yeuCauQuyen } from "@/lib/auth";
import { NHAN_VAI_TRO, NHOM_QUYEN, QUYEN_THEO_VAI_TRO, VAI_TRO } from "@/lib/quyen";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { ShieldCheck } from "lucide-react";
import { MucTrang } from "@/components/ui/MucTrang";

/** Bảng "ai làm được gì": vai trò (cột) × quyền (hàng). Chủ và Kỹ thuật luôn đủ quyền; quyền riêng từng người chỉnh ở Tài khoản & phân quyền. */
export default async function VaiTroVaQuyen() {
  await yeuCauQuyen("hethong.phanquyen");
  return (
    <div className="space-y-6">
      <TieuDeNoi icon={ShieldCheck} quayLai={{ href: "/cai-dat", nhan: "Cài đặt" }} tieuDe="Vai trò & quyền" phu="Mỗi vai trò mặc định làm được những gì. Muốn một người có thêm hay bớt quyền so với vai trò thì chỉnh riêng cho người đó." />
      <p className="text-[14px] text-muc-2">
        Chỉnh quyền từng người ở <Link href="/nhan-vien" className="font-medium text-nhan-dam hover:underline">Tài khoản & phân quyền</Link> (nút Phân quyền cạnh tên). Chủ và Kỹ thuật luôn đủ mọi quyền; riêng Kỹ thuật được bỏ qua quy tắc “người lập không tự duyệt”.
      </p>
      {NHOM_QUYEN.map((g) => (
        <MucTrang key={g.nhom} noi tieuDe={g.nhom}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] table-fixed text-left text-[13.5px]">
              <thead>
                <tr className="nhan-muc border-b border-vien">
                  <th className="sticky left-0 w-[210px] bg-giay py-2.5 pr-4 font-medium">Quyền</th>
                  {VAI_TRO.map((v) => <th key={v} className="px-2 py-2.5 text-center font-medium">{NHAN_VAI_TRO[v]}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-vien">
                {g.muc.map((m) => (
                  <tr key={m.ma}>
                    <th scope="row" className="sticky left-0 bg-giay py-2.5 pr-4 font-normal text-muc">{m.nhan}</th>
                    {VAI_TRO.map((v) => (
                      <td key={v} className="px-2 py-2.5 text-center">
                        {QUYEN_THEO_VAI_TRO[v].includes(m.ma) ? <Check strokeWidth={2} className="mx-auto h-4 w-4 text-nhan-dam" aria-label="Có quyền" /> : <span className="text-muc-3" aria-label="Không có">·</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MucTrang>
      ))}
    </div>
  );
}
