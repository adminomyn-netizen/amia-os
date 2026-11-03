"use client";

import { Check, Save } from "lucide-react";
import { NUT_CHINH } from "@/components/ui/dinh-dang";

/** Thanh lưu nổi cuối form cài đặt: dính đáy vùng cuộn (trên điện thoại nằm ngay trên thanh tab), hiện trạng thái đã lưu. */
export function ThanhLuu({ dang, ok, onLuu, nhan = "Lưu thông tin" }: { dang: boolean; ok: boolean; onLuu: () => void; nhan?: string }) {
  return (
    <div className="sticky bottom-3 z-30 mr-16 mt-6 rounded-hop border border-vien bg-giay-sang/95 px-4 py-3 shadow-[0_8px_28px_rgba(6,26,23,0.18)] khong-in">
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span role="status" className={`min-w-0 text-[12.5px] sm:text-[13.5px] ${ok ? "flex items-center gap-1.5 font-medium text-nhan-dam" : "text-muc-3"}`}>
          {ok ? <><Check className="h-4 w-4" aria-hidden />Đã lưu thông tin</> : "Thay đổi chỉ có hiệu lực sau khi lưu"}
        </span>
        <button type="button" className={`${NUT_CHINH} inline-flex shrink-0 items-center gap-2`} disabled={dang} onClick={onLuu}><Save className="h-4 w-4" aria-hidden />{dang ? "Đang lưu" : nhan}</button>
      </div>
    </div>
  );
}
