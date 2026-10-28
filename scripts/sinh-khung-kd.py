#!/usr/bin/env python3
"""Sinh dữ liệu "Khung vận hành Kinh doanh" từ hai tệp Excel của MSC (đặt ở docs/khung-kd/) để chữ trên hệ thống GIỐNG HỆT bản gốc.

  python3 scripts/sinh-khung-kd.py            # ghi supabase/migrations/0050_khung_kinh_doanh.sql, src/lib/khung-kd-phu.ts, docs/khung-kd/BAN-DO-PHU-KD.md

Một nguồn duy nhất cho "bản đồ phủ" (mỗi bước quy trình / biểu mẫu đang được làm ở màn nào của AMIA OS) nằm trong PHU_* bên dưới.
Khi xây xong một chức năng: sửa PHU_* rồi chạy lại để cập nhật tệp TS và tài liệu (không cần migration mới cho phần này).
Trạng thái: co = làm được trên hệ thống · mot_phan = làm được một phần · thieu = chưa có, cần xây · ngoai = thao tác con người/kỹ năng, không nằm trong phần mềm.
"""
import json, re, sys
from pathlib import Path
import openpyxl

GOC = Path(__file__).resolve().parent.parent
QT = GOC / "docs/khung-kd/MSC_Bo_Quy_trinh_chi_tiet.xlsx"
KD = GOC / "docs/khung-kd/MSC_Khung_nghiep_vu_KD_FULL.xlsx"


def s(v):
    return "" if v is None else str(v).strip()


def q(v):
    """Chuỗi SQL dạng dollar-quote (không cần thoát ký tự)."""
    v = s(v)
    return "null" if v == "" else f"$q${v}$q$"


# ───────────────────────── BẢN ĐỒ PHỦ (sửa ở đây) ─────────────────────────
# (trạng thái, màn hình AMIA OS, ghi chú)
PHU_BM = {
    "BM01": ("mot_phan", "/khach-hang", "Hồ sơ khách và lead có nguồn, dịch vụ quan tâm, người phụ trách, hạng. Thiếu: phân khúc/tầng khách."),
    "BM02": ("thieu", "/khach-hang", "Chưa có bản khai tiền sử và chống chỉ định có cấu trúc (dị ứng, thuốc đang dùng, thai kỳ); hiện chỉ có Ghi chú điều trị gõ tự do."),
    "BM03": ("mot_phan", "/khach-hang", "Tab Ghi chú điều trị (tình trạng, yêu cầu, phương án, kết quả, bác sĩ). Chưa có chỉ định phác đồ theo số buổi và khoảng cách."),
    "BM04": ("thieu", "", "Chưa có phiếu tư vấn (nhu cầu, gói đề xuất, phản đối, kết quả chốt)."),
    "BM05": ("co", "/van-ban/danh-sach", "Văn bản loại Hợp đồng mua dịch vụ / gói / thẻ, có hiệu lực và bản điện tử."),
    "BM06": ("mot_phan", "/van-ban/danh-sach", "Có loại văn bản phụ lục; chưa có lịch từng buổi và khoảng cách theo phác đồ."),
    "BM07": ("co", "/van-ban/dong-y-anh", "Đồng ý chụp ảnh theo dõi điều trị và đồng ý dùng ảnh cho truyền thông (có hạn, rút lại được)."),
    "BM08": ("mot_phan", "/ban-hang", "Có đơn bán và công nợ; chưa có phiếu chốt đơn / đặt cọc riêng và kiểm tra tỷ lệ cọc."),
    "BM09": ("co", "/hoa-don", "Hoá đơn, phiếu thu, thanh toán nhiều phương thức."),
    "BM10": ("co", "/tai-chinh/cong-no-khach", "Công nợ khách chia 6 nhóm tuổi nợ."),
    "BM11": ("thieu", "", "Chưa có phiếu bàn giao Tư vấn → KTV (hiện có lịch hẹn và phiếu cấp vật tư)."),
    "BM12": ("co", "/the", "Buổi thực hiện theo thẻ liệu trình: KTV, bác sĩ, tham số buổi."),
    "BM13": ("co", "/khach-hang", "Tab Ảnh của khách: kho riêng tư, ghi vết mỗi lần xem."),
    "BM14": ("thieu", "", "Chưa có phiếu hướng dẫn chăm sóc tại nhà."),
    "BM15": ("mot_phan", "/lich-hen", "Có lịch hẹn và thông báo đẩy nội bộ; nhắc lịch gửi tới khách (Zalo, SMS) cần tài khoản bên thứ ba."),
    "BM16": ("thieu", "", "Chưa có khảo sát hài lòng."),
    "BM17": ("co", "/khieu-nai", "Phiếu tiếp nhận khiếu nại: khách, kênh, loại, nội dung, người và giờ tiếp nhận, phương án, duyệt, khách xác nhận đóng. Số giờ SLA tiếp nhận chờ chị chốt."),
    "BM18": ("mot_phan", "/khieu-nai?tab=bien-chung", "Biên bản biến chứng: dấu hiệu, chẩn đoán, phương án, cam kết, nguyên nhân gốc, báo lãnh đạo; chẩn đoán chỉ người xem hồ sơ điều trị đọc được. Chưa có chữ ký khách trên biên bản."),
    "BM19": ("mot_phan", "/khach-hang", "Tab Khiếu nại & bảo hành tính mốc từ buổi cuối (3–6 tháng 50%, 6–12 tháng 40%, quá 12 tháng giá mới, triệt lông 1 năm/lần) và ghi từng lần làm lại. Chưa in phiếu điều kiện bảo hành từng dịch vụ."),
    "BM20": ("co", "/the", "Thẻ khách: liệu trình / giá trị, số dư, hạn dùng."),
    "BM21": ("mot_phan", "/the", "Có điều chỉnh và cấp thẻ tay; chưa có phiếu chuyển đổi / chuyển nhượng thẻ."),
    "BM22": ("mot_phan", "/marketing/doi-tac", "Khách có người giới thiệu; đối tác/CTV có mã giới thiệu. Chưa có thưởng referral."),
    "BM23": ("co", "/quy-trinh?tab=kich-ban", "Bộ kịch bản mẫu KB1–KB10 nằm trong Quy trình; kịch bản theo từng dịch vụ viết thêm ở Wiki công ty."),
    "BM24": ("co", "/bao-cao", "Báo cáo doanh thu, nhân viên, phễu; báo cáo ngày ở Nơi làm việc."),
    "BM25": ("thieu", "/nhan-su", "Chưa có phiếu đánh giá TVV (BSC/KPI nhân sự đang làm tiếp)."),
    "BM26": ("thieu", "", "Chưa có bộ câu hỏi khai thác nhu cầu; sẽ gắn vào phiếu tư vấn BM04."),
}

