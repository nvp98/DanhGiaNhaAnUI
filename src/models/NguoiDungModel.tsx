export default interface NguoiDungModel {
    id: number;
    tenDangNhap: string;
    hoTen: string;
    email?: string;
    soDienThoai?: string;
    phongBanId?: number;
    nhaThauId?: number;
    trangThai: string;
    danhSachVaiTro: string[];
}
