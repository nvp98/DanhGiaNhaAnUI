import Phieu1KetLuanModel from "./Phieu1KetLuanModel";
import Phieu1Model from "./Phieu1Model";
import Phieu2Model from "./Phieu2Model";
import Phieu2TieuChiModel from "./Phieu2TieuChiModel";
import NhaAnModel from "./NhaAnModel";

export interface Phieu2KetQuaModel {
    id: number;
    phieuId: number;
    soTieuChiDat?: number;
    tongSoTieuChi: number;
}

export interface Phieu2YKienNhaThauModel {
    id: number;
    phieuId: number;
    yKien?: string;
    nguoiPhanHoi?: string;
    ngayPhanHoi?: string;
}

export default interface Phieu2ResponseModel {
    phieu: Phieu2Model;
    tieuChi: Phieu2TieuChiModel[];
    ketQua?: Phieu2KetQuaModel;
    yKienNhaThau?: Phieu2YKienNhaThauModel;
    phieu1?: Phieu1Model;
    phieu1KetLuan?: Phieu1KetLuanModel;
    danhSachNhaAn: NhaAnModel[];
}
