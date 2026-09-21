import Phieu1ChiTietModel from "./Phieu1ChiTietModel";
import Phieu1KetLuanModel from "./Phieu1KetLuanModel";
import Phieu1Model from "./Phieu1Model";

export default interface Phieu1ResponseModel {
    phieu: Phieu1Model;
    chiTiet: Phieu1ChiTietModel[];
    ketLuan?: Phieu1KetLuanModel;
}
