export default interface Phieu2Model {
    id: number;
    soHieu: string;
    thang: number;
    nam: number;
    nhaThauId: number;
    bepAnId?: number;
    // Chỉ có ở API danh sách (GET /phieu2) — trang chi tiết dùng
    // Phieu2ResponseModel.danhSachNhaAn (đầy đủ tên, không chỉ id).
    nhaAnIds?: number[];
    thoiGianTu?: string;
    thoiGianDen?: string;
    diaDiem?: string;
    thoiGianKiemTraText?: string;
    phieu1Id?: number;
    nguoiTao?: number;
    trangThai: string; // NHAP, CHO_KY, DA_DUYET, TU_CHOI
    ngayTao: string;
    // Chỉ có ở API danh sách (GET /phieu2) — tên người đã ký (ĐÃ DUYỆT, lượt
    // ký mới nhất), resolve sẵn từ backend. NULL khi chưa ai ký bước tương ứng.
    tenNhaThauDaKy?: string;
    tenNguoiDaKy?: string;
}
