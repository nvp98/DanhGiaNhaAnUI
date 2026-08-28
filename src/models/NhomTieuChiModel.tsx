export default interface NhomTieuChiModel {
    id: number;
    loaiPhieu: string;
    ma?: string;
    ten: string;
    thuTu: number;
    dangHoatDong: boolean;
    soBang?: number; // chỉ dùng khi loaiPhieu === "PHIEU4": nhóm thuộc Bảng mấy (2..5)
}
