import React from "react";
import { Tag } from "antd";
import { Phieu4BangModel, Phieu4DongModel } from "../../models/Phieu4ResponseModel";

// ============================================================
// CONFIG DẠNG MA TRẬN (dòng × cột) CHO CÁC BẢNG "CỐ ĐỊNH" (hard-code) —
// thay cho viết thẳng JSX/HTML lặp lại ở mỗi bảng (Bảng 1/2 của Phiếu 3/4).
//
// Cột luôn là 3 cột tĩnh (STT/Nội dung/ĐVT) + N cột ĐỘNG theo nhà thầu (ma
// trận nhà thầu là đặc thù chung của toàn hệ thống, không cần khai báo lại
// mỗi bảng) — phần THỰC SỰ khác nhau giữa các bảng là cấu trúc DÒNG (nhóm
// nào, mấy dòng con, có dòng tổng hay không) nên config tập trung mô tả
// đúng phần đó. Mỗi dòng khớp với 1 dòng thật trong DB qua "key" =
// (nhomSo, stt) — dùng để tra đúng Phieu4Dong/Phieu4GiaTri tương ứng.
// ============================================================

export interface BangDongConfig {
    nhomSo: number;
    stt: number;
    label: string; // nhãn hiển thị (đè lên NoiDung lưu DB, giống NHAN_MUC_BANG1 cũ)
}

export interface BangNhomConfig {
    nhomSo: number;
    soLaMa: string;
    nhanNhom: string;
    // Dòng CHA của nhóm (tùy chọn) — nếu có, chính dòng la-mã/header của
    // nhóm CŨNG LÀ 1 dòng dữ liệu thật (nhập/hiển thị giá trị được, không
    // chỉ là nhãn suông). Bắt buộc khai báo đúng "stt" của dòng cha thật
    // trong DB — không có quy ước ngầm (1 bảng có thể có nhiều nhóm dạng
    // này ở Stt khác nhau, VD Bảng 2: nhóm 1 dùng Stt 1-6, nhóm 2 dùng Stt
    // 7, nhóm 3 phải dùng Stt khác như 13). Dùng ĐỘC LẬP (nhóm chỉ có đúng
    // dòng cha, không tiêu chí con — "dong" để rỗng) hoặc dùng CHUNG với
    // "dong" bên dưới (dòng cha nhập được RIÊNG, cộng thêm tiêu chí con
    // hiển thị bên dưới nó — VD dòng cha là 1 chỉ số tổng hợp tự nhập, các
    // dòng con là chi tiết theo từng tiêu chí).
    dongCha?: { stt: number };
    // Tiêu chí con — nhiều dòng con hiển thị bên dưới dòng cha/header (VD 5
    // mức của Nhóm 2 Bảng 1, 6 tiêu chí của Bảng 2). Để rỗng nếu nhóm chỉ
    // có đúng dòng cha, không tách con.
    dong: BangDongConfig[];
    // Hiện thêm 1 dòng "tổng" ngay dưới header nhóm = tổng giá trị các dòng
    // con (tính ở FE, không lưu DB) — VD dòng "II" của Bảng 1 vừa là header
    // vừa hiện luôn tổng 5 mức. Chỉ có ý nghĩa khi KHÔNG dùng dongCha (dòng
    // cha đã tự có giá trị riêng của nó, không cần tính tổng thay).
    coDongTongTrenHeader?: boolean;
}

export interface BangCoDinhConfig {
    key: string;
    nhom: BangNhomConfig[];
}

export interface BangCoDinhTableProps {
    config: BangCoDinhConfig;
    bang: Phieu4BangModel;
    cotNhaThau: { nhaThauId: number }[];
    tenNhaThau: (id: number) => string;
    layGiaTri: (dong: Phieu4DongModel, nhaThauId: number) => number | null | undefined;
    renderOGiaTri: (dong: Phieu4DongModel, nhaThauId: number) => React.ReactNode;
    daChinhSuaThuCong: (dong: Phieu4DongModel, nhaThauId: number) => boolean;
}

// Tổng giá trị 1 nhóm dòng con cho 1 cột nhà thầu — dùng chung cho MỌI nhóm
// có coDongTongTrenHeader (không riêng Bảng 1), phản ánh cả giá trị đang sửa
// tay cục bộ (chưa lưu) qua layGiaTri.
const tongNhom = (
    dongCon: Phieu4DongModel[],
    nhaThauId: number,
    layGiaTri: BangCoDinhTableProps["layGiaTri"]
): number | null => {
    if (dongCon.length === 0) return null;
    let tong = 0;
    let coGiaTri = false;
    for (const d of dongCon) {
        const v = layGiaTri(d, nhaThauId);
        if (v !== null && v !== undefined) {
            tong += v;
            coGiaTri = true;
        }
    }
    return coGiaTri ? tong : null;
};

