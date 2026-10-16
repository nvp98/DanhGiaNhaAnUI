export default interface Phieu1Model {
    id: number;
    // null tới khi phiếu hoàn tất ký duyệt (DA_DUYET) mới được cấp số
    soHieu: string | null;
    ngayKiemTra: string;
    bepAnId: number;
    nhaThauId: number;
    phongBanId: number;
    nguoiTao?: number;
    trangThai: string; // NHAP, CHO_KY, DA_DUYET, TU_CHOI
    ngayTao: string;
    // Số lần phiếu đã bị thu hồi (CHO_KY/DA_DUYET -> NHAP để sửa lại) — chi
    // tiết từng lần xem GET /phieu1/{id}/lich-su-thu-hoi (Phieu1ThuHoiModel).
    soLanThuHoi: number;
    // Chỉ có ở API danh sách (GET /phieu1) — tên người đã ký (ĐÃ DUYỆT, lượt
    // ký mới nhất), resolve sẵn từ backend. NULL khi chưa ai ký bước tương ứng.
    tenNhaThauDaKy?: string;
    tenNguoiDaKy?: string;
}
