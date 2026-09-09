import Phieu4Model from "./Phieu4Model";

export interface Phieu4NhaThauCotModel {
    id: number;
    phieuId: number;
    nhaThauId: number;
    thuTu: number;
}

export interface Phieu4GiaTriModel {
    id: number;
    dongId: number;
    nhaThauId: number;
    giaTri?: number;
    chinhSuaThuCong: boolean;
}

export interface Phieu4DongModel {
    id: number;
    bangId: number;
    nhomSo?: number;
    stt?: number;
    noiDung?: string;
    dvt?: string;
    loaiDong?: string; // NHAP_TAY, DEM_TU_PHIEU2, TINH_TRUNG_BINH, TINH_TY_LE
    congThuc?: string;
    tieuChiId?: number; // dòng được seed từ TieuChi (master) nào, undefined nếu tự thêm
    nhomTieuChiId?: number; // nhóm (master) để render tiêu đề nhóm trên Bảng 2-5
    diaDiemNhaAnId?: number; // Bảng 4/5: dòng ứng với địa điểm ăn nào
    nhaThauId?: number; // CHỈ Bảng 5: dòng này thuộc nhà thầu nào (khác Phieu4GiaTriModel.nhaThauId — đó là cột của Bảng 1-3)
    giaTriChung?: number; // Bảng 4/5: giá trị nhập tay, không chia theo cột nhà thầu
    giaTri: Phieu4GiaTriModel[];
}

export interface Phieu4BangModel {
    id: number;
    soBang: number;
    tenBang?: string;
    dong: Phieu4DongModel[];
}

export default interface Phieu4ResponseModel {
    phieu: Phieu4Model;
    nhaThau: Phieu4NhaThauCotModel[];
    bang: Phieu4BangModel[];
}
