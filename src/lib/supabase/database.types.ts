export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      don_nhap: {
        Row: {
          cap_nhat_luc: string
          chi_nhanh_id: string
          dong: Json
          id: string
          khach_id: string | null
          nguoi_lap_id: string
          tao_luc: string
          tieu_de: string | null
        }
        Insert: {
          cap_nhat_luc?: string
          chi_nhanh_id: string
          dong?: Json
          id?: string
          khach_id?: string | null
          nguoi_lap_id: string
          tao_luc?: string
          tieu_de?: string | null
        }
        Update: {
          cap_nhat_luc?: string
          chi_nhanh_id?: string
          dong?: Json
          id?: string
          khach_id?: string | null
          nguoi_lap_id?: string
          tao_luc?: string
          tieu_de?: string | null
        }
        Relationships: []
      }
      hoa_don_xuat_dong: {
        Row: {
          hoa_don_dong_id: string
          sua_boi: string | null
          sua_luc: string
          ten_xuat: string
        }
        Insert: {
          hoa_don_dong_id: string
          sua_boi?: string | null
          sua_luc?: string
          ten_xuat: string
        }
        Update: {
          hoa_don_dong_id?: string
          sua_boi?: string | null
          sua_luc?: string
          ten_xuat?: string
        }
        Relationships: [
          {
            foreignKeyName: "hoa_don_xuat_dong_hoa_don_dong_id_fkey"
            columns: ["hoa_don_dong_id"]
            isOneToOne: true
            referencedRelation: "hoa_don_dong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoa_don_xuat_dong_sua_boi_fkey"
            columns: ["sua_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      hoa_don_xuat_tuy_chinh: {
        Row: {
          dia_chi: string | null
          hoa_don_id: string
          ma_so_thue: string | null
          sua_boi: string | null
          sua_luc: string
          ten_nguoi_mua: string | null
        }
        Insert: {
          dia_chi?: string | null
          hoa_don_id: string
          ma_so_thue?: string | null
          sua_boi?: string | null
          sua_luc?: string
          ten_nguoi_mua?: string | null
        }
        Update: {
          dia_chi?: string | null
          hoa_don_id?: string
          ma_so_thue?: string | null
          sua_boi?: string | null
          sua_luc?: string
          ten_nguoi_mua?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hoa_don_xuat_tuy_chinh_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: true
            referencedRelation: "hoa_don"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoa_don_xuat_tuy_chinh_sua_boi_fkey"
            columns: ["sua_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      hop_thu_hoi_thoai: {
        Row: {
          chi_nhanh_id: string | null
          chua_doc: number
          id: string
          kenh: string
          khach_id: string | null
          ma_ngoai: string
          tao_luc: string
          ten_khach: string | null
          tin_cuoi: string | null
          tin_cuoi_luc: string | null
        }
        Insert: {
          chi_nhanh_id?: string | null
          chua_doc?: number
          id?: string
          kenh: string
          khach_id?: string | null
          ma_ngoai: string
          tao_luc?: string
          ten_khach?: string | null
          tin_cuoi?: string | null
          tin_cuoi_luc?: string | null
        }
        Update: {
          chi_nhanh_id?: string | null
          chua_doc?: number
          id?: string
          kenh?: string
          khach_id?: string | null
          ma_ngoai?: string
          tao_luc?: string
          ten_khach?: string | null
          tin_cuoi?: string | null
          tin_cuoi_luc?: string | null
        }
        Relationships: []
      }
      hop_thu_tin: {
        Row: {
          hoi_thoai_id: string
          huong: string
          id: string
          nguoi_id: string | null
          noi_dung: string
          tao_luc: string
          trang_thai: string
        }
        Insert: {
          hoi_thoai_id: string
          huong: string
          id?: string
          nguoi_id?: string | null
          noi_dung: string
          tao_luc?: string
          trang_thai?: string
        }
        Update: {
          hoi_thoai_id?: string
          huong?: string
          id?: string
          nguoi_id?: string | null
          noi_dung?: string
          tao_luc?: string
          trang_thai?: string
        }
        Relationships: []
      }
      ket_noi_ben_thu_ba: {
        Row: {
          cau_hinh_ma_hoa: string
          kenh: string
          nguoi_id: string | null
          sua_luc: string
          ten_hien_thi: string | null
          trang_thai: string
        }
        Insert: {
          cau_hinh_ma_hoa: string
          kenh: string
          nguoi_id?: string | null
          sua_luc?: string
          ten_hien_thi?: string | null
          trang_thai?: string
        }
        Update: {
          cau_hinh_ma_hoa?: string
          kenh?: string
          nguoi_id?: string | null
          sua_luc?: string
          ten_hien_thi?: string | null
          trang_thai?: string
        }
        Relationships: []
      }
      tin_nhan_hang_doi: {
        Row: {
          chi_nhanh_id: string | null
          den_so_dien_thoai: string
          gui_luc: string | null
          id: string
          kenh: string
          khach_id: string | null
          loi: string | null
          mau_ma: string | null
          nguoi_tao_id: string | null
          noi_dung: string
          tao_luc: string
          trang_thai: string
        }
        Insert: {
          chi_nhanh_id?: string | null
          den_so_dien_thoai: string
          gui_luc?: string | null
          id?: string
          kenh: string
          khach_id?: string | null
          loi?: string | null
          mau_ma?: string | null
          nguoi_tao_id?: string | null
          noi_dung: string
          tao_luc?: string
          trang_thai?: string
        }
        Update: {
          chi_nhanh_id?: string | null
          den_so_dien_thoai?: string
          gui_luc?: string | null
          id?: string
          kenh?: string
          khach_id?: string | null
          loi?: string | null
          mau_ma?: string | null
          nguoi_tao_id?: string | null
          noi_dung?: string
          tao_luc?: string
          trang_thai?: string
        }
        Relationships: []
      }
      tin_nhan_mau: {
        Row: {
          bat: boolean
          kenh: string
          ma: string
          noi_dung: string
          sua_luc: string
          ten: string
        }
        Insert: {
          bat?: boolean
          kenh?: string
          ma: string
          noi_dung: string
          sua_luc?: string
          ten: string
        }
        Update: {
          bat?: boolean
          kenh?: string
          ma?: string
          noi_dung?: string
          sua_luc?: string
          ten?: string
        }
        Relationships: []
      }
      thu_ket_noi: {
        Row: {
          email: string
          id: boolean
          mat_khau_ma_hoa: string
          nguoi_id: string | null
          sua_luc: string
        }
        Insert: {
          email: string
          id?: boolean
          mat_khau_ma_hoa: string
          nguoi_id?: string | null
          sua_luc?: string
        }
        Update: {
          email?: string
          id?: boolean
          mat_khau_ma_hoa?: string
          nguoi_id?: string | null
          sua_luc?: string
        }
        Relationships: []
      }
      tuyen_dung_hang_doi_thu: {
        Row: {
          den_email: string
          gui_luc: string | null
          id: string
          loi: string | null
          mau_ma: string
          nguoi_tao_id: string | null
          noi_dung: string
          tao_luc: string
          tieu_de: string
          trang_thai: string
          ung_vien_id: string | null
        }
        Insert: {
          den_email: string
          gui_luc?: string | null
          id?: string
          loi?: string | null
          mau_ma: string
          nguoi_tao_id?: string | null
          noi_dung: string
          tao_luc?: string
          tieu_de: string
          trang_thai?: string
          ung_vien_id?: string | null
        }
        Update: {
          den_email?: string
          gui_luc?: string | null
          id?: string
          loi?: string | null
          mau_ma?: string
          nguoi_tao_id?: string | null
          noi_dung?: string
          tao_luc?: string
          tieu_de?: string
          trang_thai?: string
          ung_vien_id?: string | null
        }
        Relationships: []
      }
      tuyen_dung_mau_thu: {
        Row: {
          buoc: string
          hoat_dong: boolean
          ma: string
          noi_dung: string
          sua_luc: string
          ten: string
          tieu_de: string
          tu_gui: boolean
        }
        Insert: {
          buoc: string
          hoat_dong?: boolean
          ma: string
          noi_dung: string
          sua_luc?: string
          ten: string
          tieu_de: string
          tu_gui?: boolean
        }
        Update: {
          buoc?: string
          hoat_dong?: boolean
          ma?: string
          noi_dung?: string
          sua_luc?: string
          ten?: string
          tieu_de?: string
          tu_gui?: boolean
        }
        Relationships: []
      }
      ban_giao_muc: {
        Row: {
          hoat_dong: boolean
          id: string
          ten: string
          thu_tu: number
        }
        Insert: {
          hoat_dong?: boolean
          id?: string
          ten: string
          thu_tu?: number
        }
        Update: {
          hoat_dong?: boolean
          id?: string
          ten?: string
          thu_tu?: number
        }
        Relationships: []
      }
      ban_giao_tien_do: {
        Row: {
          ghi_chu: string | null
          muc_id: string
          nghi_viec_id: string
          nguoi_id: string | null
          xong_luc: string
        }
        Insert: {
          ghi_chu?: string | null
          muc_id: string
          nghi_viec_id: string
          nguoi_id?: string | null
          xong_luc?: string
        }
        Update: {
          ghi_chu?: string | null
          muc_id?: string
          nghi_viec_id?: string
          nguoi_id?: string | null
          xong_luc?: string
        }
        Relationships: []
      }
      cap_bac: {
        Row: {
          bac: number
          dieu_kien: string | null
          hoat_dong: boolean
          id: string
          luong_den: number | null
          luong_tu: number | null
          ma: string
          tao_luc: string
          ten: string
        }
        Insert: {
          bac: number
          dieu_kien?: string | null
          hoat_dong?: boolean
          id?: string
          luong_den?: number | null
          luong_tu?: number | null
          ma: string
          tao_luc?: string
          ten: string
        }
        Update: {
          bac?: number
          dieu_kien?: string | null
          hoat_dong?: boolean
          id?: string
          luong_den?: number | null
          luong_tu?: number | null
          ma?: string
          tao_luc?: string
          ten?: string
        }
        Relationships: []
      }
      chot_nghi_viec: {
        Row: {
          bhxh_chot_den: string | null
          chot_boi_id: string | null
          chot_luc: string | null
          cong_den_ngay: string | null
          ghi_chu: string | null
          luong_con_lai: number | null
          nghi_viec_id: string
          tien_phep_con: number | null
        }
        Insert: {
          bhxh_chot_den?: string | null
          chot_boi_id?: string | null
          chot_luc?: string | null
          cong_den_ngay?: string | null
          ghi_chu?: string | null
          luong_con_lai?: number | null
          nghi_viec_id: string
          tien_phep_con?: number | null
        }
        Update: {
          bhxh_chot_den?: string | null
          chot_boi_id?: string | null
          chot_luc?: string | null
          cong_den_ngay?: string | null
          ghi_chu?: string | null
          luong_con_lai?: number | null
          nghi_viec_id?: string
          tien_phep_con?: number | null
        }
        Relationships: []
      }
      dao_tao_ket_qua: {
        Row: {
          diem: number | null
          ghi_chu: string | null
          id: string
          khoa_id: string
          ngay_hoc: string | null
          nhan_vien_id: string
          tao_luc: string
          trang_thai: string
        }
        Insert: {
          diem?: number | null
          ghi_chu?: string | null
          id?: string
          khoa_id: string
          ngay_hoc?: string | null
          nhan_vien_id: string
          tao_luc?: string
          trang_thai?: string
        }
        Update: {
          diem?: number | null
          ghi_chu?: string | null
          id?: string
          khoa_id?: string
          ngay_hoc?: string | null
          nhan_vien_id?: string
          tao_luc?: string
          trang_thai?: string
        }
        Relationships: []
      }
      dao_tao_khoa: {
        Row: {
          bat_buoc: boolean
          chuc_danh: string | null
          hoat_dong: boolean
          id: string
          mo_ta: string | null
          so_gio: number
          tao_luc: string
          ten: string
          thu_tu: number
        }
        Insert: {
          bat_buoc?: boolean
          chuc_danh?: string | null
          hoat_dong?: boolean
          id?: string
          mo_ta?: string | null
          so_gio?: number
          tao_luc?: string
          ten: string
          thu_tu?: number
        }
        Update: {
          bat_buoc?: boolean
          chuc_danh?: string | null
          hoat_dong?: boolean
          id?: string
          mo_ta?: string | null
          so_gio?: number
          tao_luc?: string
          ten?: string
          thu_tu?: number
        }
        Relationships: []
      }
      kpi_diem: {
        Row: {
          diem: number
          ghi_chu: string | null
          id: string
          nam: number
          nguoi_nhap_id: string | null
          nguon: string
          nhan_vien_id: string
          tao_luc: string
          thang: number
        }
        Insert: {
          diem: number
          ghi_chu?: string | null
          id?: string
          nam: number
          nguoi_nhap_id?: string | null
          nguon?: string
          nhan_vien_id: string
          tao_luc?: string
          thang: number
        }
        Update: {
          diem?: number
          ghi_chu?: string | null
          id?: string
          nam?: number
          nguoi_nhap_id?: string | null
          nguon?: string
          nhan_vien_id?: string
          tao_luc?: string
          thang?: number
        }
        Relationships: []
      }
      kpi_thuong: {
        Row: {
          doi_tuong: string
          hang: number
          id: string
          ky: string
          so_tien: number
        }
        Insert: {
          doi_tuong: string
          hang: number
          id?: string
          ky: string
          so_tien?: number
        }
        Update: {
          doi_tuong?: string
          hang?: number
          id?: string
          ky?: string
          so_tien?: number
        }
        Relationships: []
      }
      phong_van_thoi_viec: {
        Row: {
          co_the_quay_lai: boolean | null
          de_xuat: string | null
          dieu_chua_hai_long: string | null
          dieu_hai_long: string | null
          id: string
          ly_do_chinh: string | null
          ngay_pv: string
          nghi_viec_id: string
          nguoi_pv_id: string | null
          tao_luc: string
        }
        Insert: {
          co_the_quay_lai?: boolean | null
          de_xuat?: string | null
          dieu_chua_hai_long?: string | null
          dieu_hai_long?: string | null
          id?: string
          ly_do_chinh?: string | null
          ngay_pv: string
          nghi_viec_id: string
          nguoi_pv_id?: string | null
          tao_luc?: string
        }
        Update: {
          co_the_quay_lai?: boolean | null
          de_xuat?: string | null
          dieu_chua_hai_long?: string | null
          dieu_hai_long?: string | null
          id?: string
          ly_do_chinh?: string | null
          ngay_pv?: string
          nghi_viec_id?: string
          nguoi_pv_id?: string | null
          tao_luc?: string
        }
        Relationships: []
      }
      thang_chuc: {
        Row: {
          cap_bac_id: string | null
          den_chuc_danh: string | null
          den_phong_id: string | null
          hieu_luc_tu: string
          id: string
          loai: string
          ly_do: string | null
          nguoi_tao_id: string | null
          nhan_vien_id: string
          so_quyet_dinh: string | null
          tao_luc: string
          tu_chuc_danh: string | null
          tu_phong_id: string | null
        }
        Insert: {
          cap_bac_id?: string | null
          den_chuc_danh?: string | null
          den_phong_id?: string | null
          hieu_luc_tu: string
          id?: string
          loai: string
          ly_do?: string | null
          nguoi_tao_id?: string | null
          nhan_vien_id: string
          so_quyet_dinh?: string | null
          tao_luc?: string
          tu_chuc_danh?: string | null
          tu_phong_id?: string | null
        }
        Update: {
          cap_bac_id?: string | null
          den_chuc_danh?: string | null
          den_phong_id?: string | null
          hieu_luc_tu?: string
          id?: string
          loai?: string
          ly_do?: string | null
          nguoi_tao_id?: string | null
          nhan_vien_id?: string
          so_quyet_dinh?: string | null
          tao_luc?: string
          tu_chuc_danh?: string | null
          tu_phong_id?: string | null
        }
        Relationships: []
      }
      thu_viec_danh_gia: {
        Row: {
          diem: number
          id: string
          moc: number
          nguoi_danh_gia_id: string | null
          nhan_vien_id: string
          nhan_xet: string | null
          quyet_dinh: string | null
          tao_luc: string
          vai: string
        }
        Insert: {
          diem: number
          id?: string
          moc: number
          nguoi_danh_gia_id?: string | null
          nhan_vien_id: string
          nhan_xet?: string | null
          quyet_dinh?: string | null
          tao_luc?: string
          vai: string
        }
        Update: {
          diem?: number
          id?: string
          moc?: number
          nguoi_danh_gia_id?: string | null
          nhan_vien_id?: string
          nhan_xet?: string | null
          quyet_dinh?: string | null
          tao_luc?: string
          vai?: string
        }
        Relationships: []
      }
      thu_viec_muc_tieu: {
        Row: {
          id: string
          ket_qua: string
          moc: number
          nguoi_tao_id: string | null
          nhan_vien_id: string
          noi_dung: string
          tao_luc: string
          tieu_chi: string | null
        }
        Insert: {
          id?: string
          ket_qua?: string
          moc: number
          nguoi_tao_id?: string | null
          nhan_vien_id: string
          noi_dung: string
          tao_luc?: string
          tieu_chi?: string | null
        }
        Update: {
          id?: string
          ket_qua?: string
          moc?: number
          nguoi_tao_id?: string | null
          nhan_vien_id?: string
          noi_dung?: string
          tao_luc?: string
          tieu_chi?: string | null
        }
        Relationships: []
      }
      bang_cong_thang: {
        Row: {
          khoa: boolean
          khoa_luc: string | null
          nam: number
          nguoi_khoa_id: string | null
          thang: number
        }
        Insert: {
          khoa?: boolean
          khoa_luc?: string | null
          nam: number
          nguoi_khoa_id?: string | null
          thang: number
        }
        Update: {
          khoa?: boolean
          khoa_luc?: string | null
          nam?: number
          nguoi_khoa_id?: string | null
          thang?: number
        }
        Relationships: [
          {
            foreignKeyName: "bang_cong_thang_nguoi_khoa_id_fkey"
            columns: ["nguoi_khoa_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      bang_luong_dong: {
        Row: {
          an_ca: number
          bhxh_nld: number
          cong_chuan: number
          cong_khac: number
          cong_tinh: number
          dong_phuc: number
          giam_tru: number
          gross: number
          hoa_hong: number
          id: string
          ky_id: string
          luong_co_ban: number
          luong_cong: number
          luong_ot: number
          nha_o: number
          nhan_vien_id: string
          ot_gio: number
          tam_ung: number
          thu_nhap_tinh_thue: number
          thuc_tra: number
          thue_tncn: number
          tinh_trang: string
          tru_khac: number
          tru_vi_pham: number
        }
        Insert: {
          an_ca?: number
          bhxh_nld?: number
          cong_chuan: number
          cong_khac?: number
          cong_tinh: number
          dong_phuc?: number
          giam_tru?: number
          gross: number
          hoa_hong?: number
          id?: string
          ky_id: string
          luong_co_ban: number
          luong_cong: number
          luong_ot?: number
          nha_o?: number
          nhan_vien_id: string
          ot_gio?: number
          tam_ung?: number
          thu_nhap_tinh_thue?: number
          thuc_tra: number
          thue_tncn?: number
          tinh_trang: string
          tru_khac?: number
          tru_vi_pham?: number
        }
        Update: {
          an_ca?: number
          bhxh_nld?: number
          cong_chuan?: number
          cong_khac?: number
          cong_tinh?: number
          dong_phuc?: number
          giam_tru?: number
          gross?: number
          hoa_hong?: number
          id?: string
          ky_id?: string
          luong_co_ban?: number
          luong_cong?: number
          luong_ot?: number
          nha_o?: number
          nhan_vien_id?: string
          ot_gio?: number
          tam_ung?: number
          thu_nhap_tinh_thue?: number
          thuc_tra?: number
          thue_tncn?: number
          tinh_trang?: string
          tru_khac?: number
          tru_vi_pham?: number
        }
        Relationships: [
          {
            foreignKeyName: "bang_luong_dong_ky_id_fkey"
            columns: ["ky_id"]
            isOneToOne: false
            referencedRelation: "ky_luong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bang_luong_dong_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      bang_tin: {
        Row: {
          ghim: boolean
          hien_den: string | null
          hien_tu: string
          hoat_dong: boolean
          id: string
          noi_dung: string
          tao_boi: string | null
          tao_luc: string
          tieu_de: string
        }
        Insert: {
          ghim?: boolean
          hien_den?: string | null
          hien_tu?: string
          hoat_dong?: boolean
          id?: string
          noi_dung: string
          tao_boi?: string | null
          tao_luc?: string
          tieu_de: string
        }
        Update: {
          ghim?: boolean
          hien_den?: string | null
          hien_tu?: string
          hoat_dong?: boolean
          id?: string
          noi_dung?: string
          tao_boi?: string | null
          tao_luc?: string
          tieu_de?: string
        }
        Relationships: [
          {
            foreignKeyName: "bang_tin_tao_boi_fkey"
            columns: ["tao_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_bai_viet: {
        Row: {
          anh: string | null
          cap_nhat_luc: string
          chuyen_muc_id: string
          hoat_dong: boolean
          id: string
          mo_ta_ngan: string | null
          noi_dung: string
          tao_boi: string | null
          tao_luc: string
          tieu_bieu: boolean
          tieu_de: string
        }
        Insert: {
          anh?: string | null
          cap_nhat_luc?: string
          chuyen_muc_id: string
          hoat_dong?: boolean
          id?: string
          mo_ta_ngan?: string | null
          noi_dung: string
          tao_boi?: string | null
          tao_luc?: string
          tieu_bieu?: boolean
          tieu_de: string
        }
        Update: {
          anh?: string | null
          cap_nhat_luc?: string
          chuyen_muc_id?: string
          hoat_dong?: boolean
          id?: string
          mo_ta_ngan?: string | null
          noi_dung?: string
          tao_boi?: string | null
          tao_luc?: string
          tieu_bieu?: boolean
          tieu_de?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_bai_viet_chuyen_muc_id_fkey"
            columns: ["chuyen_muc_id"]
            isOneToOne: false
            referencedRelation: "blog_chuyen_muc"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_bai_viet_tao_boi_fkey"
            columns: ["tao_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_chuyen_muc: {
        Row: {
          cap_nhat_luc: string
          hoat_dong: boolean
          id: string
          mo_ta: string | null
          tao_luc: string
          thu_tu: number
          tieu_de: string
        }
        Insert: {
          cap_nhat_luc?: string
          hoat_dong?: boolean
          id?: string
          mo_ta?: string | null
          tao_luc?: string
          thu_tu?: number
          tieu_de: string
        }
        Update: {
          cap_nhat_luc?: string
          hoat_dong?: boolean
          id?: string
          mo_ta?: string | null
          tao_luc?: string
          thu_tu?: number
          tieu_de?: string
        }
        Relationships: []
      }
      bao_cao_ngay: {
        Row: {
          cap_nhat_luc: string
          da_lam: string
          id: string
          ke_hoach: string | null
          ngay: string
          nguoi_nop_id: string
          nhan_vien_id: string
          vuong: string | null
        }
        Insert: {
          cap_nhat_luc?: string
          da_lam: string
          id?: string
          ke_hoach?: string | null
          ngay: string
          nguoi_nop_id: string
          nhan_vien_id: string
          vuong?: string | null
        }
        Update: {
          cap_nhat_luc?: string
          da_lam?: string
          id?: string
          ke_hoach?: string | null
          ngay?: string
          nguoi_nop_id?: string
          nhan_vien_id?: string
          vuong?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bao_cao_ngay_nguoi_nop_id_fkey"
            columns: ["nguoi_nop_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bao_cao_ngay_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      bao_cao_sang: {
        Row: {
          chi_nhanh_id: string | null
          du_lieu: Json
          id: string
          ngay: string
          tao_luc: string
        }
        Insert: {
          chi_nhanh_id?: string | null
          du_lieu: Json
          id?: string
          ngay: string
          tao_luc?: string
        }
        Update: {
          chi_nhanh_id?: string | null
          du_lieu?: Json
          id?: string
          ngay?: string
          tao_luc?: string
        }
        Relationships: [
          {
            foreignKeyName: "bao_cao_sang_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
        ]
      }
      bao_gia_don_mua: {
        Row: {
          don_mua_id: string
          duoc_chon: boolean
          ghi_chu: string | null
          id: string
          link_file: string | null
          ncc_id: string
          nguoi_id: string
          tao_luc: string
          tong_tien: number
        }
        Insert: {
          don_mua_id: string
          duoc_chon?: boolean
          ghi_chu?: string | null
          id?: string
          link_file?: string | null
          ncc_id: string
          nguoi_id: string
          tao_luc?: string
          tong_tien: number
        }
        Update: {
          don_mua_id?: string
          duoc_chon?: boolean
          ghi_chu?: string | null
          id?: string
          link_file?: string | null
          ncc_id?: string
          nguoi_id?: string
          tao_luc?: string
          tong_tien?: number
        }
        Relationships: [
          {
            foreignKeyName: "bao_gia_don_mua_don_mua_id_fkey"
            columns: ["don_mua_id"]
            isOneToOne: false
            referencedRelation: "don_mua"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bao_gia_don_mua_ncc_id_fkey"
            columns: ["ncc_id"]
            isOneToOne: false
            referencedRelation: "nha_cung_cap"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bao_gia_don_mua_ncc_id_fkey"
            columns: ["ncc_id"]
            isOneToOne: false
            referencedRelation: "v_cong_no_ncc"
            referencedColumns: ["ncc_id"]
          },
          {
            foreignKeyName: "bao_gia_don_mua_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      bao_hanh_lan: {
        Row: {
          bien_chung_id: string | null
          buoi_cuoi_id: string | null
          dich_vu_id: string
          ghi_chu: string | null
          id: string
          khach_id: string
          khieu_nai_id: string | null
          moc: string
          ngay_dich_vu_cuoi: string
          ngay_lam_lai: string
          nguoi_ghi_id: string
          tao_luc: string
          ty_le_giam: number | null
        }
        Insert: {
          bien_chung_id?: string | null
          buoi_cuoi_id?: string | null
          dich_vu_id: string
          ghi_chu?: string | null
          id?: string
          khach_id: string
          khieu_nai_id?: string | null
          moc: string
          ngay_dich_vu_cuoi: string
          ngay_lam_lai?: string
          nguoi_ghi_id: string
          tao_luc?: string
          ty_le_giam?: number | null
        }
        Update: {
          bien_chung_id?: string | null
          buoi_cuoi_id?: string | null
          dich_vu_id?: string
          ghi_chu?: string | null
          id?: string
          khach_id?: string
          khieu_nai_id?: string | null
          moc?: string
          ngay_dich_vu_cuoi?: string
          ngay_lam_lai?: string
          nguoi_ghi_id?: string
          tao_luc?: string
          ty_le_giam?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bao_hanh_lan_bien_chung_id_fkey"
            columns: ["bien_chung_id"]
            isOneToOne: false
            referencedRelation: "bien_chung"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bao_hanh_lan_buoi_cuoi_id_fkey"
            columns: ["buoi_cuoi_id"]
            isOneToOne: false
            referencedRelation: "buoi_thuc_hien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bao_hanh_lan_dich_vu_id_fkey"
            columns: ["dich_vu_id"]
            isOneToOne: false
            referencedRelation: "dich_vu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bao_hanh_lan_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bao_hanh_lan_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bao_hanh_lan_khieu_nai_id_fkey"
            columns: ["khieu_nai_id"]
            isOneToOne: false
            referencedRelation: "khieu_nai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bao_hanh_lan_nguoi_ghi_id_fkey"
            columns: ["nguoi_ghi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      bien_chung: {
        Row: {
          bac_si_id: string | null
          bao_lanh_dao_luc: string
          bao_luc: string
          buoi_id: string | null
          cam_ket: string | null
          chan_doan: string | null
          chi_nhanh_id: string | null
          dau_hieu: string
          dich_vu_id: string | null
          dong_luc: string | null
          id: string
          khach_id: string
          khieu_nai_id: string | null
          ma: string
          nguoi_bao_id: string
          nguyen_nhan_goc: string | null
          phong_ngua: string | null
          phuong_an: string | null
          tao_luc: string
          trang_thai: string
        }
        Insert: {
          bac_si_id?: string | null
          bao_lanh_dao_luc?: string
          bao_luc?: string
          buoi_id?: string | null
          cam_ket?: string | null
          chan_doan?: string | null
          chi_nhanh_id?: string | null
          dau_hieu: string
          dich_vu_id?: string | null
          dong_luc?: string | null
          id?: string
          khach_id: string
          khieu_nai_id?: string | null
          ma: string
          nguoi_bao_id: string
          nguyen_nhan_goc?: string | null
          phong_ngua?: string | null
          phuong_an?: string | null
          tao_luc?: string
          trang_thai?: string
        }
        Update: {
          bac_si_id?: string | null
          bao_lanh_dao_luc?: string
          bao_luc?: string
          buoi_id?: string | null
          cam_ket?: string | null
          chan_doan?: string | null
          chi_nhanh_id?: string | null
          dau_hieu?: string
          dich_vu_id?: string | null
          dong_luc?: string | null
          id?: string
          khach_id?: string
          khieu_nai_id?: string | null
          ma?: string
          nguoi_bao_id?: string
          nguyen_nhan_goc?: string | null
          phong_ngua?: string | null
          phuong_an?: string | null
          tao_luc?: string
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "bien_chung_bac_si_id_fkey"
            columns: ["bac_si_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bien_chung_buoi_id_fkey"
            columns: ["buoi_id"]
            isOneToOne: false
            referencedRelation: "buoi_thuc_hien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bien_chung_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bien_chung_dich_vu_id_fkey"
            columns: ["dich_vu_id"]
            isOneToOne: false
            referencedRelation: "dich_vu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bien_chung_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bien_chung_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bien_chung_khieu_nai_id_fkey"
            columns: ["khieu_nai_id"]
            isOneToOne: false
            referencedRelation: "khieu_nai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bien_chung_nguoi_bao_id_fkey"
            columns: ["nguoi_bao_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      buoi_thuc_hien: {
        Row: {
          bac_si_id: string | null
          chi_nhanh_id: string
          dich_vu_id: string
          doanh_thu_buoi: number
          ghi_chu: string | null
          huy_luc: string | null
          id: string
          khach_id: string
          lich_hen_id: string | null
          ly_do_huy: string | null
          ngay_lam: string
          nv_thuc_hien_id: string
          tao_boi: string | null
          tao_luc: string
          tham_so: Json
          the_id: string | null
          trang_thai: string
        }
        Insert: {
          bac_si_id?: string | null
          chi_nhanh_id: string
          dich_vu_id: string
          doanh_thu_buoi?: number
          ghi_chu?: string | null
          huy_luc?: string | null
          id?: string
          khach_id: string
          lich_hen_id?: string | null
          ly_do_huy?: string | null
          ngay_lam?: string
          nv_thuc_hien_id: string
          tao_boi?: string | null
          tao_luc?: string
          tham_so?: Json
          the_id?: string | null
          trang_thai?: string
        }
        Update: {
          bac_si_id?: string | null
          chi_nhanh_id?: string
          dich_vu_id?: string
          doanh_thu_buoi?: number
          ghi_chu?: string | null
          huy_luc?: string | null
          id?: string
          khach_id?: string
          lich_hen_id?: string | null
          ly_do_huy?: string | null
          ngay_lam?: string
          nv_thuc_hien_id?: string
          tao_boi?: string | null
          tao_luc?: string
          tham_so?: Json
          the_id?: string | null
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "buoi_thuc_hien_bac_si_id_fkey"
            columns: ["bac_si_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buoi_thuc_hien_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buoi_thuc_hien_dich_vu_id_fkey"
            columns: ["dich_vu_id"]
            isOneToOne: false
            referencedRelation: "dich_vu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buoi_thuc_hien_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buoi_thuc_hien_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buoi_thuc_hien_lich_hen_id_fkey"
            columns: ["lich_hen_id"]
            isOneToOne: false
            referencedRelation: "lich_hen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buoi_thuc_hien_nv_thuc_hien_id_fkey"
            columns: ["nv_thuc_hien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buoi_thuc_hien_tao_boi_fkey"
            columns: ["tao_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buoi_thuc_hien_the_id_fkey"
            columns: ["the_id"]
            isOneToOne: false
            referencedRelation: "the_khach"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buoi_thuc_hien_the_id_fkey"
            columns: ["the_id"]
            isOneToOne: false
            referencedRelation: "v_the_khach"
            referencedColumns: ["id"]
          },
        ]
      }
      ca_lam: {
        Row: {
          dung_sai_phut: number
          gio_chuan: number
          gio_ra: string
          gio_vao: string
          hoat_dong: boolean
          id: string
          ma: string
          nghi_phut: number
          ten: string
        }
        Insert: {
          dung_sai_phut?: number
          gio_chuan?: number
          gio_ra: string
          gio_vao: string
          hoat_dong?: boolean
          id?: string
          ma: string
          nghi_phut?: number
          ten: string
        }
        Update: {
          dung_sai_phut?: number
          gio_chuan?: number
          gio_ra?: string
          gio_vao?: string
          hoat_dong?: boolean
          id?: string
          ma?: string
          nghi_phut?: number
          ten?: string
        }
        Relationships: []
      }
      cau_hinh: {
        Row: {
          ghi_chu: string | null
          gia_tri: string
          khoa: string
        }
        Insert: {
          ghi_chu?: string | null
          gia_tri: string
          khoa: string
        }
        Update: {
          ghi_chu?: string | null
          gia_tri?: string
          khoa?: string
        }
        Relationships: []
      }
      cham_cong: {
        Row: {
          ca_id: string | null
          cap_nhat_luc: string
          cong: number
          ghi_chu: string | null
          id: string
          loi: string | null
          ngay: string
          nguoi_id: string | null
          nhan_vien_id: string
          nhap_dot: string | null
          phuong_thuc: string
          ra: string | null
          tao_luc: string
          tre_phut: number
          vao: string | null
          ve_som_phut: number
        }
        Insert: {
          ca_id?: string | null
          cap_nhat_luc?: string
          cong?: number
          ghi_chu?: string | null
          id?: string
          loi?: string | null
          ngay: string
          nguoi_id?: string | null
          nhan_vien_id: string
          nhap_dot?: string | null
          phuong_thuc?: string
          ra?: string | null
          tao_luc?: string
          tre_phut?: number
          vao?: string | null
          ve_som_phut?: number
        }
        Update: {
          ca_id?: string | null
          cap_nhat_luc?: string
          cong?: number
          ghi_chu?: string | null
          id?: string
          loi?: string | null
          ngay?: string
          nguoi_id?: string | null
          nhan_vien_id?: string
          nhap_dot?: string | null
          phuong_thuc?: string
          ra?: string | null
          tao_luc?: string
          tre_phut?: number
          vao?: string | null
          ve_som_phut?: number
        }
        Relationships: [
          {
            foreignKeyName: "cham_cong_ca_id_fkey"
            columns: ["ca_id"]
            isOneToOne: false
            referencedRelation: "ca_lam"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cham_cong_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cham_cong_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cham_cong_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      cham_soc_cuoc_goi: {
        Row: {
          chi_nhanh_id: string | null
          chi_tiet: string | null
          id: string
          khach_id: string
          khong_can_goi_lai: boolean
          loai: string
          ngay_goc: string
          ngay_goi_lai: string | null
          nguoi_id: string | null
          noi_dung: string | null
          tao_luc: string
          trang_thai: string
        }
        Insert: {
          chi_nhanh_id?: string | null
          chi_tiet?: string | null
          id?: string
          khach_id: string
          khong_can_goi_lai?: boolean
          loai: string
          ngay_goc: string
          ngay_goi_lai?: string | null
          nguoi_id?: string | null
          noi_dung?: string | null
          tao_luc?: string
          trang_thai: string
        }
        Update: {
          chi_nhanh_id?: string | null
          chi_tiet?: string | null
          id?: string
          khach_id?: string
          khong_can_goi_lai?: boolean
          loai?: string
          ngay_goc?: string
          ngay_goi_lai?: string | null
          nguoi_id?: string | null
          noi_dung?: string | null
          tao_luc?: string
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "cham_soc_cuoc_goi_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cham_soc_cuoc_goi_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cham_soc_cuoc_goi_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cham_soc_cuoc_goi_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_cuoc: {
        Row: {
          id: string
          nhan_vien_id: string
          tao_luc: string
        }
        Insert: {
          id?: string
          nhan_vien_id: string
          tao_luc?: string
        }
        Update: {
          id?: string
          nhan_vien_id?: string
          tao_luc?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_cuoc_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: true
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_nhip: {
        Row: {
          id: number
          luc: string
        }
        Insert: {
          id: number
          luc?: string
        }
        Update: {
          id?: number
          luc?: string
        }
        Relationships: []
      }
      chat_tin: {
        Row: {
          cuoc_id: string
          da_duyet_luc: string | null
          han_thong_hanh: string | null
          hoi_tin_id: string | null
          id: string
          loai: string
          nhan_vien_id: string
          nhanh_sua: string | null
          noi_dung: string
          tao_luc: string
          tep_duong_dan: string | null
          tep_ten: string | null
          thong_hanh: string | null
          trang_thai: string
          vai: string
          vai_tro_chup: string | null
          xong_luc: string | null
        }
        Insert: {
          cuoc_id: string
          da_duyet_luc?: string | null
          han_thong_hanh?: string | null
          hoi_tin_id?: string | null
          id?: string
          loai?: string
          nhan_vien_id: string
          nhanh_sua?: string | null
          noi_dung: string
          tao_luc?: string
          tep_duong_dan?: string | null
          tep_ten?: string | null
          thong_hanh?: string | null
          trang_thai?: string
          vai: string
          vai_tro_chup?: string | null
          xong_luc?: string | null
        }
        Update: {
          cuoc_id?: string
          da_duyet_luc?: string | null
          han_thong_hanh?: string | null
          hoi_tin_id?: string | null
          id?: string
          loai?: string
          nhan_vien_id?: string
          nhanh_sua?: string | null
          noi_dung?: string
          tao_luc?: string
          tep_duong_dan?: string | null
          tep_ten?: string | null
          thong_hanh?: string | null
          trang_thai?: string
          vai?: string
          vai_tro_chup?: string | null
          xong_luc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_tin_cuoc_id_fkey"
            columns: ["cuoc_id"]
            isOneToOne: false
            referencedRelation: "chat_cuoc"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_tin_hoi_tin_id_fkey"
            columns: ["hoi_tin_id"]
            isOneToOne: false
            referencedRelation: "chat_tin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_tin_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      chi_nhanh: {
        Row: {
          dia_chi: string | null
          dien_thoai: string | null
          gio_lam_viec: Json | null
          hien_dat_lich: boolean
          hoat_dong: boolean
          id: string
          ma: string
          mo_ta: string | null
          phuong_quan: string | null
          tao_luc: string
          ten: string
          thanh_pho: string | null
          thu_tu: number
        }
        Insert: {
          dia_chi?: string | null
          dien_thoai?: string | null
          gio_lam_viec?: Json | null
          hien_dat_lich?: boolean
          hoat_dong?: boolean
          id?: string
          ma: string
          mo_ta?: string | null
          phuong_quan?: string | null
          tao_luc?: string
          ten: string
          thanh_pho?: string | null
          thu_tu?: number
        }
        Update: {
          dia_chi?: string | null
          dien_thoai?: string | null
          gio_lam_viec?: Json | null
          hien_dat_lich?: boolean
          hoat_dong?: boolean
          id?: string
          ma?: string
          mo_ta?: string | null
          phuong_quan?: string | null
          tao_luc?: string
          ten?: string
          thanh_pho?: string | null
          thu_tu?: number
        }
        Relationships: []
      }
      chi_phi_qc_ngay: {
        Row: {
          chi_phi: number
          chien_dich_id: string
          click: number
          hien_thi: number
          id: string
          lead_so: number
          ngay: string
          nguoi_id: string | null
          tao_luc: string
          tiep_can: number
          tin_nhan_moi: number
        }
        Insert: {
          chi_phi?: number
          chien_dich_id: string
          click?: number
          hien_thi?: number
          id?: string
          lead_so?: number
          ngay: string
          nguoi_id?: string | null
          tao_luc?: string
          tiep_can?: number
          tin_nhan_moi?: number
        }
        Update: {
          chi_phi?: number
          chien_dich_id?: string
          click?: number
          hien_thi?: number
          id?: string
          lead_so?: number
          ngay?: string
          nguoi_id?: string | null
          tao_luc?: string
          tiep_can?: number
          tin_nhan_moi?: number
        }
        Relationships: [
          {
            foreignKeyName: "chi_phi_qc_ngay_chien_dich_id_fkey"
            columns: ["chien_dich_id"]
            isOneToOne: false
            referencedRelation: "chien_dich"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chi_phi_qc_ngay_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      chien_dich: {
        Row: {
          bat_dau: string | null
          chi_nhanh_id: string | null
          ghi_chu: string | null
          id: string
          kenh: string | null
          ket_thuc: string | null
          ma: string
          muc_tieu: string
          ngan_sach: number
          nguoi_duyet_id: string | null
          nguon_id: string | null
          owner_id: string | null
          tao_luc: string
          ten: string
          trang_thai: string
        }
        Insert: {
          bat_dau?: string | null
          chi_nhanh_id?: string | null
          ghi_chu?: string | null
          id?: string
          kenh?: string | null
          ket_thuc?: string | null
          ma: string
          muc_tieu: string
          ngan_sach?: number
          nguoi_duyet_id?: string | null
          nguon_id?: string | null
          owner_id?: string | null
          tao_luc?: string
          ten: string
          trang_thai?: string
        }
        Update: {
          bat_dau?: string | null
          chi_nhanh_id?: string | null
          ghi_chu?: string | null
          id?: string
          kenh?: string | null
          ket_thuc?: string | null
          ma?: string
          muc_tieu?: string
          ngan_sach?: number
          nguoi_duyet_id?: string | null
          nguon_id?: string | null
          owner_id?: string | null
          tao_luc?: string
          ten?: string
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "chien_dich_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chien_dich_nguoi_duyet_id_fkey"
            columns: ["nguoi_duyet_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chien_dich_nguon_id_fkey"
            columns: ["nguon_id"]
            isOneToOne: false
            referencedRelation: "nguon_lead"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chien_dich_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      cho_lam: {
        Row: {
          chi_nhanh_id: string
          hoat_dong: boolean
          id: string
          tao_luc: string
          ten: string
          thu_tu: number
        }
        Insert: {
          chi_nhanh_id: string
          hoat_dong?: boolean
          id?: string
          tao_luc?: string
          ten: string
          thu_tu?: number
        }
        Update: {
          chi_nhanh_id?: string
          hoat_dong?: boolean
          id?: string
          tao_luc?: string
          ten?: string
          thu_tu?: number
        }
        Relationships: [
          {
            foreignKeyName: "cho_lam_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
        ]
      }
      chuc_danh_dm: {
        Row: {
          hoat_dong: boolean
          id: string
          nhap_dot: string | null
          ten: string
          thu_tu: number
        }
        Insert: {
          hoat_dong?: boolean
          id?: string
          nhap_dot?: string | null
          ten: string
          thu_tu?: number
        }
        Update: {
          hoat_dong?: boolean
          id?: string
          nhap_dot?: string | null
          ten?: string
          thu_tu?: number
        }
        Relationships: [
          {
            foreignKeyName: "chuc_danh_dm_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      cong_no_khach_xu_ly: {
        Row: {
          cap_nhat_luc: string
          ghi_chu: string | null
          hen_tra: string | null
          hoa_don_id: string
          nguoi_id: string
          nguoi_phu_trach_id: string | null
          trang_thai: string
        }
        Insert: {
          cap_nhat_luc?: string
          ghi_chu?: string | null
          hen_tra?: string | null
          hoa_don_id: string
          nguoi_id: string
          nguoi_phu_trach_id?: string | null
          trang_thai: string
        }
        Update: {
          cap_nhat_luc?: string
          ghi_chu?: string | null
          hen_tra?: string | null
          hoa_don_id?: string
          nguoi_id?: string
          nguoi_phu_trach_id?: string | null
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "cong_no_khach_xu_ly_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: true
            referencedRelation: "hoa_don"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cong_no_khach_xu_ly_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: true
            referencedRelation: "v_doanh_so_dong"
            referencedColumns: ["hoa_don_id"]
          },
          {
            foreignKeyName: "cong_no_khach_xu_ly_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: true
            referencedRelation: "v_hd_doanh_thu"
            referencedColumns: ["hoa_don_id"]
          },
          {
            foreignKeyName: "cong_no_khach_xu_ly_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cong_no_khach_xu_ly_nguoi_phu_trach_id_fkey"
            columns: ["nguoi_phu_trach_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      cong_viec: {
        Row: {
          danh_gia: string
          danh_gia_boi: string | null
          danh_gia_ghi_chu: string | null
          danh_gia_luc: string | null
          han: string | null
          han_gio: string | null
          hoan_thanh_luc: string | null
          id: string
          ket_luc: string | null
          ket_ly_do: string | null
          ket_nguoi_id: string | null
          ket_qua: string | null
          mo_ta: string | null
          nguoi_giao_id: string
          nguoi_nhan_id: string
          san_pham: string | null
          tao_luc: string
          tc_do_duoc: boolean
          tc_dung_duoc: boolean
          tc_lam_duoc: boolean
          tc_thay_duoc: boolean
          tieu_chi_xong: string | null
          tieu_de: string
          trang_thai: string
          uu_tien: string
        }
        Insert: {
          danh_gia?: string
          danh_gia_boi?: string | null
          danh_gia_ghi_chu?: string | null
          danh_gia_luc?: string | null
          han?: string | null
          han_gio?: string | null
          hoan_thanh_luc?: string | null
          id?: string
          ket_luc?: string | null
          ket_ly_do?: string | null
          ket_nguoi_id?: string | null
          ket_qua?: string | null
          mo_ta?: string | null
          nguoi_giao_id: string
          nguoi_nhan_id: string
          san_pham?: string | null
          tao_luc?: string
          tc_do_duoc?: boolean
          tc_dung_duoc?: boolean
          tc_lam_duoc?: boolean
          tc_thay_duoc?: boolean
          tieu_chi_xong?: string | null
          tieu_de: string
          trang_thai?: string
          uu_tien?: string
        }
        Update: {
          danh_gia?: string
          danh_gia_boi?: string | null
          danh_gia_ghi_chu?: string | null
          danh_gia_luc?: string | null
          han?: string | null
          han_gio?: string | null
          hoan_thanh_luc?: string | null
          id?: string
          ket_luc?: string | null
          ket_ly_do?: string | null
          ket_nguoi_id?: string | null
          ket_qua?: string | null
          mo_ta?: string | null
          nguoi_giao_id?: string
          nguoi_nhan_id?: string
          san_pham?: string | null
          tao_luc?: string
          tc_do_duoc?: boolean
          tc_dung_duoc?: boolean
          tc_lam_duoc?: boolean
          tc_thay_duoc?: boolean
          tieu_chi_xong?: string | null
          tieu_de?: string
          trang_thai?: string
          uu_tien?: string
        }
        Relationships: [
          {
            foreignKeyName: "cong_viec_nguoi_giao_id_fkey"
            columns: ["nguoi_giao_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cong_viec_nguoi_nhan_id_fkey"
            columns: ["nguoi_nhan_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_anh: {
        Row: {
          da_rut: boolean
          ghi_chu: string | null
          hieu_luc_den: string | null
          id: string
          khach_id: string
          loai: string
          ngay_ky: string
          nguoi_id: string
          pham_vi_kenh: string | null
          rut_luc: string | null
          tao_luc: string
          van_ban_id: string | null
        }
        Insert: {
          da_rut?: boolean
          ghi_chu?: string | null
          hieu_luc_den?: string | null
          id?: string
          khach_id: string
          loai: string
          ngay_ky: string
          nguoi_id: string
          pham_vi_kenh?: string | null
          rut_luc?: string | null
          tao_luc?: string
          van_ban_id?: string | null
        }
        Update: {
          da_rut?: boolean
          ghi_chu?: string | null
          hieu_luc_den?: string | null
          id?: string
          khach_id?: string
          loai?: string
          ngay_ky?: string
          nguoi_id?: string
          pham_vi_kenh?: string | null
          rut_luc?: string | null
          tao_luc?: string
          van_ban_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_anh_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_anh_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_anh_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_anh_van_ban_id_fkey"
            columns: ["van_ban_id"]
            isOneToOne: false
            referencedRelation: "van_ban"
            referencedColumns: ["id"]
          },
        ]
      }
      cua_hang: {
        Row: {
          cap_nhat_luc: string
          dia_chi: string | null
          dien_thoai: string | null
          email: string | null
          gio_lam_viec: Json
          id: number
          ma_so_thue: string | null
          ten_phap_nhan: string | null
          ten_thuong_hieu: string
          website: string | null
        }
        Insert: {
          cap_nhat_luc?: string
          dia_chi?: string | null
          dien_thoai?: string | null
          email?: string | null
          gio_lam_viec?: Json
          id?: number
          ma_so_thue?: string | null
          ten_phap_nhan?: string | null
          ten_thuong_hieu?: string
          website?: string | null
        }
        Update: {
          cap_nhat_luc?: string
          dia_chi?: string | null
          dien_thoai?: string | null
          email?: string | null
          gio_lam_viec?: Json
          id?: number
          ma_so_thue?: string | null
          ten_phap_nhan?: string | null
          ten_thuong_hieu?: string
          website?: string | null
        }
        Relationships: []
      }
      dang_ky_thong_bao: {
        Row: {
          auth: string
          endpoint: string
          gui_cuoi_luc: string | null
          id: string
          nhan_vien_id: string
          p256dh: string
          tao_luc: string
          thiet_bi: string | null
        }
        Insert: {
          auth: string
          endpoint: string
          gui_cuoi_luc?: string | null
          id?: string
          nhan_vien_id: string
          p256dh: string
          tao_luc?: string
          thiet_bi?: string | null
        }
        Update: {
          auth?: string
          endpoint?: string
          gui_cuoi_luc?: string | null
          id?: string
          nhan_vien_id?: string
          p256dh?: string
          tao_luc?: string
          thiet_bi?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dang_ky_thong_bao_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      dang_tin_kenh: {
        Row: {
          chi_phi: number
          ghi_chu: string | null
          id: string
          kenh: string
          link_bai: string | null
          ngay_dang: string
          tao_luc: string
          tin_id: string
          trang_thai: string
        }
        Insert: {
          chi_phi?: number
          ghi_chu?: string | null
          id?: string
          kenh: string
          link_bai?: string | null
          ngay_dang?: string
          tao_luc?: string
          tin_id: string
          trang_thai?: string
        }
        Update: {
          chi_phi?: number
          ghi_chu?: string | null
          id?: string
          kenh?: string
          link_bai?: string | null
          ngay_dang?: string
          tao_luc?: string
          tin_id?: string
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "dang_tin_kenh_tin_id_fkey"
            columns: ["tin_id"]
            isOneToOne: false
            referencedRelation: "tin_tuyen_dung"
            referencedColumns: ["id"]
          },
        ]
      }
      danh_gia_nhan_vien: {
        Row: {
          diem: number
          hoa_don_id: string
          id: string
          nguoi_ghi_id: string | null
          nhan_vien_id: string
          sua_luc: string | null
          tao_luc: string
          y_kien: string | null
        }
        Insert: {
          diem: number
          hoa_don_id: string
          id?: string
          nguoi_ghi_id?: string | null
          nhan_vien_id: string
          sua_luc?: string | null
          tao_luc?: string
          y_kien?: string | null
        }
        Update: {
          diem?: number
          hoa_don_id?: string
          id?: string
          nguoi_ghi_id?: string | null
          nhan_vien_id?: string
          sua_luc?: string | null
          tao_luc?: string
          y_kien?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "danh_gia_nhan_vien_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "hoa_don"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "danh_gia_nhan_vien_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "v_doanh_so_dong"
            referencedColumns: ["hoa_don_id"]
          },
          {
            foreignKeyName: "danh_gia_nhan_vien_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "v_hd_doanh_thu"
            referencedColumns: ["hoa_don_id"]
          },
          {
            foreignKeyName: "danh_gia_nhan_vien_nguoi_ghi_id_fkey"
            columns: ["nguoi_ghi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "danh_gia_nhan_vien_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      danh_gia_sau_dieu_tri: {
        Row: {
          chi_nhanh_id: string | null
          ghi_chu: string | null
          hoa_don_id: string | null
          id: string
          ket_qua: string
          khach_id: string
          khieu_nai_id: string | null
          lich_hen_id: string | null
          ly_do: string | null
          nguoi_ghi_id: string | null
          sua_luc: string | null
          tao_luc: string
        }
        Insert: {
          chi_nhanh_id?: string | null
          ghi_chu?: string | null
          hoa_don_id?: string | null
          id?: string
          ket_qua: string
          khach_id: string
          khieu_nai_id?: string | null
          lich_hen_id?: string | null
          ly_do?: string | null
          nguoi_ghi_id?: string | null
          sua_luc?: string | null
          tao_luc?: string
        }
        Update: {
          chi_nhanh_id?: string | null
          ghi_chu?: string | null
          hoa_don_id?: string | null
          id?: string
          ket_qua?: string
          khach_id?: string
          khieu_nai_id?: string | null
          lich_hen_id?: string | null
          ly_do?: string | null
          nguoi_ghi_id?: string | null
          sua_luc?: string | null
          tao_luc?: string
        }
        Relationships: [
          {
            foreignKeyName: "danh_gia_sau_dieu_tri_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "danh_gia_sau_dieu_tri_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "hoa_don"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "danh_gia_sau_dieu_tri_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "v_doanh_so_dong"
            referencedColumns: ["hoa_don_id"]
          },
          {
            foreignKeyName: "danh_gia_sau_dieu_tri_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "v_hd_doanh_thu"
            referencedColumns: ["hoa_don_id"]
          },
          {
            foreignKeyName: "danh_gia_sau_dieu_tri_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "danh_gia_sau_dieu_tri_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "danh_gia_sau_dieu_tri_khieu_nai_id_fkey"
            columns: ["khieu_nai_id"]
            isOneToOne: false
            referencedRelation: "khieu_nai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "danh_gia_sau_dieu_tri_lich_hen_id_fkey"
            columns: ["lich_hen_id"]
            isOneToOne: false
            referencedRelation: "lich_hen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "danh_gia_sau_dieu_tri_nguoi_ghi_id_fkey"
            columns: ["nguoi_ghi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      de_xuat: {
        Row: {
          chi_nhanh_id: string
          de_xuat_goc_id: string | null
          doi_tuong: string | null
          don_mua_id: string | null
          duyet_luc: string | null
          han_duyet: string | null
          id: string
          ky_luong_tru_id: string | null
          loai: string
          loai_tam_ung: string | null
          ly_do: string | null
          ly_do_hoan: string | null
          ma: string
          ngay_can_chi: string | null
          nguoi_duyet_id: string | null
          nguoi_gui_id: string
          noi_dung: string | null
          so_quy_id: string | null
          so_tien: number | null
          tao_luc: string
          tieu_de: string
          trang_thai: string
        }
        Insert: {
          chi_nhanh_id: string
          de_xuat_goc_id?: string | null
          doi_tuong?: string | null
          don_mua_id?: string | null
          duyet_luc?: string | null
          han_duyet?: string | null
          id?: string
          ky_luong_tru_id?: string | null
          loai: string
          loai_tam_ung?: string | null
          ly_do?: string | null
          ly_do_hoan?: string | null
          ma: string
          ngay_can_chi?: string | null
          nguoi_duyet_id?: string | null
          nguoi_gui_id: string
          noi_dung?: string | null
          so_quy_id?: string | null
          so_tien?: number | null
          tao_luc?: string
          tieu_de: string
          trang_thai?: string
        }
        Update: {
          chi_nhanh_id?: string
          de_xuat_goc_id?: string | null
          doi_tuong?: string | null
          don_mua_id?: string | null
          duyet_luc?: string | null
          han_duyet?: string | null
          id?: string
          ky_luong_tru_id?: string | null
          loai?: string
          loai_tam_ung?: string | null
          ly_do?: string | null
          ly_do_hoan?: string | null
          ma?: string
          ngay_can_chi?: string | null
          nguoi_duyet_id?: string | null
          nguoi_gui_id?: string
          noi_dung?: string | null
          so_quy_id?: string | null
          so_tien?: number | null
          tao_luc?: string
          tieu_de?: string
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "de_xuat_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "de_xuat_de_xuat_goc_id_fkey"
            columns: ["de_xuat_goc_id"]
            isOneToOne: false
            referencedRelation: "de_xuat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "de_xuat_don_mua_id_fkey"
            columns: ["don_mua_id"]
            isOneToOne: false
            referencedRelation: "don_mua"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "de_xuat_ky_luong_tru_fk"
            columns: ["ky_luong_tru_id"]
            isOneToOne: false
            referencedRelation: "ky_luong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "de_xuat_nguoi_duyet_id_fkey"
            columns: ["nguoi_duyet_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "de_xuat_nguoi_gui_id_fkey"
            columns: ["nguoi_gui_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "de_xuat_so_quy_id_fkey"
            columns: ["so_quy_id"]
            isOneToOne: false
            referencedRelation: "so_quy"
            referencedColumns: ["id"]
          },
        ]
      }
      dem_ma: {
        Row: {
          khoa: string
          so: number
        }
        Insert: {
          khoa: string
          so?: number
        }
        Update: {
          khoa?: string
          so?: number
        }
        Relationships: []
      }
      dich_vu: {
        Row: {
          dat_online: boolean
          don_vi_tinh: string
          gia: number
          gia_von: number
          hoat_dong: boolean
          id: string
          ma: string
          nhom_id: string
          sh_id: number | null
          tao_luc: string
          ten: string
          thoi_luong_phut: number
          vat_pct: number
        }
        Insert: {
          dat_online?: boolean
          don_vi_tinh?: string
          gia?: number
          gia_von?: number
          hoat_dong?: boolean
          id?: string
          ma: string
          nhom_id: string
          sh_id?: number | null
          tao_luc?: string
          ten: string
          thoi_luong_phut?: number
          vat_pct?: number
        }
        Update: {
          dat_online?: boolean
          don_vi_tinh?: string
          gia?: number
          gia_von?: number
          hoat_dong?: boolean
          id?: string
          ma?: string
          nhom_id?: string
          sh_id?: number | null
          tao_luc?: string
          ten?: string
          thoi_luong_phut?: number
          vat_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "dich_vu_nhom_id_fkey"
            columns: ["nhom_id"]
            isOneToOne: false
            referencedRelation: "dich_vu_nhom"
            referencedColumns: ["id"]
          },
        ]
      }
      dich_vu_nhom: {
        Row: {
          id: string
          kieu_bao_hanh: string
          ten: string
          thu_tu: number
        }
        Insert: {
          id?: string
          kieu_bao_hanh?: string
          ten: string
          thu_tu?: number
        }
        Update: {
          id?: string
          kieu_bao_hanh?: string
          ten?: string
          thu_tu?: number
        }
        Relationships: []
      }
      dieu_chinh_phep: {
        Row: {
          id: string
          ly_do: string
          nam: number
          nguoi_id: string
          nhan_vien_id: string
          nhap_dot: string | null
          so_ngay: number
          tao_luc: string
        }
        Insert: {
          id?: string
          ly_do: string
          nam: number
          nguoi_id: string
          nhan_vien_id: string
          nhap_dot?: string | null
          so_ngay: number
          tao_luc?: string
        }
        Update: {
          id?: string
          ly_do?: string
          nam?: number
          nguoi_id?: string
          nhan_vien_id?: string
          nhap_dot?: string | null
          so_ngay?: number
          tao_luc?: string
        }
        Relationships: [
          {
            foreignKeyName: "dieu_chinh_phep_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dieu_chinh_phep_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dieu_chinh_phep_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      dieu_kien_luong: {
        Row: {
          an_ca_ngay: number
          cam_ket_08: boolean | null
          chuc_danh: string | null
          dong_bh: boolean
          dong_phuc_cap: number
          ghi_chu: string | null
          he_so_luong: number | null
          hieu_luc_tu: string
          id: string
          khung_lam_viec: string | null
          loai_thay_doi: string | null
          luong_co_ban: number
          luong_dong_bh: number
          luong_thoa_thuan: number | null
          ngay_thong_bao_review: string | null
          nguoi_id: string | null
          nha_o_cap: number
          nhan_vien_id: string
          nhap_dot: string | null
          phong_ban_id: string | null
          phu_cap_khac: number | null
          phu_cap_truc_ca: number | null
          quy_nhan_vien: number | null
          so_npt: number
          so_quyet_dinh: string | null
          tao_luc: string
          thu_nhap_chuc_danh: number | null
          thuong_hieu_qua: number | null
          tinh_trang: string
          ty_le_thu_viec: number
          vi_tri: string | null
        }
        Insert: {
          an_ca_ngay?: number
          cam_ket_08?: boolean | null
          chuc_danh?: string | null
          dong_bh?: boolean
          dong_phuc_cap?: number
          ghi_chu?: string | null
          he_so_luong?: number | null
          hieu_luc_tu: string
          id?: string
          khung_lam_viec?: string | null
          loai_thay_doi?: string | null
          luong_co_ban?: number
          luong_dong_bh?: number
          luong_thoa_thuan?: number | null
          ngay_thong_bao_review?: string | null
          nguoi_id?: string | null
          nha_o_cap?: number
          nhan_vien_id: string
          nhap_dot?: string | null
          phong_ban_id?: string | null
          phu_cap_khac?: number | null
          phu_cap_truc_ca?: number | null
          quy_nhan_vien?: number | null
          so_npt?: number
          so_quyet_dinh?: string | null
          tao_luc?: string
          thu_nhap_chuc_danh?: number | null
          thuong_hieu_qua?: number | null
          tinh_trang?: string
          ty_le_thu_viec?: number
          vi_tri?: string | null
        }
        Update: {
          an_ca_ngay?: number
          cam_ket_08?: boolean | null
          chuc_danh?: string | null
          dong_bh?: boolean
          dong_phuc_cap?: number
          ghi_chu?: string | null
          he_so_luong?: number | null
          hieu_luc_tu?: string
          id?: string
          khung_lam_viec?: string | null
          loai_thay_doi?: string | null
          luong_co_ban?: number
          luong_dong_bh?: number
          luong_thoa_thuan?: number | null
          ngay_thong_bao_review?: string | null
          nguoi_id?: string | null
          nha_o_cap?: number
          nhan_vien_id?: string
          nhap_dot?: string | null
          phong_ban_id?: string | null
          phu_cap_khac?: number | null
          phu_cap_truc_ca?: number | null
          quy_nhan_vien?: number | null
          so_npt?: number
          so_quyet_dinh?: string | null
          tao_luc?: string
          thu_nhap_chuc_danh?: number | null
          thuong_hieu_qua?: number | null
          tinh_trang?: string
          ty_le_thu_viec?: number
          vi_tri?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dieu_kien_luong_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dieu_kien_luong_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dieu_kien_luong_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
          {
            foreignKeyName: "dieu_kien_luong_phong_ban_id_fkey"
            columns: ["phong_ban_id"]
            isOneToOne: false
            referencedRelation: "phong_ban"
            referencedColumns: ["id"]
          },
        ]
      }
      dinh_muc: {
        Row: {
          chon_theo_chi_dinh: boolean
          dich_vu_id: string
          ghi_chu: string | null
          id: string
          san_pham_id: string
          so_luong: number
        }
        Insert: {
          chon_theo_chi_dinh?: boolean
          dich_vu_id: string
          ghi_chu?: string | null
          id?: string
          san_pham_id: string
          so_luong: number
        }
        Update: {
          chon_theo_chi_dinh?: boolean
          dich_vu_id?: string
          ghi_chu?: string | null
          id?: string
          san_pham_id?: string
          so_luong?: number
        }
        Relationships: [
          {
            foreignKeyName: "dinh_muc_dich_vu_id_fkey"
            columns: ["dich_vu_id"]
            isOneToOne: false
            referencedRelation: "dich_vu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dinh_muc_san_pham_id_fkey"
            columns: ["san_pham_id"]
            isOneToOne: false
            referencedRelation: "san_pham"
            referencedColumns: ["id"]
          },
        ]
      }
      doi_tac_gt: {
        Row: {
          dien_thoai: string | null
          ghi_chu: string | null
          hoat_dong: boolean
          id: string
          loai: string
          ma: string
          ma_gioi_thieu: string
          tao_luc: string
          ten: string
        }
        Insert: {
          dien_thoai?: string | null
          ghi_chu?: string | null
          hoat_dong?: boolean
          id?: string
          loai?: string
          ma: string
          ma_gioi_thieu: string
          tao_luc?: string
          ten: string
        }
        Update: {
          dien_thoai?: string | null
          ghi_chu?: string | null
          hoat_dong?: boolean
          id?: string
          loai?: string
          ma?: string
          ma_gioi_thieu?: string
          tao_luc?: string
          ten?: string
        }
        Relationships: []
      }
      don_mua: {
        Row: {
          chi_nhanh_id: string
          duyet_luc: string | null
          ghi_chu: string | null
          id: string
          ly_do: string | null
          ly_do_ngoai_le_bao_gia: string | null
          ma: string
          ncc_id: string
          ngay_dat: string
          ngay_du_kien: string | null
          nguoi_duyet_id: string | null
          nguoi_tao_id: string
          tao_luc: string
          trang_thai: string
        }
        Insert: {
          chi_nhanh_id: string
          duyet_luc?: string | null
          ghi_chu?: string | null
          id?: string
          ly_do?: string | null
          ly_do_ngoai_le_bao_gia?: string | null
          ma: string
          ncc_id: string
          ngay_dat?: string
          ngay_du_kien?: string | null
          nguoi_duyet_id?: string | null
          nguoi_tao_id: string
          tao_luc?: string
          trang_thai?: string
        }
        Update: {
          chi_nhanh_id?: string
          duyet_luc?: string | null
          ghi_chu?: string | null
          id?: string
          ly_do?: string | null
          ly_do_ngoai_le_bao_gia?: string | null
          ma?: string
          ncc_id?: string
          ngay_dat?: string
          ngay_du_kien?: string | null
          nguoi_duyet_id?: string | null
          nguoi_tao_id?: string
          tao_luc?: string
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "don_mua_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "don_mua_ncc_id_fkey"
            columns: ["ncc_id"]
            isOneToOne: false
            referencedRelation: "nha_cung_cap"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "don_mua_ncc_id_fkey"
            columns: ["ncc_id"]
            isOneToOne: false
            referencedRelation: "v_cong_no_ncc"
            referencedColumns: ["ncc_id"]
          },
          {
            foreignKeyName: "don_mua_nguoi_duyet_id_fkey"
            columns: ["nguoi_duyet_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "don_mua_nguoi_tao_id_fkey"
            columns: ["nguoi_tao_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      don_mua_dong: {
        Row: {
          da_nhan: number
          don_gia: number
          don_mua_id: string
          id: string
          san_pham_id: string
          so_luong: number
        }
        Insert: {
          da_nhan?: number
          don_gia?: number
          don_mua_id: string
          id?: string
          san_pham_id: string
          so_luong: number
        }
        Update: {
          da_nhan?: number
          don_gia?: number
          don_mua_id?: string
          id?: string
          san_pham_id?: string
          so_luong?: number
        }
        Relationships: [
          {
            foreignKeyName: "don_mua_dong_don_mua_id_fkey"
            columns: ["don_mua_id"]
            isOneToOne: false
            referencedRelation: "don_mua"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "don_mua_dong_san_pham_id_fkey"
            columns: ["san_pham_id"]
            isOneToOne: false
            referencedRelation: "san_pham"
            referencedColumns: ["id"]
          },
        ]
      }
      dong_hoa_hong_goc: {
        Row: {
          dong_id: string
          gia_tri: number
          id: number
          kieu: string | null
          nhan_vien_id: string | null
          nhap_dot: string | null
          phan_tram: number | null
          sh_nhan_vien_id: number | null
          ten_nguoi: string | null
          vai: string
          vi_tri: number
        }
        Insert: {
          dong_id: string
          gia_tri?: number
          id?: never
          kieu?: string | null
          nhan_vien_id?: string | null
          nhap_dot?: string | null
          phan_tram?: number | null
          sh_nhan_vien_id?: number | null
          ten_nguoi?: string | null
          vai: string
          vi_tri?: number
        }
        Update: {
          dong_id?: string
          gia_tri?: number
          id?: never
          kieu?: string | null
          nhan_vien_id?: string | null
          nhap_dot?: string | null
          phan_tram?: number | null
          sh_nhan_vien_id?: number | null
          ten_nguoi?: string | null
          vai?: string
          vi_tri?: number
        }
        Relationships: [
          {
            foreignKeyName: "dong_hoa_hong_goc_dong_id_fkey"
            columns: ["dong_id"]
            isOneToOne: false
            referencedRelation: "hoa_don_dong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dong_hoa_hong_goc_dong_id_fkey"
            columns: ["dong_id"]
            isOneToOne: false
            referencedRelation: "v_doanh_so_dong"
            referencedColumns: ["dong_id"]
          },
          {
            foreignKeyName: "dong_hoa_hong_goc_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dong_hoa_hong_goc_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      dong_nhan_vien: {
        Row: {
          dong_id: string
          nhan_vien_id: string
          nhap_dot: string | null
          ti_le: number
          vai: string
        }
        Insert: {
          dong_id: string
          nhan_vien_id: string
          nhap_dot?: string | null
          ti_le: number
          vai: string
        }
        Update: {
          dong_id?: string
          nhan_vien_id?: string
          nhap_dot?: string | null
          ti_le?: number
          vai?: string
        }
        Relationships: [
          {
            foreignKeyName: "dong_nhan_vien_dong_id_fkey"
            columns: ["dong_id"]
            isOneToOne: false
            referencedRelation: "hoa_don_dong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dong_nhan_vien_dong_id_fkey"
            columns: ["dong_id"]
            isOneToOne: false
            referencedRelation: "v_doanh_so_dong"
            referencedColumns: ["dong_id"]
          },
          {
            foreignKeyName: "dong_nhan_vien_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dong_nhan_vien_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      goi_the: {
        Row: {
          gia: number
          gia_tri_the: number | null
          han_dung_ngay: number | null
          hoat_dong: boolean
          id: string
          khoang_cach_ngay: number | null
          loai: string
          ma: string
          sh_id: number | null
          so_buoi: number | null
          tao_luc: string
          ten: string
        }
        Insert: {
          gia: number
          gia_tri_the?: number | null
          han_dung_ngay?: number | null
          hoat_dong?: boolean
          id?: string
          khoang_cach_ngay?: number | null
          loai: string
          ma: string
          sh_id?: number | null
          so_buoi?: number | null
          tao_luc?: string
          ten: string
        }
        Update: {
          gia?: number
          gia_tri_the?: number | null
          han_dung_ngay?: number | null
          hoat_dong?: boolean
          id?: string
          khoang_cach_ngay?: number | null
          loai?: string
          ma?: string
          sh_id?: number | null
          so_buoi?: number | null
          tao_luc?: string
          ten?: string
        }
        Relationships: []
      }
      goi_the_dich_vu: {
        Row: {
          dich_vu_id: string
          goi_id: string
          la_tang: boolean
        }
        Insert: {
          dich_vu_id: string
          goi_id: string
          la_tang?: boolean
        }
        Update: {
          dich_vu_id?: string
          goi_id?: string
          la_tang?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "goi_the_dich_vu_dich_vu_id_fkey"
            columns: ["dich_vu_id"]
            isOneToOne: false
            referencedRelation: "dich_vu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goi_the_dich_vu_goi_id_fkey"
            columns: ["goi_id"]
            isOneToOne: false
            referencedRelation: "goi_the"
            referencedColumns: ["id"]
          },
        ]
      }
      hang_diem_cau_hinh: {
        Row: {
          cap_nhat_boi: string | null
          cap_nhat_luc: string
          hang: string
          tien_doi_moi_diem: number
          tien_moi_diem: number
        }
        Insert: {
          cap_nhat_boi?: string | null
          cap_nhat_luc?: string
          hang: string
          tien_doi_moi_diem: number
          tien_moi_diem: number
        }
        Update: {
          cap_nhat_boi?: string | null
          cap_nhat_luc?: string
          hang?: string
          tien_doi_moi_diem?: number
          tien_moi_diem?: number
        }
        Relationships: [
          {
            foreignKeyName: "hang_diem_cau_hinh_cap_nhat_boi_fkey"
            columns: ["cap_nhat_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hang_diem_cau_hinh_hang_fkey"
            columns: ["hang"]
            isOneToOne: true
            referencedRelation: "hang_khach"
            referencedColumns: ["ten"]
          },
        ]
      }
      hang_khach: {
        Row: {
          ten: string
          thu_tu: number
          tu_so_tien: number
        }
        Insert: {
          ten: string
          thu_tu: number
          tu_so_tien: number
        }
        Update: {
          ten?: string
          thu_tu?: number
          tu_so_tien?: number
        }
        Relationships: []
      }
      hd_lao_dong: {
        Row: {
          den_ngay: string | null
          ghi_chu: string | null
          giai_doan: string
          id: string
          link_ban_dien_tu: string | null
          nguoi_id: string
          nhan_vien_id: string
          nhap_dot: string | null
          so_hd: string | null
          tao_luc: string
          tu_ngay: string
        }
        Insert: {
          den_ngay?: string | null
          ghi_chu?: string | null
          giai_doan: string
          id?: string
          link_ban_dien_tu?: string | null
          nguoi_id: string
          nhan_vien_id: string
          nhap_dot?: string | null
          so_hd?: string | null
          tao_luc?: string
          tu_ngay: string
        }
        Update: {
          den_ngay?: string | null
          ghi_chu?: string | null
          giai_doan?: string
          id?: string
          link_ban_dien_tu?: string | null
          nguoi_id?: string
          nhan_vien_id?: string
          nhap_dot?: string | null
          so_hd?: string | null
          tao_luc?: string
          tu_ngay?: string
        }
        Relationships: [
          {
            foreignKeyName: "hd_lao_dong_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hd_lao_dong_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hd_lao_dong_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      hoa_don: {
        Row: {
          chi_nhanh_id: string
          chot_luc: string | null
          con_no: number
          da_thu: number
          ghi_chu: string | null
          giam_diem: number
          giam_gia_don: number
          giam_voucher: number
          huy_luc: string | null
          id: string
          khach_id: string | null
          la_lich_su: boolean
          la_so_du_dau: boolean
          lich_hen_id: string | null
          ly_do_huy: string | null
          ma: string
          ngay_hd: string
          nguoi_gioi_thieu_id: string | null
          nguoi_lap_id: string
          nhap_dot: string | null
          phu_phi: number
          sh_id: number | null
          sh_ma: string | null
          sh_trang_thai: string | null
          tao_luc: string
          thu_ngan_sh_id: number | null
          thu_ngan_ten: string | null
          tien_tru_the: number
          tip: number
          tong_hang: number
          tong_phai_thu: number
          trang_thai: string
          vat_hd_ky_hieu: string | null
          vat_hd_luc: string | null
          vat_hd_mau_so: string | null
          vat_hd_ngay: string | null
          vat_hd_nguoi_id: string | null
          vat_hd_so: string | null
          vat_hd_tra_cuu: string | null
          vat_pct: number
          vat_tien: number
          gio_ra: string | null
          gio_vao: string | null
          so_khach: number
        }
        Insert: {
          chi_nhanh_id: string
          chot_luc?: string | null
          con_no?: number
          da_thu?: number
          ghi_chu?: string | null
          giam_diem?: number
          giam_gia_don?: number
          giam_voucher?: number
          huy_luc?: string | null
          id?: string
          khach_id?: string | null
          la_lich_su?: boolean
          la_so_du_dau?: boolean
          lich_hen_id?: string | null
          ly_do_huy?: string | null
          ma: string
          ngay_hd?: string
          nguoi_gioi_thieu_id?: string | null
          nguoi_lap_id: string
          nhap_dot?: string | null
          phu_phi?: number
          sh_id?: number | null
          sh_ma?: string | null
          sh_trang_thai?: string | null
          tao_luc?: string
          thu_ngan_sh_id?: number | null
          thu_ngan_ten?: string | null
          tien_tru_the?: number
          tip?: number
          tong_hang?: number
          tong_phai_thu?: number
          trang_thai?: string
          vat_hd_ky_hieu?: string | null
          vat_hd_luc?: string | null
          vat_hd_mau_so?: string | null
          vat_hd_ngay?: string | null
          vat_hd_nguoi_id?: string | null
          vat_hd_so?: string | null
          vat_hd_tra_cuu?: string | null
          vat_pct?: number
          vat_tien?: number
          gio_ra?: string | null
          gio_vao?: string | null
          so_khach?: number
        }
        Update: {
          chi_nhanh_id?: string
          chot_luc?: string | null
          con_no?: number
          da_thu?: number
          ghi_chu?: string | null
          giam_diem?: number
          giam_gia_don?: number
          giam_voucher?: number
          huy_luc?: string | null
          id?: string
          khach_id?: string | null
          la_lich_su?: boolean
          la_so_du_dau?: boolean
          lich_hen_id?: string | null
          ly_do_huy?: string | null
          ma?: string
          ngay_hd?: string
          nguoi_gioi_thieu_id?: string | null
          nguoi_lap_id?: string
          nhap_dot?: string | null
          phu_phi?: number
          sh_id?: number | null
          sh_ma?: string | null
          sh_trang_thai?: string | null
          tao_luc?: string
          thu_ngan_sh_id?: number | null
          thu_ngan_ten?: string | null
          tien_tru_the?: number
          tip?: number
          tong_hang?: number
          tong_phai_thu?: number
          trang_thai?: string
          vat_hd_ky_hieu?: string | null
          vat_hd_luc?: string | null
          vat_hd_mau_so?: string | null
          vat_hd_ngay?: string | null
          vat_hd_nguoi_id?: string | null
          vat_hd_so?: string | null
          vat_hd_tra_cuu?: string | null
          vat_pct?: number
          vat_tien?: number
          gio_ra?: string | null
          gio_vao?: string | null
          so_khach?: number
        }
        Relationships: [
          {
            foreignKeyName: "hoa_don_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoa_don_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoa_don_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoa_don_lich_hen_id_fkey"
            columns: ["lich_hen_id"]
            isOneToOne: false
            referencedRelation: "lich_hen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoa_don_nguoi_gioi_thieu_id_fkey"
            columns: ["nguoi_gioi_thieu_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoa_don_nguoi_gioi_thieu_id_fkey"
            columns: ["nguoi_gioi_thieu_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoa_don_nguoi_lap_id_fkey"
            columns: ["nguoi_lap_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoa_don_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
          {
            foreignKeyName: "hoa_don_vat_hd_nguoi_id_fkey"
            columns: ["vat_hd_nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      hoa_don_dau_vao: {
        Row: {
          doi_chieu_boi: string | null
          doi_chieu_luc: string | null
          don_mua_id: string | null
          ghi_chu: string | null
          han_nhan: string | null
          id: string
          ky_hieu: string | null
          link_file: string | null
          ma: string
          muc_dich: string | null
          ncc_id: string
          ngay_hd: string | null
          nguoi_id: string
          so_hd: string | null
          tao_luc: string
          thue_gtgt: number
          tien_hang: number
          tong_tien: number | null
          trang_thai: string
        }
        Insert: {
          doi_chieu_boi?: string | null
          doi_chieu_luc?: string | null
          don_mua_id?: string | null
          ghi_chu?: string | null
          han_nhan?: string | null
          id?: string
          ky_hieu?: string | null
          link_file?: string | null
          ma: string
          muc_dich?: string | null
          ncc_id: string
          ngay_hd?: string | null
          nguoi_id: string
          so_hd?: string | null
          tao_luc?: string
          thue_gtgt?: number
          tien_hang: number
          tong_tien?: number | null
          trang_thai?: string
        }
        Update: {
          doi_chieu_boi?: string | null
          doi_chieu_luc?: string | null
          don_mua_id?: string | null
          ghi_chu?: string | null
          han_nhan?: string | null
          id?: string
          ky_hieu?: string | null
          link_file?: string | null
          ma?: string
          muc_dich?: string | null
          ncc_id?: string
          ngay_hd?: string | null
          nguoi_id?: string
          so_hd?: string | null
          tao_luc?: string
          thue_gtgt?: number
          tien_hang?: number
          tong_tien?: number | null
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "hoa_don_dau_vao_doi_chieu_boi_fkey"
            columns: ["doi_chieu_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoa_don_dau_vao_don_mua_id_fkey"
            columns: ["don_mua_id"]
            isOneToOne: false
            referencedRelation: "don_mua"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoa_don_dau_vao_ncc_id_fkey"
            columns: ["ncc_id"]
            isOneToOne: false
            referencedRelation: "nha_cung_cap"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoa_don_dau_vao_ncc_id_fkey"
            columns: ["ncc_id"]
            isOneToOne: false
            referencedRelation: "v_cong_no_ncc"
            referencedColumns: ["ncc_id"]
          },
          {
            foreignKeyName: "hoa_don_dau_vao_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      hoa_don_dong: {
        Row: {
          dich_vu_id: string | null
          don_gia: number
          giam_gia: number
          goi_id: string | null
          hoa_don_id: string
          id: string
          la_lich_su: boolean
          loai: string
          loai_goc: string | null
          nhap_dot: string | null
          san_pham_id: string | null
          sh_id: number | null
          so_luong: number
          tao_luc: string
          ten: string
          thanh_tien: number | null
          the_khach_sh_id: number | null
        }
        Insert: {
          dich_vu_id?: string | null
          don_gia: number
          giam_gia?: number
          goi_id?: string | null
          hoa_don_id: string
          id?: string
          la_lich_su?: boolean
          loai: string
          loai_goc?: string | null
          nhap_dot?: string | null
          san_pham_id?: string | null
          sh_id?: number | null
          so_luong?: number
          tao_luc?: string
          ten: string
          thanh_tien?: number | null
          the_khach_sh_id?: number | null
        }
        Update: {
          dich_vu_id?: string | null
          don_gia?: number
          giam_gia?: number
          goi_id?: string | null
          hoa_don_id?: string
          id?: string
          la_lich_su?: boolean
          loai?: string
          loai_goc?: string | null
          nhap_dot?: string | null
          san_pham_id?: string | null
          sh_id?: number | null
          so_luong?: number
          tao_luc?: string
          ten?: string
          thanh_tien?: number | null
          the_khach_sh_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hoa_don_dong_dich_vu_id_fkey"
            columns: ["dich_vu_id"]
            isOneToOne: false
            referencedRelation: "dich_vu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoa_don_dong_goi_id_fkey"
            columns: ["goi_id"]
            isOneToOne: false
            referencedRelation: "goi_the"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoa_don_dong_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "hoa_don"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoa_don_dong_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "v_doanh_so_dong"
            referencedColumns: ["hoa_don_id"]
          },
          {
            foreignKeyName: "hoa_don_dong_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "v_hd_doanh_thu"
            referencedColumns: ["hoa_don_id"]
          },
          {
            foreignKeyName: "hoa_don_dong_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
          {
            foreignKeyName: "hoa_don_dong_san_pham_id_fkey"
            columns: ["san_pham_id"]
            isOneToOne: false
            referencedRelation: "san_pham"
            referencedColumns: ["id"]
          },
        ]
      }
      hoa_hong_ti_le: {
        Row: {
          id: string
          loai: string
          muc_id: string | null
          nhan_vien_id: string | null
          nhom_chuc_danh: string | null
          so_tien: number | null
          ti_le: number
          vai: string
        }
        Insert: {
          id?: string
          loai: string
          muc_id?: string | null
          nhan_vien_id?: string | null
          nhom_chuc_danh?: string | null
          so_tien?: number | null
          ti_le: number
          vai: string
        }
        Update: {
          id?: string
          loai?: string
          muc_id?: string | null
          nhan_vien_id?: string | null
          nhom_chuc_danh?: string | null
          so_tien?: number | null
          ti_le?: number
          vai?: string
        }
        Relationships: [
          {
            foreignKeyName: "hoa_hong_ti_le_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_bsc: {
        Row: {
          hieu_qua: number | null
          id: string
          nam: number
          nhan_vien_id: string
          nhap_dot: string | null
          thang: number
        }
        Insert: {
          hieu_qua?: number | null
          id?: string
          nam: number
          nhan_vien_id: string
          nhap_dot?: string | null
          thang: number
        }
        Update: {
          hieu_qua?: number | null
          id?: string
          nam?: number
          nhan_vien_id?: string
          nhap_dot?: string | null
          thang?: number
        }
        Relationships: [
          {
            foreignKeyName: "hr_bsc_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_bsc_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      hr_cong_lark: {
        Row: {
          bu_ra: string | null
          bu_vao: string | null
          ca_ten: string | null
          gio_ca_ra: string | null
          gio_ca_vao: string | null
          id: string
          kq_ra: string | null
          kq_vao: string | null
          ma_ket_qua: string
          ngay: string
          ngoai_ra: boolean | null
          ngoai_vao: boolean | null
          nguon: string
          nhan_vien_id: string
          nhap_dot: string | null
          nhom_cham_cong: string | null
          noi_ra: string | null
          noi_vao: string | null
          ra: string | null
          ra_2: string | null
          tre_ve_som_cong: number | null
          vao: string | null
          vao_2: string | null
        }
        Insert: {
          bu_ra?: string | null
          bu_vao?: string | null
          ca_ten?: string | null
          gio_ca_ra?: string | null
          gio_ca_vao?: string | null
          id?: string
          kq_ra?: string | null
          kq_vao?: string | null
          ma_ket_qua: string
          ngay: string
          ngoai_ra?: boolean | null
          ngoai_vao?: boolean | null
          nguon: string
          nhan_vien_id: string
          nhap_dot?: string | null
          nhom_cham_cong?: string | null
          noi_ra?: string | null
          noi_vao?: string | null
          ra?: string | null
          ra_2?: string | null
          tre_ve_som_cong?: number | null
          vao?: string | null
          vao_2?: string | null
        }
        Update: {
          bu_ra?: string | null
          bu_vao?: string | null
          ca_ten?: string | null
          gio_ca_ra?: string | null
          gio_ca_vao?: string | null
          id?: string
          kq_ra?: string | null
          kq_vao?: string | null
          ma_ket_qua?: string
          ngay?: string
          ngoai_ra?: boolean | null
          ngoai_vao?: boolean | null
          nguon?: string
          nhan_vien_id?: string
          nhap_dot?: string | null
          nhom_cham_cong?: string | null
          noi_ra?: string | null
          noi_vao?: string | null
          ra?: string | null
          ra_2?: string | null
          tre_ve_som_cong?: number | null
          vao?: string | null
          vao_2?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_cong_lark_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_cong_lark_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      hr_don_vi_lark: {
        Row: {
          hoat_dong: boolean
          id: string
          ma_cha: string | null
          ma_lark: string
          nhap_dot: string | null
          ten: string
          thu_tu: number | null
          truong_don_vi_id: string | null
        }
        Insert: {
          hoat_dong?: boolean
          id?: string
          ma_cha?: string | null
          ma_lark: string
          nhap_dot?: string | null
          ten: string
          thu_tu?: number | null
          truong_don_vi_id?: string | null
        }
        Update: {
          hoat_dong?: boolean
          id?: string
          ma_cha?: string | null
          ma_lark?: string
          nhap_dot?: string | null
          ten?: string
          thu_tu?: number | null
          truong_don_vi_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_don_vi_lark_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
          {
            foreignKeyName: "hr_don_vi_lark_truong_don_vi_id_fkey"
            columns: ["truong_don_vi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_ghi_nhan_kd: {
        Row: {
          doanh_so_dich_vu: number | null
          doanh_so_my_pham: number | null
          don_vi: string | null
          ghi_chu: string | null
          hh_ban_lanh_dao: number | null
          hh_dich_vu: number | null
          hh_gdcn: number | null
          hh_my_pham: number | null
          id: string
          ma_tham_chieu: string | null
          nam: number | null
          ngay: string | null
          nhan_vien_id: string | null
          nhap_dot: string | null
          phi_tri_lieu: number | null
          phong_ban: string | null
          thang: number | null
          thuong: number | null
          thuong_ds_truong_bp: number | null
          thuong_vuot_chi_nhanh: number | null
          thuong_vuot_dat_ca_nhan: number | null
          tong_cong: number | null
          tong_hh_ca_nhan: number | null
          tong_hh_thuc_nhan: number | null
          tro_cap_truc_dem: number | null
        }
        Insert: {
          doanh_so_dich_vu?: number | null
          doanh_so_my_pham?: number | null
          don_vi?: string | null
          ghi_chu?: string | null
          hh_ban_lanh_dao?: number | null
          hh_dich_vu?: number | null
          hh_gdcn?: number | null
          hh_my_pham?: number | null
          id?: string
          ma_tham_chieu?: string | null
          nam?: number | null
          ngay?: string | null
          nhan_vien_id?: string | null
          nhap_dot?: string | null
          phi_tri_lieu?: number | null
          phong_ban?: string | null
          thang?: number | null
          thuong?: number | null
          thuong_ds_truong_bp?: number | null
          thuong_vuot_chi_nhanh?: number | null
          thuong_vuot_dat_ca_nhan?: number | null
          tong_cong?: number | null
          tong_hh_ca_nhan?: number | null
          tong_hh_thuc_nhan?: number | null
          tro_cap_truc_dem?: number | null
        }
        Update: {
          doanh_so_dich_vu?: number | null
          doanh_so_my_pham?: number | null
          don_vi?: string | null
          ghi_chu?: string | null
          hh_ban_lanh_dao?: number | null
          hh_dich_vu?: number | null
          hh_gdcn?: number | null
          hh_my_pham?: number | null
          id?: string
          ma_tham_chieu?: string | null
          nam?: number | null
          ngay?: string | null
          nhan_vien_id?: string | null
          nhap_dot?: string | null
          phi_tri_lieu?: number | null
          phong_ban?: string | null
          thang?: number | null
          thuong?: number | null
          thuong_ds_truong_bp?: number | null
          thuong_vuot_chi_nhanh?: number | null
          thuong_vuot_dat_ca_nhan?: number | null
          tong_cong?: number | null
          tong_hh_ca_nhan?: number | null
          tong_hh_thuc_nhan?: number | null
          tro_cap_truc_dem?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_ghi_nhan_kd_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_ghi_nhan_kd_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      hr_khao_sat_nghi_viec: {
        Row: {
          chi_nhanh: string | null
          chuc_vu: string | null
          danh_gia_quan_ly: number | null
          id: string
          lo_trinh_phat_trien: number | null
          ly_do_chinh: string | null
          nhan_vien_id: string
          nhap_dot: string | null
          phong_ban: string | null
          y_dinh_nghi: string | null
          y_kien: string | null
          yeu_to_giu_chan: string | null
        }
        Insert: {
          chi_nhanh?: string | null
          chuc_vu?: string | null
          danh_gia_quan_ly?: number | null
          id?: string
          lo_trinh_phat_trien?: number | null
          ly_do_chinh?: string | null
          nhan_vien_id: string
          nhap_dot?: string | null
          phong_ban?: string | null
          y_dinh_nghi?: string | null
          y_kien?: string | null
          yeu_to_giu_chan?: string | null
        }
        Update: {
          chi_nhanh?: string | null
          chuc_vu?: string | null
          danh_gia_quan_ly?: number | null
          id?: string
          lo_trinh_phat_trien?: number | null
          ly_do_chinh?: string | null
          nhan_vien_id?: string
          nhap_dot?: string | null
          phong_ban?: string | null
          y_dinh_nghi?: string | null
          y_kien?: string | null
          yeu_to_giu_chan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_khao_sat_nghi_viec_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_khao_sat_nghi_viec_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      hr_luong_ctv: {
        Row: {
          chu_tai_khoan: string | null
          don_gia: number | null
          email: string | null
          ho_ten: string | null
          id: string
          ma_nv: string | null
          nam: number | null
          ngan_hang: string | null
          ngay: string | null
          ngay_cong: number | null
          nhan_vien_id: string | null
          nhap_dot: string | null
          so_tai_khoan: string | null
          thang: number | null
          thuc_nhan: number | null
          thue_tncn: number | null
          thuong_khac: number | null
          tong_thu_nhap: number | null
        }
        Insert: {
          chu_tai_khoan?: string | null
          don_gia?: number | null
          email?: string | null
          ho_ten?: string | null
          id?: string
          ma_nv?: string | null
          nam?: number | null
          ngan_hang?: string | null
          ngay?: string | null
          ngay_cong?: number | null
          nhan_vien_id?: string | null
          nhap_dot?: string | null
          so_tai_khoan?: string | null
          thang?: number | null
          thuc_nhan?: number | null
          thue_tncn?: number | null
          thuong_khac?: number | null
          tong_thu_nhap?: number | null
        }
        Update: {
          chu_tai_khoan?: string | null
          don_gia?: number | null
          email?: string | null
          ho_ten?: string | null
          id?: string
          ma_nv?: string | null
          nam?: number | null
          ngan_hang?: string | null
          ngay?: string | null
          ngay_cong?: number | null
          nhan_vien_id?: string | null
          nhap_dot?: string | null
          so_tai_khoan?: string | null
          thang?: number | null
          thuc_nhan?: number | null
          thue_tncn?: number | null
          thuong_khac?: number | null
          tong_thu_nhap?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_luong_ctv_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_luong_ctv_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      hr_luong_lark: {
        Row: {
          an_ca: number | null
          bhxh_cty: number | null
          bhxh_nld: number | null
          cong_chuan: number | null
          cong_khac: number | null
          don_vi: string | null
          dong_phuc: number | null
          gross: number | null
          id: string
          khung_lam_viec: string | null
          luong_co_ban: number | null
          luong_ot: number | null
          nam: number
          nguon: string
          nha_o: number | null
          nhan_vien_id: string
          nhap_dot: string | null
          phong_ban: string | null
          quy_nhan_vien: number | null
          thang: number
          thanh_toan_l1: number | null
          thu_nhap_chiu_thue: number | null
          thu_nhap_chuc_danh: number | null
          thu_nhap_tinh_thue: number | null
          thuc_tra: number | null
          thue_tncn: number | null
          thuong_hieu_suat: number | null
          thuong_hoa_hong_dv: number | null
          tinh_trang: string | null
          tong_cong: number | null
          tong_giam_tru: number | null
          tong_khau_tru: number | null
          tru_khac_tam_ung: number | null
        }
        Insert: {
          an_ca?: number | null
          bhxh_cty?: number | null
          bhxh_nld?: number | null
          cong_chuan?: number | null
          cong_khac?: number | null
          don_vi?: string | null
          dong_phuc?: number | null
          gross?: number | null
          id?: string
          khung_lam_viec?: string | null
          luong_co_ban?: number | null
          luong_ot?: number | null
          nam: number
          nguon: string
          nha_o?: number | null
          nhan_vien_id: string
          nhap_dot?: string | null
          phong_ban?: string | null
          quy_nhan_vien?: number | null
          thang: number
          thanh_toan_l1?: number | null
          thu_nhap_chiu_thue?: number | null
          thu_nhap_chuc_danh?: number | null
          thu_nhap_tinh_thue?: number | null
          thuc_tra?: number | null
          thue_tncn?: number | null
          thuong_hieu_suat?: number | null
          thuong_hoa_hong_dv?: number | null
          tinh_trang?: string | null
          tong_cong?: number | null
          tong_giam_tru?: number | null
          tong_khau_tru?: number | null
          tru_khac_tam_ung?: number | null
        }
        Update: {
          an_ca?: number | null
          bhxh_cty?: number | null
          bhxh_nld?: number | null
          cong_chuan?: number | null
          cong_khac?: number | null
          don_vi?: string | null
          dong_phuc?: number | null
          gross?: number | null
          id?: string
          khung_lam_viec?: string | null
          luong_co_ban?: number | null
          luong_ot?: number | null
          nam?: number
          nguon?: string
          nha_o?: number | null
          nhan_vien_id?: string
          nhap_dot?: string | null
          phong_ban?: string | null
          quy_nhan_vien?: number | null
          thang?: number
          thanh_toan_l1?: number | null
          thu_nhap_chiu_thue?: number | null
          thu_nhap_chuc_danh?: number | null
          thu_nhap_tinh_thue?: number | null
          thuc_tra?: number | null
          thue_tncn?: number | null
          thuong_hieu_suat?: number | null
          thuong_hoa_hong_dv?: number | null
          tinh_trang?: string | null
          tong_cong?: number | null
          tong_giam_tru?: number | null
          tong_khau_tru?: number | null
          tru_khac_tam_ung?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_luong_lark_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_luong_lark_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      hr_nghi_le: {
        Row: {
          id: string
          ngay: string
          nhan_vien_id: string
          nhap_dot: string | null
        }
        Insert: {
          id?: string
          ngay: string
          nhan_vien_id: string
          nhap_dot?: string | null
        }
        Update: {
          id?: string
          ngay?: string
          nhan_vien_id?: string
          nhap_dot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_nghi_le_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_nghi_le_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      hr_nghi_thang: {
        Row: {
          duyet: boolean
          id: string
          khong_duyet: boolean
          ngay: string
          nhan_vien_id: string
          nhap_dot: string | null
        }
        Insert: {
          duyet?: boolean
          id?: string
          khong_duyet?: boolean
          ngay: string
          nhan_vien_id: string
          nhap_dot?: string | null
        }
        Update: {
          duyet?: boolean
          id?: string
          khong_duyet?: boolean
          ngay?: string
          nhan_vien_id?: string
          nhap_dot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_nghi_thang_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_nghi_thang_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      hr_tai_san: {
        Row: {
          don_vi_tinh: string | null
          ghi_chu: string | null
          hang_model: string | null
          id: string
          loai: string | null
          ngay_cap: string | null
          ngay_thu_hoi: string | null
          nhan_vien_id: string | null
          nhap_dot: string | null
          so_luong: number | null
          ten_tai_san: string
          tinh_trang: string | null
        }
        Insert: {
          don_vi_tinh?: string | null
          ghi_chu?: string | null
          hang_model?: string | null
          id?: string
          loai?: string | null
          ngay_cap?: string | null
          ngay_thu_hoi?: string | null
          nhan_vien_id?: string | null
          nhap_dot?: string | null
          so_luong?: number | null
          ten_tai_san: string
          tinh_trang?: string | null
        }
        Update: {
          don_vi_tinh?: string | null
          ghi_chu?: string | null
          hang_model?: string | null
          id?: string
          loai?: string | null
          ngay_cap?: string | null
          ngay_thu_hoi?: string | null
          nhan_vien_id?: string | null
          nhap_dot?: string | null
          so_luong?: number | null
          ten_tai_san?: string
          tinh_trang?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_tai_san_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_tai_san_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      hr_thue_lan1: {
        Row: {
          id: string
          ngay: string | null
          nhan_vien_id: string
          nhap_dot: string | null
          so_tien: number | null
        }
        Insert: {
          id?: string
          ngay?: string | null
          nhan_vien_id: string
          nhap_dot?: string | null
          so_tien?: number | null
        }
        Update: {
          id?: string
          ngay?: string | null
          nhan_vien_id?: string
          nhap_dot?: string | null
          so_tien?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_thue_lan1_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_thue_lan1_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      hr_thuong_phat: {
        Row: {
          ghi_chu: string | null
          id: string
          khoan_chi: number | null
          khoan_thu: number | null
          ma_goc: string | null
          nam: number | null
          ngay_lap: string | null
          nhan_vien_id: string | null
          nhap_dot: string | null
          noi_dung: string | null
          thang: number | null
          trang_thai: string | null
        }
        Insert: {
          ghi_chu?: string | null
          id?: string
          khoan_chi?: number | null
          khoan_thu?: number | null
          ma_goc?: string | null
          nam?: number | null
          ngay_lap?: string | null
          nhan_vien_id?: string | null
          nhap_dot?: string | null
          noi_dung?: string | null
          thang?: number | null
          trang_thai?: string | null
        }
        Update: {
          ghi_chu?: string | null
          id?: string
          khoan_chi?: number | null
          khoan_thu?: number | null
          ma_goc?: string | null
          nam?: number | null
          ngay_lap?: string | null
          nhan_vien_id?: string | null
          nhap_dot?: string | null
          noi_dung?: string | null
          thang?: number | null
          trang_thai?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_thuong_phat_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_thuong_phat_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      kd_bieu_mau: {
        Row: {
          cum: string | null
          ma: string
          muc_dich: string | null
          nguoi_dung: string | null
          ten: string
          thu_tu: number
          truong: string | null
        }
        Insert: {
          cum?: string | null
          ma: string
          muc_dich?: string | null
          nguoi_dung?: string | null
          ten: string
          thu_tu: number
          truong?: string | null
        }
        Update: {
          cum?: string | null
          ma?: string
          muc_dich?: string | null
          nguoi_dung?: string | null
          ten?: string
          thu_tu?: number
          truong?: string | null
        }
        Relationships: []
      }
      kd_checklist: {
        Row: {
          cong_cu: string | null
          lam_gi: string | null
          ma: string
          nhom: string
          ten_nhom: string
          thao_tac: string
          thu_tu: number
          tieu_chuan: string | null
        }
        Insert: {
          cong_cu?: string | null
          lam_gi?: string | null
          ma: string
          nhom: string
          ten_nhom: string
          thao_tac: string
          thu_tu: number
          tieu_chuan?: string | null
        }
        Update: {
          cong_cu?: string | null
          lam_gi?: string | null
          ma?: string
          nhom?: string
          ten_nhom?: string
          thao_tac?: string
          thu_tu?: number
          tieu_chuan?: string | null
        }
        Relationships: []
      }
      kd_cum: {
        Row: {
          muc_tieu: string | null
          so: number
          ten: string
        }
        Insert: {
          muc_tieu?: string | null
          so: number
          ten: string
        }
        Update: {
          muc_tieu?: string | null
          so?: number
          ten?: string
        }
        Relationships: []
      }
      kd_dau_viec: {
        Row: {
          cap_nhat_boi: string | null
          cap_nhat_luc: string | null
          chu_tri: string | null
          dod: string | null
          ghi_chu: string | null
          giai_doan: number
          han: string | null
          hang_muc_ma: string
          ma: string
          mo_ta: string
          nguoi_phu_trach_id: string | null
          phoi_hop: string | null
          san_pham: string | null
          thu_tu: number
          trang_thai: string
        }
        Insert: {
          cap_nhat_boi?: string | null
          cap_nhat_luc?: string | null
          chu_tri?: string | null
          dod?: string | null
          ghi_chu?: string | null
          giai_doan: number
          han?: string | null
          hang_muc_ma: string
          ma: string
          mo_ta: string
          nguoi_phu_trach_id?: string | null
          phoi_hop?: string | null
          san_pham?: string | null
          thu_tu: number
          trang_thai?: string
        }
        Update: {
          cap_nhat_boi?: string | null
          cap_nhat_luc?: string | null
          chu_tri?: string | null
          dod?: string | null
          ghi_chu?: string | null
          giai_doan?: number
          han?: string | null
          hang_muc_ma?: string
          ma?: string
          mo_ta?: string
          nguoi_phu_trach_id?: string | null
          phoi_hop?: string | null
          san_pham?: string | null
          thu_tu?: number
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "kd_dau_viec_cap_nhat_boi_fkey"
            columns: ["cap_nhat_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kd_dau_viec_hang_muc_ma_fkey"
            columns: ["hang_muc_ma"]
            isOneToOne: false
            referencedRelation: "kd_hang_muc"
            referencedColumns: ["ma"]
          },
          {
            foreignKeyName: "kd_dau_viec_nguoi_phu_trach_id_fkey"
            columns: ["nguoi_phu_trach_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      kd_hang_muc: {
        Row: {
          cum_so: number
          ma: string
          muc_tieu: string | null
          ten: string
          thu_tu: number
        }
        Insert: {
          cum_so: number
          ma: string
          muc_tieu?: string | null
          ten: string
          thu_tu: number
        }
        Update: {
          cum_so?: number
          ma?: string
          muc_tieu?: string | null
          ten?: string
          thu_tu?: number
        }
        Relationships: [
          {
            foreignKeyName: "kd_hang_muc_cum_so_fkey"
            columns: ["cum_so"]
            isOneToOne: false
            referencedRelation: "kd_cum"
            referencedColumns: ["so"]
          },
        ]
      }
      kd_kich_ban: {
        Row: {
          loi_thoai: string | null
          luu_y: string | null
          ma: string
          muc_tieu: string | null
          thu_tu: number
          tinh_huong: string
        }
        Insert: {
          loi_thoai?: string | null
          luu_y?: string | null
          ma: string
          muc_tieu?: string | null
          thu_tu: number
          tinh_huong: string
        }
        Update: {
          loi_thoai?: string | null
          luu_y?: string | null
          ma?: string
          muc_tieu?: string | null
          thu_tu?: number
          tinh_huong?: string
        }
        Relationships: []
      }
      kd_kpi: {
        Row: {
          chi_tieu: string | null
          chu_tri: string | null
          cong_thuc: string | null
          id: string
          nguon: string | null
          nhom: string
          tan_suat: string | null
          ten: string
          thu_tu: number
        }
        Insert: {
          chi_tieu?: string | null
          chu_tri?: string | null
          cong_thuc?: string | null
          id?: string
          nguon?: string | null
          nhom: string
          tan_suat?: string | null
          ten: string
          thu_tu: number
        }
        Update: {
          chi_tieu?: string | null
          chu_tri?: string | null
          cong_thuc?: string | null
          id?: string
          nguon?: string | null
          nhom?: string
          tan_suat?: string | null
          ten?: string
          thu_tu?: number
        }
        Relationships: []
      }
      kd_nhip: {
        Row: {
          chu_ky: string
          chu_tri: string | null
          dau_ra: string | null
          hoat_dong: string
          id: string
          nhom: string
          noi_dung: string | null
          thu_tu: number
        }
        Insert: {
          chu_ky: string
          chu_tri?: string | null
          dau_ra?: string | null
          hoat_dong: string
          id?: string
          nhom: string
          noi_dung?: string | null
          thu_tu: number
        }
        Update: {
          chu_ky?: string
          chu_tri?: string | null
          dau_ra?: string | null
          hoat_dong?: string
          id?: string
          nhom?: string
          noi_dung?: string | null
          thu_tu?: number
        }
        Relationships: []
      }
      kd_qt_buoc: {
        Row: {
          bieu_mau: string | null
          buoc: string
          dau_ra: string | null
          hanh_dong: string
          nguoi: string | null
          qt_ma: string
          thu_tu: number
          tieu_chuan: string | null
        }
        Insert: {
          bieu_mau?: string | null
          buoc: string
          dau_ra?: string | null
          hanh_dong: string
          nguoi?: string | null
          qt_ma: string
          thu_tu: number
          tieu_chuan?: string | null
        }
        Update: {
          bieu_mau?: string | null
          buoc?: string
          dau_ra?: string | null
          hanh_dong?: string
          nguoi?: string | null
          qt_ma?: string
          thu_tu?: number
          tieu_chuan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kd_qt_buoc_qt_ma_fkey"
            columns: ["qt_ma"]
            isOneToOne: false
            referencedRelation: "kd_quy_trinh"
            referencedColumns: ["ma"]
          },
        ]
      }
      kd_quy_trinh: {
        Row: {
          bieu_mau: string | null
          bieu_mau_chinh: string | null
          chu_tri: string | null
          cum: string | null
          dau_ra: string | null
          dau_vao: string | null
          kpi: string | null
          ma: string
          muc_dich: string | null
          nguoi_lien_quan: string | null
          pham_vi: string | null
          ten: string
          tham_chieu: string | null
          thu_tu: number
        }
        Insert: {
          bieu_mau?: string | null
          bieu_mau_chinh?: string | null
          chu_tri?: string | null
          cum?: string | null
          dau_ra?: string | null
          dau_vao?: string | null
          kpi?: string | null
          ma: string
          muc_dich?: string | null
          nguoi_lien_quan?: string | null
          pham_vi?: string | null
          ten: string
          tham_chieu?: string | null
          thu_tu: number
        }
        Update: {
          bieu_mau?: string | null
          bieu_mau_chinh?: string | null
          chu_tri?: string | null
          cum?: string | null
          dau_ra?: string | null
          dau_vao?: string | null
          kpi?: string | null
          ma?: string
          muc_dich?: string | null
          nguoi_lien_quan?: string | null
          pham_vi?: string | null
          ten?: string
          tham_chieu?: string | null
          thu_tu?: number
        }
        Relationships: []
      }
      kd_rui_ro: {
        Row: {
          bien_phap: string | null
          ma: string
          mo_ta: string | null
          muc: string | null
          nhom: string | null
          ten: string
          thu_tu: number
          trach_nhiem: string | null
        }
        Insert: {
          bien_phap?: string | null
          ma: string
          mo_ta?: string | null
          muc?: string | null
          nhom?: string | null
          ten: string
          thu_tu: number
          trach_nhiem?: string | null
        }
        Update: {
          bien_phap?: string | null
          ma?: string
          mo_ta?: string | null
          muc?: string | null
          nhom?: string | null
          ten?: string
          thu_tu?: number
          trach_nhiem?: string | null
        }
        Relationships: []
      }
      khach_anh: {
        Row: {
          duong_dan: string
          ghi_chu: string | null
          het_han: string | null
          id: string
          khach_id: string
          lark_file_token: string | null
          lark_loi: string | null
          lark_record_id: string | null
          lark_so_lan: number
          lark_trang_thai: string
          lark_xong_luc: string | null
          van_ban: string | null
          van_ban_luc: string | null
          loai: string
          ngay_chup: string
          tao_boi: string | null
          tao_luc: string
        }
        Insert: {
          duong_dan: string
          ghi_chu?: string | null
          het_han?: string | null
          id?: string
          khach_id: string
          lark_file_token?: string | null
          lark_loi?: string | null
          lark_record_id?: string | null
          lark_so_lan?: number
          lark_trang_thai?: string
          lark_xong_luc?: string | null
          van_ban?: string | null
          van_ban_luc?: string | null
          loai?: string
          ngay_chup?: string
          tao_boi?: string | null
          tao_luc?: string
        }
        Update: {
          duong_dan?: string
          ghi_chu?: string | null
          het_han?: string | null
          id?: string
          khach_id?: string
          lark_file_token?: string | null
          lark_loi?: string | null
          lark_record_id?: string | null
          lark_so_lan?: number
          lark_trang_thai?: string
          lark_xong_luc?: string | null
          van_ban?: string | null
          van_ban_luc?: string | null
          loai?: string
          ngay_chup?: string
          tao_boi?: string | null
          tao_luc?: string
        }
        Relationships: [
          {
            foreignKeyName: "khach_anh_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_anh_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_anh_tao_boi_fkey"
            columns: ["tao_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      khach_anh_luu_tru: {
        Row: {
          cap_nhat_luc: string
          khach_id: string
          so_anh: number
        }
        Insert: {
          cap_nhat_luc?: string
          khach_id: string
          so_anh: number
        }
        Update: {
          cap_nhat_luc?: string
          khach_id?: string
          so_anh?: number
        }
        Relationships: [
          {
            foreignKeyName: "khach_anh_luu_tru_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: true
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_anh_luu_tru_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: true
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
        ]
      }
      khach_diem_so: {
        Row: {
          chi_nhanh_id: string | null
          hoa_don_id: string | null
          hoa_don_sh_id: number | null
          id: number
          khach_id: string
          la_lich_su: boolean
          loai: string
          ly_do: string | null
          ma_hoa_don_sh: string | null
          nguoi_id: string | null
          nguoi_tao_ten: string | null
          nhap_dot: string | null
          sh_id: number | null
          sh_loai: string | null
          so_diem: number
          so_du_sau_sh: number | null
          so_du_truoc_sh: number | null
          tao_luc: string
        }
        Insert: {
          chi_nhanh_id?: string | null
          hoa_don_id?: string | null
          hoa_don_sh_id?: number | null
          id?: never
          khach_id: string
          la_lich_su?: boolean
          loai: string
          ly_do?: string | null
          ma_hoa_don_sh?: string | null
          nguoi_id?: string | null
          nguoi_tao_ten?: string | null
          nhap_dot?: string | null
          sh_id?: number | null
          sh_loai?: string | null
          so_diem: number
          so_du_sau_sh?: number | null
          so_du_truoc_sh?: number | null
          tao_luc?: string
        }
        Update: {
          chi_nhanh_id?: string | null
          hoa_don_id?: string | null
          hoa_don_sh_id?: number | null
          id?: never
          khach_id?: string
          la_lich_su?: boolean
          loai?: string
          ly_do?: string | null
          ma_hoa_don_sh?: string | null
          nguoi_id?: string | null
          nguoi_tao_ten?: string | null
          nhap_dot?: string | null
          sh_id?: number | null
          sh_loai?: string | null
          so_diem?: number
          so_du_sau_sh?: number | null
          so_du_truoc_sh?: number | null
          tao_luc?: string
        }
        Relationships: [
          {
            foreignKeyName: "khach_diem_so_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_diem_so_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_diem_so_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_diem_so_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_diem_so_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      khach_ghi_chu: {
        Row: {
          bac_si_id: string | null
          id: string
          ket_qua: string | null
          khach_id: string
          loai: string
          nhap_dot: string | null
          phuong_an: string | null
          sh_id: number | null
          tao_boi: string | null
          tao_luc: string
          tinh_trang: string | null
          yeu_cau: string | null
        }
        Insert: {
          bac_si_id?: string | null
          id?: string
          ket_qua?: string | null
          khach_id: string
          loai?: string
          nhap_dot?: string | null
          phuong_an?: string | null
          sh_id?: number | null
          tao_boi?: string | null
          tao_luc?: string
          tinh_trang?: string | null
          yeu_cau?: string | null
        }
        Update: {
          bac_si_id?: string | null
          id?: string
          ket_qua?: string | null
          khach_id?: string
          loai?: string
          nhap_dot?: string | null
          phuong_an?: string | null
          sh_id?: number | null
          tao_boi?: string | null
          tao_luc?: string
          tinh_trang?: string | null
          yeu_cau?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "khach_ghi_chu_bac_si_id_fkey"
            columns: ["bac_si_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_ghi_chu_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_ghi_chu_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_ghi_chu_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
          {
            foreignKeyName: "khach_ghi_chu_tao_boi_fkey"
            columns: ["tao_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      ket_noi_hoa_don_dien_tu: {
        Row: {
          dia_chi_may_chu: string | null
          id: boolean
          khoa_cuoi4: string | null
          khoa_ma_hoa: string | null
          ky_hieu_mac_dinh: string | null
          ma_so_thue: string
          mau_so_mac_dinh: string | null
          nguoi_id: string | null
          nha_cung_cap: string
          sua_luc: string
          ten_dang_nhap: string | null
        }
        Insert: {
          dia_chi_may_chu?: string | null
          id?: boolean
          khoa_cuoi4?: string | null
          khoa_ma_hoa?: string | null
          ky_hieu_mac_dinh?: string | null
          ma_so_thue: string
          mau_so_mac_dinh?: string | null
          nguoi_id?: string | null
          nha_cung_cap: string
          sua_luc?: string
          ten_dang_nhap?: string | null
        }
        Update: {
          dia_chi_may_chu?: string | null
          id?: boolean
          khoa_cuoi4?: string | null
          khoa_ma_hoa?: string | null
          ky_hieu_mac_dinh?: string | null
          ma_so_thue?: string
          mau_so_mac_dinh?: string | null
          nguoi_id?: string | null
          nha_cung_cap?: string
          sua_luc?: string
          ten_dang_nhap?: string | null
        }
        Relationships: []
      }
      khach_hang: {
        Row: {
          anh_dai_dien_url: string | null
          can_nang_kg: number | null
          cap_nhat_luc: string
          chi_nhanh_id: string
          chieu_cao_cm: number | null
          co_so_goc: string | null
          cong_no_goc: number | null
          cong_ty: string | null
          danh_dau_mat: boolean
          dia_chi: string | null
          diem_goc: number | null
          diem_so_du: number
          dien_thoai: string
          dong_y_dung_hinh: boolean
          dong_y_dung_hinh_luc: string | null
          email: string | null
          facebook: string | null
          ghi_chu: string | null
          gioi_tinh: string | null
          hang_goc: string | null
          ho_ten: string
          ho_ten_khong_dau: string | null
          id: string
          khong_gui_zns: boolean
          lan_den_cuoi: string | null
          ma: string
          ma_so_thue: string | null
          ma_the_giay: string | null
          ma_vung_sdt: string | null
          ngay_sinh: string | null
          nghe_nghiep: string | null
          nguoi_gioi_thieu_id: string | null
          nguoi_phu_trach_id: string
          nguon: string
          nguon_chi_tiet: string | null
          nhap_dot: string | null
          quan_huyen: string | null
          quoc_gia: string | null
          sdt_phu: string | null
          sh_id: number | null
          so_lan_den_goc: number | null
          tao_boi: string | null
          tao_luc: string
          tinh_thanh: string | null
          tong_checkin_goc: number | null
          tong_chi_goc: number | null
          tong_dat_lich_goc: number | null
          tong_huy_lich_goc: number | null
          website: string | null
          zalo: string | null
        }
        Insert: {
          anh_dai_dien_url?: string | null
          can_nang_kg?: number | null
          cap_nhat_luc?: string
          chi_nhanh_id: string
          chieu_cao_cm?: number | null
          co_so_goc?: string | null
          cong_no_goc?: number | null
          cong_ty?: string | null
          danh_dau_mat?: boolean
          dia_chi?: string | null
          diem_goc?: number | null
          diem_so_du?: number
          dien_thoai: string
          dong_y_dung_hinh?: boolean
          dong_y_dung_hinh_luc?: string | null
          email?: string | null
          facebook?: string | null
          ghi_chu?: string | null
          gioi_tinh?: string | null
          hang_goc?: string | null
          ho_ten: string
          ho_ten_khong_dau?: string | null
          id?: string
          khong_gui_zns?: boolean
          lan_den_cuoi?: string | null
          ma: string
          ma_so_thue?: string | null
          ma_the_giay?: string | null
          ma_vung_sdt?: string | null
          ngay_sinh?: string | null
          nghe_nghiep?: string | null
          nguoi_gioi_thieu_id?: string | null
          nguoi_phu_trach_id: string
          nguon: string
          nguon_chi_tiet?: string | null
          nhap_dot?: string | null
          quan_huyen?: string | null
          quoc_gia?: string | null
          sdt_phu?: string | null
          sh_id?: number | null
          so_lan_den_goc?: number | null
          tao_boi?: string | null
          tao_luc?: string
          tinh_thanh?: string | null
          tong_checkin_goc?: number | null
          tong_chi_goc?: number | null
          tong_dat_lich_goc?: number | null
          tong_huy_lich_goc?: number | null
          website?: string | null
          zalo?: string | null
        }
        Update: {
          anh_dai_dien_url?: string | null
          can_nang_kg?: number | null
          cap_nhat_luc?: string
          chi_nhanh_id?: string
          chieu_cao_cm?: number | null
          co_so_goc?: string | null
          cong_no_goc?: number | null
          cong_ty?: string | null
          danh_dau_mat?: boolean
          dia_chi?: string | null
          diem_goc?: number | null
          diem_so_du?: number
          dien_thoai?: string
          dong_y_dung_hinh?: boolean
          dong_y_dung_hinh_luc?: string | null
          email?: string | null
          facebook?: string | null
          ghi_chu?: string | null
          gioi_tinh?: string | null
          hang_goc?: string | null
          ho_ten?: string
          ho_ten_khong_dau?: string | null
          id?: string
          khong_gui_zns?: boolean
          lan_den_cuoi?: string | null
          ma?: string
          ma_so_thue?: string | null
          ma_the_giay?: string | null
          ma_vung_sdt?: string | null
          ngay_sinh?: string | null
          nghe_nghiep?: string | null
          nguoi_gioi_thieu_id?: string | null
          nguoi_phu_trach_id?: string
          nguon?: string
          nguon_chi_tiet?: string | null
          nhap_dot?: string | null
          quan_huyen?: string | null
          quoc_gia?: string | null
          sdt_phu?: string | null
          sh_id?: number | null
          so_lan_den_goc?: number | null
          tao_boi?: string | null
          tao_luc?: string
          tinh_thanh?: string | null
          tong_checkin_goc?: number | null
          tong_chi_goc?: number | null
          tong_dat_lich_goc?: number | null
          tong_huy_lich_goc?: number | null
          website?: string | null
          zalo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "khach_hang_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_hang_hang_goc_fkey"
            columns: ["hang_goc"]
            isOneToOne: false
            referencedRelation: "hang_khach"
            referencedColumns: ["ten"]
          },
          {
            foreignKeyName: "khach_hang_nguoi_gioi_thieu_id_fkey"
            columns: ["nguoi_gioi_thieu_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_hang_nguoi_gioi_thieu_id_fkey"
            columns: ["nguoi_gioi_thieu_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_hang_nguoi_phu_trach_id_fkey"
            columns: ["nguoi_phu_trach_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_hang_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
          {
            foreignKeyName: "khach_hang_tao_boi_fkey"
            columns: ["tao_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      khach_nguoi_than: {
        Row: {
          dien_thoai: string | null
          ho_ten: string
          id: string
          khach_id: string
          nhap_dot: string | null
          quan_he: string | null
        }
        Insert: {
          dien_thoai?: string | null
          ho_ten: string
          id?: string
          khach_id: string
          nhap_dot?: string | null
          quan_he?: string | null
        }
        Update: {
          dien_thoai?: string | null
          ho_ten?: string
          id?: string
          khach_id?: string
          nhap_dot?: string | null
          quan_he?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "khach_nguoi_than_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_nguoi_than_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_nguoi_than_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      khach_nhac: {
        Row: {
          cac_ngay_nhac: Json | null
          chi_nhanh_id: string | null
          dich_vu_ten: string | null
          ghi_chu: string | null
          hoan_thanh_luc: string | null
          id: string
          khach_id: string
          kieu_lap: string | null
          la_lich_su: boolean
          ngay_nhac: string | null
          nguoi_phu_trach_ten: string | null
          nguoi_tao_ten: string | null
          nhap_dot: string | null
          noi_dung: string | null
          sh_id: number | null
          sh_trang_thai: string | null
          so_cuoc_goi: number | null
          so_lan_lap: number | null
          tao_luc: string
          trang_thai: string
        }
        Insert: {
          cac_ngay_nhac?: Json | null
          chi_nhanh_id?: string | null
          dich_vu_ten?: string | null
          ghi_chu?: string | null
          hoan_thanh_luc?: string | null
          id?: string
          khach_id: string
          kieu_lap?: string | null
          la_lich_su?: boolean
          ngay_nhac?: string | null
          nguoi_phu_trach_ten?: string | null
          nguoi_tao_ten?: string | null
          nhap_dot?: string | null
          noi_dung?: string | null
          sh_id?: number | null
          sh_trang_thai?: string | null
          so_cuoc_goi?: number | null
          so_lan_lap?: number | null
          tao_luc?: string
          trang_thai?: string
        }
        Update: {
          cac_ngay_nhac?: Json | null
          chi_nhanh_id?: string | null
          dich_vu_ten?: string | null
          ghi_chu?: string | null
          hoan_thanh_luc?: string | null
          id?: string
          khach_id?: string
          kieu_lap?: string | null
          la_lich_su?: boolean
          ngay_nhac?: string | null
          nguoi_phu_trach_ten?: string | null
          nguoi_tao_ten?: string | null
          nhap_dot?: string | null
          noi_dung?: string | null
          sh_id?: number | null
          sh_trang_thai?: string | null
          so_cuoc_goi?: number | null
          so_lan_lap?: number | null
          tao_luc?: string
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "khach_nhac_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_nhac_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_nhac_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_nhac_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      khach_nhom: {
        Row: {
          gan_luc: string
          khach_id: string
          nhap_dot: string | null
          nhom_id: string
        }
        Insert: {
          gan_luc?: string
          khach_id: string
          nhap_dot?: string | null
          nhom_id: string
        }
        Update: {
          gan_luc?: string
          khach_id?: string
          nhap_dot?: string | null
          nhom_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "khach_nhom_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_nhom_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_nhom_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
          {
            foreignKeyName: "khach_nhom_nhom_id_fkey"
            columns: ["nhom_id"]
            isOneToOne: false
            referencedRelation: "nhom_khach"
            referencedColumns: ["id"]
          },
        ]
      }
      khach_quan_tam: {
        Row: {
          dich_vu_id: string
          khach_id: string
        }
        Insert: {
          dich_vu_id: string
          khach_id: string
        }
        Update: {
          dich_vu_id?: string
          khach_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "khach_quan_tam_dich_vu_id_fkey"
            columns: ["dich_vu_id"]
            isOneToOne: false
            referencedRelation: "dich_vu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_quan_tam_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_quan_tam_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
        ]
      }
      khieu_nai: {
        Row: {
          bien_chung_id: string | null
          buoi_id: string | null
          cach_xac_nhan: string | null
          can_duyet: boolean
          chi_nhanh_id: string | null
          chi_phi: number
          co_chi_phi: boolean
          danh_gia_sau_dt_id: string | null
          de_xuat_luc: string | null
          dich_vu_id: string | null
          dong_luc: string | null
          duyet_luc: string | null
          hoa_don_id: string | null
          id: string
          kenh: string
          khach_id: string
          khach_xac_nhan: boolean
          loai: string
          ly_do_tra_lai: string | null
          ma: string
          nguoi_de_xuat_id: string | null
          nguoi_duyet_id: string | null
          nguoi_tiep_nhan_id: string
          nguyen_nhan: string | null
          nguyen_nhan_goc: string | null
          noi_dung: string
          phong_ngua: string | null
          phuong_an: string | null
          tao_luc: string
          tiep_nhan_luc: string
          trang_thai: string
        }
        Insert: {
          bien_chung_id?: string | null
          buoi_id?: string | null
          cach_xac_nhan?: string | null
          can_duyet?: boolean
          chi_nhanh_id?: string | null
          chi_phi?: number
          co_chi_phi?: boolean
          danh_gia_sau_dt_id?: string | null
          de_xuat_luc?: string | null
          dich_vu_id?: string | null
          dong_luc?: string | null
          duyet_luc?: string | null
          hoa_don_id?: string | null
          id?: string
          kenh?: string
          khach_id: string
          khach_xac_nhan?: boolean
          loai: string
          ly_do_tra_lai?: string | null
          ma: string
          nguoi_de_xuat_id?: string | null
          nguoi_duyet_id?: string | null
          nguoi_tiep_nhan_id: string
          nguyen_nhan?: string | null
          nguyen_nhan_goc?: string | null
          noi_dung: string
          phong_ngua?: string | null
          phuong_an?: string | null
          tao_luc?: string
          tiep_nhan_luc?: string
          trang_thai?: string
        }
        Update: {
          bien_chung_id?: string | null
          buoi_id?: string | null
          cach_xac_nhan?: string | null
          can_duyet?: boolean
          chi_nhanh_id?: string | null
          chi_phi?: number
          co_chi_phi?: boolean
          danh_gia_sau_dt_id?: string | null
          de_xuat_luc?: string | null
          dich_vu_id?: string | null
          dong_luc?: string | null
          duyet_luc?: string | null
          hoa_don_id?: string | null
          id?: string
          kenh?: string
          khach_id?: string
          khach_xac_nhan?: boolean
          loai?: string
          ly_do_tra_lai?: string | null
          ma?: string
          nguoi_de_xuat_id?: string | null
          nguoi_duyet_id?: string | null
          nguoi_tiep_nhan_id?: string
          nguyen_nhan?: string | null
          nguyen_nhan_goc?: string | null
          noi_dung?: string
          phong_ngua?: string | null
          phuong_an?: string | null
          tao_luc?: string
          tiep_nhan_luc?: string
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "khieu_nai_bien_chung_id_fkey"
            columns: ["bien_chung_id"]
            isOneToOne: false
            referencedRelation: "bien_chung"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khieu_nai_buoi_id_fkey"
            columns: ["buoi_id"]
            isOneToOne: false
            referencedRelation: "buoi_thuc_hien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khieu_nai_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khieu_nai_danh_gia_sau_dt_id_fkey"
            columns: ["danh_gia_sau_dt_id"]
            isOneToOne: false
            referencedRelation: "danh_gia_sau_dieu_tri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khieu_nai_dich_vu_id_fkey"
            columns: ["dich_vu_id"]
            isOneToOne: false
            referencedRelation: "dich_vu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khieu_nai_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "hoa_don"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khieu_nai_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "v_doanh_so_dong"
            referencedColumns: ["hoa_don_id"]
          },
          {
            foreignKeyName: "khieu_nai_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "v_hd_doanh_thu"
            referencedColumns: ["hoa_don_id"]
          },
          {
            foreignKeyName: "khieu_nai_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khieu_nai_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khieu_nai_nguoi_de_xuat_id_fkey"
            columns: ["nguoi_de_xuat_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khieu_nai_nguoi_duyet_id_fkey"
            columns: ["nguoi_duyet_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khieu_nai_nguoi_tiep_nhan_id_fkey"
            columns: ["nguoi_tiep_nhan_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      kho_ton_sh_tham_chieu: {
        Row: {
          chi_nhanh_id: string
          nap_luc: string
          nguon: string
          san_pham_id: string | null
          sh_id: number
          ten_sh: string
          ton_cuoi: number
        }
        Insert: {
          chi_nhanh_id: string
          nap_luc?: string
          nguon?: string
          san_pham_id?: string | null
          sh_id: number
          ten_sh: string
          ton_cuoi: number
        }
        Update: {
          chi_nhanh_id?: string
          nap_luc?: string
          nguon?: string
          san_pham_id?: string | null
          sh_id?: number
          ten_sh?: string
          ton_cuoi?: number
        }
        Relationships: [
          {
            foreignKeyName: "kho_ton_sh_tham_chieu_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kho_ton_sh_tham_chieu_san_pham_id_fkey"
            columns: ["san_pham_id"]
            isOneToOne: false
            referencedRelation: "san_pham"
            referencedColumns: ["id"]
          },
        ]
      }
      kho_so_cai: {
        Row: {
          chi_nhanh_id: string
          don_gia: number | null
          ghi_chu: string | null
          han_dung: string | null
          hoa_don_id: string | null
          id: number
          loai: string
          nguoi_id: string | null
          phieu_cap_id: string | null
          san_pham_id: string
          so_lo: string | null
          so_luong: number
          tao_luc: string
        }
        Insert: {
          chi_nhanh_id: string
          don_gia?: number | null
          ghi_chu?: string | null
          han_dung?: string | null
          hoa_don_id?: string | null
          id?: never
          loai: string
          nguoi_id?: string | null
          phieu_cap_id?: string | null
          san_pham_id: string
          so_lo?: string | null
          so_luong: number
          tao_luc?: string
        }
        Update: {
          chi_nhanh_id?: string
          don_gia?: number | null
          ghi_chu?: string | null
          han_dung?: string | null
          hoa_don_id?: string | null
          id?: never
          loai?: string
          nguoi_id?: string | null
          phieu_cap_id?: string | null
          san_pham_id?: string
          so_lo?: string | null
          so_luong?: number
          tao_luc?: string
        }
        Relationships: [
          {
            foreignKeyName: "kho_so_cai_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kho_so_cai_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "hoa_don"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kho_so_cai_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "v_doanh_so_dong"
            referencedColumns: ["hoa_don_id"]
          },
          {
            foreignKeyName: "kho_so_cai_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "v_hd_doanh_thu"
            referencedColumns: ["hoa_don_id"]
          },
          {
            foreignKeyName: "kho_so_cai_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kho_so_cai_phieu_fk"
            columns: ["phieu_cap_id"]
            isOneToOne: false
            referencedRelation: "phieu_cap"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kho_so_cai_san_pham_id_fkey"
            columns: ["san_pham_id"]
            isOneToOne: false
            referencedRelation: "san_pham"
            referencedColumns: ["id"]
          },
        ]
      }
      ky_ke_toan: {
        Row: {
          ghi_chu: string | null
          khoa_boi: string | null
          khoa_luc: string | null
          ly_do_mo_lai: string | null
          mo_lai_boi: string | null
          mo_lai_luc: string | null
          thang: string
          trang_thai: string
        }
        Insert: {
          ghi_chu?: string | null
          khoa_boi?: string | null
          khoa_luc?: string | null
          ly_do_mo_lai?: string | null
          mo_lai_boi?: string | null
          mo_lai_luc?: string | null
          thang: string
          trang_thai?: string
        }
        Update: {
          ghi_chu?: string | null
          khoa_boi?: string | null
          khoa_luc?: string | null
          ly_do_mo_lai?: string | null
          mo_lai_boi?: string | null
          mo_lai_luc?: string | null
          thang?: string
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "ky_ke_toan_khoa_boi_fkey"
            columns: ["khoa_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ky_ke_toan_mo_lai_boi_fkey"
            columns: ["mo_lai_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      ky_ke_toan_nhat_ky: {
        Row: {
          hanh_dong: string
          id: number
          luc: string
          ly_do: string | null
          nguoi_id: string
          thang: string
        }
        Insert: {
          hanh_dong: string
          id?: never
          luc?: string
          ly_do?: string | null
          nguoi_id: string
          thang: string
        }
        Update: {
          hanh_dong?: string
          id?: never
          luc?: string
          ly_do?: string | null
          nguoi_id?: string
          thang?: string
        }
        Relationships: [
          {
            foreignKeyName: "ky_ke_toan_nhat_ky_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      ky_luong: {
        Row: {
          chi_luc: string | null
          cong_chuan: number
          duyet_luc: string | null
          ghi_chu: string | null
          id: string
          lap_luc: string
          nam: number
          nguoi_chi_id: string | null
          nguoi_duyet_id: string | null
          nguoi_lap_id: string
          so_quy_id: string | null
          thang: number
          trang_thai: string
        }
        Insert: {
          chi_luc?: string | null
          cong_chuan?: number
          duyet_luc?: string | null
          ghi_chu?: string | null
          id?: string
          lap_luc?: string
          nam: number
          nguoi_chi_id?: string | null
          nguoi_duyet_id?: string | null
          nguoi_lap_id: string
          so_quy_id?: string | null
          thang: number
          trang_thai?: string
        }
        Update: {
          chi_luc?: string | null
          cong_chuan?: number
          duyet_luc?: string | null
          ghi_chu?: string | null
          id?: string
          lap_luc?: string
          nam?: number
          nguoi_chi_id?: string | null
          nguoi_duyet_id?: string | null
          nguoi_lap_id?: string
          so_quy_id?: string | null
          thang?: number
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "ky_luong_nguoi_chi_id_fkey"
            columns: ["nguoi_chi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ky_luong_nguoi_duyet_id_fkey"
            columns: ["nguoi_duyet_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ky_luong_nguoi_lap_id_fkey"
            columns: ["nguoi_lap_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ky_luong_so_quy_id_fkey"
            columns: ["so_quy_id"]
            isOneToOne: false
            referencedRelation: "so_quy"
            referencedColumns: ["id"]
          },
        ]
      }
      lead: {
        Row: {
          cap_nhat_luc: string
          chi_nhanh_id: string
          chien_dich_id: string | null
          dich_vu_quan_tam: string | null
          doi_tac_id: string | null
          ho_ten: string
          id: string
          khach_id: string | null
          link_id: string | null
          ly_do: string | null
          ma: string
          nguon_id: string
          nhu_cau: string | null
          owner_id: string | null
          owner_xac_nhan_luc: string | null
          sdt: string
          tao_boi: string | null
          tao_luc: string
          thoi_diem_phat_sinh: string
          trang_thai_lien_he: string
          trang_thai_phan_bo: string
        }
        Insert: {
          cap_nhat_luc?: string
          chi_nhanh_id: string
          chien_dich_id?: string | null
          dich_vu_quan_tam?: string | null
          doi_tac_id?: string | null
          ho_ten: string
          id?: string
          khach_id?: string | null
          link_id?: string | null
          ly_do?: string | null
          ma: string
          nguon_id: string
          nhu_cau?: string | null
          owner_id?: string | null
          owner_xac_nhan_luc?: string | null
          sdt: string
          tao_boi?: string | null
          tao_luc?: string
          thoi_diem_phat_sinh?: string
          trang_thai_lien_he?: string
          trang_thai_phan_bo?: string
        }
        Update: {
          cap_nhat_luc?: string
          chi_nhanh_id?: string
          chien_dich_id?: string | null
          dich_vu_quan_tam?: string | null
          doi_tac_id?: string | null
          ho_ten?: string
          id?: string
          khach_id?: string | null
          link_id?: string | null
          ly_do?: string | null
          ma?: string
          nguon_id?: string
          nhu_cau?: string | null
          owner_id?: string | null
          owner_xac_nhan_luc?: string | null
          sdt?: string
          tao_boi?: string | null
          tao_luc?: string
          thoi_diem_phat_sinh?: string
          trang_thai_lien_he?: string
          trang_thai_phan_bo?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_chien_dich_id_fkey"
            columns: ["chien_dich_id"]
            isOneToOne: false
            referencedRelation: "chien_dich"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_doi_tac_id_fkey"
            columns: ["doi_tac_id"]
            isOneToOne: false
            referencedRelation: "doi_tac_gt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "link_theo_doi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_nguon_id_fkey"
            columns: ["nguon_id"]
            isOneToOne: false
            referencedRelation: "nguon_lead"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tao_boi_fkey"
            columns: ["tao_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_lien_he: {
        Row: {
          ghi_chu: string | null
          han_tiep: string | null
          id: number
          kenh: string
          ket_qua: string
          lead_id: string
          nguoi_id: string
          tao_luc: string
        }
        Insert: {
          ghi_chu?: string | null
          han_tiep?: string | null
          id?: never
          kenh: string
          ket_qua: string
          lead_id: string
          nguoi_id: string
          tao_luc?: string
        }
        Update: {
          ghi_chu?: string | null
          han_tiep?: string | null
          id?: never
          kenh?: string
          ket_qua?: string
          lead_id?: string
          nguoi_id?: string
          tao_luc?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_lien_he_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_lien_he_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      lich_hen: {
        Row: {
          bat_dau: string
          bat_dau_lam_luc: string | null
          cap_nhat_luc: string
          checkin_luc: string | null
          chi_nhanh_id: string
          dich_vu_ten: string | null
          ghi_chu: string | null
          hoa_don_sh_id: number | null
          hoan_thanh_luc: string | null
          huy_luc: string | null
          id: string
          ket_thuc: string
          khach_id: string
          kieu_lap: string | null
          la_lich_su: boolean
          lap_khoang: number | null
          lap_nhom: string | null
          lap_thu_tu: number | null
          lap_tong: number | null
          ly_do_huy: string | null
          ma_dat_lich: string | null
          nguoi_tao_ten: string | null
          nguon: string | null
          nguon_dat: string | null
          nhan_vien_id: string | null
          nhan_vien_ten: string | null
          nhap_dot: string | null
          phong: string | null
          sh_id: number | null
          so_khach: number | null
          tao_boi: string | null
          tao_luc: string
          trang_thai: string
          xac_nhan_luc: string | null
        }
        Insert: {
          bat_dau: string
          bat_dau_lam_luc?: string | null
          cap_nhat_luc?: string
          checkin_luc?: string | null
          chi_nhanh_id: string
          dich_vu_ten?: string | null
          ghi_chu?: string | null
          hoa_don_sh_id?: number | null
          hoan_thanh_luc?: string | null
          huy_luc?: string | null
          id?: string
          ket_thuc: string
          khach_id: string
          kieu_lap?: string | null
          la_lich_su?: boolean
          lap_khoang?: number | null
          lap_nhom?: string | null
          lap_thu_tu?: number | null
          lap_tong?: number | null
          ly_do_huy?: string | null
          ma_dat_lich?: string | null
          nguoi_tao_ten?: string | null
          nguon?: string | null
          nguon_dat?: string | null
          nhan_vien_id?: string | null
          nhan_vien_ten?: string | null
          nhap_dot?: string | null
          phong?: string | null
          sh_id?: number | null
          so_khach?: number | null
          tao_boi?: string | null
          tao_luc?: string
          trang_thai?: string
          xac_nhan_luc?: string | null
        }
        Update: {
          bat_dau?: string
          bat_dau_lam_luc?: string | null
          cap_nhat_luc?: string
          checkin_luc?: string | null
          chi_nhanh_id?: string
          dich_vu_ten?: string | null
          ghi_chu?: string | null
          hoa_don_sh_id?: number | null
          hoan_thanh_luc?: string | null
          huy_luc?: string | null
          id?: string
          ket_thuc?: string
          khach_id?: string
          kieu_lap?: string | null
          la_lich_su?: boolean
          lap_khoang?: number | null
          lap_nhom?: string | null
          lap_thu_tu?: number | null
          lap_tong?: number | null
          ly_do_huy?: string | null
          ma_dat_lich?: string | null
          nguoi_tao_ten?: string | null
          nguon?: string | null
          nguon_dat?: string | null
          nhan_vien_id?: string | null
          nhan_vien_ten?: string | null
          nhap_dot?: string | null
          phong?: string | null
          sh_id?: number | null
          so_khach?: number | null
          tao_boi?: string | null
          tao_luc?: string
          trang_thai?: string
          xac_nhan_luc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lich_hen_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lich_hen_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lich_hen_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lich_hen_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lich_hen_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
          {
            foreignKeyName: "lich_hen_tao_boi_fkey"
            columns: ["tao_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      lich_hen_dich_vu: {
        Row: {
          dich_vu_id: string
          lich_id: string
          nhap_dot: string | null
          so_luong: number
        }
        Insert: {
          dich_vu_id: string
          lich_id: string
          nhap_dot?: string | null
          so_luong?: number
        }
        Update: {
          dich_vu_id?: string
          lich_id?: string
          nhap_dot?: string | null
          so_luong?: number
        }
        Relationships: [
          {
            foreignKeyName: "lich_hen_dich_vu_dich_vu_id_fkey"
            columns: ["dich_vu_id"]
            isOneToOne: false
            referencedRelation: "dich_vu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lich_hen_dich_vu_lich_id_fkey"
            columns: ["lich_id"]
            isOneToOne: false
            referencedRelation: "lich_hen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lich_hen_dich_vu_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      link_theo_doi: {
        Row: {
          chien_dich_id: string | null
          dich_den: string
          doi_tac_id: string | null
          hoat_dong: boolean
          id: string
          luot_click: number
          ma: string
          nguoi_id: string | null
          nguon_id: string | null
          tao_luc: string
          ten: string
        }
        Insert: {
          chien_dich_id?: string | null
          dich_den: string
          doi_tac_id?: string | null
          hoat_dong?: boolean
          id?: string
          luot_click?: number
          ma: string
          nguoi_id?: string | null
          nguon_id?: string | null
          tao_luc?: string
          ten: string
        }
        Update: {
          chien_dich_id?: string | null
          dich_den?: string
          doi_tac_id?: string | null
          hoat_dong?: boolean
          id?: string
          luot_click?: number
          ma?: string
          nguoi_id?: string | null
          nguon_id?: string | null
          tao_luc?: string
          ten?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_theo_doi_chien_dich_id_fkey"
            columns: ["chien_dich_id"]
            isOneToOne: false
            referencedRelation: "chien_dich"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_theo_doi_doi_tac_id_fkey"
            columns: ["doi_tac_id"]
            isOneToOne: false
            referencedRelation: "doi_tac_gt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_theo_doi_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_theo_doi_nguon_id_fkey"
            columns: ["nguon_id"]
            isOneToOne: false
            referencedRelation: "nguon_lead"
            referencedColumns: ["id"]
          },
        ]
      }
      loai_thu_chi: {
        Row: {
          he_thong: boolean
          hoat_dong: boolean
          huong: string
          id: string
          ten: string
          thu_tu: number
        }
        Insert: {
          he_thong?: boolean
          hoat_dong?: boolean
          huong: string
          id?: string
          ten: string
          thu_tu?: number
        }
        Update: {
          he_thong?: boolean
          hoat_dong?: boolean
          huong?: string
          id?: string
          ten?: string
          thu_tu?: number
        }
        Relationships: []
      }
      luong_khoan: {
        Row: {
          id: string
          ky_id: string
          loai: string
          nguoi_id: string
          nhan_vien_id: string
          so_tien: number
          tao_luc: string
          tieu_de: string
        }
        Insert: {
          id?: string
          ky_id: string
          loai: string
          nguoi_id: string
          nhan_vien_id: string
          so_tien: number
          tao_luc?: string
          tieu_de: string
        }
        Update: {
          id?: string
          ky_id?: string
          loai?: string
          nguoi_id?: string
          nhan_vien_id?: string
          so_tien?: number
          tao_luc?: string
          tieu_de?: string
        }
        Relationships: [
          {
            foreignKeyName: "luong_khoan_ky_id_fkey"
            columns: ["ky_id"]
            isOneToOne: false
            referencedRelation: "ky_luong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "luong_khoan_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "luong_khoan_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_chat_ngay: {
        Row: {
          bo_lo: number | null
          co_sdt: number
          hoi_thoai: number
          id: string
          khoa: string
          loai: string
          ngay: string
          phan_hoi_trung_vi_giay: number | null
          tao_luc: string
        }
        Insert: {
          bo_lo?: number | null
          co_sdt?: number
          hoi_thoai?: number
          id?: string
          khoa: string
          loai: string
          ngay: string
          phan_hoi_trung_vi_giay?: number | null
          tao_luc?: string
        }
        Update: {
          bo_lo?: number | null
          co_sdt?: number
          hoi_thoai?: number
          id?: string
          khoa?: string
          loai?: string
          ngay?: string
          phan_hoi_trung_vi_giay?: number | null
          tao_luc?: string
        }
        Relationships: []
      }
      muc_phat_cham_cong: {
        Row: {
          den_phut: number | null
          id: string
          loai: string
          so_tien: number
          trang_thai: string
          tu_phut: number
        }
        Insert: {
          den_phut?: number | null
          id?: string
          loai: string
          so_tien: number
          trang_thai?: string
          tu_phut: number
        }
        Update: {
          den_phut?: number | null
          id?: string
          loai?: string
          so_tien?: number
          trang_thai?: string
          tu_phut?: number
        }
        Relationships: []
      }
      ncc_so_cai: {
        Row: {
          don_mua_id: string | null
          ghi_chu: string | null
          id: number
          loai: string
          ncc_id: string
          ngay: string
          nguoi_id: string | null
          so_quy_id: string | null
          so_tien: number
          tao_luc: string
        }
        Insert: {
          don_mua_id?: string | null
          ghi_chu?: string | null
          id?: never
          loai: string
          ncc_id: string
          ngay?: string
          nguoi_id?: string | null
          so_quy_id?: string | null
          so_tien: number
          tao_luc?: string
        }
        Update: {
          don_mua_id?: string | null
          ghi_chu?: string | null
          id?: never
          loai?: string
          ncc_id?: string
          ngay?: string
          nguoi_id?: string | null
          so_quy_id?: string | null
          so_tien?: number
          tao_luc?: string
        }
        Relationships: [
          {
            foreignKeyName: "ncc_so_cai_don_mua_id_fkey"
            columns: ["don_mua_id"]
            isOneToOne: false
            referencedRelation: "don_mua"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncc_so_cai_ncc_id_fkey"
            columns: ["ncc_id"]
            isOneToOne: false
            referencedRelation: "nha_cung_cap"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncc_so_cai_ncc_id_fkey"
            columns: ["ncc_id"]
            isOneToOne: false
            referencedRelation: "v_cong_no_ncc"
            referencedColumns: ["ncc_id"]
          },
          {
            foreignKeyName: "ncc_so_cai_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncc_so_cai_so_quy_id_fkey"
            columns: ["so_quy_id"]
            isOneToOne: false
            referencedRelation: "so_quy"
            referencedColumns: ["id"]
          },
        ]
      }
      ngan_sach_ky: {
        Row: {
          cap_nhat_luc: string
          chi_nhanh_id: string | null
          ghi_chu: string | null
          id: string
          loai_thu_chi_id: string
          nguoi_id: string
          so_tien: number
          thang: string
        }
        Insert: {
          cap_nhat_luc?: string
          chi_nhanh_id?: string | null
          ghi_chu?: string | null
          id?: string
          loai_thu_chi_id: string
          nguoi_id: string
          so_tien: number
          thang: string
        }
        Update: {
          cap_nhat_luc?: string
          chi_nhanh_id?: string | null
          ghi_chu?: string | null
          id?: string
          loai_thu_chi_id?: string
          nguoi_id?: string
          so_tien?: number
          thang?: string
        }
        Relationships: [
          {
            foreignKeyName: "ngan_sach_ky_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ngan_sach_ky_loai_thu_chi_id_fkey"
            columns: ["loai_thu_chi_id"]
            isOneToOne: false
            referencedRelation: "loai_thu_chi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ngan_sach_ky_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      ngay_le: {
        Row: {
          ngay: string
          nhap_dot: string | null
          ten: string
        }
        Insert: {
          ngay: string
          nhap_dot?: string | null
          ten: string
        }
        Update: {
          ngay?: string
          nhap_dot?: string | null
          ten?: string
        }
        Relationships: [
          {
            foreignKeyName: "ngay_le_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      nghi_viec: {
        Row: {
          ban_giao_xong: boolean
          bien_ban_thoa_thuan: boolean
          cam_ket_bao_mat: boolean
          duyet_luc: string | null
          hoan_tat_luc: string | null
          id: string
          khao_sat: string | null
          loai: string
          ly_do: string | null
          ly_do_duyet: string | null
          ly_do_goc: string | null
          ma_phieu: string | null
          ngay_lam_cuoi: string
          nguoi_duyet_id: string | null
          nguoi_gui_id: string | null
          nguoi_nhan_ban_giao_id: string | null
          nhan_vien_id: string
          nhap_dot: string | null
          nhom_ly_do: string
          nop_luc: string | null
          tao_luc: string
          trang_thai: string
          trang_thai_goc: string | null
        }
        Insert: {
          ban_giao_xong?: boolean
          bien_ban_thoa_thuan?: boolean
          cam_ket_bao_mat?: boolean
          duyet_luc?: string | null
          hoan_tat_luc?: string | null
          id?: string
          khao_sat?: string | null
          loai: string
          ly_do?: string | null
          ly_do_duyet?: string | null
          ly_do_goc?: string | null
          ma_phieu?: string | null
          ngay_lam_cuoi: string
          nguoi_duyet_id?: string | null
          nguoi_gui_id?: string | null
          nguoi_nhan_ban_giao_id?: string | null
          nhan_vien_id: string
          nhap_dot?: string | null
          nhom_ly_do: string
          nop_luc?: string | null
          tao_luc?: string
          trang_thai?: string
          trang_thai_goc?: string | null
        }
        Update: {
          ban_giao_xong?: boolean
          bien_ban_thoa_thuan?: boolean
          cam_ket_bao_mat?: boolean
          duyet_luc?: string | null
          hoan_tat_luc?: string | null
          id?: string
          khao_sat?: string | null
          loai?: string
          ly_do?: string | null
          ly_do_duyet?: string | null
          ly_do_goc?: string | null
          ma_phieu?: string | null
          ngay_lam_cuoi?: string
          nguoi_duyet_id?: string | null
          nguoi_gui_id?: string | null
          nguoi_nhan_ban_giao_id?: string | null
          nhan_vien_id?: string
          nhap_dot?: string | null
          nhom_ly_do?: string
          nop_luc?: string | null
          tao_luc?: string
          trang_thai?: string
          trang_thai_goc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nghi_viec_nguoi_duyet_id_fkey"
            columns: ["nguoi_duyet_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nghi_viec_nguoi_gui_id_fkey"
            columns: ["nguoi_gui_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nghi_viec_nguoi_nhan_ban_giao_id_fkey"
            columns: ["nguoi_nhan_ban_giao_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nghi_viec_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nghi_viec_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      nguon_lead: {
        Row: {
          hoat_dong: boolean
          id: string
          ma: string
          nhom: string
          ten: string
          thu_tu: number
        }
        Insert: {
          hoat_dong?: boolean
          id?: string
          ma: string
          nhom?: string
          ten: string
          thu_tu?: number
        }
        Update: {
          hoat_dong?: boolean
          id?: string
          ma?: string
          nhom?: string
          ten?: string
          thu_tu?: number
        }
        Relationships: []
      }
      nha_cung_cap: {
        Row: {
          dia_chi: string | null
          dien_thoai: string | null
          email: string | null
          ghi_chu: string | null
          hoat_dong: boolean
          id: string
          ma: string
          ma_so_thue: string | null
          nguoi_lien_he: string | null
          so_ngay_no: number
          tao_luc: string
          ten: string
        }
        Insert: {
          dia_chi?: string | null
          dien_thoai?: string | null
          email?: string | null
          ghi_chu?: string | null
          hoat_dong?: boolean
          id?: string
          ma: string
          ma_so_thue?: string | null
          nguoi_lien_he?: string | null
          so_ngay_no?: number
          tao_luc?: string
          ten: string
        }
        Update: {
          dia_chi?: string | null
          dien_thoai?: string | null
          email?: string | null
          ghi_chu?: string | null
          hoat_dong?: boolean
          id?: string
          ma?: string
          ma_so_thue?: string | null
          nguoi_lien_he?: string | null
          so_ngay_no?: number
          tao_luc?: string
          ten?: string
        }
        Relationships: []
      }
      nhac_da_gui: {
        Row: {
          gui_luc: string
          loai: string
          ngay: string
          nhan_vien_id: string
        }
        Insert: {
          gui_luc?: string
          loai: string
          ngay: string
          nhan_vien_id: string
        }
        Update: {
          gui_luc?: string
          loai?: string
          ngay?: string
          nhan_vien_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nhac_da_gui_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      nhan_vien: {
        Row: {
          anh_dai_dien: string | null
          chi_nhanh_id: string | null
          chuc_danh: string | null
          chuc_danh_tai_chinh: string | null
          dien_thoai: string | null
          don_vi: string | null
          email: string | null
          han_muc_duyet: number | null
          hien_dat_lich: boolean
          ho_ten: string
          hoat_dong: boolean
          id: string
          khung_lam_viec: string
          la_phuc_vu: boolean
          lark_open_id: string | null
          ma_lark: string | null
          ma_nv: string | null
          ngay_nghi_viec: string | null
          ngay_vao_chinh_thuc: string | null
          ngay_vao_lam: string | null
          nhap_dot: string | null
          nhom_nv: string | null
          phai_doi_mat_khau: boolean
          phong_ban_goc: string | null
          phong_ban_id: string | null
          quyen_rieng: string[] | null
          sh_id: number | null
          tao_luc: string
          trang_thai_lam: string
          user_id: string | null
          vai_tro: string
          vai_tro_chuyen_mon: string[]
        }
        Insert: {
          anh_dai_dien?: string | null
          chi_nhanh_id?: string | null
          chuc_danh?: string | null
          chuc_danh_tai_chinh?: string | null
          dien_thoai?: string | null
          don_vi?: string | null
          email?: string | null
          han_muc_duyet?: number | null
          hien_dat_lich?: boolean
          ho_ten: string
          hoat_dong?: boolean
          id?: string
          khung_lam_viec?: string
          la_phuc_vu?: boolean
          lark_open_id?: string | null
          ma_lark?: string | null
          ma_nv?: string | null
          ngay_nghi_viec?: string | null
          ngay_vao_chinh_thuc?: string | null
          ngay_vao_lam?: string | null
          nhap_dot?: string | null
          nhom_nv?: string | null
          phai_doi_mat_khau?: boolean
          phong_ban_goc?: string | null
          phong_ban_id?: string | null
          quyen_rieng?: string[] | null
          sh_id?: number | null
          tao_luc?: string
          trang_thai_lam?: string
          user_id?: string | null
          vai_tro: string
          vai_tro_chuyen_mon?: string[]
        }
        Update: {
          anh_dai_dien?: string | null
          chi_nhanh_id?: string | null
          chuc_danh?: string | null
          chuc_danh_tai_chinh?: string | null
          dien_thoai?: string | null
          don_vi?: string | null
          email?: string | null
          han_muc_duyet?: number | null
          hien_dat_lich?: boolean
          ho_ten?: string
          hoat_dong?: boolean
          id?: string
          khung_lam_viec?: string
          la_phuc_vu?: boolean
          lark_open_id?: string | null
          ma_lark?: string | null
          ma_nv?: string | null
          ngay_nghi_viec?: string | null
          ngay_vao_chinh_thuc?: string | null
          ngay_vao_lam?: string | null
          nhap_dot?: string | null
          nhom_nv?: string | null
          phai_doi_mat_khau?: boolean
          phong_ban_goc?: string | null
          phong_ban_id?: string | null
          quyen_rieng?: string[] | null
          sh_id?: number | null
          tao_luc?: string
          trang_thai_lam?: string
          user_id?: string | null
          vai_tro?: string
          vai_tro_chuyen_mon?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "nhan_vien_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nhan_vien_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
          {
            foreignKeyName: "nhan_vien_phong_ban_id_fkey"
            columns: ["phong_ban_id"]
            isOneToOne: false
            referencedRelation: "phong_ban"
            referencedColumns: ["id"]
          },
        ]
      }
      nhan_vien_ghep_lark: {
        Row: {
          ly_do: string
          ma_lark: string | null
          nhan_vien_id: string
          nhap_dot: string
          tao_luc: string
          truoc: Json
        }
        Insert: {
          ly_do: string
          ma_lark?: string | null
          nhan_vien_id: string
          nhap_dot: string
          tao_luc?: string
          truoc: Json
        }
        Update: {
          ly_do?: string
          ma_lark?: string | null
          nhan_vien_id?: string
          nhap_dot?: string
          tao_luc?: string
          truoc?: Json
        }
        Relationships: [
          {
            foreignKeyName: "nhan_vien_ghep_lark_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: true
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nhan_vien_ghep_lark_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      nhan_vien_ho_so: {
        Row: {
          cap_nhat_boi: string | null
          cap_nhat_luc: string
          cccd: string | null
          chu_tai_khoan: string | null
          dan_toc: string | null
          dia_chi_hien_tai: string | null
          dia_chi_thuong_tru: string | null
          dien_thoai_rieng: string | null
          ghi_chu: string | null
          gioi_tinh: string | null
          hinh_thuc_nhan_luong: string | null
          ma_so_thue: string | null
          ngan_hang: string | null
          nganh: string | null
          ngay_cap_cccd: string | null
          ngay_sinh: string | null
          nguoi_than_dien_thoai: string | null
          nguoi_than_quan_he: string | null
          nguoi_than_ten: string | null
          nhan_vien_id: string
          nhap_dot: string | null
          noi_cap_cccd: string | null
          noi_dk_bhyt: string | null
          noi_sinh: string | null
          que_quan: string | null
          quoc_tich: string | null
          so_bhxh: string | null
          so_bhyt: string | null
          so_tai_khoan: string | null
          tinh_trang_hon_nhan: string | null
          ton_giao: string | null
          trinh_do: string | null
          truong: string | null
        }
        Insert: {
          cap_nhat_boi?: string | null
          cap_nhat_luc?: string
          cccd?: string | null
          chu_tai_khoan?: string | null
          dan_toc?: string | null
          dia_chi_hien_tai?: string | null
          dia_chi_thuong_tru?: string | null
          dien_thoai_rieng?: string | null
          ghi_chu?: string | null
          gioi_tinh?: string | null
          hinh_thuc_nhan_luong?: string | null
          ma_so_thue?: string | null
          ngan_hang?: string | null
          nganh?: string | null
          ngay_cap_cccd?: string | null
          ngay_sinh?: string | null
          nguoi_than_dien_thoai?: string | null
          nguoi_than_quan_he?: string | null
          nguoi_than_ten?: string | null
          nhan_vien_id: string
          nhap_dot?: string | null
          noi_cap_cccd?: string | null
          noi_dk_bhyt?: string | null
          noi_sinh?: string | null
          que_quan?: string | null
          quoc_tich?: string | null
          so_bhxh?: string | null
          so_bhyt?: string | null
          so_tai_khoan?: string | null
          tinh_trang_hon_nhan?: string | null
          ton_giao?: string | null
          trinh_do?: string | null
          truong?: string | null
        }
        Update: {
          cap_nhat_boi?: string | null
          cap_nhat_luc?: string
          cccd?: string | null
          chu_tai_khoan?: string | null
          dan_toc?: string | null
          dia_chi_hien_tai?: string | null
          dia_chi_thuong_tru?: string | null
          dien_thoai_rieng?: string | null
          ghi_chu?: string | null
          gioi_tinh?: string | null
          hinh_thuc_nhan_luong?: string | null
          ma_so_thue?: string | null
          ngan_hang?: string | null
          nganh?: string | null
          ngay_cap_cccd?: string | null
          ngay_sinh?: string | null
          nguoi_than_dien_thoai?: string | null
          nguoi_than_quan_he?: string | null
          nguoi_than_ten?: string | null
          nhan_vien_id?: string
          nhap_dot?: string | null
          noi_cap_cccd?: string | null
          noi_dk_bhyt?: string | null
          noi_sinh?: string | null
          que_quan?: string | null
          quoc_tich?: string | null
          so_bhxh?: string | null
          so_bhyt?: string | null
          so_tai_khoan?: string | null
          tinh_trang_hon_nhan?: string | null
          ton_giao?: string | null
          trinh_do?: string | null
          truong?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nhan_vien_ho_so_cap_nhat_boi_fkey"
            columns: ["cap_nhat_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nhan_vien_ho_so_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: true
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nhan_vien_ho_so_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      nhan_vien_tai_lieu: {
        Row: {
          da_go: boolean
          duong_dan: string
          ghi_chu: string | null
          go_boi: string | null
          go_luc: string | null
          id: string
          kich_thuoc: number
          loai: string
          ly_do_go: string | null
          mime: string
          nhan_vien_id: string
          tai_boi: string | null
          tao_luc: string
          ten_tep: string
          trang_thai: string
        }
        Insert: {
          da_go?: boolean
          duong_dan: string
          ghi_chu?: string | null
          go_boi?: string | null
          go_luc?: string | null
          id?: string
          kich_thuoc: number
          loai: string
          ly_do_go?: string | null
          mime: string
          nhan_vien_id: string
          tai_boi?: string | null
          tao_luc?: string
          ten_tep: string
          trang_thai?: string
        }
        Update: {
          da_go?: boolean
          duong_dan?: string
          ghi_chu?: string | null
          go_boi?: string | null
          go_luc?: string | null
          id?: string
          kich_thuoc?: number
          loai?: string
          ly_do_go?: string | null
          mime?: string
          nhan_vien_id?: string
          tai_boi?: string | null
          tao_luc?: string
          ten_tep?: string
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "nhan_vien_tai_lieu_go_boi_fkey"
            columns: ["go_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nhan_vien_tai_lieu_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nhan_vien_tai_lieu_tai_boi_fkey"
            columns: ["tai_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      nhan_vien_tai_lieu_xem: {
        Row: {
          id: number
          luc: string
          nguoi_id: string | null
          tai_lieu_id: string
        }
        Insert: {
          id?: never
          luc?: string
          nguoi_id?: string | null
          tai_lieu_id: string
        }
        Update: {
          id?: never
          luc?: string
          nguoi_id?: string | null
          tai_lieu_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nhan_vien_tai_lieu_xem_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nhan_vien_tai_lieu_xem_tai_lieu_id_fkey"
            columns: ["tai_lieu_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien_tai_lieu"
            referencedColumns: ["id"]
          },
        ]
      }
      nhan_vien_than_nhan: {
        Row: {
          cccd: string | null
          dien_thoai: string | null
          gioi_tinh: string | null
          ho_ten: string
          id: string
          ngay_sinh: string | null
          nhan_vien_id: string
          nhap_dot: string | null
          phu_thuoc: boolean
          quan_he: string
          tao_luc: string
        }
        Insert: {
          cccd?: string | null
          dien_thoai?: string | null
          gioi_tinh?: string | null
          ho_ten: string
          id?: string
          ngay_sinh?: string | null
          nhan_vien_id: string
          nhap_dot?: string | null
          phu_thuoc?: boolean
          quan_he: string
          tao_luc?: string
        }
        Update: {
          cccd?: string | null
          dien_thoai?: string | null
          gioi_tinh?: string | null
          ho_ten?: string
          id?: string
          ngay_sinh?: string | null
          nhan_vien_id?: string
          nhap_dot?: string | null
          phu_thuoc?: boolean
          quan_he?: string
          tao_luc?: string
        }
        Relationships: [
          {
            foreignKeyName: "nhan_vien_than_nhan_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nhan_vien_than_nhan_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      nhap_dot: {
        Row: {
          go_luc: string | null
          ma: string
          mo_ta: string | null
          so_lieu: Json | null
          tao_luc: string
        }
        Insert: {
          go_luc?: string | null
          ma: string
          mo_ta?: string | null
          so_lieu?: Json | null
          tao_luc?: string
        }
        Update: {
          go_luc?: string | null
          ma?: string
          mo_ta?: string | null
          so_lieu?: Json | null
          tao_luc?: string
        }
        Relationships: []
      }
      nhat_ky_truy_cap: {
        Row: {
          chi_tiet: Json | null
          doi_tuong: string
          doi_tuong_id: string | null
          hanh_dong: string
          id: number
          luc: string
          nguoi_id: string | null
        }
        Insert: {
          chi_tiet?: Json | null
          doi_tuong: string
          doi_tuong_id?: string | null
          hanh_dong: string
          id?: never
          luc?: string
          nguoi_id?: string | null
        }
        Update: {
          chi_tiet?: Json | null
          doi_tuong?: string
          doi_tuong_id?: string | null
          hanh_dong?: string
          id?: never
          luc?: string
          nguoi_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nhat_ky_truy_cap_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      nhom_khach: {
        Row: {
          hoat_dong: boolean
          id: string
          mau: string | null
          mo_ta: string | null
          nhap_dot: string | null
          sh_id: number | null
          tao_luc: string
          ten: string
        }
        Insert: {
          hoat_dong?: boolean
          id?: string
          mau?: string | null
          mo_ta?: string | null
          nhap_dot?: string | null
          sh_id?: number | null
          tao_luc?: string
          ten: string
        }
        Update: {
          hoat_dong?: boolean
          id?: string
          mau?: string | null
          mo_ta?: string | null
          nhap_dot?: string | null
          sh_id?: number | null
          tao_luc?: string
          ten?: string
        }
        Relationships: [
          {
            foreignKeyName: "nhom_khach_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      noi_dung_mkt: {
        Row: {
          chien_dich_id: string | null
          ghi_chu: string | null
          han: string
          hoan_thanh_luc: string | null
          id: string
          kenh: string | null
          link_bai: string | null
          loai: string
          ma: string
          ngay_dang: string | null
          nguoi_duyet_id: string | null
          nguoi_phu_trach_id: string
          so_lan_duyet: number
          tao_luc: string
          tieu_de: string
          trang_thai_duyet: string
        }
        Insert: {
          chien_dich_id?: string | null
          ghi_chu?: string | null
          han: string
          hoan_thanh_luc?: string | null
          id?: string
          kenh?: string | null
          link_bai?: string | null
          loai?: string
          ma: string
          ngay_dang?: string | null
          nguoi_duyet_id?: string | null
          nguoi_phu_trach_id: string
          so_lan_duyet?: number
          tao_luc?: string
          tieu_de: string
          trang_thai_duyet?: string
        }
        Update: {
          chien_dich_id?: string | null
          ghi_chu?: string | null
          han?: string
          hoan_thanh_luc?: string | null
          id?: string
          kenh?: string | null
          link_bai?: string | null
          loai?: string
          ma?: string
          ngay_dang?: string | null
          nguoi_duyet_id?: string | null
          nguoi_phu_trach_id?: string
          so_lan_duyet?: number
          tao_luc?: string
          tieu_de?: string
          trang_thai_duyet?: string
        }
        Relationships: [
          {
            foreignKeyName: "noi_dung_mkt_chien_dich_id_fkey"
            columns: ["chien_dich_id"]
            isOneToOne: false
            referencedRelation: "chien_dich"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "noi_dung_mkt_nguoi_duyet_id_fkey"
            columns: ["nguoi_duyet_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "noi_dung_mkt_nguoi_phu_trach_id_fkey"
            columns: ["nguoi_phu_trach_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_muc: {
        Row: {
          hoat_dong: boolean
          id: string
          sau_ngay: number
          ten: string
          thu_tu: number
        }
        Insert: {
          hoat_dong?: boolean
          id?: string
          sau_ngay: number
          ten: string
          thu_tu?: number
        }
        Update: {
          hoat_dong?: boolean
          id?: string
          sau_ngay?: number
          ten?: string
          thu_tu?: number
        }
        Relationships: []
      }
      onboarding_tien_do: {
        Row: {
          ghi_chu: string | null
          muc_id: string
          nguoi_id: string
          nhan_vien_id: string
          xong_luc: string
        }
        Insert: {
          ghi_chu?: string | null
          muc_id: string
          nguoi_id: string
          nhan_vien_id: string
          xong_luc?: string
        }
        Update: {
          ghi_chu?: string | null
          muc_id?: string
          nguoi_id?: string
          nhan_vien_id?: string
          xong_luc?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_tien_do_muc_id_fkey"
            columns: ["muc_id"]
            isOneToOne: false
            referencedRelation: "onboarding_muc"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tien_do_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tien_do_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      phan_ca: {
        Row: {
          ca_id: string | null
          id: string
          ngay: string
          nghi: boolean
          nhan_vien_id: string
        }
        Insert: {
          ca_id?: string | null
          id?: string
          ngay: string
          nghi?: boolean
          nhan_vien_id: string
        }
        Update: {
          ca_id?: string | null
          id?: string
          ngay?: string
          nghi?: boolean
          nhan_vien_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phan_ca_ca_id_fkey"
            columns: ["ca_id"]
            isOneToOne: false
            referencedRelation: "ca_lam"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phan_ca_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      phieu_cap: {
        Row: {
          bac_si_id: string
          cap_boi: string | null
          cap_luc: string | null
          chi_nhanh_id: string
          dem_may_sau: number | null
          dem_may_truoc: number | null
          dich_vu_id: string
          doi_chieu_boi: string | null
          doi_chieu_luc: string | null
          ghi_chu: string | null
          id: string
          khach_id: string
          ktv_id: string | null
          lam_xong_luc: string | null
          lich_hen_id: string | null
          ly_do_huy: string | null
          ma: string
          nhan_boi: string | null
          nhan_luc: string | null
          tao_boi: string | null
          tao_luc: string
          trang_thai: string
        }
        Insert: {
          bac_si_id: string
          cap_boi?: string | null
          cap_luc?: string | null
          chi_nhanh_id: string
          dem_may_sau?: number | null
          dem_may_truoc?: number | null
          dich_vu_id: string
          doi_chieu_boi?: string | null
          doi_chieu_luc?: string | null
          ghi_chu?: string | null
          id?: string
          khach_id: string
          ktv_id?: string | null
          lam_xong_luc?: string | null
          lich_hen_id?: string | null
          ly_do_huy?: string | null
          ma: string
          nhan_boi?: string | null
          nhan_luc?: string | null
          tao_boi?: string | null
          tao_luc?: string
          trang_thai?: string
        }
        Update: {
          bac_si_id?: string
          cap_boi?: string | null
          cap_luc?: string | null
          chi_nhanh_id?: string
          dem_may_sau?: number | null
          dem_may_truoc?: number | null
          dich_vu_id?: string
          doi_chieu_boi?: string | null
          doi_chieu_luc?: string | null
          ghi_chu?: string | null
          id?: string
          khach_id?: string
          ktv_id?: string | null
          lam_xong_luc?: string | null
          lich_hen_id?: string | null
          ly_do_huy?: string | null
          ma?: string
          nhan_boi?: string | null
          nhan_luc?: string | null
          tao_boi?: string | null
          tao_luc?: string
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "phieu_cap_bac_si_id_fkey"
            columns: ["bac_si_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_cap_cap_boi_fkey"
            columns: ["cap_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_cap_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_cap_dich_vu_id_fkey"
            columns: ["dich_vu_id"]
            isOneToOne: false
            referencedRelation: "dich_vu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_cap_doi_chieu_boi_fkey"
            columns: ["doi_chieu_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_cap_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_cap_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_cap_ktv_id_fkey"
            columns: ["ktv_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_cap_lich_hen_id_fkey"
            columns: ["lich_hen_id"]
            isOneToOne: false
            referencedRelation: "lich_hen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_cap_nhan_boi_fkey"
            columns: ["nhan_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_cap_tao_boi_fkey"
            columns: ["tao_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      phieu_cap_dong: {
        Row: {
          bac_si_xac_nhan_id: string | null
          cap_them: boolean
          dinh_muc: number
          don_gia: number | null
          id: string
          ly_do_vuot: string | null
          nhom_cap: string | null
          phieu_id: string
          san_pham_id: string
          so_cap: number
          so_tra: number | null
        }
        Insert: {
          bac_si_xac_nhan_id?: string | null
          cap_them?: boolean
          dinh_muc: number
          don_gia?: number | null
          id?: string
          ly_do_vuot?: string | null
          nhom_cap?: string | null
          phieu_id: string
          san_pham_id: string
          so_cap: number
          so_tra?: number | null
        }
        Update: {
          bac_si_xac_nhan_id?: string | null
          cap_them?: boolean
          dinh_muc?: number
          don_gia?: number | null
          id?: string
          ly_do_vuot?: string | null
          nhom_cap?: string | null
          phieu_id?: string
          san_pham_id?: string
          so_cap?: number
          so_tra?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "phieu_cap_dong_bac_si_xac_nhan_id_fkey"
            columns: ["bac_si_xac_nhan_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_cap_dong_phieu_id_fkey"
            columns: ["phieu_id"]
            isOneToOne: false
            referencedRelation: "phieu_cap"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_cap_dong_san_pham_id_fkey"
            columns: ["san_pham_id"]
            isOneToOne: false
            referencedRelation: "san_pham"
            referencedColumns: ["id"]
          },
        ]
      }
      phieu_chuyen_kho: {
        Row: {
          cach_xu_ly: string | null
          den_chi_nhanh_id: string
          ghi_chu: string | null
          gui_luc: string
          han_dung: string | null
          han_nhan: string
          id: string
          ly_do_lech: string | null
          ma: string
          nguoi_gui_id: string
          nguoi_nhan_id: string | null
          nguoi_xu_ly_id: string | null
          nhan_luc: string | null
          san_pham_id: string
          so_lo: string | null
          so_luong_gui: number
          so_luong_nhan: number | null
          trang_thai: string
          tu_chi_nhanh_id: string
        }
        Insert: {
          cach_xu_ly?: string | null
          den_chi_nhanh_id: string
          ghi_chu?: string | null
          gui_luc?: string
          han_dung?: string | null
          han_nhan?: string
          id?: string
          ly_do_lech?: string | null
          ma: string
          nguoi_gui_id: string
          nguoi_nhan_id?: string | null
          nguoi_xu_ly_id?: string | null
          nhan_luc?: string | null
          san_pham_id: string
          so_lo?: string | null
          so_luong_gui: number
          so_luong_nhan?: number | null
          trang_thai?: string
          tu_chi_nhanh_id: string
        }
        Update: {
          cach_xu_ly?: string | null
          den_chi_nhanh_id?: string
          ghi_chu?: string | null
          gui_luc?: string
          han_dung?: string | null
          han_nhan?: string
          id?: string
          ly_do_lech?: string | null
          ma?: string
          nguoi_gui_id?: string
          nguoi_nhan_id?: string | null
          nguoi_xu_ly_id?: string | null
          nhan_luc?: string | null
          san_pham_id?: string
          so_lo?: string | null
          so_luong_gui?: number
          so_luong_nhan?: number | null
          trang_thai?: string
          tu_chi_nhanh_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phieu_chuyen_kho_den_chi_nhanh_id_fkey"
            columns: ["den_chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_chuyen_kho_nguoi_gui_id_fkey"
            columns: ["nguoi_gui_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_chuyen_kho_nguoi_nhan_id_fkey"
            columns: ["nguoi_nhan_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_chuyen_kho_nguoi_xu_ly_id_fkey"
            columns: ["nguoi_xu_ly_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_chuyen_kho_san_pham_id_fkey"
            columns: ["san_pham_id"]
            isOneToOne: false
            referencedRelation: "san_pham"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_chuyen_kho_tu_chi_nhanh_id_fkey"
            columns: ["tu_chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
        ]
      }
      phieu_hr: {
        Row: {
          chi_tiet_goc: string | null
          den_ngay: string
          duyet_luc: string | null
          id: string
          loai: string
          loai_nghi: string | null
          loi_cham_cong: string | null
          ly_do: string
          ly_do_duyet: string | null
          ma: string
          nguoi_duyet_id: string | null
          nguoi_gui_id: string
          nguoi_nhan_ban_giao_id: string | null
          nhan_vien_id: string
          nhap_dot: string | null
          qua_han_bao_truoc: boolean
          ra_dieu_chinh: string | null
          so_gio: number | null
          so_ngay: number
          tao_luc: string
          trang_thai: string
          trang_thai_goc: string | null
          tu_ngay: string
          vao_dieu_chinh: string | null
          vuot_han_muc: boolean
        }
        Insert: {
          chi_tiet_goc?: string | null
          den_ngay: string
          duyet_luc?: string | null
          id?: string
          loai: string
          loai_nghi?: string | null
          loi_cham_cong?: string | null
          ly_do: string
          ly_do_duyet?: string | null
          ma: string
          nguoi_duyet_id?: string | null
          nguoi_gui_id: string
          nguoi_nhan_ban_giao_id?: string | null
          nhan_vien_id: string
          nhap_dot?: string | null
          qua_han_bao_truoc?: boolean
          ra_dieu_chinh?: string | null
          so_gio?: number | null
          so_ngay?: number
          tao_luc?: string
          trang_thai?: string
          trang_thai_goc?: string | null
          tu_ngay: string
          vao_dieu_chinh?: string | null
          vuot_han_muc?: boolean
        }
        Update: {
          chi_tiet_goc?: string | null
          den_ngay?: string
          duyet_luc?: string | null
          id?: string
          loai?: string
          loai_nghi?: string | null
          loi_cham_cong?: string | null
          ly_do?: string
          ly_do_duyet?: string | null
          ma?: string
          nguoi_duyet_id?: string | null
          nguoi_gui_id?: string
          nguoi_nhan_ban_giao_id?: string | null
          nhan_vien_id?: string
          nhap_dot?: string | null
          qua_han_bao_truoc?: boolean
          ra_dieu_chinh?: string | null
          so_gio?: number | null
          so_ngay?: number
          tao_luc?: string
          trang_thai?: string
          trang_thai_goc?: string | null
          tu_ngay?: string
          vao_dieu_chinh?: string | null
          vuot_han_muc?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "phieu_hr_nguoi_duyet_id_fkey"
            columns: ["nguoi_duyet_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_hr_nguoi_gui_id_fkey"
            columns: ["nguoi_gui_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_hr_nguoi_nhan_ban_giao_id_fkey"
            columns: ["nguoi_nhan_ban_giao_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_hr_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_hr_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      phieu_kiem_ke: {
        Row: {
          chi_nhanh_id: string
          duyet_luc: string | null
          ghi_chu: string | null
          id: string
          loai: string
          ly_do: string | null
          ma: string
          ngay: string
          nguoi_dem_2_id: string | null
          nguoi_duyet_id: string | null
          nguoi_lap_id: string
          tao_luc: string
          trang_thai: string
        }
        Insert: {
          chi_nhanh_id: string
          duyet_luc?: string | null
          ghi_chu?: string | null
          id?: string
          loai?: string
          ly_do?: string | null
          ma: string
          ngay: string
          nguoi_dem_2_id?: string | null
          nguoi_duyet_id?: string | null
          nguoi_lap_id: string
          tao_luc?: string
          trang_thai?: string
        }
        Update: {
          chi_nhanh_id?: string
          duyet_luc?: string | null
          ghi_chu?: string | null
          id?: string
          loai?: string
          ly_do?: string | null
          ma?: string
          ngay?: string
          nguoi_dem_2_id?: string | null
          nguoi_duyet_id?: string | null
          nguoi_lap_id?: string
          tao_luc?: string
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "phieu_kiem_ke_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_kiem_ke_nguoi_dem_2_id_fkey"
            columns: ["nguoi_dem_2_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_kiem_ke_nguoi_duyet_id_fkey"
            columns: ["nguoi_duyet_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_kiem_ke_nguoi_lap_id_fkey"
            columns: ["nguoi_lap_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      phieu_kiem_ke_dong: {
        Row: {
          ghi_chu: string | null
          han_dung: string | null
          id: string
          phieu_id: string
          san_pham_id: string
          so_lo: string | null
          ton_so: number
          ton_thuc: number | null
        }
        Insert: {
          ghi_chu?: string | null
          han_dung?: string | null
          id?: string
          phieu_id: string
          san_pham_id: string
          so_lo?: string | null
          ton_so: number
          ton_thuc?: number | null
        }
        Update: {
          ghi_chu?: string | null
          han_dung?: string | null
          id?: string
          phieu_id?: string
          san_pham_id?: string
          so_lo?: string | null
          ton_so?: number
          ton_thuc?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "phieu_kiem_ke_dong_phieu_id_fkey"
            columns: ["phieu_id"]
            isOneToOne: false
            referencedRelation: "phieu_kiem_ke"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_kiem_ke_dong_san_pham_id_fkey"
            columns: ["san_pham_id"]
            isOneToOne: false
            referencedRelation: "san_pham"
            referencedColumns: ["id"]
          },
        ]
      }
      phieu_tu_van: {
        Row: {
          bao_gia: number
          chi_nhanh_id: string | null
          chung_minh: string | null
          dat_van_de: string | null
          dich_vu_id: string | null
          goi_quan_tam: string | null
          id: string
          ket_qua: string
          khach_id: string
          ly_do_khong_chot: string | null
          ma: string
          ngay_hen_lai: string | null
          ngay_tu_van: string
          nguoi_ghi_id: string | null
          phan_tich: string | null
          sua_luc: string | null
          tao_luc: string
          tu_van_vien_id: string
        }
        Insert: {
          bao_gia?: number
          chi_nhanh_id?: string | null
          chung_minh?: string | null
          dat_van_de?: string | null
          dich_vu_id?: string | null
          goi_quan_tam?: string | null
          id?: string
          ket_qua?: string
          khach_id: string
          ly_do_khong_chot?: string | null
          ma: string
          ngay_hen_lai?: string | null
          ngay_tu_van?: string
          nguoi_ghi_id?: string | null
          phan_tich?: string | null
          sua_luc?: string | null
          tao_luc?: string
          tu_van_vien_id: string
        }
        Update: {
          bao_gia?: number
          chi_nhanh_id?: string | null
          chung_minh?: string | null
          dat_van_de?: string | null
          dich_vu_id?: string | null
          goi_quan_tam?: string | null
          id?: string
          ket_qua?: string
          khach_id?: string
          ly_do_khong_chot?: string | null
          ma?: string
          ngay_hen_lai?: string | null
          ngay_tu_van?: string
          nguoi_ghi_id?: string | null
          phan_tich?: string | null
          sua_luc?: string | null
          tao_luc?: string
          tu_van_vien_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phieu_tu_van_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_tu_van_dich_vu_id_fkey"
            columns: ["dich_vu_id"]
            isOneToOne: false
            referencedRelation: "dich_vu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_tu_van_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_tu_van_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_tu_van_nguoi_ghi_id_fkey"
            columns: ["nguoi_ghi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_tu_van_tu_van_vien_id_fkey"
            columns: ["tu_van_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      phieu_tu_van_nhu_cau: {
        Row: {
          id: string
          nguoi_ghi_id: string | null
          noi_dung: string
          phieu_id: string
          tao_luc: string
        }
        Insert: {
          id?: string
          nguoi_ghi_id?: string | null
          noi_dung: string
          phieu_id: string
          tao_luc?: string
        }
        Update: {
          id?: string
          nguoi_ghi_id?: string | null
          noi_dung?: string
          phieu_id?: string
          tao_luc?: string
        }
        Relationships: [
          {
            foreignKeyName: "phieu_tu_van_nhu_cau_nguoi_ghi_id_fkey"
            columns: ["nguoi_ghi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_tu_van_nhu_cau_phieu_id_fkey"
            columns: ["phieu_id"]
            isOneToOne: false
            referencedRelation: "phieu_tu_van"
            referencedColumns: ["id"]
          },
        ]
      }
      phieu_xuat_khan: {
        Row: {
          chi_nhanh_id: string
          han_dung: string | null
          han_hau_kiem: string
          hau_kiem_boi: string | null
          hau_kiem_luc: string | null
          id: string
          ket_luan: string | null
          khach_id: string | null
          ly_do_lam_sang: string
          ma: string
          nguoi_de_nghi: string | null
          nguoi_ghi_id: string
          nguoi_nhan: string | null
          nguoi_quyet_dinh_id: string
          san_pham_id: string
          so_lo: string | null
          so_luong: number
          trang_thai: string
          xuat_luc: string
        }
        Insert: {
          chi_nhanh_id: string
          han_dung?: string | null
          han_hau_kiem?: string
          hau_kiem_boi?: string | null
          hau_kiem_luc?: string | null
          id?: string
          ket_luan?: string | null
          khach_id?: string | null
          ly_do_lam_sang: string
          ma: string
          nguoi_de_nghi?: string | null
          nguoi_ghi_id: string
          nguoi_nhan?: string | null
          nguoi_quyet_dinh_id: string
          san_pham_id: string
          so_lo?: string | null
          so_luong: number
          trang_thai?: string
          xuat_luc?: string
        }
        Update: {
          chi_nhanh_id?: string
          han_dung?: string | null
          han_hau_kiem?: string
          hau_kiem_boi?: string | null
          hau_kiem_luc?: string | null
          id?: string
          ket_luan?: string | null
          khach_id?: string | null
          ly_do_lam_sang?: string
          ma?: string
          nguoi_de_nghi?: string | null
          nguoi_ghi_id?: string
          nguoi_nhan?: string | null
          nguoi_quyet_dinh_id?: string
          san_pham_id?: string
          so_lo?: string | null
          so_luong?: number
          trang_thai?: string
          xuat_luc?: string
        }
        Relationships: [
          {
            foreignKeyName: "phieu_xuat_khan_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_xuat_khan_hau_kiem_boi_fkey"
            columns: ["hau_kiem_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_xuat_khan_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_xuat_khan_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_xuat_khan_nguoi_ghi_id_fkey"
            columns: ["nguoi_ghi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_xuat_khan_nguoi_quyet_dinh_id_fkey"
            columns: ["nguoi_quyet_dinh_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_xuat_khan_san_pham_id_fkey"
            columns: ["san_pham_id"]
            isOneToOne: false
            referencedRelation: "san_pham"
            referencedColumns: ["id"]
          },
        ]
      }
      phong_ban: {
        Row: {
          hoat_dong: boolean
          id: string
          nhap_dot: string | null
          ten: string
          thu_tu: number
          truong_phong_id: string | null
        }
        Insert: {
          hoat_dong?: boolean
          id?: string
          nhap_dot?: string | null
          ten: string
          thu_tu?: number
          truong_phong_id?: string | null
        }
        Update: {
          hoat_dong?: boolean
          id?: string
          nhap_dot?: string | null
          ten?: string
          thu_tu?: number
          truong_phong_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phong_ban_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
          {
            foreignKeyName: "phong_ban_truong_phong_id_fkey"
            columns: ["truong_phong_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      quy: {
        Row: {
          chi_nhanh_id: string
          da_nhap_so_du: boolean
          hoat_dong: boolean
          id: string
          loai: string
          so_du_dau: number
          tao_luc: string
          ten: string
        }
        Insert: {
          chi_nhanh_id: string
          da_nhap_so_du?: boolean
          hoat_dong?: boolean
          id?: string
          loai: string
          so_du_dau?: number
          tao_luc?: string
          ten: string
        }
        Update: {
          chi_nhanh_id?: string
          da_nhap_so_du?: boolean
          hoat_dong?: boolean
          id?: string
          loai?: string
          so_du_dau?: number
          tao_luc?: string
          ten?: string
        }
        Relationships: [
          {
            foreignKeyName: "quy_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
        ]
      }
      quy_tac_duyet: {
        Row: {
          cap_nhat_luc: string
          id: string
          ma: string
          mo_ta: string | null
          nguong_tien: number
          ten: string
          trang_thai: string
        }
        Insert: {
          cap_nhat_luc?: string
          id?: string
          ma: string
          mo_ta?: string | null
          nguong_tien: number
          ten: string
          trang_thai?: string
        }
        Update: {
          cap_nhat_luc?: string
          id?: string
          ma?: string
          mo_ta?: string | null
          nguong_tien?: number
          ten?: string
          trang_thai?: string
        }
        Relationships: []
      }
      san_pham: {
        Row: {
          ban_le: boolean
          bat_buoc_han_dung: boolean
          don_vi: string
          don_vi_mua: string | null
          gia_ban: number
          gia_nhap_don_vi: number | null
          he_so_quy_doi: number
          hoat_dong: boolean
          id: string
          ma: string
          ma_vach: string | null
          nhom: string | null
          nhom_cap: string | null
          sh_id: number | null
          tao_luc: string
          ten: string
          theo_doi_kho: boolean
          tieu_hao: boolean
          ton_toi_thieu: number
        }
        Insert: {
          ban_le?: boolean
          bat_buoc_han_dung?: boolean
          don_vi: string
          don_vi_mua?: string | null
          gia_ban?: number
          gia_nhap_don_vi?: number | null
          he_so_quy_doi?: number
          hoat_dong?: boolean
          id?: string
          ma: string
          ma_vach?: string | null
          nhom?: string | null
          nhom_cap?: string | null
          sh_id?: number | null
          tao_luc?: string
          ten: string
          theo_doi_kho?: boolean
          tieu_hao?: boolean
          ton_toi_thieu?: number
        }
        Update: {
          ban_le?: boolean
          bat_buoc_han_dung?: boolean
          don_vi?: string
          don_vi_mua?: string | null
          gia_ban?: number
          gia_nhap_don_vi?: number | null
          he_so_quy_doi?: number
          hoat_dong?: boolean
          id?: string
          ma?: string
          ma_vach?: string | null
          nhom?: string | null
          nhom_cap?: string | null
          sh_id?: number | null
          tao_luc?: string
          ten?: string
          theo_doi_kho?: boolean
          tieu_hao?: boolean
          ton_toi_thieu?: number
        }
        Relationships: []
      }
      so_quy: {
        Row: {
          doi_tuong: string | null
          id: string
          loai: string
          loai_thu_chi_id: string | null
          ma: string
          ngay: string
          nguoi_id: string
          nguon: string
          nhom_chuyen: string | null
          noi_dung: string
          phieu_goc_id: string | null
          quy_id: string
          so_tien: number
          tao_luc: string
        }
        Insert: {
          doi_tuong?: string | null
          id?: string
          loai: string
          loai_thu_chi_id?: string | null
          ma: string
          ngay?: string
          nguoi_id: string
          nguon?: string
          nhom_chuyen?: string | null
          noi_dung: string
          phieu_goc_id?: string | null
          quy_id: string
          so_tien: number
          tao_luc?: string
        }
        Update: {
          doi_tuong?: string | null
          id?: string
          loai?: string
          loai_thu_chi_id?: string | null
          ma?: string
          ngay?: string
          nguoi_id?: string
          nguon?: string
          nhom_chuyen?: string | null
          noi_dung?: string
          phieu_goc_id?: string | null
          quy_id?: string
          so_tien?: number
          tao_luc?: string
        }
        Relationships: [
          {
            foreignKeyName: "so_quy_loai_thu_chi_id_fkey"
            columns: ["loai_thu_chi_id"]
            isOneToOne: false
            referencedRelation: "loai_thu_chi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_quy_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_quy_phieu_goc_id_fkey"
            columns: ["phieu_goc_id"]
            isOneToOne: false
            referencedRelation: "so_quy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_quy_quy_id_fkey"
            columns: ["quy_id"]
            isOneToOne: false
            referencedRelation: "quy"
            referencedColumns: ["id"]
          },
        ]
      }
      tai_kham_xu_ly: {
        Row: {
          cap_nhat_luc: string
          ghi_chu: string | null
          khach_id: string
          lan_cuoi: string
          nguoi_id: string | null
          nhac_id: string | null
          tao_luc: string
          trang_thai: string | null
        }
        Insert: {
          cap_nhat_luc?: string
          ghi_chu?: string | null
          khach_id: string
          lan_cuoi: string
          nguoi_id?: string | null
          nhac_id?: string | null
          tao_luc?: string
          trang_thai?: string | null
        }
        Update: {
          cap_nhat_luc?: string
          ghi_chu?: string | null
          khach_id?: string
          lan_cuoi?: string
          nguoi_id?: string | null
          nhac_id?: string | null
          tao_luc?: string
          trang_thai?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tai_kham_xu_ly_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tai_kham_xu_ly_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tai_kham_xu_ly_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tai_kham_xu_ly_nhac_id_fkey"
            columns: ["nhac_id"]
            isOneToOne: false
            referencedRelation: "khach_nhac"
            referencedColumns: ["id"]
          },
        ]
      }
      tai_khoan_ngan_hang: {
        Row: {
          chi_nhanh_id: string | null
          chu_tai_khoan: string
          dung_chuyen_khoan: boolean
          dung_quet_the: boolean
          ghi_chu: string | null
          hoat_dong: boolean
          id: string
          mac_dinh: boolean
          ngan_hang: string
          so_tai_khoan: string
          tao_luc: string
        }
        Insert: {
          chi_nhanh_id?: string | null
          chu_tai_khoan: string
          dung_chuyen_khoan?: boolean
          dung_quet_the?: boolean
          ghi_chu?: string | null
          hoat_dong?: boolean
          id?: string
          mac_dinh?: boolean
          ngan_hang: string
          so_tai_khoan: string
          tao_luc?: string
        }
        Update: {
          chi_nhanh_id?: string | null
          chu_tai_khoan?: string
          dung_chuyen_khoan?: boolean
          dung_quet_the?: boolean
          ghi_chu?: string | null
          hoat_dong?: boolean
          id?: string
          mac_dinh?: boolean
          ngan_hang?: string
          so_tai_khoan?: string
          tao_luc?: string
        }
        Relationships: [
          {
            foreignKeyName: "tai_khoan_ngan_hang_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
        ]
      }
      thanh_toan: {
        Row: {
          ghi_chu: string | null
          hoa_don_id: string
          id: string
          la_lich_su: boolean
          loai: string
          ngan_hang: string | null
          ngay: string
          nguoi_id: string
          nhap_dot: string | null
          phuong_thuc: string
          so_tien: number
          tao_luc: string
          the_id: string | null
        }
        Insert: {
          ghi_chu?: string | null
          hoa_don_id: string
          id?: string
          la_lich_su?: boolean
          loai?: string
          ngan_hang?: string | null
          ngay?: string
          nguoi_id: string
          nhap_dot?: string | null
          phuong_thuc: string
          so_tien: number
          tao_luc?: string
          the_id?: string | null
        }
        Update: {
          ghi_chu?: string | null
          hoa_don_id?: string
          id?: string
          la_lich_su?: boolean
          loai?: string
          ngan_hang?: string | null
          ngay?: string
          nguoi_id?: string
          nhap_dot?: string | null
          phuong_thuc?: string
          so_tien?: number
          tao_luc?: string
          the_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thanh_toan_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "hoa_don"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thanh_toan_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "v_doanh_so_dong"
            referencedColumns: ["hoa_don_id"]
          },
          {
            foreignKeyName: "thanh_toan_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "v_hd_doanh_thu"
            referencedColumns: ["hoa_don_id"]
          },
          {
            foreignKeyName: "thanh_toan_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thanh_toan_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
          {
            foreignKeyName: "thanh_toan_the_id_fkey"
            columns: ["the_id"]
            isOneToOne: false
            referencedRelation: "the_khach"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thanh_toan_the_id_fkey"
            columns: ["the_id"]
            isOneToOne: false
            referencedRelation: "v_the_khach"
            referencedColumns: ["id"]
          },
        ]
      }
      the_buoi_ke_tiep: {
        Row: {
          buoi_id: string | null
          chi_nhanh_id: string | null
          id: string
          khach_id: string
          ngay_hen: string
          nguoi_id: string | null
          nhac_id: string | null
          noi_dung: string | null
          tao_luc: string
          the_id: string
        }
        Insert: {
          buoi_id?: string | null
          chi_nhanh_id?: string | null
          id?: string
          khach_id: string
          ngay_hen: string
          nguoi_id?: string | null
          nhac_id?: string | null
          noi_dung?: string | null
          tao_luc?: string
          the_id: string
        }
        Update: {
          buoi_id?: string | null
          chi_nhanh_id?: string | null
          id?: string
          khach_id?: string
          ngay_hen?: string
          nguoi_id?: string | null
          nhac_id?: string | null
          noi_dung?: string | null
          tao_luc?: string
          the_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "the_buoi_ke_tiep_buoi_id_fkey"
            columns: ["buoi_id"]
            isOneToOne: true
            referencedRelation: "buoi_thuc_hien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "the_buoi_ke_tiep_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "the_buoi_ke_tiep_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "the_buoi_ke_tiep_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "the_buoi_ke_tiep_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "the_buoi_ke_tiep_nhac_id_fkey"
            columns: ["nhac_id"]
            isOneToOne: false
            referencedRelation: "khach_nhac"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "the_buoi_ke_tiep_the_id_fkey"
            columns: ["the_id"]
            isOneToOne: false
            referencedRelation: "the_khach"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "the_buoi_ke_tiep_the_id_fkey"
            columns: ["the_id"]
            isOneToOne: false
            referencedRelation: "v_the_khach"
            referencedColumns: ["id"]
          },
        ]
      }
      the_khach: {
        Row: {
          cap_tay: boolean
          chi_nhanh_id: string
          ghi_chu: string | null
          gia_tri_buoi: number
          goi_id: string
          han_dung: string | null
          hoa_don_dong_id: string | null
          id: string
          khach_id: string
          loai: string
          ma: string
          ngay_cap: string
          nhap_dot: string | null
          sh_id: number | null
          so_buoi_tong: number | null
          tao_luc: string
          tong_tien: number | null
          trang_thai: string
        }
        Insert: {
          cap_tay?: boolean
          chi_nhanh_id: string
          ghi_chu?: string | null
          gia_tri_buoi?: number
          goi_id: string
          han_dung?: string | null
          hoa_don_dong_id?: string | null
          id?: string
          khach_id: string
          loai: string
          ma: string
          ngay_cap?: string
          nhap_dot?: string | null
          sh_id?: number | null
          so_buoi_tong?: number | null
          tao_luc?: string
          tong_tien?: number | null
          trang_thai?: string
        }
        Update: {
          cap_tay?: boolean
          chi_nhanh_id?: string
          ghi_chu?: string | null
          gia_tri_buoi?: number
          goi_id?: string
          han_dung?: string | null
          hoa_don_dong_id?: string | null
          id?: string
          khach_id?: string
          loai?: string
          ma?: string
          ngay_cap?: string
          nhap_dot?: string | null
          sh_id?: number | null
          so_buoi_tong?: number | null
          tao_luc?: string
          tong_tien?: number | null
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "the_khach_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "the_khach_goi_id_fkey"
            columns: ["goi_id"]
            isOneToOne: false
            referencedRelation: "goi_the"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "the_khach_hoa_don_dong_id_fkey"
            columns: ["hoa_don_dong_id"]
            isOneToOne: false
            referencedRelation: "hoa_don_dong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "the_khach_hoa_don_dong_id_fkey"
            columns: ["hoa_don_dong_id"]
            isOneToOne: false
            referencedRelation: "v_doanh_so_dong"
            referencedColumns: ["dong_id"]
          },
          {
            foreignKeyName: "the_khach_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "the_khach_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "the_khach_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
        ]
      }
      the_so_cai: {
        Row: {
          buoi_id: string | null
          ghi_chu: string | null
          hoa_don_id: string | null
          id: number
          loai: string
          nguoi_id: string | null
          nhap_dot: string | null
          so_buoi: number
          so_tien: number
          tao_luc: string
          the_id: string
        }
        Insert: {
          buoi_id?: string | null
          ghi_chu?: string | null
          hoa_don_id?: string | null
          id?: never
          loai: string
          nguoi_id?: string | null
          nhap_dot?: string | null
          so_buoi?: number
          so_tien?: number
          tao_luc?: string
          the_id: string
        }
        Update: {
          buoi_id?: string | null
          ghi_chu?: string | null
          hoa_don_id?: string | null
          id?: never
          loai?: string
          nguoi_id?: string | null
          nhap_dot?: string | null
          so_buoi?: number
          so_tien?: number
          tao_luc?: string
          the_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "the_so_cai_buoi_id_fkey"
            columns: ["buoi_id"]
            isOneToOne: false
            referencedRelation: "buoi_thuc_hien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "the_so_cai_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "hoa_don"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "the_so_cai_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "v_doanh_so_dong"
            referencedColumns: ["hoa_don_id"]
          },
          {
            foreignKeyName: "the_so_cai_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "v_hd_doanh_thu"
            referencedColumns: ["hoa_don_id"]
          },
          {
            foreignKeyName: "the_so_cai_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "the_so_cai_nhap_dot_fkey"
            columns: ["nhap_dot"]
            isOneToOne: false
            referencedRelation: "nhap_dot"
            referencedColumns: ["ma"]
          },
          {
            foreignKeyName: "the_so_cai_the_id_fkey"
            columns: ["the_id"]
            isOneToOne: false
            referencedRelation: "the_khach"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "the_so_cai_the_id_fkey"
            columns: ["the_id"]
            isOneToOne: false
            referencedRelation: "v_the_khach"
            referencedColumns: ["id"]
          },
        ]
      }
      thong_bao_trang_thai: {
        Row: {
          cap_nhat_luc: string
          dau_van: string
          ma: string
          nhan_vien_id: string
          trang_thai: string
        }
        Insert: {
          cap_nhat_luc?: string
          dau_van: string
          ma: string
          nhan_vien_id: string
          trang_thai: string
        }
        Update: {
          cap_nhat_luc?: string
          dau_van?: string
          ma?: string
          nhan_vien_id?: string
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "thong_bao_trang_thai_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      tin_tuyen_dung: {
        Row: {
          chi_nhanh_id: string | null
          han_nop: string | null
          id: string
          mo_ta: string | null
          so_luong_can: number
          tao_luc: string
          trang_thai: string
          vi_tri: string
          yeu_cau_id: string | null
        }
        Insert: {
          chi_nhanh_id?: string | null
          han_nop?: string | null
          id?: string
          mo_ta?: string | null
          so_luong_can?: number
          tao_luc?: string
          trang_thai?: string
          vi_tri: string
          yeu_cau_id?: string | null
        }
        Update: {
          chi_nhanh_id?: string | null
          han_nop?: string | null
          id?: string
          mo_ta?: string | null
          so_luong_can?: number
          tao_luc?: string
          trang_thai?: string
          vi_tri?: string
          yeu_cau_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tin_tuyen_dung_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tin_tuyen_dung_yeu_cau_id_fkey"
            columns: ["yeu_cau_id"]
            isOneToOne: false
            referencedRelation: "yeu_cau_tuyen_dung"
            referencedColumns: ["id"]
          },
        ]
      }
      tong_hop_hieu_suat: {
        Row: {
          chi_tiet: Json
          id: string
          ky: string
          loai: string
          noi_dung: string
          tao_luc: string
          tieu_de: string
        }
        Insert: {
          chi_tiet?: Json
          id?: string
          ky: string
          loai: string
          noi_dung: string
          tao_luc?: string
          tieu_de: string
        }
        Update: {
          chi_tiet?: Json
          id?: string
          ky?: string
          loai?: string
          noi_dung?: string
          tao_luc?: string
          tieu_de?: string
        }
        Relationships: []
      }
      ung_vien: {
        Row: {
          dien_thoai: string | null
          email: string | null
          ghi_chu: string | null
          ho_ten: string
          id: string
          ly_do_khong_dat: string | null
          ngay_nhan_ho_so: string
          ngay_nhan_viec: string | null
          ngay_phong_van: string | null
          nguon: string | null
          tao_luc: string
          tin_id: string
          trang_thai: string
        }
        Insert: {
          dien_thoai?: string | null
          email?: string | null
          ghi_chu?: string | null
          ho_ten: string
          id?: string
          ly_do_khong_dat?: string | null
          ngay_nhan_ho_so?: string
          ngay_nhan_viec?: string | null
          ngay_phong_van?: string | null
          nguon?: string | null
          tao_luc?: string
          tin_id: string
          trang_thai?: string
        }
        Update: {
          dien_thoai?: string | null
          email?: string | null
          ghi_chu?: string | null
          ho_ten?: string
          id?: string
          ly_do_khong_dat?: string | null
          ngay_nhan_ho_so?: string
          ngay_nhan_viec?: string | null
          ngay_phong_van?: string | null
          nguon?: string | null
          tao_luc?: string
          tin_id?: string
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "ung_vien_tin_id_fkey"
            columns: ["tin_id"]
            isOneToOne: false
            referencedRelation: "tin_tuyen_dung"
            referencedColumns: ["id"]
          },
        ]
      }
      van_ban: {
        Row: {
          chi_nhanh_id: string | null
          dung_tam: boolean
          duyet_luc: string | null
          ghi_chu: string | null
          gia_tri: number | null
          hieu_luc_den: string | null
          hieu_luc_tu: string | null
          hoa_don_id: string | null
          id: string
          khach_id: string | null
          link_ban_dien_tu: string | null
          loai_id: string
          ly_do: string | null
          ma: string
          ncc_id: string | null
          ngay_ky: string | null
          nguoi_duyet_id: string | null
          nguoi_ky: string | null
          nguoi_soan_id: string
          nhan_vien_id: string | null
          phien_ban: number
          tao_luc: string
          thay_the_id: string | null
          tieu_de: string
          trang_thai: string
          vi_tri_ban_giay: string | null
        }
        Insert: {
          chi_nhanh_id?: string | null
          dung_tam?: boolean
          duyet_luc?: string | null
          ghi_chu?: string | null
          gia_tri?: number | null
          hieu_luc_den?: string | null
          hieu_luc_tu?: string | null
          hoa_don_id?: string | null
          id?: string
          khach_id?: string | null
          link_ban_dien_tu?: string | null
          loai_id: string
          ly_do?: string | null
          ma: string
          ncc_id?: string | null
          ngay_ky?: string | null
          nguoi_duyet_id?: string | null
          nguoi_ky?: string | null
          nguoi_soan_id: string
          nhan_vien_id?: string | null
          phien_ban?: number
          tao_luc?: string
          thay_the_id?: string | null
          tieu_de: string
          trang_thai?: string
          vi_tri_ban_giay?: string | null
        }
        Update: {
          chi_nhanh_id?: string | null
          dung_tam?: boolean
          duyet_luc?: string | null
          ghi_chu?: string | null
          gia_tri?: number | null
          hieu_luc_den?: string | null
          hieu_luc_tu?: string | null
          hoa_don_id?: string | null
          id?: string
          khach_id?: string | null
          link_ban_dien_tu?: string | null
          loai_id?: string
          ly_do?: string | null
          ma?: string
          ncc_id?: string | null
          ngay_ky?: string | null
          nguoi_duyet_id?: string | null
          nguoi_ky?: string | null
          nguoi_soan_id?: string
          nhan_vien_id?: string | null
          phien_ban?: number
          tao_luc?: string
          thay_the_id?: string | null
          tieu_de?: string
          trang_thai?: string
          vi_tri_ban_giay?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "van_ban_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "van_ban_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "hoa_don"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "van_ban_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "v_doanh_so_dong"
            referencedColumns: ["hoa_don_id"]
          },
          {
            foreignKeyName: "van_ban_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "v_hd_doanh_thu"
            referencedColumns: ["hoa_don_id"]
          },
          {
            foreignKeyName: "van_ban_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "van_ban_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "van_ban_loai_id_fkey"
            columns: ["loai_id"]
            isOneToOne: false
            referencedRelation: "vb_loai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "van_ban_ncc_id_fkey"
            columns: ["ncc_id"]
            isOneToOne: false
            referencedRelation: "nha_cung_cap"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "van_ban_ncc_id_fkey"
            columns: ["ncc_id"]
            isOneToOne: false
            referencedRelation: "v_cong_no_ncc"
            referencedColumns: ["ncc_id"]
          },
          {
            foreignKeyName: "van_ban_nguoi_duyet_id_fkey"
            columns: ["nguoi_duyet_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "van_ban_nguoi_soan_id_fkey"
            columns: ["nguoi_soan_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "van_ban_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "van_ban_thay_the_id_fkey"
            columns: ["thay_the_id"]
            isOneToOne: false
            referencedRelation: "van_ban"
            referencedColumns: ["id"]
          },
        ]
      }
      van_ban_nhat_ky: {
        Row: {
          ghi_chu: string | null
          hanh_dong: string
          id: number
          luc: string
          nguoi_id: string
          van_ban_id: string
        }
        Insert: {
          ghi_chu?: string | null
          hanh_dong: string
          id?: never
          luc?: string
          nguoi_id: string
          van_ban_id: string
        }
        Update: {
          ghi_chu?: string | null
          hanh_dong?: string
          id?: never
          luc?: string
          nguoi_id?: string
          van_ban_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "van_ban_nhat_ky_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "van_ban_nhat_ky_van_ban_id_fkey"
            columns: ["van_ban_id"]
            isOneToOne: false
            referencedRelation: "van_ban"
            referencedColumns: ["id"]
          },
        ]
      }
      vb_loai: {
        Row: {
          hoat_dong: boolean
          id: string
          ma: string
          nhom: string
          ten: string
          thu_tu: number
        }
        Insert: {
          hoat_dong?: boolean
          id?: string
          ma: string
          nhom: string
          ten: string
          thu_tu?: number
        }
        Update: {
          hoat_dong?: boolean
          id?: string
          ma?: string
          nhom?: string
          ten?: string
          thu_tu?: number
        }
        Relationships: []
      }
      voucher: {
        Row: {
          bi_khoa: boolean
          chi_nhanh_ids: string[] | null
          den_ngay: string
          dich_vu_ids: string[] | null
          don_toi_thieu: number
          gia_tri: number
          giam_toi_da: number | null
          gio_den: string | null
          gio_tu: string | null
          gioi_han: string
          hang_khach: string[] | null
          hien_thi_tim_kiem: string
          id: string
          khach_moi_cu: string | null
          loai_giam: string
          loai_lich_hen: string[] | null
          loai_ma: string
          mo_ta: string | null
          ngay_trong_tuan: number[] | null
          nhom_khach_ids: string[] | null
          so_lan_toi_da_khach: number | null
          so_luong: number
          sua_luc: string | null
          tao_boi: string | null
          tao_luc: string
          ten: string
          tu_ngay: string
        }
        Insert: {
          bi_khoa?: boolean
          chi_nhanh_ids?: string[] | null
          den_ngay: string
          dich_vu_ids?: string[] | null
          don_toi_thieu?: number
          gia_tri: number
          giam_toi_da?: number | null
          gio_den?: string | null
          gio_tu?: string | null
          gioi_han?: string
          hang_khach?: string[] | null
          hien_thi_tim_kiem?: string
          id?: string
          khach_moi_cu?: string | null
          loai_giam: string
          loai_lich_hen?: string[] | null
          loai_ma: string
          mo_ta?: string | null
          ngay_trong_tuan?: number[] | null
          nhom_khach_ids?: string[] | null
          so_lan_toi_da_khach?: number | null
          so_luong: number
          sua_luc?: string | null
          tao_boi?: string | null
          tao_luc?: string
          ten: string
          tu_ngay: string
        }
        Update: {
          bi_khoa?: boolean
          chi_nhanh_ids?: string[] | null
          den_ngay?: string
          dich_vu_ids?: string[] | null
          don_toi_thieu?: number
          gia_tri?: number
          giam_toi_da?: number | null
          gio_den?: string | null
          gio_tu?: string | null
          gioi_han?: string
          hang_khach?: string[] | null
          hien_thi_tim_kiem?: string
          id?: string
          khach_moi_cu?: string | null
          loai_giam?: string
          loai_lich_hen?: string[] | null
          loai_ma?: string
          mo_ta?: string | null
          ngay_trong_tuan?: number[] | null
          nhom_khach_ids?: string[] | null
          so_lan_toi_da_khach?: number | null
          so_luong?: number
          sua_luc?: string | null
          tao_boi?: string | null
          tao_luc?: string
          ten?: string
          tu_ngay?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_tao_boi_fkey"
            columns: ["tao_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_luot_dung: {
        Row: {
          ghi_chu: string | null
          hoa_don_id: string
          id: number
          khach_id: string | null
          loai: string
          ma_id: string
          nguoi_id: string | null
          so_tien: number
          tao_luc: string
          voucher_id: string
        }
        Insert: {
          ghi_chu?: string | null
          hoa_don_id: string
          id?: never
          khach_id?: string | null
          loai: string
          ma_id: string
          nguoi_id?: string | null
          so_tien: number
          tao_luc?: string
          voucher_id: string
        }
        Update: {
          ghi_chu?: string | null
          hoa_don_id?: string
          id?: never
          khach_id?: string | null
          loai?: string
          ma_id?: string
          nguoi_id?: string | null
          so_tien?: number
          tao_luc?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_luot_dung_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_luot_dung_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_luot_dung_ma_id_fkey"
            columns: ["ma_id"]
            isOneToOne: false
            referencedRelation: "voucher_ma"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_luot_dung_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_luot_dung_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "voucher"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_ma: {
        Row: {
          id: string
          ma: string
          tao_luc: string
          voucher_id: string
        }
        Insert: {
          id?: string
          ma: string
          tao_luc?: string
          voucher_id: string
        }
        Update: {
          id?: string
          ma?: string
          tao_luc?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_ma_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "voucher"
            referencedColumns: ["id"]
          },
        ]
      }
      wiki_bai: {
        Row: {
          cap_nhat_luc: string
          cong_khai: boolean
          ghim: boolean
          id: string
          nguoi_id: string
          nhom: string
          noi_dung: string
          tao_luc: string
          tieu_de: string
        }
        Insert: {
          cap_nhat_luc?: string
          cong_khai?: boolean
          ghim?: boolean
          id?: string
          nguoi_id: string
          nhom?: string
          noi_dung: string
          tao_luc?: string
          tieu_de: string
        }
        Update: {
          cap_nhat_luc?: string
          cong_khai?: boolean
          ghim?: boolean
          id?: string
          nguoi_id?: string
          nhom?: string
          noi_dung?: string
          tao_luc?: string
          tieu_de?: string
        }
        Relationships: [
          {
            foreignKeyName: "wiki_bai_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      xu_ly_vat_tu: {
        Row: {
          chi_nhanh_id: string
          duyet_luc: string | null
          han_dung: string | null
          id: string
          loai: string
          ly_do: string
          ly_do_tu_choi: string | null
          ma: string
          ncc_id: string | null
          nguoi_duyet_id: string | null
          nguoi_lap_id: string
          san_pham_id: string
          so_lo: string | null
          so_luong: number
          tao_luc: string
          trang_thai: string
        }
        Insert: {
          chi_nhanh_id: string
          duyet_luc?: string | null
          han_dung?: string | null
          id?: string
          loai: string
          ly_do: string
          ly_do_tu_choi?: string | null
          ma: string
          ncc_id?: string | null
          nguoi_duyet_id?: string | null
          nguoi_lap_id: string
          san_pham_id: string
          so_lo?: string | null
          so_luong: number
          tao_luc?: string
          trang_thai?: string
        }
        Update: {
          chi_nhanh_id?: string
          duyet_luc?: string | null
          han_dung?: string | null
          id?: string
          loai?: string
          ly_do?: string
          ly_do_tu_choi?: string | null
          ma?: string
          ncc_id?: string | null
          nguoi_duyet_id?: string | null
          nguoi_lap_id?: string
          san_pham_id?: string
          so_lo?: string | null
          so_luong?: number
          tao_luc?: string
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "xu_ly_vat_tu_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xu_ly_vat_tu_ncc_id_fkey"
            columns: ["ncc_id"]
            isOneToOne: false
            referencedRelation: "nha_cung_cap"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xu_ly_vat_tu_ncc_id_fkey"
            columns: ["ncc_id"]
            isOneToOne: false
            referencedRelation: "v_cong_no_ncc"
            referencedColumns: ["ncc_id"]
          },
          {
            foreignKeyName: "xu_ly_vat_tu_nguoi_duyet_id_fkey"
            columns: ["nguoi_duyet_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xu_ly_vat_tu_nguoi_lap_id_fkey"
            columns: ["nguoi_lap_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xu_ly_vat_tu_san_pham_id_fkey"
            columns: ["san_pham_id"]
            isOneToOne: false
            referencedRelation: "san_pham"
            referencedColumns: ["id"]
          },
        ]
      }
      yeu_cau_dat_lich: {
        Row: {
          bat_dau: string
          chi_nhanh_id: string
          dich_vu_ids: string[]
          dien_thoai: string
          ghi_chu: string | null
          ho_ten: string
          id: string
          ip_bam: string
          lich_id: string | null
          ly_do: string | null
          tao_luc: string
          thoi_luong_phut: number
          trang_thai: string
          xu_ly_boi: string | null
          xu_ly_luc: string | null
        }
        Insert: {
          bat_dau: string
          chi_nhanh_id: string
          dich_vu_ids: string[]
          dien_thoai: string
          ghi_chu?: string | null
          ho_ten: string
          id?: string
          ip_bam: string
          lich_id?: string | null
          ly_do?: string | null
          tao_luc?: string
          thoi_luong_phut: number
          trang_thai?: string
          xu_ly_boi?: string | null
          xu_ly_luc?: string | null
        }
        Update: {
          bat_dau?: string
          chi_nhanh_id?: string
          dich_vu_ids?: string[]
          dien_thoai?: string
          ghi_chu?: string | null
          ho_ten?: string
          id?: string
          ip_bam?: string
          lich_id?: string | null
          ly_do?: string | null
          tao_luc?: string
          thoi_luong_phut?: number
          trang_thai?: string
          xu_ly_boi?: string | null
          xu_ly_luc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "yeu_cau_dat_lich_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yeu_cau_dat_lich_lich_id_fkey"
            columns: ["lich_id"]
            isOneToOne: false
            referencedRelation: "lich_hen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yeu_cau_dat_lich_xu_ly_boi_fkey"
            columns: ["xu_ly_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      yeu_cau_lay_anh: {
        Row: {
          id: string
          khach_id: string
          loi: string | null
          so_anh_lay: number | null
          tao_boi: string | null
          tao_luc: string
          trang_thai: string
          xong_luc: string | null
        }
        Insert: {
          id?: string
          khach_id: string
          loi?: string | null
          so_anh_lay?: number | null
          tao_boi?: string | null
          tao_luc?: string
          trang_thai?: string
          xong_luc?: string | null
        }
        Update: {
          id?: string
          khach_id?: string
          loi?: string | null
          so_anh_lay?: number | null
          tao_boi?: string | null
          tao_luc?: string
          trang_thai?: string
          xong_luc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "yeu_cau_lay_anh_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yeu_cau_lay_anh_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yeu_cau_lay_anh_tao_boi_fkey"
            columns: ["tao_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      yeu_cau_tuyen_dung: {
        Row: {
          chi_nhanh_id: string | null
          han_can_nhan_su: string | null
          id: string
          loai_tuyen: string
          ly_do_tu_choi: string | null
          ma: string
          muc_luong: string | null
          ngay_hoan_thanh: string | null
          ngay_tiep_nhan: string | null
          nguoi_tiep_nhan_id: string | null
          nguoi_yeu_cau_id: string | null
          so_luong: number
          tao_luc: string
          thay_the_cho: string | null
          trang_thai: string
          vi_tri: string
          yeu_cau_chinh: string | null
        }
        Insert: {
          chi_nhanh_id?: string | null
          han_can_nhan_su?: string | null
          id?: string
          loai_tuyen?: string
          ly_do_tu_choi?: string | null
          ma: string
          muc_luong?: string | null
          ngay_hoan_thanh?: string | null
          ngay_tiep_nhan?: string | null
          nguoi_tiep_nhan_id?: string | null
          nguoi_yeu_cau_id?: string | null
          so_luong?: number
          tao_luc?: string
          thay_the_cho?: string | null
          trang_thai?: string
          vi_tri: string
          yeu_cau_chinh?: string | null
        }
        Update: {
          chi_nhanh_id?: string | null
          han_can_nhan_su?: string | null
          id?: string
          loai_tuyen?: string
          ly_do_tu_choi?: string | null
          ma?: string
          muc_luong?: string | null
          ngay_hoan_thanh?: string | null
          ngay_tiep_nhan?: string | null
          nguoi_tiep_nhan_id?: string | null
          nguoi_yeu_cau_id?: string | null
          so_luong?: number
          tao_luc?: string
          thay_the_cho?: string | null
          trang_thai?: string
          vi_tri?: string
          yeu_cau_chinh?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "yeu_cau_tuyen_dung_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yeu_cau_tuyen_dung_nguoi_tiep_nhan_id_fkey"
            columns: ["nguoi_tiep_nhan_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yeu_cau_tuyen_dung_nguoi_yeu_cau_id_fkey"
            columns: ["nguoi_yeu_cau_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_cong_no_ncc: {
        Row: {
          con_no: number | null
          hoat_dong: boolean | null
          ma: string | null
          ncc_id: string | null
          so_ngay_no: number | null
          ten: string | null
          thanh_toan_cuoi: string | null
          tong_hoa_don: number | null
        }
        Relationships: []
      }
      v_doanh_so_dong: {
        Row: {
          chi_nhanh_id: string | null
          doanh_so: number | null
          dong_id: string | null
          hoa_don_id: string | null
          loai: string | null
          muc_id: string | null
          ngay_hd: string | null
          so_luong: number | null
          ten: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hoa_don_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
        ]
      }
      v_hd_doanh_thu: {
        Row: {
          chi_nhanh_id: string | null
          hoa_don_id: string | null
          ngay_hd: string | null
          tong_don: number | null
          tru_the: number | null
        }
        Insert: {
          chi_nhanh_id?: string | null
          hoa_don_id?: string | null
          ngay_hd?: string | null
          tong_don?: number | null
          tru_the?: never
        }
        Update: {
          chi_nhanh_id?: string | null
          hoa_don_id?: string | null
          ngay_hd?: string | null
          tong_don?: number | null
          tru_the?: never
        }
        Relationships: [
          {
            foreignKeyName: "hoa_don_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
        ]
      }
      v_khach_hang: {
        Row: {
          cap_nhat_luc: string | null
          chi_12_thang: number | null
          chi_nhanh_id: string | null
          danh_dau_mat: boolean | null
          dia_chi: string | null
          diem_goc: number | null
          dien_thoai: string | null
          dong_y_dung_hinh: boolean | null
          dong_y_dung_hinh_luc: string | null
          email: string | null
          ghi_chu: string | null
          gioi_tinh: string | null
          hang: string | null
          hang_goc: string | null
          ho_ten: string | null
          id: string | null
          lan_den_cuoi: string | null
          ma: string | null
          ngay_sinh: string | null
          nguoi_gioi_thieu_id: string | null
          nguoi_phu_trach_id: string | null
          nguon: string | null
          nguon_chi_tiet: string | null
          sh_id: number | null
          so_lan_den_goc: number | null
          so_the_dang_dung: number | null
          tao_boi: string | null
          tao_luc: string | null
          tong_chi_goc: number | null
          trang_thai: string | null
          zalo: string | null
        }
        Relationships: [
          {
            foreignKeyName: "khach_hang_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_hang_hang_goc_fkey"
            columns: ["hang_goc"]
            isOneToOne: false
            referencedRelation: "hang_khach"
            referencedColumns: ["ten"]
          },
          {
            foreignKeyName: "khach_hang_nguoi_gioi_thieu_id_fkey"
            columns: ["nguoi_gioi_thieu_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_hang_nguoi_gioi_thieu_id_fkey"
            columns: ["nguoi_gioi_thieu_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_hang_nguoi_phu_trach_id_fkey"
            columns: ["nguoi_phu_trach_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "khach_hang_tao_boi_fkey"
            columns: ["tao_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      v_phieu_cap_lech: {
        Row: {
          bac_si_id: string | null
          bac_si_xac_nhan_id: string | null
          chi_nhanh_id: string | null
          dich_vu_id: string | null
          dinh_muc: number | null
          dong_id: string | null
          dung_that: number | null
          gia_tri_dung: number | null
          ktv_id: string | null
          lam_xong_luc: string | null
          lech_pct: number | null
          ly_do_vuot: string | null
          ma_phieu: string | null
          nhom_cap: string | null
          phieu_id: string | null
          san_pham_id: string | null
          so_cap: number | null
          so_tra: number | null
          ten_vat_tu: string | null
          trang_thai: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phieu_cap_bac_si_id_fkey"
            columns: ["bac_si_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
      v_hoa_don_loc: {
        Row: {
          chi_nhanh_id: string | null
          chot_luc: string | null
          con_no: number | null
          da_thu: number | null
          dung_the_lan: boolean | null
          ghi_chu: string | null
          giam_diem: number | null
          giam_gia_don: number | null
          giam_voucher: number | null
          hinh_thuc: string[] | null
          id: string | null
          khach_id: string | null
          la_lich_su: boolean | null
          la_so_du_dau: boolean | null
          ly_do_huy: string | null
          ma: string | null
          mua_the_lan: boolean | null
          mua_the_tien: boolean | null
          ngay_hd: string | null
          nguoi_lap_id: string | null
          nv_ban: string[] | null
          nv_phuc_vu: string[] | null
          nv_tu_van: string[] | null
          phu_phi: number | null
          sh_ma: string | null
          tao_luc: string | null
          thu_ngan_ten: string | null
          tien_tru_the: number | null
          tip: number | null
          tong_hang: number | null
          tong_phai_thu: number | null
          trang_thai: string | null
          vat_hd_ky_hieu: string | null
          vat_hd_luc: string | null
          vat_hd_so: string | null
          vat_pct: number | null
          vat_tien: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hoa_don_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoa_don_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoa_don_nguoi_lap_id_fkey"
            columns: ["nguoi_lap_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
            foreignKeyName: "phieu_cap_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_cap_dich_vu_id_fkey"
            columns: ["dich_vu_id"]
            isOneToOne: false
            referencedRelation: "dich_vu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_cap_dong_bac_si_xac_nhan_id_fkey"
            columns: ["bac_si_xac_nhan_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_cap_dong_phieu_id_fkey"
            columns: ["phieu_id"]
            isOneToOne: false
            referencedRelation: "phieu_cap"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_cap_dong_san_pham_id_fkey"
            columns: ["san_pham_id"]
            isOneToOne: false
            referencedRelation: "san_pham"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phieu_cap_ktv_id_fkey"
            columns: ["ktv_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      v_so_quy: {
        Row: {
          bien_dong: number | null
          chi_nhanh_id: string | null
          da_dao: boolean | null
          doi_tuong: string | null
          id: string | null
          loai: string | null
          loai_quy: string | null
          loai_thu_chi: string | null
          ma: string | null
          ngay: string | null
          nguoi_id: string | null
          nguon: string | null
          noi_dung: string | null
          phieu_goc_id: string | null
          quy_id: string | null
          so_tien: number | null
          sua_duoc: boolean | null
          tao_luc: string | null
        }
        Relationships: []
      }
      v_the_khach: {
        Row: {
          cap_tay: boolean | null
          chi_nhanh_id: string | null
          ghi_chu: string | null
          gia_tri_buoi: number | null
          goi_id: string | null
          han_dung: string | null
          hoa_don_dong_id: string | null
          id: string | null
          khach_id: string | null
          loai: string | null
          ma: string | null
          ngay_cap: string | null
          sh_id: number | null
          so_buoi_con: number | null
          so_buoi_tong: number | null
          so_du_tien: number | null
          tao_luc: string | null
          tinh_trang: string | null
          tong_tien: number | null
          trang_thai: string | null
        }
        Relationships: [
          {
            foreignKeyName: "the_khach_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "the_khach_goi_id_fkey"
            columns: ["goi_id"]
            isOneToOne: false
            referencedRelation: "goi_the"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "the_khach_hoa_don_dong_id_fkey"
            columns: ["hoa_don_dong_id"]
            isOneToOne: false
            referencedRelation: "hoa_don_dong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "the_khach_hoa_don_dong_id_fkey"
            columns: ["hoa_don_dong_id"]
            isOneToOne: false
            referencedRelation: "v_doanh_so_dong"
            referencedColumns: ["dong_id"]
          },
          {
            foreignKeyName: "the_khach_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "khach_hang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "the_khach_khach_id_fkey"
            columns: ["khach_id"]
            isOneToOne: false
            referencedRelation: "v_khach_hang"
            referencedColumns: ["id"]
          },
        ]
      }
      v_ton_kho: {
        Row: {
          chi_nhanh_id: string | null
          don_vi: string | null
          duoi_muc_toi_thieu: boolean | null
          ma: string | null
          nhom_cap: string | null
          san_pham_id: string | null
          ten: string | null
          ton: number | null
          ton_toi_thieu: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kho_so_cai_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kho_so_cai_san_pham_id_fkey"
            columns: ["san_pham_id"]
            isOneToOne: false
            referencedRelation: "san_pham"
            referencedColumns: ["id"]
          },
        ]
      }
      v_ton_lo: {
        Row: {
          chi_nhanh_id: string | null
          con_lai: number | null
          han_dung: string | null
          nhap: number | null
          san_pham_id: string | null
          so_lo: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kho_so_cai_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kho_so_cai_san_pham_id_fkey"
            columns: ["san_pham_id"]
            isOneToOne: false
            referencedRelation: "san_pham"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      chuan_don_vi: { Args: { p: string }; Returns: string }
      bao_cao_sang_tinh: {
        Args: { p_cn?: string; p_ngay?: string }
        Returns: Json
      }
      bc_ban_san_pham: {
        Args: {
          p_cn?: string
          p_den: string
          p_so?: number
          p_tim?: string
          p_tong?: boolean
          p_tu: string
          p_tu_dong?: number
        }
        Returns: {
          doanh_thu: number
          gia_1sp: number
          gia_sau: number
          gia_von: number
          hoa_don_id: string
          khoa: string
          loi_nhuan: number
          ma: string
          ma_hd: string
          san_pham_id: string
          so_luong: number
          ten: string
          thoi_gian: string
          tong_doanh_thu: number
          tong_dong: number
          tong_nhap: number
        }[]
      }
      bc_cac_lan_tra_no: {
        Args: {
          p_cn?: string
          p_den: string
          p_so?: number
          p_tim?: string
          p_tu: string
          p_tu_dong?: number
        }
        Returns: {
          chi_nhanh: string
          dien_thoai: string
          hoa_don_id: string
          khach: string
          khach_id: string
          ma_hd: string
          ngay: string
          nguoi_thu: string
          phuong_thuc: string
          so_tien: number
          thanh_toan_id: string
          tong_dong: number
          tong_hd: number
          tong_tien: number
        }[]
      }
      bc_chi_phi_dich_vu: {
        Args: {
          p_cn?: string
          p_den: string
          p_dv?: string
          p_nv?: string
          p_so?: number
          p_tim?: string
          p_tu: string
          p_tu_dong?: number
        }
        Returns: {
          chi_nhanh: string
          chi_nhanh_id: string
          chi_phi: number
          ma: string
          san_pham_id: string
          so_lan: number
          so_luong: number
          ten: string
          tong_chi_phi: number
          tong_dong: number
        }[]
      }
      bc_chi_phi_dich_vu_ct: {
        Args: {
          p_cn: string
          p_den: string
          p_dv?: string
          p_nv?: string
          p_sp: string
          p_tu: string
        }
        Returns: {
          chi_phi: number
          dich_vu: string
          ma: string
          ngay: string
          nguoi_lam: string
          phieu_id: string
          so_luong: number
        }[]
      }
      bc_dat_lich: {
        Args: { p_cn?: string; p_den: string; p_nhom?: string; p_tu: string }
        Returns: {
          chieu: string
          chua_den: number
          hoan_thanh: number
          huy: number
          khoa: string
          khong_den: number
          nhan: string
          so_lich: number
        }[]
      }
      bc_doanh_thu_chi_so: {
        Args: { p_cn?: string; p_den: string; p_tu: string }
        Returns: {
          ban_moi: number
          ck_ban: number
          ck_no: number
          no_moi_chua_thu: number
          qt_ban: number
          qt_no: number
          so_don: number
          so_voucher: number
          thu_no: number
          thu_no_ngoai_ky: number
          thu_no_trong_ky: number
          tip: number
          tm_ban: number
          tm_no: number
          tru_the_tien: number
          tru_voucher: number
          vat: number
        }[]
      }
      bc_doanh_thu_ngay: {
        Args: { p_cn?: string; p_den: string; p_tu: string }
        Returns: {
          chuyen_khoan: number
          doanh_thu: number
          doanh_thu_buoi: number
          ngay: string
          no_moi: number
          quet_the: number
          so_buoi: number
          so_don: number
          thu_don_moi: number
          thu_no_cu: number
          thuc_thu: number
          tien_mat: number
          tru_the_tien: number
        }[]
      }
      bc_doi_soat_san_pham: {
        Args: { p_cn?: string; p_den: string; p_tu: string }
        Returns: {
          chenh_lech: number
          doanh_thu: number
          don_vi: string
          gia_von: number
          ma: string
          san_pham_id: string
          sl_ban: number
          sl_huy: number
          sl_xuat_kho: number
          ten: string
        }[]
      }
      bc_dung_dich_vu: {
        Args: { p_cn?: string; p_den: string; p_nhom?: string; p_tu: string }
        Returns: {
          chieu: string
          doanh_so: number
          gia_tri_the: number
          khoa: string
          luot_the: number
          luot_tien: number
          nhan: string
        }[]
      }
      bc_hoa_hong_doi_chieu: {
        Args: { p_cn?: string; p_den: string; p_tu: string }
        Returns: {
          con_no_cuoi_ky: number
          khac: number
          theo_hoa_don: number
          thu_no_cu: number
          thuc_thu_don_moi: number
          tru_the_don_moi: number
          tru_the_no_cu: number
        }[]
      }
      bc_hoa_hong_gioi_thieu: {
        Args: { p_cn?: string; p_den: string; p_tu: string }
        Returns: {
          doanh_so: number
          hoa_hong: number
          nguoi_dt: string
          nguoi_khoa: string
          nguoi_ma: string
          nguoi_ten: string
          nguon: string
          so_hd: number
        }[]
      }
      bc_hoa_hong_thuc_thu: {
        Args: { p_cn?: string; p_den: string; p_tu: string }
        Returns: {
          chi_nhanh_id: string
          doanh_so_the: number
          doanh_so_tien: number
          hoa_hong_the: number
          hoa_hong_tien: number
          nguon: string
          nhan_vien_id: string
          so_hd: number
          vai: string
        }[]
      }
      bc_kho_nhap: {
        Args: {
          p_cn?: string
          p_den: string
          p_ncc?: string
          p_nguon?: string
          p_so?: number
          p_tim?: string
          p_tong?: boolean
          p_tu: string
          p_tu_dong?: number
        }
        Returns: {
          gia_nhap: number
          giam_gia: number
          han: string
          khoa: string
          lo: string
          ma: string
          ma_phieu: string
          ncc: string
          nhom: string
          san_pham_id: string
          so_luong: number
          ten: string
          thoi_gian: string
          tong_chi_phi: number
          tong_dong: number
          tong_tien: number
        }[]
      }
      bc_kho_nhap_xuat: {
        Args: {
          p_cn?: string
          p_den: string
          p_nhom?: string
          p_so?: number
          p_tim?: string
          p_tu: string
          p_tu_dong?: number
        }
        Returns: {
          cuoi: number
          dau: number
          gia_ban: number
          gia_nhap_tb: number
          gia_von: number
          ma: string
          nhap: number
          nhap_cd: number
          nhom: string
          san_pham_id: string
          ten: string
          tong_cuoi: number
          tong_dau: number
          tong_dong: number
          tong_nhap: number
          tong_xuat: number
          xuat: number
          xuat_cd: number
        }[]
      }
      bc_kho_xuat: {
        Args: {
          p_cn?: string
          p_den: string
          p_loai?: string
          p_so?: number
          p_tim?: string
          p_tong?: boolean
          p_tu: string
          p_tu_dong?: number
        }
        Returns: {
          gia_tb: number
          gia_von: number
          han: string
          khoa: string
          lo: string
          ma: string
          ma_phieu: string
          nguoi_nhan: string
          nhom: string
          phan_loai: string
          san_pham_id: string
          so_luong: number
          ten: string
          thoi_gian: string
          tong_dong: number
        }[]
      }
      bc_lich_su_dung_the: {
        Args: {
          p_cn?: string
          p_den: string
          p_loai?: string
          p_so?: number
          p_ten_the?: string
          p_tim?: string
          p_tu: string
          p_tu_dong?: number
        }
        Returns: {
          chi_nhanh: string
          dien_thoai: string
          hoa_don_id: string
          khach: string
          khach_id: string
          loai_the: string
          ma_hd: string
          ma_the: string
          ngay: string
          so_lan: number
          ten_the: string
          tien: number
          tong_dong: number
          tong_lan: number
          tong_tien: number
        }[]
      }
      bc_muc_ban: {
        Args: { p_cn?: string; p_den: string; p_tu: string }
        Returns: {
          doanh_so: number
          loai: string
          muc_id: string
          so_luong: number
          ten: string
        }[]
      }
      bc_nhan_vien: {
        Args: { p_cn?: string; p_den: string; p_tu: string }
        Returns: {
          doanh_so: number
          hoa_hong: number
          nhan_vien_id: string
          so_dong: number
          vai: string
        }[]
      }
      bc_nhan_vien_sh: {
        Args: { p_cn?: string; p_den: string; p_tu: string }
        Returns: {
          ds_dich_vu: number
          ds_san_pham: number
          ds_the: number
          ds_tu_van: number
          ho_ten: string
          nhan_vien_id: string
          so_phuc_vu: number
          so_san_pham: number
          so_the: number
          so_tu_van: number
        }[]
      }
      bc_phan_bo: {
        Args: { p_cn?: string }
        Returns: {
          nhan: string
          nhom: string
          so: number
          tien: number
        }[]
      }
      bc_phieu_marketing: {
        Args: { p_cn?: string; p_den: string; p_tu: string }
        Returns: {
          co_hoa_don: number
          da_dat_lich: number
          da_lien_he: number
          hop_le: number
          khach_den: number
          nguon_id: string
          so_lead: number
          thuc_thu: number
        }[]
      }
      bc_san_pham_dich_vu: {
        Args: { p_cn?: string; p_den: string; p_tu: string }
        Returns: {
          loai: string
          ma: string
          sau: number
          so_luong: number
          ten: string
          thuc_nhan: number
          tru_the: number
          truoc: number
        }[]
      }
      bc_the_con_du: {
        Args: { p_cn?: string }
        Returns: {
          du_tien: number
          gia_tri_buoi: number
          so_buoi: number
          so_the_khong_gioi_han: number
          so_the_lan: number
          so_the_tien: number
        }[]
      }
      bc_theo_chi_nhanh: {
        Args: { p_den: string; p_tu: string }
        Returns: {
          chi_nhanh_id: string
          ck_ban: number
          ck_no: number
          con_no: number
          da_thu: number
          doanh_thu: number
          so_don: number
          so_nhan_vien: number
          ten: string
          tm_ban: number
          tm_no: number
        }[]
      }
      bc_theo_khach_hang: {
        Args: {
          p_cn?: string
          p_den: string
          p_hang?: string
          p_nhom?: string[]
          p_so?: number
          p_tim?: string
          p_tu: string
          p_tu_dong?: number
        }
        Returns: {
          dien_thoai: string
          doanh_thu: number
          hang: string
          ho_ten: string
          khach_id: string
          la_moi: boolean
          ma: string
          no_moi: number
          so_don: number
          t_doanh_thu: number
          t_dt_cu: number
          t_dt_moi: number
          t_khach: number
          t_khach_cu: number
          t_khach_moi: number
          t_thu_cu: number
          t_thu_moi: number
          t_thu_no: number
          t_thuc_thu: number
          thu_no: number
          thuc_thu: number
          tong_dong: number
        }[]
      }
      bc_thu_ngan: {
        Args: { p_cn?: string; p_den: string; p_nhom?: string; p_tu: string }
        Returns: {
          cac_ten: string
          con_no: number
          da_thu: number
          doanh_so: number
          doanh_thu: number
          khoa: string
          ky: string
          so_don: number
          thu_ngan: string
          tru_the_tien: number
        }[]
      }
      bc_ti_le_chot: {
        Args: { p_cn?: string; p_den: string; p_tu: string }
        Returns: {
          cho_chot: number
          chot: number
          khong_chot: number
          so_phieu: number
          tong_bao_gia: number
          tong_bao_gia_chot: number
          tu_van_vien_id: string
        }[]
      }
      bc_ton_theo_lo: {
        Args: {
          p_cn?: string
          p_han?: string
          p_so?: number
          p_tim?: string
          p_tt?: string
          p_tu_dong?: number
        }
        Returns: {
          chi_nhanh: string
          han: string
          khoa: string
          lo: string
          ma: string
          nhap: number
          san_pham_id: string
          ten: string
          ton: number
          tong_dong: number
          xuat: number
        }[]
      }
      bo_dau: { Args: { s: string }; Returns: string }
      cap_phieu: { Args: { p_id: string; p_nguoi: string }; Returns: undefined }
      cap_them_phieu: {
        Args: {
          p_bac_si_xn: string
          p_id: string
          p_ly_do: string
          p_nguoi: string
          p_san_pham: string
          p_so_luong: number
        }
        Returns: undefined
      }
      cau_hinh_so: {
        Args: { p_khoa: string; p_mac_dinh: number }
        Returns: number
      }
      cham_soc_hien: {
        Args: { p_cn?: string; p_loai?: string; p_sau_dt?: number }
        Returns: {
          chi_nhanh_id: string
          hang: string
          hen_ngay: string
          khach_id: string
          lich_id: string
          loai: string
          moc: number
          ngay_goc: string
        }[]
      }
      cham_soc_ung_vien: {
        Args: { p_cn?: string; p_loai?: string; p_sau_dt?: number }
        Returns: {
          chi_nhanh_id: string
          khach_id: string
          lich_id: string
          loai: string
          moc: number
          ngay_goc: string
        }[]
      }
      chi_ky_luong: {
        Args: {
          p_bo_qua_kiem?: boolean
          p_ky: string
          p_ngay: string
          p_nguoi: string
          p_quy: string
        }
        Returns: undefined
      }
      chi_theo_de_xuat: {
        Args: {
          p_bo_qua_kiem?: boolean
          p_de_xuat: string
          p_loai_thu_chi: string
          p_ngay: string
          p_nguoi: string
          p_quy: string
        }
        Returns: undefined
      }
      chot_hoa_don: {
        Args: { p_id: string; p_nguoi: string }
        Returns: undefined
      }
      chot_hoa_don_doi_diem: {
        Args: { p_diem: number; p_id: string; p_nguoi: string; p_tien: number }
        Returns: undefined
      }
      chot_hoa_don_voucher: {
        Args: {
          p_diem: number
          p_id: string
          p_ma: string
          p_nguoi: string
          p_tien_diem: number
          p_tien_voucher: number
        }
        Returns: undefined
      }
      con_cho_online: {
        Args: { p_bd: string; p_cn: string; p_kt: string }
        Returns: boolean
      }
      cong_chuan_thang: {
        Args: { p_khung: string; p_nam: number; p_thang: number }
        Returns: number
      }
      dem_cham_soc: {
        Args: { p_cn?: string; p_sau_dt?: number }
        Returns: {
          hang: string
          so: number
        }[]
      }
      diem_du_kien_hoa_don: {
        Args: { p_hoa_don: string }
        Returns: {
          diem: number
          hang: string
          so_tien: number
        }[]
      }
      diem_ra_tien: {
        Args: { p_diem: number; p_hang: string }
        Returns: number
      }
      diem_tich_duoc: {
        Args: { p_hang: string; p_so_tien: number }
        Returns: number
      }
      doi_chieu_phieu: {
        Args: { p_id: string; p_nguoi: string }
        Returns: undefined
      }
      ds_cham_soc: {
        Args: {
          p_cn?: string
          p_loai: string
          p_sau_dt?: number
          p_so?: number
          p_tu?: number
        }
        Returns: {
          chi_nhanh_id: string
          dich_vu: string
          dien_thoai: string
          gio: string
          goi_chi_tiet: string
          goi_luc: string
          goi_nguoi: string
          goi_noi_dung: string
          goi_tt: string
          hang: string
          hen_ngay: string
          ho_ten: string
          khach_id: string
          lich_id: string
          lich_tt: string
          loai: string
          ma: string
          moc: number
          ngay_goc: string
          so_lan_goi: number
          tong: number
        }[]
      }
      ds_tai_kham: {
        Args: {
          p_bao_truoc?: number
          p_cn?: string
          p_gioi_han?: number
          p_khach?: string
          p_tre_toi_da?: number
        }
        Returns: {
          chi_nhanh_id: string
          den_han: string
          dien_thoai: string
          ghi_chu: string
          han_dung: string
          ho_ten: string
          khach_id: string
          khoang_cach: number
          khong_gioi_han: boolean
          lan_cuoi: string
          ma: string
          ma_the: string
          nhac_id: string
          so_buoi_con: number
          so_ngay_tre: number
          so_the: number
          ten_goi: string
          the_id: string
          tong: number
          trang_thai: string
        }[]
      }
      ds_the_sap_het: {
        Args: {
          p_buoi?: number
          p_cn?: string
          p_gioi_han?: number
          p_khach?: string
          p_ngay?: number
        }
        Returns: {
          chi_nhanh_id: string
          dien_thoai: string
          han_dung: string
          ho_ten: string
          khach_id: string
          loai: string
          ly_do: string
          ma: string
          ma_the: string
          ngay_cap: string
          so_buoi_con: number
          so_du_tien: number
          so_ngay_con: number
          ten_goi: string
          the_id: string
          tong: number
        }[]
      }
      dung_luong_kho_anh_mb: { Args: never; Returns: number }
      duyet_phieu_kiem_ke: {
        Args: { p_bo_qua_kiem?: boolean; p_nguoi: string; p_phieu: string }
        Returns: undefined
      }
      duyet_xu_ly_vat_tu: {
        Args: { p_bo_qua_kiem?: boolean; p_id: string; p_nguoi: string }
        Returns: undefined
      }
      duyet_yeu_cau_dat_lich: {
        Args: { p_id: string; p_nguoi: string }
        Returns: string
      }
      gan_nhom_theo_loc: {
        Args: {
          p: Json
          p_ap_dung?: boolean
          p_che_do: string
          p_du_kien?: number
          p_nhom: string
        }
        Returns: Json
      }
      ghi_click_link: { Args: { p_ma: string }; Returns: string }
      ghi_danh_gia_sau_dieu_tri: {
        Args: {
          p_ghi_chu: string
          p_hoa_don: string
          p_ket_qua: string
          p_lich: string
          p_ly_do: string
          p_nguoi: string
        }
        Returns: {
          r_chi_nhanh_id: string
          r_danh_gia_id: string
          r_khieu_nai_id: string
          r_khieu_nai_moi: boolean
        }[]
      }
      gio_trong_online: {
        Args: { p_cn: string; p_ngay: string; p_phut: number }
        Returns: string[]
      }
      go_dot_hr: { Args: { p_dot: string }; Returns: Json }
      go_dot_nhap: { Args: { p_dot: string }; Returns: Json }
      gui_chuyen_kho: {
        Args: {
          p_den: string
          p_ghi_chu: string
          p_han: string
          p_lo: string
          p_nguoi: string
          p_sl: number
          p_sp: string
          p_tu: string
        }
        Returns: string
      }
      gui_yeu_cau_dat_lich: {
        Args: {
          p_bat_dau: string
          p_cn: string
          p_dv: string[]
          p_ghi_chu: string
          p_ho_ten: string
          p_ip_bam: string
          p_sdt: string
        }
        Returns: string
      }
      hh_cai: {
        Args: { p_loai: string; p_muc: string; p_nv?: string; p_vai: string }
        Returns: {
          so_tien: number
          ti_le: number
        }[]
      }
      hh_sao_chep: {
        Args: {
          p_dich_khoa: string
          p_dich_kieu: string
          p_ghi_de?: boolean
          p_nguon_khoa: string
          p_nguon_kieu: string
        }
        Returns: {
          ghi_de: number
          giu_nguyen: number
          them: number
        }[]
      }
      hh_ti_le: {
        Args: { p_loai: string; p_muc: string; p_nv?: string; p_vai: string }
        Returns: number
      }
      hh_tinh: {
        Args: {
          p_doanh_so: number
          p_loai: string
          p_muc: string
          p_nv?: string
          p_so_luong: number
          p_vai: string
        }
        Returns: number
      }
      hh_xem_truoc_sao_chep: {
        Args: {
          p_dich_khoa: string
          p_dich_kieu: string
          p_nguon_khoa: string
          p_nguon_kieu: string
        }
        Returns: {
          hanh_dong: string
          loai: string
          muc_id: string
          so_tien: number
          so_tien_cu: number
          ti_le: number
          ti_le_cu: number
          vai: string
        }[]
      }
      hoan_tat_phieu: {
        Args: { p_dem_sau: number; p_dong: Json; p_id: string; p_nguoi: string }
        Returns: undefined
      }
      hom_nay: { Args: never; Returns: string }
      huy_buoi: {
        Args: { p_buoi: string; p_ly_do: string; p_nguoi: string }
        Returns: undefined
      }
      huy_chuyen_kho: {
        Args: { p_nguoi: string; p_phieu: string }
        Returns: undefined
      }
      huy_hoa_don: {
        Args: { p_id: string; p_ly_do: string; p_nguoi: string }
        Returns: undefined
      }
      huy_phieu: {
        Args: { p_id: string; p_ly_do: string; p_nguoi: string }
        Returns: undefined
      }
      khach_cho_lich: {
        Args: { p_ids: string[] }
        Returns: {
          dien_thoai: string
          hang: string
          ho_ten: string
          id: string
          ma: string
          nguoi_phu_trach_id: string
        }[]
      }
      khoa_ky: {
        Args: { p_ghi_chu: string; p_nguoi: string; p_thang: string }
        Returns: undefined
      }
      khoa_tat_ca_bang: { Args: never; Returns: undefined }
      kiem_kho_xuat: {
        Args: {
          p_chan_het_ton: boolean
          p_cn: string
          p_sl: number
          p_sp: string
          p_ten: string
        }
        Returns: undefined
      }
      kiem_token_cron: { Args: { p: string }; Returns: boolean }
      loc_khach: {
        Args: { p: Json; p_so?: number; p_tu?: number }
        Returns: {
          dong: Json
          tong: number
        }[]
      }
      luu_bao_cao_sang: { Args: { p_ngay?: string }; Returns: number }
      mo_lai_ky: {
        Args: { p_ly_do: string; p_nguoi: string; p_thang: string }
        Returns: undefined
      }
      nhan_chuyen_kho: {
        Args: {
          p_ly_do: string
          p_nguoi: string
          p_phieu: string
          p_sl_thuc: number
        }
        Returns: undefined
      }
      nhan_hang_don_mua: {
        Args: { p_don: string; p_dong: Json; p_nguoi: string }
        Returns: undefined
      }
      nhan_phieu: {
        Args: { p_dem_truoc: number; p_id: string; p_nguoi: string }
        Returns: undefined
      }
      so_du_phep: { Args: { p_nam: number; p_nv: string }; Returns: number }
      so_lieu_khach: { Args: never; Returns: Json }
      so_quy_tong: {
        Args: { p_den: string; p_quy: string[]; p_tu: string }
        Returns: {
          chi: number
          dau: number
          hien_tai: number
          nap: number
          rut: number
          thu: number
        }[]
      }
      so_tiep_theo: { Args: { p_khoa: string }; Returns: number }
      tao_phieu_cap: {
        Args: {
          p_bac_si: string
          p_chi_dinh: Json
          p_chi_nhanh: string
          p_dich_vu: string
          p_khach: string
          p_ktv: string
          p_lich: string
          p_nguoi: string
        }
        Returns: string
      }
      tao_phieu_kiem_ke: {
        Args: {
          p_cn: string
          p_ghi_chu: string
          p_loai: string
          p_ngay: string
          p_nguoi: string
          p_nguoi_2: string
        }
        Returns: string
      }
      thanh_toan_ncc: {
        Args: {
          p_ghi_chu: string
          p_ncc: string
          p_ngay: string
          p_nguoi: string
          p_quy: string
          p_so_tien: number
        }
        Returns: undefined
      }
      thong_ke_khach: { Args: never; Returns: Json }
      tong_khach_dung_the: { Args: { p_cap_den?: string; p_cap_tu?: string; p_cn?: string; p_han_den?: string; p_han_tu?: string; p_hom?: string; p_loai?: string; p_nhom?: string; p_sdt?: string; p_tim?: string; p_tim_kd?: string; p_tt?: string }; Returns: Json }
      the_dung_loc: { Args: { p_cap_den?: string; p_cap_tu?: string; p_cn?: string; p_han_den?: string; p_han_tu?: string; p_hom?: string; p_loai?: string; p_nhom?: string; p_sdt?: string; p_tim?: string; p_tim_kd?: string; p_tt?: string }; Returns: Database["public"]["Views"]["v_the_khach"]["Row"][] }
      the_gan_nhat: { Args: { p_ids: string[] }; Returns: { ngay: string; the_id: string }[] }
      dem_the_sap_het_han: { Args: { p_cn?: string; p_hom?: string }; Returns: Json }
      khach_gan_den: { Args: { p_cn?: string; p_lim?: number; p_off?: number }; Returns: { hd_id: string; hd_ma: string; khach_id: string; ngay: string; tien: number; tong: number }[] }
      thong_ke_khach_ngay: { Args: { p_so_ngay?: number }; Returns: Json }
      thuc_hien_buoi: {
        Args: {
          p_bac_si: string
          p_dich_vu: string
          p_ghi_chu: string
          p_lich: string
          p_ngay: string
          p_nguoi: string
          p_nv: string
          p_tham_so: Json
          p_the: string
        }
        Returns: string
      }
      thue_luy_tien: { Args: { p_tntt: number }; Returns: number }
      tinh_giam_voucher: {
        Args: { p_hoa_don: string; p_voucher: string }
        Returns: number
      }
      tinh_ky_luong: { Args: { p_ky: string }; Returns: number }
      tinh_lai_hoa_don: { Args: { p_id: string }; Returns: undefined }
      ton_kho: {
        Args: { p_chi_nhanh: string; p_san_pham: string }
        Returns: number
      }
      tong_hop_cong: {
        Args: { p_cn?: string; p_nam: number; p_thang: number }
        Returns: {
          cong_chuan: number
          cong_di_lam: number
          cong_tac: number
          cong_tinh_luong: number
          cong_tru_tre: number
          khung: string
          ngay_vang: number
          nghi_khong_luong: number
          nghi_le: number
          nhan_vien_id: string
          ot_gio: number
          phep_co_luong: number
          phut_tre: number
          phut_ve_som: number
          so_lan_tre: number
          so_lan_ve_som: number
        }[]
      }
      top_ban_thang: {
        Args: { p_cn?: string; p_tu: string }
        Returns: {
          nhom: string
          so: number
          ten: string
          tien: number
        }[]
      }
      top_khach_chi_12_thang: {
        Args: { p_cn?: string; p_so?: number }
        Returns: {
          chi: number
          ho_ten: string
        }[]
      }
      tuy_chon_loc_khach: { Args: never; Returns: Json }
      voucher_loai_dong: { Args: { p_gioi_han: string }; Returns: string[] }
      xu_ly_lech_chuyen_kho: {
        Args: { p_cach: string; p_nguoi: string; p_phieu: string }
        Returns: undefined
      }
      xuat_khan_cap: {
        Args: {
          p_cn: string
          p_de_nghi: string
          p_han: string
          p_khach: string
          p_lo: string
          p_ly_do: string
          p_nguoi: string
          p_nhan: string
          p_quyet_dinh: string
          p_sl: number
          p_sp: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
