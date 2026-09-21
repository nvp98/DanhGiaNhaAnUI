export default interface PhongBanModel {
    id: number;
    ma: string;
    ten: string;
    dangHoatDong: boolean;
    // Loại phiếu phòng ban này được phép xử lý — rỗng = không giới hạn (mọi
    // loại phiếu). Xem NguoiDungService.TinhLoaiPhieuApDung ở backend.
    danhSachLoaiPhieu: string[];
}
