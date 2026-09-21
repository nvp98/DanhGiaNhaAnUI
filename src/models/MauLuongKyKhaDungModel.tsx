export default interface MauLuongKyKhaDungModel {
    mauLuongKyId: number;
    loaiPhieu: string;
    buocThuTu: number;
    tenBuoc: string;
    loaiNguoiKy: string; // PHONG_BAN | NHA_THAU | TRUC_TIEP
    duDieuKienCauTruc: boolean;
    // true nếu loại phiếu của bước này nằm trong "trần" phòng ban/nhà thầu
    // của user (khác lý do của duDieuKienCauTruc — đó là khớp cấu trúc
    // PHONG_BAN/NHA_THAU của riêng dòng MauLuongKy này).
    duDieuKienPhongBan: boolean;
    daDuocGan: boolean;
}
