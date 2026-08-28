export default interface NguoiDungListItemModel {
    id: number;
    tenDangNhap: string;
    hoTen: string;
    email?: string;
    soDienThoai?: string;
    phongBanId?: number;
    nhaThauId?: number;
    trangThai: string;
    nguoiDuyet?: number;
    ngayDuyet?: string;
    ngayTao: string;
    danhSachVaiTro: string[];
}
