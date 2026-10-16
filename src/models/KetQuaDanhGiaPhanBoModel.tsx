// Kết quả KetQuaDanhGia (hệ kiosk) đã phân bổ lại cho khớp DuLieuCom.Com_ThucTe
// — dùng cho màn hình rà soát số liệu GỐC vs ĐÃ PHÂN BỔ (xem
// 02. Phantich/modules/KetQuaDanhGiaPhanBo.md). "id_BuaAn" giữ đúng casing
// JSON trả về từ BE (System.Text.Json CamelCase chỉ hạ chữ đầu của "ID_BuaAn").
export default interface KetQuaDanhGiaPhanBoModel {
    id: number;
    ngay: string;
    id_BuaAn: number;
    tenBuaAn: string;
    diaDiemNhaAnId: number;

    diem1Goc: number;
    diem2Goc: number;
    diem3Goc: number;
    diem4Goc: number;
    diem5Goc: number;
    tongGoc: number;

    comThucTe: number | null;

    diem1: number;
    diem2: number;
    diem3: number;
    diem4: number;
    diem5: number;
    tong: number;

    thoiGianTinh: string;
}
