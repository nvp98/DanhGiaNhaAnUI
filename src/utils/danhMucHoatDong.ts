// Danh mục (Nhà thầu / Bếp ăn / Phòng ban / Nhóm tiêu chí / Tiêu chí / Địa
// điểm nhà ăn) ngừng hoạt động thì KHÔNG hiện trong dropdown để chọn mới,
// nhưng bản ghi đã được chọn trước đó (phiếu cũ, tài khoản cũ...) vẫn phải
// giữ lại trong option để hiển thị đúng tên — không ảnh hưởng lịch sử.
// Tra tên (find theo id) luôn dùng danh sách ĐẦY ĐỦ, không lọc.
// Khớp với BE: DanhGiaAPI/Common/DanhMucHoatDong.cs.
export const TRANG_THAI_HOAT_DONG = "HOAT_DONG";

// Các danh mục đang dùng 3 kiểu cờ trạng thái khác nhau:
// - trangThai: "HOAT_DONG" | ... (NhaThau, BepAn)
// - dangHoatDong: boolean       (PhongBan, NhomTieuChi, TieuChi)
// - isActive: boolean           (DiaDiemNhaAn)
type CoTrangThai = { trangThai?: string; dangHoatDong?: boolean; isActive?: boolean };

export const laHoatDong = (item: CoTrangThai) => {
    if (item.trangThai !== undefined) return item.trangThai === TRANG_THAI_HOAT_DONG;
    if (item.dangHoatDong !== undefined) return item.dangHoatDong;
    if (item.isActive !== undefined) return item.isActive;
    return true;
};

export const locDanhMucChon = <T extends { id: number } & CoTrangThai>(
    danhSach: T[],
    giuLai?: number | (number | undefined | null)[] | null,
): T[] => {
    const idsGiuLai = new Set((Array.isArray(giuLai) ? giuLai : [giuLai]).filter((id): id is number => id != null));
    return danhSach.filter(x => laHoatDong(x) || idsGiuLai.has(x.id));
};

// Tên hiển thị trong option: đánh dấu bản ghi đã ngừng (chỉ xuất hiện khi được giữ lại).
export const tenOptionDanhMuc = (item: { ten: string } & CoTrangThai) =>
    laHoatDong(item) ? item.ten : `${item.ten} (ngừng hoạt động)`;
