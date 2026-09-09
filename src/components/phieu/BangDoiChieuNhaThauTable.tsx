import React from "react";

import { Phieu4BangModel, Phieu4DongModel } from "../../models/Phieu4ResponseModel";

// Bảng "nhà thầu là HÀNG" — khác quy ước NHÀ THẦU LÀ CỘT dùng ở mọi bảng khác
// của Phiếu 4 (BangCoDinhTable, BangDonGiaTriTable). Chỉ dùng cho Bảng 3.2
// ("Điểm tổng hợp của các Nhà thầu") để khớp đúng layout bản giấy
// BM.09/HD.22.04 — dữ liệu vẫn lưu dòng × cột nhà thầu như bình thường (xem
// Phieu4Service.DongBoBang3CoDinhAsync), chỉ XOAY TRỤC lúc hiển thị.
export interface BangDoiChieuNhaThauCotConfig {
    stt: number;
    label: string;
}

export interface BangDoiChieuNhaThauTableProps {
    config: BangDoiChieuNhaThauCotConfig[];
    bang: Phieu4BangModel;
    cotNhaThau: { nhaThauId: number }[];
    tenNhaThau: (id: number) => string;
    layGiaTri: (dong: Phieu4DongModel, nhaThauId: number) => number | null | undefined;
    renderOGiaTri: (dong: Phieu4DongModel, nhaThauId: number) => React.ReactNode;
}

export const BangDoiChieuNhaThauTable: React.FC<BangDoiChieuNhaThauTableProps> = ({
    config,
    bang,
    cotNhaThau,
    tenNhaThau,
    layGiaTri,
    renderOGiaTri,
}) => {
    const timDong = (stt: number): Phieu4DongModel | undefined =>
        bang.dong.find(d => d.nhomSo === 1 && d.stt === stt);

    const dongTheoCot = config.map(c => timDong(c.stt));

    return (
        <table className="phieu-table phieu4-table">
            <thead>
                <tr>
                    <th>Nhà thầu</th>
                    {config.map(c => (
                        <th key={c.stt}>{c.label}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {cotNhaThau.map(cot => (
                    <tr key={cot.nhaThauId}>
                        <td className="o-noi-dung">{tenNhaThau(cot.nhaThauId)}</td>
                        {dongTheoCot.map((d, idx) => (
                            <td key={config[idx].stt} className="o-so">
                                {d ? renderOGiaTri(d, cot.nhaThauId) : "--"}
                            </td>
                        ))}
                    </tr>
                ))}
                <tr className="dong-nhom-bang1">
                    <td>Tổng</td>
                    {dongTheoCot.map((d, idx) => {
                        if (!d) return <td key={config[idx].stt} className="o-so o-so-tong">--</td>;
                        let tong = 0;
                        let coGiaTri = false;
                        for (const cot of cotNhaThau) {
                            const v = layGiaTri(d, cot.nhaThauId);
                            if (v !== null && v !== undefined) {
                                tong += v;
                                coGiaTri = true;
                            }
                        }
                        return (
                            <td key={config[idx].stt} className="o-so o-so-tong">
                                {coGiaTri ? tong : "--"}
                            </td>
                        );
                    })}
                </tr>
            </tbody>
        </table>
    );
};

export default BangDoiChieuNhaThauTable;
