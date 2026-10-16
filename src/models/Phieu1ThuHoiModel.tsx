// Dùng cho GET /phieu1/{id}/lich-su-thu-hoi — xem Phieu1ThuHoiDto.cs ở backend.
export default interface Phieu1ThuHoiModel {
    id: number;
    phienBan: number;
    trangThaiTruocKhiThuHoi: string; // "CHO_KY" hoặc "DA_DUYET"
    nguoiThuHoiId: number;
    nguoiThuHoiHoTen?: string;
    ngayThuHoi: string;
    lyDoThuHoi: string;
}
