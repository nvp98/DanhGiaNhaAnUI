import NguoiDungPhieuQuyenModel from "./NguoiDungPhieuQuyenModel";

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
    danhSachMauLuongKyId: number[];
    phieuQuyen: NguoiDungPhieuQuyenModel[];
    // "Trần" cấu trúc — loại phiếu tài khoản này ĐƯỢC PHÉP cấu hình Đánh
    // giá/Quản lý tiêu chí/Ký (không phải quyền thật đang có). Dùng để modal
    // "Phân quyền theo Phiếu" quyết định hiện Card của loại phiếu nào.
    loaiPhieuApDung: string[];
    // Quyền THẬT đang có — hợp của loại phiếu có duocDanhGia=true và loại
    // phiếu có ít nhất 1 bước ký đã gán. Dùng cho sidebar/TrangChu.
    danhSachLoaiPhieuDuocXem: string[];
}