LEAD = "/marketing/lead"
LICH = "/lich-hen"
KHACH = "/khach-hang"
BAN = "/ban-hang"
# Mặc định theo quy trình: (trạng thái, màn hình, ghi chú)
PHU_QT_MD = {
    "QT-01": ("co", LEAD, "Lead có nguồn, phân bổ owner, trạng thái liên hệ, cảnh báo chưa nhận."),
    "QT-02": ("ngoai", "", "Tư vấn bằng lời và chat; ghi kết quả ở lead / lịch hẹn."),
    "QT-03": ("co", LICH, "Lịch hẹn kiểm trùng lịch, đồng bộ cho chi nhánh, nhắc nội bộ."),
    "QT-04": ("mot_phan", LICH, "Lịch hẹn có trạng thái đến / đang phục vụ; tác phong tiếp đón là thao tác con người."),
    "QT-05": ("mot_phan", BAN, "Bán hàng ở POS; chưa có phiếu tư vấn và hạn mức chiết khấu theo cấp."),
    "QT-06": ("mot_phan", "/van-ban/danh-sach", "Hợp đồng, hoá đơn, thu tiền, công nợ đã có; chưa kiểm tỷ lệ đặt cọc."),
    "QT-07": ("mot_phan", "/the", "Buổi thực hiện, ảnh, phiếu cấp vật tư đã có; chưa có phiếu bàn giao TVV → KTV."),
    "QT-08": ("thieu", "", "Chưa có theo dõi sau điều trị, hướng dẫn chăm sóc tại nhà, khảo sát hài lòng."),
    "QT-09": ("thieu", "", "Chưa có lịch chăm sóc (sinh nhật, nhắc lịch, tri ân) cho CSKH."),
    "QT-10": ("mot_phan", KHACH, "Khách có người giới thiệu; chưa có thưởng referral và ma trận bán chéo."),
    "QT-11": ("co", "/khieu-nai", "Tiếp nhận, phân loại, phương án, duyệt (người ghi/đề xuất không tự duyệt), khách xác nhận mới đóng, nguyên nhân gốc. SLA tiếp nhận và hạn mức tự xử lý chờ chốt."),
    "QT-12": ("co", "/khieu-nai?tab=bien-chung", "Báo dấu hiệu bất thường, bác sĩ khám và lập phương án, cam kết, báo lãnh đạo tự động 100% ca, nguyên nhân gốc và phòng ngừa."),
    "QT-13": ("co", KHACH, "Dữ liệu khách tập trung, phân quyền, ghi vết xem dữ liệu sức khoẻ."),
    "QT-14": ("ngoai", "", "Phát ngôn và xử lý khủng hoảng là việc của Ban Lãnh đạo; hệ thống chỉ lưu vụ việc liên quan (khiếu nại, biến chứng)."),
}
# Ghi đè theo từng bước: "QT-xx.Bn": (trạng thái, màn hình, ghi chú)
PHU_BUOC = {
    "QT-01.B3": ("ngoai", "", "Chuẩn bị tâm thế và xem ghi chú trước khi gọi."),
    "QT-01.B4": ("ngoai", "", "Cuộc gọi, theo kịch bản KB1."),
    "QT-01.B5": ("thieu", "", "Chưa có bộ câu hỏi khai thác BM26."),
    "QT-01.B8": ("co", LEAD, "Lead quá hạn lên cảnh báo trên chuông."),
    "QT-02.B2": ("thieu", "", "Chưa có bộ câu hỏi khai thác BM26."),
    "QT-02.B3": ("mot_phan", "/quy-trinh?tab=kich-ban", "Có kịch bản KB3; chưa có kho minh chứng trước/sau gắn câu tư vấn."),
    "QT-02.B6": ("co", LICH, "Đặt lịch khám / soi da."),
    "QT-02.B7": ("thieu", "", "Chưa có phiếu tư vấn BM04."),
    "QT-03.B4": ("mot_phan", LICH, "Chưa nhắc lịch tới khách tự động (cần Zalo / SMS)."),
    "QT-04.B1": ("ngoai", "", "Tác phong đón khách trong 30 giây."),
    "QT-04.B3": ("ngoai", "", "Bố trí phòng chờ sạch, riêng tư."),
    "QT-04.B5": ("ngoai", "", "Cho xem ảnh trước/sau (kho minh chứng có đồng ý của khách)."),
    "QT-05.B1": ("mot_phan", KHACH, "Ghi chú điều trị có phương án; chưa có phụ lục phác đồ số buổi."),
    "QT-05.B2": ("co", "/the", "Gói và thẻ liệu trình có giá và hạn dùng."),
    "QT-05.B3": ("ngoai", "", "Xử lý phản đối bằng lời (KB4–KB6)."),
    "QT-05.B4": ("ngoai", "", "Câu chốt (KB7)."),
    "QT-05.B5": ("thieu", "", "Chưa có phiếu chốt / đặt cọc BM08."),
    "QT-05.B6": ("thieu", "", "Chưa có hạn mức chiết khấu theo cấp và quy trình duyệt vượt hạn mức."),
    "QT-06.B1": ("co", "/van-ban/danh-sach", "Hợp đồng và phụ lục."),
    "QT-06.B2": ("co", "/van-ban/dong-y-anh", "Cam kết chụp ảnh và bảo mật hình ảnh."),
    "QT-06.B3": ("mot_phan", "/van-ban/danh-sach", "Có ngưỡng ký theo tham số; chờ chị Lâm chốt ngưỡng."),
    "QT-06.B4": ("mot_phan", BAN, "Thu tiền và phiếu thu có; chưa kiểm tỷ lệ cọc."),
    "QT-06.B5": ("co", "/tai-chinh/cong-no-khach", "Ghi nhận doanh thu và công nợ."),
    "QT-06.B6": ("co", "/van-ban/danh-sach", "Lưu hợp đồng, phân quyền, đồng bộ hồ sơ khách."),
    "QT-07.B1": ("thieu", "", "Chưa có phiếu bàn giao BM11."),
    "QT-07.B2": ("co", KHACH, "Tab Ảnh của khách."),
    "QT-07.B3": ("ngoai", "", "Quy trình vô khuẩn và kiểm tra máy."),
    "QT-07.B4": ("co", "/the", "Buổi thực hiện theo thẻ."),
    "QT-07.B5": ("ngoai", "", "Bác sĩ giám sát tại chỗ."),
    "QT-07.B6": ("co", KHACH, "Ảnh sau và kết quả."),
    "QT-08.B3": ("mot_phan", LICH, "Lịch hẹn có; nhắc tới khách cần Zalo / SMS."),
    "QT-09.B1": ("thieu", "", "Chưa có lịch chăm sóc sinh nhật, dịp lễ, theo nhóm khách."),
    "QT-10.B1": ("co", KHACH, "Ảnh trước/sau và lịch sử giao dịch."),
    "QT-10.B4": ("thieu", "", "Chưa có thưởng referral BM22."),
    "QT-10.B5": ("co", LEAD, "Lead nguồn Khách cũ giới thiệu."),
    "QT-11.B3": ("co", "/khieu-nai", "Ghi nguyên nhân đã xác minh và phương án ngay trên phiếu."),
    "QT-11.B4": ("co", "/khieu-nai", "Phương án có chi phí chờ Quản lý duyệt (thông báo đẩy); người ghi/đề xuất không tự duyệt."),
    "QT-12.B1": ("mot_phan", "/lich-hen", "Nút Báo bất thường trên lịch hẹn và hồ sơ khách; ngừng thao tác và đưa khách tới bác sĩ vẫn là việc con người."),
    "QT-12.B2": ("co", "/khieu-nai?tab=bien-chung", "Bác sĩ ghi chẩn đoán và phương án bằng văn bản trên ca."),
    "QT-13.B1": ("co", KHACH, "Form thông tin khách chuẩn."),
    "QT-13.B3": ("mot_phan", LEAD, "Lead chuyển thành khách; chuyển giao giữa các bộ phận chưa có xác nhận nhận bàn giao."),
    "QT-13.B5": ("mot_phan", "/cai-dat/vai-tro", "Phân quyền và ghi vết có; báo cáo tuân thủ chưa có."),
    "QT-14.B1": ("ngoai", "", "Người phát hiện báo ngay đầu mối."),
}


