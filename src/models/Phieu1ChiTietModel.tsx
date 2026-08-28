export default interface Phieu1ChiTietModel {
    id: number;
    phieuId: number;
    nhomId?: number;
    tieuChiId?: number;
    noiDungTuThem?: string;
    ketQua?: string; // DAT / KHONG_DAT
    ghiChu?: string;
    thuTu: number;
}
