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
        ]
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
          thu_tu: number
        }
        Insert: {
          dia_chi?: string | null
          dien_thoai?: string | null
          hoat_dong?: boolean
          id?: string
          ma: string
          tao_luc?: string
          ten: string
          thu_tu?: number
        }
        Update: {
          dia_chi?: string | null
          dien_thoai?: string | null
          hoat_dong?: boolean
          id?: string
          ma?: string
          tao_luc?: string
          ten?: string
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
          han: string | null
          hoan_thanh_luc: string | null
          id: string
          ket_qua: string | null
          mo_ta: string | null
          nguoi_giao_id: string
          nguoi_nhan_id: string
          tao_luc: string
          tieu_de: string
          trang_thai: string
          uu_tien: string
        }
        Insert: {
          han?: string | null
          hoan_thanh_luc?: string | null
          id?: string
          ket_qua?: string | null
          mo_ta?: string | null
          nguoi_giao_id: string
          nguoi_nhan_id: string
          tao_luc?: string
          tieu_de: string
          trang_thai?: string
          uu_tien?: string
        }
        Update: {
          han?: string | null
          hoan_thanh_luc?: string | null
          id?: string
          ket_qua?: string | null
          mo_ta?: string | null
          nguoi_giao_id?: string
          nguoi_nhan_id?: string
          tao_luc?: string
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
      dieu_chinh_phep: {
        Row: {
          id: string
          ly_do: string
          nam: number
          nguoi_id: string
          nhan_vien_id: string
          so_ngay: number
          tao_luc: string
        }
        Insert: {
          id?: string
          ly_do: string
          nam: number
          nguoi_id: string
          nhan_vien_id: string
          so_ngay: number
          tao_luc?: string
        }
        Update: {
          id?: string
          ly_do?: string
          nam?: number
          nguoi_id?: string
          nhan_vien_id?: string
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
        ]
      }
      dieu_kien_luong: {
        Row: {
          an_ca_ngay: number
          dong_bh: boolean
          dong_phuc_cap: number
          ghi_chu: string | null
          hieu_luc_tu: string
          id: string
          luong_co_ban: number
          luong_dong_bh: number
          nguoi_id: string | null
          nha_o_cap: number
          nhan_vien_id: string
          so_npt: number
          tao_luc: string
          thu_nhap_chuc_danh: number | null
          tinh_trang: string
          ty_le_thu_viec: number
        }
        Insert: {
          an_ca_ngay?: number
          dong_bh?: boolean
          dong_phuc_cap?: number
          ghi_chu?: string | null
          hieu_luc_tu: string
          id?: string
          luong_co_ban?: number
          luong_dong_bh?: number
          nguoi_id?: string | null
          nha_o_cap?: number
          nhan_vien_id: string
          so_npt?: number
          tao_luc?: string
          thu_nhap_chuc_danh?: number | null
          tinh_trang?: string
          ty_le_thu_viec?: number
        }
        Update: {
          an_ca_ngay?: number
          dong_bh?: boolean
          dong_phuc_cap?: number
          ghi_chu?: string | null
          hieu_luc_tu?: string
          id?: string
          luong_co_ban?: number
          luong_dong_bh?: number
          nguoi_id?: string | null
          nha_o_cap?: number
          nhan_vien_id?: string
          so_npt?: number
          tao_luc?: string
          thu_nhap_chuc_danh?: number | null
          tinh_trang?: string
          ty_le_thu_viec?: number
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
        ]
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
          la_so_du_dau: boolean
          lich_hen_id: string | null
          ly_do_huy: string | null
          ma: string
          ngay_hd: string
          nguoi_gioi_thieu_id: string | null
          nguoi_lap_id: string
          phu_phi: number
          sh_id: number | null
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
          la_so_du_dau?: boolean
          lich_hen_id?: string | null
          ly_do_huy?: string | null
          ma: string
          ngay_hd?: string
          nguoi_gioi_thieu_id?: string | null
          nguoi_lap_id: string
          phu_phi?: number
          sh_id?: number | null
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
          la_so_du_dau?: boolean
          lich_hen_id?: string | null
          ly_do_huy?: string | null
          ma?: string
          ngay_hd?: string
          nguoi_gioi_thieu_id?: string | null
          nguoi_lap_id?: string
          phu_phi?: number
          sh_id?: number | null
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
          het_han: string | null
          id: string
          khach_id: string
          lark_file_token: string | null
          lark_loi: string | null
          lark_record_id: string | null
          lark_so_lan: number
          lark_trang_thai: string
          lark_xong_luc: string | null
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
          diem_goc: number | null
          dien_thoai: string
          dong_y_dung_hinh: boolean
          dong_y_dung_hinh_luc: string | null
          email: string | null
          ghi_chu: string | null
          gioi_tinh: string | null
          hang_goc: string | null
          ho_ten: string
          id: string
          lan_den_cuoi: string | null
          ma: string
          ngay_sinh: string | null
          nguoi_gioi_thieu_id: string | null
          nguoi_phu_trach_id: string
          nguon: string
          nguon_chi_tiet: string | null
          sh_id: number | null
          so_lan_den_goc: number | null
          tao_boi: string | null
          tao_luc: string
          tong_chi_goc: number | null
          zalo: string | null
        }
        Insert: {
          cap_nhat_luc?: string
          chi_nhanh_id: string
          danh_dau_mat?: boolean
          dia_chi?: string | null
          diem_goc?: number | null
          dien_thoai: string
          dong_y_dung_hinh?: boolean
          dong_y_dung_hinh_luc?: string | null
          email?: string | null
          ghi_chu?: string | null
          gioi_tinh?: string | null
          hang_goc?: string | null
          ho_ten: string
          id?: string
          lan_den_cuoi?: string | null
          ma: string
          ngay_sinh?: string | null
          nguoi_gioi_thieu_id?: string | null
          nguoi_phu_trach_id: string
          nguon: string
          nguon_chi_tiet?: string | null
          sh_id?: number | null
          so_lan_den_goc?: number | null
          tao_boi?: string | null
          tao_luc?: string
          tong_chi_goc?: number | null
          zalo?: string | null
        }
        Update: {
          cap_nhat_luc?: string
          chi_nhanh_id?: string
          danh_dau_mat?: boolean
          dia_chi?: string | null
          diem_goc?: number | null
          dien_thoai?: string
          dong_y_dung_hinh?: boolean
          dong_y_dung_hinh_luc?: string | null
          email?: string | null
          ghi_chu?: string | null
          gioi_tinh?: string | null
          hang_goc?: string | null
          ho_ten?: string
          id?: string
          lan_den_cuoi?: string | null
          ma?: string
          ngay_sinh?: string | null
          nguoi_gioi_thieu_id?: string | null
          nguoi_phu_trach_id?: string
          nguon?: string
          nguon_chi_tiet?: string | null
          sh_id?: number | null
          so_lan_den_goc?: number | null
          tao_boi?: string | null
          tao_luc?: string
          tong_chi_goc?: number | null
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
          ten: string
        }
        Insert: {
          ngay: string
          ten: string
        }
        Update: {
          ngay?: string
          ten?: string
        }
        Relationships: []
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
        Relationships: []
      }
      nhan_vien: {
        Row: {
          anh_dai_dien: string | null
          chi_nhanh_id: string | null
          chuc_danh: string | null
          chuc_danh_tai_chinh: string | null
          dien_thoai: string | null
          email: string | null
          han_muc_duyet: number | null
          ho_ten: string
          hoat_dong: boolean
          id: string
          khung_lam_viec: string
          ma_nv: string | null
          ngay_vao_chinh_thuc: string | null
          ngay_vao_lam: string | null
          phai_doi_mat_khau: boolean
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
          email?: string | null
          han_muc_duyet?: number | null
          ho_ten: string
          hoat_dong?: boolean
          id?: string
          khung_lam_viec?: string
          ma_nv?: string | null
          ngay_vao_chinh_thuc?: string | null
          ngay_vao_lam?: string | null
          phai_doi_mat_khau?: boolean
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
          email?: string | null
          han_muc_duyet?: number | null
          ho_ten?: string
          hoat_dong?: boolean
          id?: string
          khung_lam_viec?: string
          ma_nv?: string | null
          ngay_vao_chinh_thuc?: string | null
          ngay_vao_lam?: string | null
          phai_doi_mat_khau?: boolean
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
          qua_han_bao_truoc: boolean
          ra_dieu_chinh: string | null
          so_gio: number | null
          so_ngay: number
          tao_luc: string
          trang_thai: string
          tu_ngay: string
          vao_dieu_chinh: string | null
          vuot_han_muc: boolean
        }
        Insert: {
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
          qua_han_bao_truoc?: boolean
          ra_dieu_chinh?: string | null
          so_gio?: number | null
          so_ngay?: number
          tao_luc?: string
          trang_thai?: string
          tu_ngay: string
          vao_dieu_chinh?: string | null
          vuot_han_muc?: boolean
        }
        Update: {
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
          qua_han_bao_truoc?: boolean
          ra_dieu_chinh?: string | null
          so_gio?: number | null
          so_ngay?: number
          tao_luc?: string
          trang_thai?: string
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
          id: string
          phieu_id: string
          san_pham_id: string
          ton_so: number
          ton_thuc: number | null
        }
        Insert: {
          ghi_chu?: string | null
          id?: string
          phieu_id: string
          san_pham_id: string
          ton_so: number
          ton_thuc?: number | null
        }
        Update: {
          ghi_chu?: string | null
          id?: string
          phieu_id?: string
          san_pham_id?: string
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
          sh_id: number | null
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
          sh_id?: number | null
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
      tai_khoan_ngan_hang: {
        Row: {
          chi_nhanh_id: string | null
          chu_tai_khoan: string
          ghi_chu: string | null
          hoat_dong: boolean
          id: string
          ngan_hang: string
          so_tai_khoan: string
          tao_luc: string
        }
        Insert: {
          chi_nhanh_id?: string | null
          chu_tai_khoan: string
          ghi_chu?: string | null
          hoat_dong?: boolean
          id?: string
          ngan_hang: string
          so_tai_khoan: string
          tao_luc?: string
        }
        Update: {
          chi_nhanh_id?: string | null
          chu_tai_khoan?: string
          ghi_chu?: string | null
          hoat_dong?: boolean
          id?: string
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
      cong_chuan_thang: {
        Args: { p_khung: string; p_nam: number; p_thang: number }
        Returns: number
      }
      doi_chieu_phieu: {
        Args: { p_id: string; p_nguoi: string }
        Returns: undefined
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
      ghi_click_link: { Args: { p_ma: string }; Returns: string }
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
      khoa_ky: {
        Args: { p_ghi_chu: string; p_nguoi: string; p_thang: string }
        Returns: undefined
      }
      khoa_tat_ca_bang: { Args: never; Returns: undefined }
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
      kiem_token_cron: { Args: { p: string }; Returns: boolean }
      so_du_phep: { Args: { p_nam: number; p_nv: string }; Returns: number }
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