# ───────────────────────── ĐỌC EXCEL ─────────────────────────
def doc_qt():
    wb = openpyxl.load_workbook(QT, data_only=True)
    ds, buoc = [], []
    ws = wb["00. Danh mục quy trình"]
    thu_tu = 0
    for r in ws.iter_rows(values_only=True):
        if s(r[1]).startswith("QT-"):
            thu_tu += 1
            ds.append(dict(ma=s(r[1]), ten=s(r[2]), chu_tri=s(r[3]), bieu_mau_chinh=s(r[4]), cum=s(r[5]), thu_tu=thu_tu))
    gop = {d["ma"]: d for d in ds}
    for ws in wb.worksheets[1:]:
        ma = ws.title.split(" ")[0].replace("QT", "QT-")
        d = gop[ma]
        o_bang, k = False, 0
        for r in ws.iter_rows(values_only=True):
            a = s(r[0])
            if a == "Bước":
                o_bang = True
                continue
            if not o_bang:
                nhan = {"Mục đích": "muc_dich", "Phạm vi áp dụng": "pham_vi", "Đầu vào": "dau_vao", "Đầu ra": "dau_ra", "Người liên quan": "nguoi_lien_quan", "Biểu mẫu/Tài liệu": "bieu_mau", "KPI kiểm soát": "kpi", "Tham chiếu khung": "tham_chieu"}.get(a)
                if nhan:
                    d[nhan] = s(r[1])
            elif a:
                k += 1
                buoc.append(dict(qt=ma, buoc=a, nguoi=s(r[1]), hanh_dong=s(r[2]), tieu_chuan=s(r[3]), dau_ra=s(r[4]), bieu_mau=s(r[5]), thu_tu=k))
    return ds, buoc


