import Phieu3Model from "./Phieu3Model";

export interface Phieu3Bang1DongModel {
    id: number;
    phieuId: number;
    maDong: string; // LUOT_CBNV_THAM_GIA, TONG_SUAT_AN, TY_LE_PHAN_TRAM
    tenDong?: string;
    diem1?: number;
    diem2?: number;
    diem3?: number;
    diem4?: number;
    diem5?: number;
    tong?: number;
    chinhSuaThuCong: boolean;
    nguonDuLieu?: string;
    // Các ô đã từng bị sửa tay ("diem1".."diem5", "tong") + giá trị hệ thống
    // gốc của từng ô đó (trước khi bị sửa) — dùng để tô vàng + tooltip so
    // sánh trên UI, xem Phieu3FormPage.
    truongDaSuaTay?: string[];
    diem1HeThong?: number;
    diem2HeThong?: number;
    diem3HeThong?: number;
    diem4HeThong?: number;
    diem5HeThong?: number;
    tongHeThong?: number;
}

export interface Phieu3Bang2GiaTriModel {
    id: number;
    dongId: number;
    maTieuChi: string; // TC1..TC6
    giaTri?: number;
    chinhSuaThuCong: boolean;
    thamChieuNguon?: string;
}

export interface Phieu3Bang2DongModel {
    id: number;
    phongBanId: number;
    giaTri: Phieu3Bang2GiaTriModel[];
}

export interface Phieu3YKienNhaThauModel {
    id: number;
    phieuId: number;
    yKien?: string;
}

export default interface Phieu3ResponseModel {
    phieu: Phieu3Model;
    bang1: Phieu3Bang1DongModel[];
    bang2: Phieu3Bang2DongModel[];
    yKienNhaThau?: Phieu3YKienNhaThauModel;
}
