export default interface MauLuongKyModel {
    id: number;
    loaiPhieu: string;
    buocThuTu: number;
    tenBuoc: string;
    loaiNguoiKy: string; // PHONG_BAN | NHA_THAU | TRUC_TIEP
    phongBanId?: number;
    batBuoc: boolean;
}