def doc_kd():
    wb = openpyxl.load_workbook(KD, data_only=True)
    cum, hm, dv = [], [], []
    ws = wb["01. Khung nghiệp vụ KD"]
    c_cur = h_cur = None
    for r in ws.iter_rows(min_row=4, values_only=True):
        a = s(r[0])
        if not a:
            continue
        m = re.match(r"CỤM (\d+)\.\s+(.*)", a)
        if m:
            c_cur = int(m.group(1)); cum.append(dict(so=c_cur, ten=m.group(2).strip(), muc_tieu=""))
            continue
        if a.startswith("▸ Mục tiêu cụm:"):
            cum[-1]["muc_tieu"] = a.split(":", 1)[1].strip()
            continue
        m = re.match(r"(\d+\.\d+)\s+(.*?)\s+—\s+(.*)", a)
        if m and not r[1]:
            h_cur = m.group(1); hm.append(dict(ma=h_cur, cum=c_cur, ten=m.group(2).strip(), muc_tieu=m.group(3).strip(), thu_tu=len(hm) + 1))
            continue
        if re.match(r"^\d+\.\d+\.\d+$", a):
            dv.append(dict(ma=a, hm=h_cur, mo_ta=s(r[1]), san_pham=s(r[2]), dod=s(r[3]), chu_tri=s(r[4]), phoi_hop=s(r[5]), gd=int(s(r[6]) or 1), thu_tu=len(dv) + 1))
    ck = []
    ws = wb["02. Checklist thao tác"]
    nhom = ten_nhom = ""
    for r in ws.iter_rows(min_row=4, values_only=True):
        a = s(r[0])
        if not a:
            continue
        m = re.match(r"^([A-J])\.\s+(.*)", a)
        if m and not r[1]:
            nhom, ten_nhom = m.group(1), m.group(2).strip()
        elif re.match(r"^[A-J]\d+$", a):
            ck.append(dict(ma=a, nhom=nhom, ten_nhom=ten_nhom, thao_tac=s(r[1]), lam_gi=s(r[2]), tieu_chuan=s(r[3]), cong_cu=s(r[4]), thu_tu=len(ck) + 1))
    bm = [dict(ma=s(r[0]), ten=s(r[1]), muc_dich=s(r[2]), truong=s(r[3]), nguoi_dung=s(r[4]), cum=s(r[5]), thu_tu=i + 1) for i, r in enumerate([r for r in wb["03. Danh mục biểu mẫu"].iter_rows(min_row=4, values_only=True) if re.match(r"^BM\d+$", s(r[0]))])]
    kpi = [dict(nhom=s(r[0]), ten=s(r[1]), cong_thuc=s(r[2]), chi_tieu=s(r[3]), tan_suat=s(r[4]), nguon=s(r[5]), chu_tri=s(r[6]), thu_tu=i + 1) for i, r in enumerate([r for r in wb["04. Từ điển KPI"].iter_rows(min_row=4, values_only=True) if s(r[0]) in ("T", "K", "V", "P") and s(r[1])])]
    rr = []
    ws = wb["05. Rủi ro & Tuân thủ"]
    nhom_rr = ""
    for r in ws.iter_rows(min_row=4, values_only=True):
        a = s(r[0])
        if re.match(r"^[A-D]\.\s", a) and not r[1]:
            nhom_rr = re.sub(r"^[A-D]\.\s*", "", a)
        elif re.match(r"^R\d+$", a):
            rr.append(dict(ma=a, nhom=nhom_rr, ten=s(r[1]), mo_ta=s(r[2]), muc=s(r[3]), bien_phap=s(r[4]), trach_nhiem=s(r[5]), thu_tu=len(rr) + 1))
    nhip = []
    ws = wb["06. Nhịp VH & Onboarding"]
    nh = "van_hanh"
    for r in ws.iter_rows(min_row=4, values_only=True):
        a = s(r[0])
        if a.startswith("B. ONBOARDING"):
            nh = "onboarding"
            continue
        if not a or re.match(r"^[A-B]\.\s", a) or not s(r[1]):
            continue
        nhip.append(dict(nhom=nh, chu_ky=a, hoat_dong=s(r[1]), noi_dung=s(r[2]), dau_ra=s(r[3]), chu_tri=s(r[4]), thu_tu=len(nhip) + 1))
    kb = [dict(ma=s(r[0]), tinh_huong=s(r[1]), muc_tieu=s(r[2]), loi_thoai=s(r[3]), luu_y=s(r[4]), thu_tu=i + 1) for i, r in enumerate([r for r in wb["07. Kịch bản mẫu"].iter_rows(min_row=4, values_only=True) if re.match(r"^KB\d+$", s(r[0]))])]
    return cum, hm, dv, ck, bm, kpi, rr, nhip, kb


