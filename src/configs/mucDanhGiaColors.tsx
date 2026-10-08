// Bảng màu + nhãn 5 mức đánh giá (DiemDanhGia 1..5), dùng chung cho pie
// chart và bar chart so sánh nhà ăn ở DashboardPageV2 — khớp đúng tông màu
// báo cáo Power BI cũ. Nhãn số→chữ tham khảo GetKhaoSatAction.tsx (nơi FE
// đang map DiemDanhGia cho trang Lịch sử khảo sát).
export interface MucDanhGiaInfo {
    diemDanhGia: number;
    nhan: string;
    mau: string;
}

const mucDanhGiaColors: MucDanhGiaInfo[] = [
    { diemDanhGia: 1, nhan: 'Rất không hài lòng', mau: '#ef4444' },
    { diemDanhGia: 2, nhan: 'Không hài lòng', mau: '#f97316' },
    { diemDanhGia: 3, nhan: 'Bình thường', mau: '#3b82f6' },
    { diemDanhGia: 4, nhan: 'Hài lòng', mau: '#06b6d4' },
    { diemDanhGia: 5, nhan: 'Rất hài lòng', mau: '#22c55e' },
];

export default mucDanhGiaColors;
