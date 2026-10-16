// Đánh dấu (Ngày, Bữa ăn, Địa điểm) máy kiosk hỏng — loại trừ khỏi "Lượt
// đánh giá" của Phiếu 3/4 (xem 02. Phantich/modules/KetQuaDanhGiaPhanBo.md,
// mục "Loại trừ do lỗi thiết bị"). "id_BuaAn" giữ đúng casing JSON trả về từ
// BE (System.Text.Json CamelCase chỉ hạ chữ đầu của "ID_BuaAn").
export default interface KetQuaDanhGiaLoaiTruModel {
    id: number;
    ngay: string;
    id_BuaAn: number;
    tenBuaAn?: string | null;
    diaDiemNhaAnId: number;
    tenDiaDiem?: string | null;
    lyDo?: string | null;
    nguoiTao: number;
    nguoiTaoTen?: string | null;
    ngayTao: string;
}

// Request tạo mới — tên field PHẢI khớp đúng KetQuaDanhGiaLoaiTruRequest.cs ở
// BE (binding JSON case-insensitive nhưng vẫn cần đúng thứ tự ký tự, kể cả
// dấu gạch dưới).
export interface KetQuaDanhGiaLoaiTruRequestV2 {
    ngay: string;
    id_BuaAn: number;
    diaDiemNhaAnId: number;
    lyDo?: string;
}