# ───────────────────────── GHI RA ─────────────────────────
SCHEMA = """-- 0050 — KHUNG VẬN HÀNH KINH DOANH (chị Lâm 28/10/2026: "setup đầy đủ bộ quy trình và nghiệp vụ bên mình"), sinh bằng scripts/sinh-khung-kd.py từ
-- docs/khung-kd/MSC_Bo_Quy_trinh_chi_tiet.xlsx (14 quy trình) và MSC_Khung_nghiep_vu_KD_FULL.xlsx (14 cụm, checklist A–J, 26 biểu mẫu, từ điển KPI, rủi ro, nhịp vận hành, kịch bản).
-- Chữ giữ nguyên bản gốc. Chỉ có bảng đầu việc triển khai (kd_dau_viec) là dữ liệu sống: trạng thái, người phụ trách, hạn.
create table public.kd_quy_trinh (
  ma text primary key, ten text not null, chu_tri text, bieu_mau_chinh text, cum text, muc_dich text, pham_vi text, dau_vao text, dau_ra text,
  nguoi_lien_quan text, bieu_mau text, kpi text, tham_chieu text, thu_tu int not null
);
create table public.kd_qt_buoc (
  qt_ma text not null references public.kd_quy_trinh (ma) on delete cascade, buoc text not null, nguoi text, hanh_dong text not null, tieu_chuan text, dau_ra text, bieu_mau text,
  thu_tu int not null, primary key (qt_ma, buoc)
);
create table public.kd_checklist (
  ma text primary key, nhom text not null, ten_nhom text not null, thao_tac text not null, lam_gi text, tieu_chuan text, cong_cu text, thu_tu int not null
);
create table public.kd_bieu_mau (
  ma text primary key, ten text not null, muc_dich text, truong text, nguoi_dung text, cum text, thu_tu int not null
);
create table public.kd_kich_ban (
  ma text primary key, tinh_huong text not null, muc_tieu text, loi_thoai text, luu_y text, thu_tu int not null
);
create table public.kd_kpi (
  id uuid primary key default gen_random_uuid(), nhom text not null check (nhom in ('T', 'K', 'V', 'P')), ten text not null unique, cong_thuc text, chi_tieu text, tan_suat text, nguon text, chu_tri text, thu_tu int not null
);
create table public.kd_rui_ro (
  ma text primary key, nhom text, ten text not null, mo_ta text, muc text, bien_phap text, trach_nhiem text, thu_tu int not null
);
create table public.kd_nhip (
  id uuid primary key default gen_random_uuid(), nhom text not null check (nhom in ('van_hanh', 'onboarding')), chu_ky text not null, hoat_dong text not null, noi_dung text, dau_ra text, chu_tri text, thu_tu int not null
);
create table public.kd_cum (so int primary key, ten text not null, muc_tieu text);
create table public.kd_hang_muc (
  ma text primary key, cum_so int not null references public.kd_cum (so) on delete cascade, ten text not null, muc_tieu text, thu_tu int not null
);
create table public.kd_dau_viec (
  ma text primary key, hang_muc_ma text not null references public.kd_hang_muc (ma) on delete cascade, mo_ta text not null, san_pham text, dod text, chu_tri text, phoi_hop text,
  giai_doan int not null check (giai_doan between 1 and 3), thu_tu int not null,
  trang_thai text not null default 'chua' check (trang_thai in ('chua', 'dang', 'xong', 'bo')),
  nguoi_phu_trach_id uuid references public.nhan_vien (id) on delete set null, han date, ghi_chu text,
  cap_nhat_luc timestamptz, cap_nhat_boi uuid references public.nhan_vien (id) on delete set null
);
create index kd_dau_viec_hm_idx on public.kd_dau_viec (hang_muc_ma);
"""