export const BangCoDinhTable: React.FC<BangCoDinhTableProps> = ({
    config,
    bang,
    cotNhaThau,
    tenNhaThau,
    layGiaTri,
    renderOGiaTri,
    daChinhSuaThuCong,
}) => {
    const timDong = (nhomSo: number, stt: number): Phieu4DongModel | undefined =>
        bang.dong.find(d => d.nhomSo === nhomSo && d.stt === stt);

    return (
        <table className="phieu-table phieu4-table" data-bang-key={config.key}>
            <thead>
                <tr>
                    <th className="cot-stt">STT</th>
                    <th className="cot-noi-dung">Nội dung</th>
                    <th className="cot-dvt">ĐVT</th>
                    {cotNhaThau.map(c => (
                        <th key={c.nhaThauId}>{tenNhaThau(c.nhaThauId)}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {config.nhom.map(nhom => {
                    const dongCha = nhom.dongCha ? timDong(nhom.nhomSo, nhom.dongCha.stt) : undefined;
                    const dongCon = nhom.dong
                        .map(dc => ({ cfg: dc, dong: timDong(dc.nhomSo, dc.stt) }))
                        .filter((x): x is { cfg: BangDongConfig; dong: Phieu4DongModel } => !!x.dong);

                    // Chỉ có dòng cha, không có tiêu chí con -> 1 dòng gộp duy nhất.
                    if (nhom.dongCha && dongCon.length === 0) {
                        if (!dongCha) return null;
                        return (
                            <tr key={nhom.nhomSo} className="dong-nhom-bang1">
                                <td className="o-stt">{nhom.soLaMa}</td>
                                <td className="o-noi-dung">{nhom.nhanNhom}</td>
                                <td className="o-dvt">{dongCha.dvt}</td>
                                {cotNhaThau.map(c => (
                                    <td key={c.nhaThauId} className="o-so">
                                        {renderOGiaTri(dongCha, c.nhaThauId)}
                                        {daChinhSuaThuCong(dongCha, c.nhaThauId) && (
                                            <Tag className="o-tag-sua-tay" color="orange">tay</Tag>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        );
                    }

                    // Không có dòng cha lẫn tiêu chí con hợp lệ -> ẩn cả nhóm.
                    if (dongCon.length === 0) return null;

                    return (
                        <React.Fragment key={nhom.nhomSo}>
                            <tr className="dong-nhom-bang1">
                                <td className="o-stt">{nhom.soLaMa}</td>
                                {dongCha ? (
                                    // Dòng cha CŨNG nhập được — hiện giá trị thật thay vì
                                    // nhãn/tổng suông trên hàng header.
                                    <>
                                        <td className="o-noi-dung">{nhom.nhanNhom}</td>
                                        <td className="o-dvt">{dongCha.dvt}</td>
                                        {cotNhaThau.map(c => (
                                            <td key={c.nhaThauId} className="o-so">
                                                {renderOGiaTri(dongCha, c.nhaThauId)}
                                                {daChinhSuaThuCong(dongCha, c.nhaThauId) && (
                                                    <Tag className="o-tag-sua-tay" color="orange">tay</Tag>
                                                )}
                                            </td>
                                        ))}
                                    </>
                                ) : nhom.coDongTongTrenHeader ? (
                                    <>
                                        <td className="o-noi-dung">{nhom.nhanNhom}</td>
                                        <td className="o-dvt" />
                                        {cotNhaThau.map(c => (
                                            <td key={c.nhaThauId} className="o-so o-so-tong">
                                                {tongNhom(dongCon.map(x => x.dong), c.nhaThauId, layGiaTri) ?? "--"}
                                            </td>
                                        ))}
                                    </>
                                ) : (
                                    <td colSpan={2 + cotNhaThau.length}>{nhom.nhanNhom}</td>
                                )}
                            </tr>
                            {dongCon.map(({ cfg, dong }, idxDong) => (
                                <tr key={dong.id}>
                                    <td className="o-stt o-stt-con">{idxDong + 1}</td>
                                    <td className="o-noi-dung">{cfg.label || dong.noiDung}</td>
                                    <td className="o-dvt">{dong.dvt}</td>
                                    {cotNhaThau.map(c => (
                                        <td key={c.nhaThauId} className="o-so">
                                            {renderOGiaTri(dong, c.nhaThauId)}
                                            {daChinhSuaThuCong(dong, c.nhaThauId) && (
                                                <Tag className="o-tag-sua-tay" color="orange">tay</Tag>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </React.Fragment>
                    );
                })}
            </tbody>
        </table>
    );
};

export default BangCoDinhTable;
