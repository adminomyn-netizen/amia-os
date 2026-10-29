"use client";

/** Lỗi tạm thời (Auth/DB chậm): giữ phiên đăng nhập, cho tải lại thay vì đá ra trang đăng nhập. */
export default function LoiTamThoi({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-[420px] flex-col items-center gap-3 px-4 py-16 text-center">
      <h1 className="text-[18px] font-semibold">Hệ thống đang chậm</h1>
      <p className="text-[14px] opacity-80">Chưa tải được trang này. Phiên đăng nhập của bạn vẫn còn. Chờ vài giây rồi bấm tải lại.</p>
      <button type="button" onClick={() => reset()} className="nut-vang h-[44px] rounded-nho px-6 text-[15px]">Tải lại</button>
    </div>
  );
}
