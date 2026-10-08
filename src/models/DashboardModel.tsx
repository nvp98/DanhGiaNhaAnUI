// Khớp với DashboardSummaryDTO (DanhGiaAPI/Models/DashboardDTO.cs) — API tổng
// hợp sẵn cho DashboardPageV2 (thay báo cáo Power BI cũ), vì bảng
// KetQuaDanhGia/DuLieuCom có hàng trăm nghìn tới hàng triệu dòng, không tải
// thô về FE để tự group được.
export interface MucDanhGiaThongKe {
    diemDanhGia: number;
    soLuong: number;
    tyLePercent: number;
}

export interface TyLeTheoNgay {
    ngay: string;
    soLuotDanhGia: number;
    soComThucTe: number;
    tyLePercent: number;
}

export interface DiaDiemThongKe {
    diaDiemId: number;
    tenDiaDiem: string;
    muc1: number;
    muc2: number;
    muc3: number;
    muc4: number;
    muc5: number;
}

export default interface DashboardSummaryModel {
    tongLuotDanhGia: number;
    tongComThucTe: number;
    tyLeDanhGiaPercent: number;
    theoMucDanhGia: MucDanhGiaThongKe[];
    theoNgay: TyLeTheoNgay[];
    theoDiaDiem: DiaDiemThongKe[];
}

export interface DashboardFilterParams {
    tuNgay: string;
    denNgay: string;
    diaDiemIds?: number[];
    // Mỗi field dưới là 1 nhóm chọn-nhiều độc lập (OR trong nhóm, AND giữa
    // các nhóm) — khớp DashboardFilterParameters ở BE.
    codeBuaAnList?: string[];
    tuanDaChon?: string[]; // "{năm}-{số tuần ISO}", vd "2026-44"
    thangDaChon?: string[]; // "{năm}-{tháng 2 số}", vd "2026-10"
}
