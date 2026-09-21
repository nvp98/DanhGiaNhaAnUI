// Danh mục "Bữa ăn" — 4 dòng tĩnh (Sáng/Trưa/Chiều/Đêm, mã "01".."04"),
// không có màn hình quản lý riêng. Dùng để chọn bữa ăn bắt đầu/kết thúc khi
// khai báo "đoạn" thời gian (Phiếu 3/4) — xem DoanModel.
export default interface BuaAnModel {
    id: number;
    tenBuaAn: string;
    codeBuaAn: string;
}