def ghi_sql(qt, buoc, cum, hm, dv, ck, bm, kpi, rr, nhip, kb):
    o = [SCHEMA]
    def ins(bang, cot, hang):
        if not hang:
            return
        o.append(f"insert into public.{bang} ({', '.join(cot)}) values")
        o.append(",\n".join("  (" + ", ".join(h) + ")" for h in hang) + ";\n")
    ins("kd_quy_trinh", ["ma", "ten", "chu_tri", "bieu_mau_chinh", "cum", "muc_dich", "pham_vi", "dau_vao", "dau_ra", "nguoi_lien_quan", "bieu_mau", "kpi", "tham_chieu", "thu_tu"],
        [[q(d["ma"]), q(d["ten"]), q(d["chu_tri"]), q(d["bieu_mau_chinh"]), q(d["cum"]), q(d.get("muc_dich")), q(d.get("pham_vi")), q(d.get("dau_vao")), q(d.get("dau_ra")), q(d.get("nguoi_lien_quan")), q(d.get("bieu_mau")), q(d.get("kpi")), q(d.get("tham_chieu")), str(d["thu_tu"])] for d in qt])
    ins("kd_qt_buoc", ["qt_ma", "buoc", "nguoi", "hanh_dong", "tieu_chuan", "dau_ra", "bieu_mau", "thu_tu"],
        [[q(b["qt"]), q(b["buoc"]), q(b["nguoi"]), q(b["hanh_dong"]), q(b["tieu_chuan"]), q(b["dau_ra"]), q(b["bieu_mau"]), str(b["thu_tu"])] for b in buoc])
    ins("kd_checklist", ["ma", "nhom", "ten_nhom", "thao_tac", "lam_gi", "tieu_chuan", "cong_cu", "thu_tu"],
        [[q(c["ma"]), q(c["nhom"]), q(c["ten_nhom"]), q(c["thao_tac"]), q(c["lam_gi"]), q(c["tieu_chuan"]), q(c["cong_cu"]), str(c["thu_tu"])] for c in ck])
    ins("kd_bieu_mau", ["ma", "ten", "muc_dich", "truong", "nguoi_dung", "cum", "thu_tu"], [[q(b["ma"]), q(b["ten"]), q(b["muc_dich"]), q(b["truong"]), q(b["nguoi_dung"]), q(b["cum"]), str(b["thu_tu"])] for b in bm])
    ins("kd_kich_ban", ["ma", "tinh_huong", "muc_tieu", "loi_thoai", "luu_y", "thu_tu"], [[q(k["ma"]), q(k["tinh_huong"]), q(k["muc_tieu"]), q(k["loi_thoai"]), q(k["luu_y"]), str(k["thu_tu"])] for k in kb])
    ins("kd_kpi", ["nhom", "ten", "cong_thuc", "chi_tieu", "tan_suat", "nguon", "chu_tri", "thu_tu"], [[q(k["nhom"]), q(k["ten"]), q(k["cong_thuc"]), q(k["chi_tieu"]), q(k["tan_suat"]), q(k["nguon"]), q(k["chu_tri"]), str(k["thu_tu"])] for k in kpi])
    ins("kd_rui_ro", ["ma", "nhom", "ten", "mo_ta", "muc", "bien_phap", "trach_nhiem", "thu_tu"], [[q(r["ma"]), q(r["nhom"]), q(r["ten"]), q(r["mo_ta"]), q(r["muc"]), q(r["bien_phap"]), q(r["trach_nhiem"]), str(r["thu_tu"])] for r in rr])
    ins("kd_nhip", ["nhom", "chu_ky", "hoat_dong", "noi_dung", "dau_ra", "chu_tri", "thu_tu"], [[q(n["nhom"]), q(n["chu_ky"]), q(n["hoat_dong"]), q(n["noi_dung"]), q(n["dau_ra"]), q(n["chu_tri"]), str(n["thu_tu"])] for n in nhip])
    ins("kd_cum", ["so", "ten", "muc_tieu"], [[str(c["so"]), q(c["ten"]), q(c["muc_tieu"])] for c in cum])
    ins("kd_hang_muc", ["ma", "cum_so", "ten", "muc_tieu", "thu_tu"], [[q(h["ma"]), str(h["cum"]), q(h["ten"]), q(h["muc_tieu"]), str(h["thu_tu"])] for h in hm])
    ins("kd_dau_viec", ["ma", "hang_muc_ma", "mo_ta", "san_pham", "dod", "chu_tri", "phoi_hop", "giai_doan", "thu_tu"],
        [[q(d["ma"]), q(d["hm"]), q(d["mo_ta"]), q(d["san_pham"]), q(d["dod"]), q(d["chu_tri"]), q(d["phoi_hop"]), str(d["gd"]), str(d["thu_tu"])] for d in dv])
    o.append("select public.khoa_tat_ca_bang();\n")
    (GOC / "supabase/migrations/0050_khung_kinh_doanh.sql").write_text("\n".join(o), encoding="utf-8")


