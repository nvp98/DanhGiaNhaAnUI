export default interface Phieu1Model {
    id: number;
    soHieu: string;
    ngayKiemTra: string;
    bepAnId: number;
    nhaThauId: number;
    phongBanId: number;
    nguoiTao?: number;
    trangThai: string; // NHAP, CHO_KY, DA_DUYET, TU_CHOI
    ngayTao: string;
}
