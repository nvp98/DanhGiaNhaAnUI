export default interface Phieu1ChiTietModel {
    id: number;
    phieuId: number;
    nhomId?: number;
    tieuChiId?: number;
    tenTieuChi?: string; // snapshot nội dung tiêu chí lúc lưu — xem Phieu1_ChiTiet.TenTieuChi
    noiDungTuThem?: string;
    ketQua?: string; // DAT / KHONG_DAT
    ghiChu?: string;
    thuTu: number;
}
