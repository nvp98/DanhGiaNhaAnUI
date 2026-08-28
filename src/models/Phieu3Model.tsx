export default interface Phieu3Model {
    id: number;
    soHieu: string;
    thang: number;
    nam: number;
    nhaThauId: number;
    nguoiTao?: number;
    trangThai: string; // NHAP, CHO_KY, DA_DUYET, TU_CHOI
    ngayTao: string;
}