def phu_buoc(qt_ma, buoc):
    return PHU_BUOC.get(f"{qt_ma}.{buoc}") or PHU_QT_MD[qt_ma]


def ghi_ts(buoc):
    p = {"bm": {k: dict(tt=v[0], link=v[1], ghi=v[2]) for k, v in PHU_BM.items()}, "buoc": {f"{b['qt']}.{b['buoc']}": dict(zip(("tt", "link", "ghi"), phu_buoc(b["qt"], b["buoc"]))) for b in buoc}}
    nd = ("// Sinh tự động bởi scripts/sinh-khung-kd.py — KHÔNG sửa tay. Bản đồ phủ: mỗi bước quy trình / biểu mẫu đang được làm ở màn nào của AMIA OS.\n"
          "export type TrangThaiPhu = \"co\" | \"mot_phan\" | \"thieu\" | \"ngoai\";\n"
          "export type Phu = { tt: TrangThaiPhu; link: string; ghi: string };\n"
          "export const NHAN_PHU: Record<TrangThaiPhu, string> = { co: \"Đã có trên hệ thống\", mot_phan: \"Có một phần\", thieu: \"Chưa có, cần xây\", ngoai: \"Thao tác con người\" };\n"
          f"export const PHU_BM: Record<string, Phu> = {json.dumps(p['bm'], ensure_ascii=False, indent=2)};\n"
          f"export const PHU_BUOC: Record<string, Phu> = {json.dumps(p['buoc'], ensure_ascii=False, indent=2)};\n")
    (GOC / "src/lib/khung-kd-phu.ts").write_text(nd, encoding="utf-8")


