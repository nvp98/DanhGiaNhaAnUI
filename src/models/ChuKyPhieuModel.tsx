export default interface ChuKyPhieuModel {
    id: number;
    loaiDoiTuong: string;
    doiTuongId: number;
    buocThuTu: number;
    tenBuoc?: string;
    nguoiKyId?: number;
    // Họ tên resolve sẵn từ backend — KHÔNG tra qua danh sách "người đủ điều
    // kiện ký" (useDanhSachNguoiKyKhaDungQuery, dùng cho dropdown chọn khác
    // khái niệm) vì bước "Người đánh giá" (buocThuTu=0) luôn có danh sách đó
    // rỗng (không gắn MauLuongKy nào) — xem ChuKyPhieuService.TienDoKyAsync.
    nguoiKyHoTen?: string;
    nguoiKyDuKienId?: number;
    nguoiKyDuKienHoTen?: string;
    chuKyId?: number;
    trangThai: string; // CHO_KY, DA_DUYET, TU_CHOI
    ghiChu?: string;
    ngayKy?: string;
    // Đường dẫn tương đối (ghép với ApiRootV2) ảnh chữ ký ĐÃ DÙNG khi ký bước
    // này. NULL khi chưa ký, người ký là tài khoản nhà thầu (không quản lý
    // ảnh chữ ký trong hệ thống), hoặc người ký nội bộ chưa từng upload chữ
    // ký nào — các trường hợp đó FE hiện icon √ thay vì ảnh (PhieuSignatures.tsx).
    duongDanChuKy?: string;
}
