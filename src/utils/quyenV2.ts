import NguoiDungModel from "../models/NguoiDungModel";

// Mã quyền cố định — phải khớp 1-1 với danh mục Quyen seed ở backend
// (xem 02. Phantich/modules/VaiTro.md mục 8). Thêm quyền mới luôn cần thêm
// policy tương ứng ở backend trước, không tự thêm ở đây mà có tác dụng.
export const MA_QUYEN = {
    QUAN_LY_TAI_KHOAN: "QUAN_LY_TAI_KHOAN",
    QUAN_LY_VAI_TRO: "QUAN_LY_VAI_TRO",
    QUAN_LY_PHONG_BAN: "QUAN_LY_PHONG_BAN",
    QUAN_LY_DANH_MUC: "QUAN_LY_DANH_MUC",
    QUAN_LY_TIEU_CHI: "QUAN_LY_TIEU_CHI",
    QUAN_LY_LUONG_KY: "QUAN_LY_LUONG_KY",
} as const;

export type MaQuyen = typeof MA_QUYEN[keyof typeof MA_QUYEN];

// laAdmin bypass toàn bộ, giống hệt cách backend check claim "admin" ở
// Program.cs (CoQuyen()) — luôn giữ 2 phía đồng bộ.
//
// danhSachQuyen dùng "?? []" vì phiên đăng nhập cũ (trước khi thêm laAdmin/
// danhSachQuyen vào NguoiDungInfoDto, xem authV2Slice) có thể vẫn còn lưu
// trong localStorage (redux-persist) mà không có field này — không "?? []"
// sẽ crash "Cannot read properties of undefined (reading 'includes')" ngay
// khi vào /v2. Tài khoản đó cần đăng nhập lại để có laAdmin/danhSachQuyen
// thật, nhưng tới lúc đó không được crash cả trang.
export const coQuyen = (nguoiDung: NguoiDungModel | null | undefined, ma: MaQuyen): boolean => {
    if (!nguoiDung) return false;
    return !!nguoiDung.laAdmin || (nguoiDung.danhSachQuyen ?? []).includes(ma);
};
