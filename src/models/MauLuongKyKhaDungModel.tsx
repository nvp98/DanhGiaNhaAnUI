export default interface MauLuongKyKhaDungModel {
    mauLuongKyId: number;
    loaiPhieu: string;
    buocThuTu: number;
    tenBuoc: string;
    loaiNguoiKy: string; // PHONG_BAN | NHA_THAU | TRUC_TIEP
    duDieuKienCauTruc: boolean;
    daDuocGan: boolean;
}
