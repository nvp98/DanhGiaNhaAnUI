export default interface Phieu2Model {
    id: number;
    soHieu: string;
    thang: number;
    nam: number;
    nhaThauId: number;
    bepAnId?: number;
    nhaAnId: number;
    thoiGianTu?: string;
    thoiGianDen?: string;
    diaDiem?: string;
    thoiGianKiemTraText?: string;
    phieu1Id?: number;
    nguoiTao?: number;
    trangThai: string; // NHAP, CHO_KY, DA_DUYET, TU_CHOI
    ngayTao: string;
}
