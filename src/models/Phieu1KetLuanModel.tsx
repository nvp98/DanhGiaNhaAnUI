export default interface Phieu1KetLuanModel {
    id: number;
    phieuId: number;
    soLuongDat?: number;
    tongSoTieuChi?: number;
    tyLePhanTram?: number;
    ketLuan?: string; // DAT / KHONG_DAT
    diemDanhGia?: number;
    ghiChu?: string;
}
