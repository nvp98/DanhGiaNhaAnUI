// "Đoạn" thời gian — khung (Ngày, Bữa ăn) bắt đầu -> (Ngày, Bữa ăn) kết thúc
// (CẢ 2 ĐẦU đều bao gồm bữa được chọn) + danh sách địa điểm ăn áp dụng —
// dùng chung cho Phiếu 3 (đoạn gắn trực tiếp vào phiếu) và Phiếu 4 (đoạn
// gắn vào từng cột nhà thầu). Thay thế hoàn toàn suy luận "địa điểm rõ
// ràng" cũ — nhà thầu có thể đổi tập địa điểm phụ trách giữa kỳ báo cáo.
export default interface DoanModel {
    id: number;
    tuNgay: string;
    tuBuaAnId: number;
    tuBuaAnCode?: string; // "01".."04" — resolve sẵn để hiển thị, không cần gọi thêm API BuaAn
    denNgay: string;
    denBuaAnId: number;
    denBuaAnCode?: string;
    diaDiemNhaAnIds: number[];
}

export interface DoanRequest {
    tuNgay: string;
    tuBuaAnId: number;
    denNgay: string;
    denBuaAnId: number;
    diaDiemNhaAnIds: number[];
}
