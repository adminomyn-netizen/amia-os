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
      chi_nhanh: {
        Row: {
          dia_chi: string | null
          dien_thoai: string | null
          hoat_dong: boolean
          id: string
          ma: string
          tao_luc: string
          ten: string
        }
        Insert: {
          dia_chi?: string | null
          dien_thoai?: string | null
          hoat_dong?: boolean
          id?: string
          ma: string
          tao_luc?: string
          ten: string
        }
        Update: {
          dia_chi?: string | null
          dien_thoai?: string | null
          hoat_dong?: boolean
          id?: string
          ma?: string
          tao_luc?: string
          ten?: string
        }
        Relationships: []
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
        Relationships: []
      }
      dich_vu: {
        Row: {
          don_vi_tinh: string
          gia: number
          gia_von: number
          hoat_dong: boolean
          id: string
          ma: string
          nhom_id: string
          tao_luc: string
          ten: string
          thoi_luong_phut: number
          vat_pct: number
        }
        Insert: {
          don_vi_tinh?: string
          gia?: number
          gia_von?: number
          hoat_dong?: boolean
          id?: string
          ma: string
          nhom_id: string
          tao_luc?: string
          ten: string
          thoi_luong_phut?: number
          vat_pct?: number
        }
        Update: {
          don_vi_tinh?: string
          gia?: number
          gia_von?: number
          hoat_dong?: boolean
          id?: string
          ma?: string
          nhom_id?: string
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
          ten: string
          thu_tu: number
        }
        Insert: {
          id?: string
          ten: string
          thu_tu?: number
        }
        Update: {
          id?: string
          ten?: string
          thu_tu?: number
        }
        Relationships: []
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
      dong_nhan_vien: {
        Row: {
          dong_id: string
          nhan_vien_id: string
          ti_le: number
          vai: string
        }
        Insert: {
          dong_id: string
          nhan_vien_id: string
          ti_le: number
          vai: string
        }
        Update: {
          dong_id?: string
          nhan_vien_id?: string
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
        ]
      }
      goi_the: {
        Row: {
          gia: number
          gia_tri_the: number | null
          han_dung_ngay: number | null
          hoat_dong: boolean
          id: string
          loai: string
          ma: string
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
          loai: string
          ma: string
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
          loai?: string
          ma?: string
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
      hoa_don: {
        Row: {
          chi_nhanh_id: string
          chot_luc: string | null
          con_no: number
          da_thu: number
          ghi_chu: string | null
          giam_gia_don: number
          huy_luc: string | null
          id: string
          khach_id: string | null
          lich_hen_id: string | null
          ly_do_huy: string | null
          ma: string
          ngay_hd: string
          nguoi_gioi_thieu_id: string | null
          nguoi_lap_id: string
          phu_phi: number
          tao_luc: string
          tip: number
          tong_hang: number
          tong_phai_thu: number
          trang_thai: string
          vat_pct: number
          vat_tien: number
        }
        Insert: {
          chi_nhanh_id: string
          chot_luc?: string | null
          con_no?: number
          da_thu?: number
          ghi_chu?: string | null
          giam_gia_don?: number
          huy_luc?: string | null
          id?: string
          khach_id?: string | null
          lich_hen_id?: string | null
          ly_do_huy?: string | null
          ma: string
          ngay_hd?: string
          nguoi_gioi_thieu_id?: string | null
          nguoi_lap_id: string
          phu_phi?: number
          tao_luc?: string
          tip?: number
          tong_hang?: number
          tong_phai_thu?: number
          trang_thai?: string
          vat_pct?: number
          vat_tien?: number
        }
        Update: {
          chi_nhanh_id?: string
          chot_luc?: string | null
          con_no?: number
          da_thu?: number
          ghi_chu?: string | null
          giam_gia_don?: number
          huy_luc?: string | null
          id?: string
          khach_id?: string | null
          lich_hen_id?: string | null
          ly_do_huy?: string | null
          ma?: string
          ngay_hd?: string
          nguoi_gioi_thieu_id?: string | null
          nguoi_lap_id?: string
          phu_phi?: number
          tao_luc?: string
          tip?: number
          tong_hang?: number
          tong_phai_thu?: number
          trang_thai?: string
          vat_pct?: number
          vat_tien?: number
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
          loai: string
          san_pham_id: string | null
          so_luong: number
          tao_luc: string
          ten: string
          thanh_tien: number | null
        }
        Insert: {
          dich_vu_id?: string | null
          don_gia: number
          giam_gia?: number
          goi_id?: string | null
          hoa_don_id: string
          id?: string
          loai: string
          san_pham_id?: string | null
          so_luong?: number
          tao_luc?: string
          ten: string
          thanh_tien?: number | null
        }
        Update: {
          dich_vu_id?: string | null
          don_gia?: number
          giam_gia?: number
          goi_id?: string | null
          hoa_don_id?: string
          id?: string
          loai?: string
          san_pham_id?: string | null
          so_luong?: number
          tao_luc?: string
          ten?: string
          thanh_tien?: number | null
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
          ti_le: number
          vai: string
        }
        Insert: {
          id?: string
          loai: string
          muc_id?: string | null
          ti_le: number
          vai: string
        }
        Update: {
          id?: string
          loai?: string
          muc_id?: string | null
          ti_le?: number
          vai?: string
        }
        Relationships: []
      }
      khach_anh: {
        Row: {
          duong_dan: string
          ghi_chu: string | null
          id: string
          khach_id: string
          loai: string
          ngay_chup: string
          tao_boi: string | null
          tao_luc: string
          lark_file_token: string | null
          lark_loi: string | null
          lark_record_id: string | null
          lark_so_lan: number
          lark_trang_thai: string
          lark_xong_luc: string | null
        }
        Insert: {
          duong_dan: string
          ghi_chu?: string | null
          id?: string
          khach_id: string
          loai?: string
          ngay_chup?: string
          tao_boi?: string | null
          tao_luc?: string
          lark_file_token?: string | null
          lark_loi?: string | null
          lark_record_id?: string | null
          lark_so_lan?: number
          lark_trang_thai?: string
          lark_xong_luc?: string | null
        }
        Update: {
          duong_dan?: string
          ghi_chu?: string | null
          id?: string
          khach_id?: string
          loai?: string
          ngay_chup?: string
          tao_boi?: string | null
          tao_luc?: string
          lark_file_token?: string | null
          lark_loi?: string | null
          lark_record_id?: string | null
          lark_so_lan?: number
          lark_trang_thai?: string
          lark_xong_luc?: string | null
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
      khach_ghi_chu: {
        Row: {
          bac_si_id: string | null
          id: string
          ket_qua: string | null
          khach_id: string
          phuong_an: string | null
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
          phuong_an?: string | null
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
          phuong_an?: string | null
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
            foreignKeyName: "khach_ghi_chu_tao_boi_fkey"
            columns: ["tao_boi"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      khach_hang: {
        Row: {
          cap_nhat_luc: string
          chi_nhanh_id: string
          danh_dau_mat: boolean
          dia_chi: string | null
          dien_thoai: string
          dong_y_dung_hinh: boolean
          dong_y_dung_hinh_luc: string | null
          email: string | null
          ghi_chu: string | null
          gioi_tinh: string | null
          ho_ten: string
          id: string
          ma: string
          ngay_sinh: string | null
          nguoi_gioi_thieu_id: string | null
          nguoi_phu_trach_id: string
          nguon: string
          nguon_chi_tiet: string | null
          tao_boi: string | null
          tao_luc: string
          zalo: string | null
        }
        Insert: {
          cap_nhat_luc?: string
          chi_nhanh_id: string
          danh_dau_mat?: boolean
          dia_chi?: string | null
          dien_thoai: string
          dong_y_dung_hinh?: boolean
          dong_y_dung_hinh_luc?: string | null
          email?: string | null
          ghi_chu?: string | null
          gioi_tinh?: string | null
          ho_ten: string
          id?: string
          ma: string
          ngay_sinh?: string | null
          nguoi_gioi_thieu_id?: string | null
          nguoi_phu_trach_id: string
          nguon: string
          nguon_chi_tiet?: string | null
          tao_boi?: string | null
          tao_luc?: string
          zalo?: string | null
        }
        Update: {
          cap_nhat_luc?: string
          chi_nhanh_id?: string
          danh_dau_mat?: boolean
          dia_chi?: string | null
          dien_thoai?: string
          dong_y_dung_hinh?: boolean
          dong_y_dung_hinh_luc?: string | null
          email?: string | null
          ghi_chu?: string | null
          gioi_tinh?: string | null
          ho_ten?: string
          id?: string
          ma?: string
          ngay_sinh?: string | null
          nguoi_gioi_thieu_id?: string | null
          nguoi_phu_trach_id?: string
          nguon?: string
          nguon_chi_tiet?: string | null
          tao_boi?: string | null
          tao_luc?: string
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
      khach_nguoi_than: {
        Row: {
          dien_thoai: string | null
          ho_ten: string
          id: string
          khach_id: string
          quan_he: string | null
        }
        Insert: {
          dien_thoai?: string | null
          ho_ten: string
          id?: string
          khach_id: string
          quan_he?: string | null
        }
        Update: {
          dien_thoai?: string | null
          ho_ten?: string
          id?: string
          khach_id?: string
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
      lich_hen: {
        Row: {
          bat_dau: string
          cap_nhat_luc: string
          chi_nhanh_id: string
          ghi_chu: string | null
          id: string
          ket_thuc: string
          khach_id: string
          ly_do_huy: string | null
          nguon: string | null
          nhan_vien_id: string | null
          phong: string | null
          tao_boi: string | null
          tao_luc: string
          trang_thai: string
        }
        Insert: {
          bat_dau: string
          cap_nhat_luc?: string
          chi_nhanh_id: string
          ghi_chu?: string | null
          id?: string
          ket_thuc: string
          khach_id: string
          ly_do_huy?: string | null
          nguon?: string | null
          nhan_vien_id?: string | null
          phong?: string | null
          tao_boi?: string | null
          tao_luc?: string
          trang_thai?: string
        }
        Update: {
          bat_dau?: string
          cap_nhat_luc?: string
          chi_nhanh_id?: string
          ghi_chu?: string | null
          id?: string
          ket_thuc?: string
          khach_id?: string
          ly_do_huy?: string | null
          nguon?: string | null
          nhan_vien_id?: string | null
          phong?: string | null
          tao_boi?: string | null
          tao_luc?: string
          trang_thai?: string
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
          so_luong: number
        }
        Insert: {
          dich_vu_id: string
          lich_id: string
          so_luong?: number
        }
        Update: {
          dich_vu_id?: string
          lich_id?: string
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
        ]
      }
      nhan_vien: {
        Row: {
          anh_dai_dien: string | null
          phai_doi_mat_khau: boolean
          quyen_rieng: string[] | null
          chi_nhanh_id: string | null
          chuc_danh: string | null
          dien_thoai: string | null
          email: string | null
          ho_ten: string
          hoat_dong: boolean
          id: string
          tao_luc: string
          user_id: string | null
          vai_tro: string
        }
        Insert: {
          anh_dai_dien?: string | null
          phai_doi_mat_khau?: boolean
          quyen_rieng?: string[] | null
          chi_nhanh_id?: string | null
          chuc_danh?: string | null
          dien_thoai?: string | null
          email?: string | null
          ho_ten: string
          hoat_dong?: boolean
          id?: string
          tao_luc?: string
          user_id?: string | null
          vai_tro: string
        }
        Update: {
          anh_dai_dien?: string | null
          phai_doi_mat_khau?: boolean
          quyen_rieng?: string[] | null
          chi_nhanh_id?: string | null
          chuc_danh?: string | null
          dien_thoai?: string | null
          email?: string | null
          ho_ten?: string
          hoat_dong?: boolean
          id?: string
          tao_luc?: string
          user_id?: string | null
          vai_tro?: string
        }
        Relationships: [
          {
            foreignKeyName: "nhan_vien_chi_nhanh_id_fkey"
            columns: ["chi_nhanh_id"]
            isOneToOne: false
            referencedRelation: "chi_nhanh"
            referencedColumns: ["id"]
          },
        ]
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
      san_pham: {
        Row: {
          ban_le: boolean
          don_vi: string
          don_vi_mua: string | null
          gia_ban: number
          gia_nhap_don_vi: number | null
          he_so_quy_doi: number
          hoat_dong: boolean
          id: string
          ma: string
          nhom: string | null
          nhom_cap: string | null
          tao_luc: string
          ten: string
          theo_doi_kho: boolean
          tieu_hao: boolean
          ton_toi_thieu: number
        }
        Insert: {
          ban_le?: boolean
          don_vi: string
          don_vi_mua?: string | null
          gia_ban?: number
          gia_nhap_don_vi?: number | null
          he_so_quy_doi?: number
          hoat_dong?: boolean
          id?: string
          ma: string
          nhom?: string | null
          nhom_cap?: string | null
          tao_luc?: string
          ten: string
          theo_doi_kho?: boolean
          tieu_hao?: boolean
          ton_toi_thieu?: number
        }
        Update: {
          ban_le?: boolean
          don_vi?: string
          don_vi_mua?: string | null
          gia_ban?: number
          gia_nhap_don_vi?: number | null
          he_so_quy_doi?: number
          hoat_dong?: boolean
          id?: string
          ma?: string
          nhom?: string | null
          nhom_cap?: string | null
          tao_luc?: string
          ten?: string
          theo_doi_kho?: boolean
          tieu_hao?: boolean
          ton_toi_thieu?: number
        }
        Relationships: []
      }
      thanh_toan: {
        Row: {
          ghi_chu: string | null
          hoa_don_id: string
          id: string
          loai: string
          ngay: string
          nguoi_id: string
          phuong_thuc: string
          so_tien: number
          tao_luc: string
          the_id: string | null
        }
        Insert: {
          ghi_chu?: string | null
          hoa_don_id: string
          id?: string
          loai?: string
          ngay?: string
          nguoi_id: string
          phuong_thuc: string
          so_tien: number
          tao_luc?: string
          the_id?: string | null
        }
        Update: {
          ghi_chu?: string | null
          hoa_don_id?: string
          id?: string
          loai?: string
          ngay?: string
          nguoi_id?: string
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
            foreignKeyName: "thanh_toan_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
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
            foreignKeyName: "the_so_cai_nguoi_id_fkey"
            columns: ["nguoi_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
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
    }
    Views: {
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
      v_khach_hang: {
        Row: {
          cap_nhat_luc: string | null
          chi_12_thang: number | null
          chi_nhanh_id: string | null
          danh_dau_mat: boolean | null
          dia_chi: string | null
          dien_thoai: string | null
          dong_y_dung_hinh: boolean | null
          dong_y_dung_hinh_luc: string | null
          email: string | null
          ghi_chu: string | null
          gioi_tinh: string | null
          hang: string | null
          ho_ten: string | null
          id: string | null
          ma: string | null
          ngay_sinh: string | null
          nguoi_gioi_thieu_id: string | null
          nguoi_phu_trach_id: string | null
          nguon: string | null
          nguon_chi_tiet: string | null
          so_the_dang_dung: number | null
          tao_boi: string | null
          tao_luc: string | null
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
    }
    Functions: {
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
      bc_phan_bo: {
        Args: { p_cn?: string }
        Returns: {
          nhan: string
          nhom: string
          so: number
          tien: number
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
      chot_hoa_don: {
        Args: { p_id: string; p_nguoi: string }
        Returns: undefined
      }
      doi_chieu_phieu: {
        Args: { p_id: string; p_nguoi: string }
        Returns: undefined
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
      huy_hoa_don: {
        Args: { p_id: string; p_ly_do: string; p_nguoi: string }
        Returns: undefined
      }
      huy_phieu: {
        Args: { p_id: string; p_ly_do: string; p_nguoi: string }
        Returns: undefined
      }
      khoa_tat_ca_bang: { Args: never; Returns: undefined }
      nhan_phieu: {
        Args: { p_dem_truoc: number; p_id: string; p_nguoi: string }
        Returns: undefined
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
      tinh_lai_hoa_don: { Args: { p_id: string }; Returns: undefined }
      ton_kho: {
        Args: { p_chi_nhanh: string; p_san_pham: string }
        Returns: number
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
