/** Ảnh đại diện tròn; chưa có ảnh thì hiện chữ cái đầu của tên. Cỡ theo px. Ảnh là data URL nhỏ do người dùng tải lên nên không qua next/image. */
export function AnhDaiDien({ hoTen, anh, kichCo = 36 }: { hoTen: string; anh: string | null; kichCo?: number }) {
  const chu = hoTen.trim().split(/\s+/).slice(-1)[0]?.[0]?.toUpperCase() ?? "?";
  return (
    <span className="vong-anh" style={{ width: kichCo, height: kichCo, fontSize: Math.round(kichCo * 0.42) }} aria-hidden>
      {anh ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={anh} alt="" width={kichCo} height={kichCo} />
      ) : (
        <span>{chu}</span>
      )}
    </span>
  );
}
