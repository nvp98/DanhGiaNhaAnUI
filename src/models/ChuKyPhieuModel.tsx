export default interface ChuKyPhieuModel {
    id: number;
    loaiDoiTuong: string;
    doiTuongId: number;
    buocThuTu: number;
    tenBuoc?: string;
    nguoiKyId?: number;
    chuKyId?: number;
    trangThai: string; // CHO_KY, DA_DUYET, TU_CHOI
    ghiChu?: string;
    ngayKy?: string;
}
