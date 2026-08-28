export default interface Phieu4Model {
    id: number;
    soHieu: string;
    tuNgay: string;
    denNgay: string;
    nguoiTao?: number;
    trangThai: string; // NHAP, CHO_KY, DA_DUYET, TU_CHOI
    ngayTao: string;
}