def ghi_doc(qt, buoc, bm):
    dem = lambda xs: {k: sum(1 for x in xs if x == k) for k in ("co", "mot_phan", "thieu", "ngoai")}
    d_bm = dem([v[0] for v in PHU_BM.values()])
    d_b = dem([phu_buoc(b["qt"], b["buoc"])[0] for b in buoc])
    nhan = {"co": "CÓ", "mot_phan": "MỘT PHẦN", "thieu": "THIẾU", "ngoai": "NGOÀI PHẦN MỀM"}
    L = ["# Bản đồ phủ: Khung kinh doanh MSC → AMIA OS", "",
         "Sinh tự động từ `scripts/sinh-khung-kd.py`. Đây là danh sách nghiệm thu: mỗi bước quy trình và mỗi biểu mẫu đang được làm ở màn nào, hay còn thiếu.", "",
         f"- **Biểu mẫu BM01–BM26:** {d_bm['co']} có · {d_bm['mot_phan']} một phần · {d_bm['thieu']} thiếu.",
         f"- **Bước quy trình ({len(buoc)} bước, 14 quy trình):** {d_b['co']} có · {d_b['mot_phan']} một phần · {d_b['thieu']} thiếu · {d_b['ngoai']} là thao tác con người (không đưa vào phần mềm).", "",
         "## Biểu mẫu", "", "| Mã | Tên | Trạng thái | Làm ở | Ghi chú |", "|---|---|---|---|---|"]
    ten_bm = {b["ma"]: b["ten"] for b in bm}
    for k, v in PHU_BM.items():
        L.append(f"| {k} | {ten_bm.get(k, '')} | {nhan[v[0]]} | {v[1] or '—'} | {v[2]} |")
    L += ["", "## Bước quy trình", ""]
    for d in qt:
        L += [f"### {d['ma']} {d['ten']}", "", "| Bước | Người làm | Việc | Trạng thái | Làm ở / ghi chú |", "|---|---|---|---|---|"]
        for b in [b for b in buoc if b["qt"] == d["ma"]]:
            tt, link, ghi = phu_buoc(b["qt"], b["buoc"])
            L.append(f"| {b['buoc']} | {b['nguoi']} | {b['hanh_dong'][:90]}{'…' if len(b['hanh_dong']) > 90 else ''} | {nhan[tt]} | {(link + ' · ') if link else ''}{ghi} |")
        L.append("")
    (GOC / "docs/khung-kd/BAN-DO-PHU-KD.md").write_text("\n".join(L), encoding="utf-8")


if __name__ == "__main__":
    qt, buoc = doc_qt()
    cum, hm, dv, ck, bm, kpi, rr, nhip, kb = doc_kd()
    for d in qt:
        assert d["ma"] in PHU_QT_MD, d["ma"]
    print("QT", len(qt), "bước", len(buoc), "cụm", len(cum), "hạng mục", len(hm), "đầu việc", len(dv), "checklist", len(ck), "BM", len(bm), "KPI", len(kpi), "rủi ro", len(rr), "nhịp", len(nhip), "KB", len(kb))
    ghi_sql(qt, buoc, cum, hm, dv, ck, bm, kpi, rr, nhip, kb)
    ghi_ts(buoc)
    ghi_doc(qt, buoc, bm)
