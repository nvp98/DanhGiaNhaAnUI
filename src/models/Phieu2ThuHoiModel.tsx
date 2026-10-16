// Dùng cho GET /phieu2/{id}/lich-su-thu-hoi — xem Phieu2ThuHoiDto.cs ở backend.
export default interface Phieu2ThuHoiModel {
    id: number;
    phienBan: number;
    trangThaiTruocKhiThuHoi: string; // "CHO_KY" hoặc "DA_DUYET"
    nguoiThuHoiId: number;
    nguoiThuHoiHoTen?: string;
    ngayThuHoi: string;
    lyDoThuHoi: string;
}
