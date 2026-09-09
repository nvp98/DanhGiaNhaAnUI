import React from "react";

import { Phieu4DongModel } from "../../models/Phieu4ResponseModel";

// Bảng "giá trị chung" — 1 cột số liệu nhập tay duy nhất, KHÔNG chia theo cột
// nhà thầu (khác BangCoDinhTable). Dùng cho Bảng 4 (danh sách địa điểm ăn,
// dùng phẳng) và Bảng 5 (phân bổ theo nhà thầu, gộp nhóm theo nhaThauId) của
// Phiếu 4 — xem Phieu4Service.DongBoBang4TuDiaDiemAsync/DongBoBang5TuPhieu2Async.
export interface BangDonGiaTriTableProps {
    dong: Phieu4DongModel[];
    // Ô nhập tay (InputNumber khi sửa được, span tĩnh khi không) cho 1 dòng.
    renderOGiaTriChung: (dong: Phieu4DongModel) => React.ReactNode;
    // Giá trị hiện tại (kể cả overlay chưa lưu) — dùng để cộng dòng "Tổng".
    layGiaTriChungHienTai: (dong: Phieu4DongModel) => number | null | undefined;
    // Bảng 5: gộp nhóm theo dong.nhaThauId, mỗi nhóm 1 cột "Nhà thầu" (rowSpan)
    // + 1 cột "Tổng theo nhà thầu" (rowSpan, cộng client-side). Bảng 4 không
    // truyền prop này — hiển thị phẳng, không nhóm.
    nhomTheoNhaThau?: boolean;
    tenNhaThau?: (nhaThauId: number) => string;
}

const tongGiaTri = (
    danhSachDong: Phieu4DongModel[],
    layGiaTriChungHienTai: BangDonGiaTriTableProps["layGiaTriChungHienTai"]
): number | null => {
    let tong = 0;
    let coGiaTri = false;
    for (const d of danhSachDong) {
        const v = layGiaTriChungHienTai(d);
        if (v !== null && v !== undefined) {
            tong += v;
            coGiaTri = true;
        }
    }
    return coGiaTri ? tong : null;
};

export const BangDonGiaTriTable: React.FC<BangDonGiaTriTableProps> = ({
    dong,
    renderOGiaTriChung,
    layGiaTriChungHienTai,
    nhomTheoNhaThau = false,
    tenNhaThau,
}) => {
    if (!nhomTheoNhaThau) {
        return (
            <table className="phieu-table phieu4-table">
                <thead>
                    <tr>
                        <th className="cot-stt">STT</th>
                        <th className="cot-noi-dung">Nội dung</th>
                        <th className="cot-dvt">ĐVT</th>
                        <th>Số lượng</th>
                    </tr>
                </thead>
                <tbody>
                    {dong.map(d => (
                        <tr key={d.id}>
                            <td className="o-stt">{d.stt}</td>
                            <td className="o-noi-dung">{d.noiDung}</td>
                            <td className="o-dvt">{d.dvt}</td>
                            <td className="o-so">{renderOGiaTriChung(d)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="dong-nhom-bang1">
                        <td colSpan={3}>Tổng</td>
                        <td className="o-so o-so-tong">{tongGiaTri(dong, layGiaTriChungHienTai) ?? "--"}</td>
                    </tr>
                </tfoot>
            </table>
        );
    }

    // Gộp nhóm theo nhaThauId — thứ tự nhóm giữ nguyên thứ tự xuất hiện đầu
    // tiên trong "dong" (đã đúng thứ tự nhà thầu vì backend tạo dòng lần lượt
    // theo từng nhà thầu, xem DongBoBang5TuPhieu2Async).
    const nhomTheoId = new Map<number, Phieu4DongModel[]>();
    dong.forEach(d => {
        if (d.nhaThauId === undefined) return;
        if (!nhomTheoId.has(d.nhaThauId)) nhomTheoId.set(d.nhaThauId, []);
        nhomTheoId.get(d.nhaThauId)!.push(d);
    });

    return (
        <table className="phieu-table phieu4-table">
            <thead>
                <tr>
                    <th className="cot-stt">STT</th>
                    <th>Nhà thầu</th>
                    <th className="cot-noi-dung">Nhà ăn/Điểm ăn phục vụ</th>
                    <th>Số lượng suất ăn phục vụ/ngày</th>
                    <th>Tổng số suất ăn được phân bổ/ngày</th>
                </tr>
            </thead>
            <tbody>
                {Array.from(nhomTheoId.entries()).map(([nhaThauId, dongCuaNhom]) => (
                    dongCuaNhom.map((d, idx) => (
                        <tr key={d.id}>
                            <td className="o-stt">{d.stt}</td>
                            {idx === 0 && (
                                <td className="o-noi-dung" rowSpan={dongCuaNhom.length}>
                                    {tenNhaThau ? tenNhaThau(nhaThauId) : `NT#${nhaThauId}`}
                                </td>
                            )}
                            <td className="o-noi-dung">{d.noiDung}</td>
                            <td className="o-so">{renderOGiaTriChung(d)}</td>
                            {idx === 0 && (
                                <td className="o-so o-so-tong" rowSpan={dongCuaNhom.length}>
                                    {tongGiaTri(dongCuaNhom, layGiaTriChungHienTai) ?? "--"}
                                </td>
                            )}
                        </tr>
                    ))
                ))}
            </tbody>
        </table>
    );
};

export default BangDonGiaTriTable;
