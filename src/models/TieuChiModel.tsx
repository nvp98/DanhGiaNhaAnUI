export default interface TieuChiModel {
    id: number;
    nhomId?: number;
    noiDung: string;
    thuTu: number;
    macDinh: boolean;
    dangHoatDong: boolean;
    dvt?: string;       // chỉ dùng khi nhóm cha thuộc loaiPhieu === "PHIEU4"
    loaiDong?: string;  // NHAP_TAY, TINH_TRUNG_BINH, TINH_TY_LE...
    congThuc?: string;
}
