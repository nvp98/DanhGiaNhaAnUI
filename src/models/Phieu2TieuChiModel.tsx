export default interface Phieu2TieuChiModel {
    id: number;
    phieuId: number;
    maTieuChi: string;
    tenTieuChi?: string;
    dat: boolean;
    khongDat: boolean;
    diem?: number;
    ghiChu?: string;
    thuTu: number;
}
