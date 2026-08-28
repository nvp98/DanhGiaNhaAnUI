export default interface MauLuongKyModel {
    id: number;
    loaiPhieu: string;
    buocThuTu: number;
    tenBuoc: string;
    loaiNguoiKy: string; // PHONG_BAN | NHA_THAU | VAI_TRO
    phongBanId?: number;
    vaiTroId?: number;
    batBuoc: boolean;
}
