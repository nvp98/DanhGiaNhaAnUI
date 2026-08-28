import { Button, DatePicker, Input, InputNumber, Modal, Select, Tag, Tooltip } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaSyncAlt, FaEdit } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import LayoutV2Component from "../../components/LayoutV2Component";
import {
    PhieuActions,
    PhieuHeader,
    PhieuInputCard,
    PhieuSignatures,
    PhieuToolbar,
    TienDoKy,
} from "../../components/phieu";

import NhaThauModel from "../../models/NhaThauModel";
import NhomTieuChiModel from "../../models/NhomTieuChiModel";
import { Phieu4BangModel, Phieu4DongModel } from "../../models/Phieu4ResponseModel";

import { useDanhSachNhaThauQuery } from "../../services/nhaThauApiV2";
import { useDanhSachNhomTieuChiQuery } from "../../services/nhomTieuChiApi";
import {
    useChiTietPhieu4Query,
    useCapNhatGiaTriPhieu4Mutation,
    useDongBoTrangThaiPhieu4Mutation,
    useGuiKyPhieu4Mutation,
    useSuaBangPhieu4Mutation,
    useThemNhaThauPhieu4Mutation,
    useThemPhieu4Mutation,
    useTinhLaiPhieu4Mutation,
    useXoaPhieu4Mutation,
} from "../../services/phieu4Api";

import { setNotify } from "../../store/notifycationSlide";
import { RootType } from "../../store/types";

import "./Phieu4FormPage.scss";

const SO_LA_MA: Record<number, string> = {
    1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII", 9: "IX", 10: "X",
};
const laMa = (n: number): string => SO_LA_MA[n] ?? String(n);

// Nhãn hiển thị cho 4 nhóm cố định của Bảng 1 — khớp mẫu báo cáo giấy (khác
// NoiDung ngắn gọn lưu ở DB, thay đổi thuần hiển thị, không đụng dữ liệu/logic
// tính toán vốn tra theo NhomSo/Stt).
const NHAN_NHOM_BANG1: Record<number, string> = {
    1: "Tổng số lượng suất ăn tại chỗ cấp phát tại các điểm đánh giá",
    2: "Số lượt CBNV tham gia đánh giá",
    3: "Điểm đánh giá trung bình của CBNV theo lượt đánh giá",
    4: "Tỷ lệ CBNV tham gia phản hồi (II/I)",
};
const NHAN_MUC_BANG1: Record<number, string> = {
    1: "1-Rất không hài lòng",
    2: "2-Không hài lòng",
    3: "3-Bình thường",
    4: "4-Hài lòng",
    5: "5-Rất hài lòng",
};

const Phieu4FormPage: React.FC = () => {
    const { id } = useParams();
    const laTaoMoi = !id || id === "moi";
    const phieuId = laTaoMoi ? undefined : Number(id);

    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    // ============================================================
    // QUERIES & MUTATIONS
    // ============================================================

    const { data: chiTietPhieu } = useChiTietPhieu4Query(
        phieuId!,
        { skip: laTaoMoi }
    );
    const { data: danhSachNhaThau = [] } = useDanhSachNhaThauQuery();
    const { data: danhSachNhomPhieu4 = [] } = useDanhSachNhomTieuChiQuery({
        loaiPhieu: "PHIEU4",
        dangHoatDong: true,
    });

    const [themPhieu4, { isLoading: dangThem }] = useThemPhieu4Mutation();
    const [xoaPhieu4] = useXoaPhieu4Mutation();
    const [tinhLaiPhieu4, { isLoading: dangTinhLai }] = useTinhLaiPhieu4Mutation();
    const [themNhaThauPhieu4, { isLoading: dangThemNhaThau }] = useThemNhaThauPhieu4Mutation();
    const [capNhatGiaTriPhieu4, { isLoading: dangLuuGiaTri }] = useCapNhatGiaTriPhieu4Mutation();
    const [suaBangPhieu4] = useSuaBangPhieu4Mutation();
    const [guiKyPhieu4, { isLoading: dangGuiKy }] = useGuiKyPhieu4Mutation();
    const [dongBoTrangThaiPhieu4] = useDongBoTrangThaiPhieu4Mutation();

    // ============================================================
    // LOCAL STATES
    // ============================================================

    const [tuNgay, setTuNgay] = useState<dayjs.Dayjs | null>(dayjs().startOf("month"));
    const [denNgay, setDenNgay] = useState<dayjs.Dayjs | null>(dayjs().endOf("month"));
    const [nhaThauIds, setNhaThauIds] = useState<number[]>([]);
    const [nhaThauMoiId, setNhaThauMoiId] = useState<number | undefined>(undefined);

    // Sửa tay giá trị — overlay cục bộ (chưa lưu) theo key "dongId_nhaThauId"
    const [chinhSuaCucBo, setChinhSuaCucBo] = useState<Record<string, number | null>>({});

    // Sửa tên bảng
    const [dangSuaTenBang, setDangSuaTenBang] = useState<{ bangId: number; ten: string } | null>(null);

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        }
    }, [authV2.isAuthenticated, navigator]);

    useEffect(() => {
        if (chiTietPhieu) {
            setTuNgay(dayjs(chiTietPhieu.phieu.tuNgay));
            setDenNgay(dayjs(chiTietPhieu.phieu.denNgay));
            setNhaThauIds(chiTietPhieu.nhaThau.map(n => n.nhaThauId));
            setChinhSuaCucBo({});
        }
    }, [chiTietPhieu?.phieu.id]);

    if (!authV2.isAuthenticated) {
        return null;
    }

    const phieu = chiTietPhieu?.phieu;
    const coTheSua =
        laTaoMoi ||
        !phieu ||
        phieu.trangThai === "NHAP" ||
        phieu.trangThai === "TU_CHOI";

    const cotNhaThau = useMemo(
        () => (chiTietPhieu?.nhaThau ?? []).slice().sort((a, b) => a.thuTu - b.thuTu),
        [chiTietPhieu]
    );
    const tenNhaThau = (idNt: number) =>
        danhSachNhaThau.find((nt: NhaThauModel) => nt.id === idNt)?.ten ?? `NT#${idNt}`;

    const bang1 = chiTietPhieu?.bang.find(b => b.soBang === 1);
    const bangKhac = (chiTietPhieu?.bang ?? []).filter(b => b.soBang !== 1).sort((a, b) => a.soBang - b.soBang);

    // Bảng 1: 4 nhóm dòng cố định (NhomSo 1-4) — nhóm hiển thị STT la mã
    // (I..IV), riêng nhóm 2 (5 dòng mức 1-5) có thêm dòng tổng + STT Ả Rập
    // con bên dưới, khớp mẫu báo cáo giấy.
    const dongNhom1Bang1 = bang1?.dong.find(d => d.nhomSo === 1);
    const dongNhom2Bang1 = (bang1?.dong ?? [])
        .filter(d => d.nhomSo === 2)
        .sort((a, b) => (a.stt ?? 0) - (b.stt ?? 0));
    const dongNhom3Bang1 = bang1?.dong.find(d => d.nhomSo === 3);
    const dongNhom4Bang1 = bang1?.dong.find(d => d.nhomSo === 4);

    // Nhóm dòng của 1 bảng (2-5) theo NhomTieuChi (master, cùng SoBang) —
    // giống cách Phieu1FormPage nhóm checklist theo NhomId. Nội dung dòng CỐ
    // ĐỊNH theo master (đồng bộ tự động ở backend mỗi lần đọc phiếu — xem
    // Phieu4Service.ChiTietAsync/DongBoDongTuMauAsync), không còn thêm/sửa/xóa
    // dòng thủ công nên nhóm rỗng (chưa có tiêu chí active nào) sẽ ẩn luôn.
    const nhomVaDongCuaBang = (bang: Phieu4BangModel) => {
        const nhomCuaBang = danhSachNhomPhieu4
            .filter((n: NhomTieuChiModel) => n.soBang === bang.soBang)
            .slice()
            .sort((a: NhomTieuChiModel, b: NhomTieuChiModel) => a.thuTu - b.thuTu);
        const idNhomHopLe = new Set(nhomCuaBang.map((n: NhomTieuChiModel) => n.id));

        const nhomVaDong = nhomCuaBang
            .map((nhom: NhomTieuChiModel) => ({
                nhom,
                dong: bang.dong
                    .filter(d => d.nhomTieuChiId === nhom.id)
                    .sort((a, b) => (a.stt ?? 0) - (b.stt ?? 0)),
            }))
            .filter(x => x.dong.length > 0);

        // Dòng cũ (từ trước khi Bảng 2-5 chuyển sang cố định theo master) có
        // thể không gắn nhóm hợp lệ — vẫn hiển thị để không mất dữ liệu.
        const dongKhongNhom = bang.dong
            .filter(d => !d.nhomTieuChiId || !idNhomHopLe.has(d.nhomTieuChiId))
            .sort((a, b) => (a.stt ?? 0) - (b.stt ?? 0));

        return { nhomVaDong, dongKhongNhom };
    };

    // ============================================================
    // GIÁ TRỊ Ô (overlay cục bộ + gốc)
    // ============================================================

    const layGiaTri = (dong: Phieu4DongModel, nhaThauId: number): number | null | undefined => {
        const key = `${dong.id}_${nhaThauId}`;
        if (key in chinhSuaCucBo) return chinhSuaCucBo[key];
        return dong.giaTri.find(g => g.nhaThauId === nhaThauId)?.giaTri;
    };

    const daChinhSuaThuCong = (dong: Phieu4DongModel, nhaThauId: number): boolean =>
        dong.giaTri.find(g => g.nhaThauId === nhaThauId)?.chinhSuaThuCong ?? false;

    // Dòng tổng của nhóm 2 (Bảng 1) — cộng lại từ 5 dòng mức 1-5, phản ánh cả
    // giá trị đang sửa tay cục bộ (chưa lưu) để hiển thị đồng bộ khi gõ số.
    const tongNhom2Bang1 = (nhaThauId: number): number | null => {
        if (dongNhom2Bang1.length === 0) return null;
        let tong = 0;
        let coGiaTri = false;
        dongNhom2Bang1.forEach(d => {
            const v = layGiaTri(d, nhaThauId);
            if (v !== null && v !== undefined) {
                tong += v;
                coGiaTri = true;
            }
        });
        return coGiaTri ? tong : null;
    };

    const capNhatGiaTriCucBo = (dongId: number, nhaThauId: number, giaTri: number | null) => {
        setChinhSuaCucBo(cs => ({ ...cs, [`${dongId}_${nhaThauId}`]: giaTri }));
    };

    const renderOGiaTri = (dong: Phieu4DongModel, nhaThauId: number) => {
        const giaTri = layGiaTri(dong, nhaThauId);
        if (coTheSua) {
            return (
                <InputNumber
                    className="o-input-so"
                    bordered={false}
                    value={giaTri ?? null}
                    onChange={v => capNhatGiaTriCucBo(dong.id, nhaThauId, v)}
                />
            );
        }
        return <span>{giaTri ?? "--"}</span>;
    };

    // ============================================================
    // TẠO MỚI / LƯU GIÁ TRỊ / TÍNH LẠI
    // ============================================================

    const xuLyTaoMoi = async () => {
        if (nhaThauIds.length === 0) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: "Vui lòng chọn ít nhất 1 nhà thầu", messageNotify: "" }));
            return;
        }
        if (!tuNgay || !denNgay) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: "Vui lòng chọn khoảng ngày", messageNotify: "" }));
            return;
        }
        try {
            const ketQua = await themPhieu4({
                tuNgay: tuNgay.format("YYYY-MM-DD"),
                denNgay: denNgay.format("YYYY-MM-DD"),
                nhaThauIds,
            }).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã lập phiếu tổng hợp", messageNotify: "" }));
            navigator(`/phieu4/${ketQua.phieu.id}`);
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Lập phiếu thất bại", messageNotify: "" }));
        }
    };

    const luuGiaTri = async () => {
        if (laTaoMoi) {
            await xuLyTaoMoi();
            return;
        }
        const cacKey = Object.keys(chinhSuaCucBo);
        if (cacKey.length === 0) {
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Không có thay đổi để lưu", messageNotify: "" }));
            return;
        }
        const giaTriGui = cacKey.map(key => {
            const [dongId, nhaThauId] = key.split("_").map(Number);
            return { dongId, nhaThauId, giaTri: chinhSuaCucBo[key] };
        });
        try {
            await capNhatGiaTriPhieu4({ id: phieuId!, body: { giaTri: giaTriGui } }).unwrap();
            setChinhSuaCucBo({});
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã lưu thay đổi", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Lưu thất bại", messageNotify: "" }));
        }
    };

    const xuLyTinhLai = async () => {
        try {
            await tinhLaiPhieu4(phieuId!).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã tính lại Bảng 1 (giữ nguyên ô đã sửa tay)", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Tính lại thất bại", messageNotify: "" }));
        }
    };

    const xuLyThemNhaThau = async () => {
        if (!nhaThauMoiId) return;
        try {
            await themNhaThauPhieu4({ id: phieuId!, body: { nhaThauId: nhaThauMoiId } }).unwrap();
            setNhaThauMoiId(undefined);
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã thêm nhà thầu vào phiếu", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Thêm nhà thầu thất bại", messageNotify: "" }));
        }
    };

    const xuLyXoaPhieu = async () => {
        try {
            await xoaPhieu4(phieuId!).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã xóa phiếu tổng hợp", messageNotify: "" }));
            navigator("/phieu4");
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Xóa thất bại", messageNotify: "" }));
        }
    };

    const xuLyGuiKy = async () => {
        try {
            await luuGiaTri();
            await guiKyPhieu4(phieuId!).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã gửi ký", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Gửi ký thất bại", messageNotify: "" }));
        }
    };

    // ============================================================
    // SỬA TÊN BẢNG (Bảng 2-5 không còn thêm/sửa/xóa dòng thủ công — nội dung
    // dòng cố định theo NhomTieuChi/TieuChi master, tự đồng bộ ở backend)
    // ============================================================

    const luuTenBang = async () => {
        if (!dangSuaTenBang) return;
        try {
            await suaBangPhieu4({ id: phieuId!, bangId: dangSuaTenBang.bangId, body: { tenBang: dangSuaTenBang.ten } }).unwrap();
            setDangSuaTenBang(null);
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Sửa tên bảng thất bại", messageNotify: "" }));
        }
    };

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <LayoutV2Component>
            <PhieuToolbar
                title={
                    laTaoMoi
                        ? "Lập bảng tổng hợp đánh giá & phân bổ suất ăn"
                        : `Bảng tổng hợp — ${phieu?.soHieu ?? ""}`
                }
                trangThai={phieu?.trangThai}
                onPrint={() => window.print()}
            />

            <PhieuInputCard title="Thông tin phiếu">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <div className="mb-1 font-medium">Từ ngày</div>
                            <DatePicker className="w-full" format="DD/MM/YYYY" disabled={!laTaoMoi} value={tuNgay} onChange={v => setTuNgay(v)} />
                        </div>
                        <div>
                            <div className="mb-1 font-medium">Đến ngày</div>
                            <DatePicker className="w-full" format="DD/MM/YYYY" disabled={!laTaoMoi} value={denNgay} onChange={v => setDenNgay(v)} />
                        </div>
                        <div>
                            <div className="mb-1 font-medium">Nhà thầu (cột trong bảng)</div>
                            <Select
                                className="w-full"
                                mode="multiple"
                                placeholder="-- Chọn các nhà thầu --"
                                showSearch
                                optionFilterProp="children"
                                disabled={!laTaoMoi}
                                value={nhaThauIds}
                                onChange={v => setNhaThauIds(v)}
                            >
                                {danhSachNhaThau.map((nt: NhaThauModel) => (
                                    <Select.Option key={nt.id} value={nt.id}>{nt.ten}</Select.Option>
                                ))}
                            </Select>
                        </div>
                    </div>
                    {!laTaoMoi && (
                        <div className="text-xs text-gray-400 mt-2">
                            Khoảng ngày cố định từ lúc lập phiếu. Danh sách nhà thầu chỉ có thể THÊM cột mới (không xóa/đổi cột đã có).
                        </div>
                    )}
                    {!laTaoMoi && coTheSua && (
                        <div className="flex items-end gap-2 mt-3">
                            <div className="flex-1">
                                <div className="mb-1 font-medium">Thêm cột nhà thầu</div>
                                <Select
                                    className="w-full"
                                    placeholder="-- Chọn nhà thầu để thêm cột --"
                                    showSearch
                                    optionFilterProp="children"
                                    value={nhaThauMoiId}
                                    onChange={v => setNhaThauMoiId(v)}
                                >
                                    {danhSachNhaThau
                                        .filter((nt: NhaThauModel) => !cotNhaThau.some(c => c.nhaThauId === nt.id))
                                        .map((nt: NhaThauModel) => (
                                            <Select.Option key={nt.id} value={nt.id}>{nt.ten}</Select.Option>
                                        ))}
                                </Select>
                            </div>
                            <Button
                                icon={<FaPlus />}
                                loading={dangThemNhaThau}
                                disabled={!nhaThauMoiId}
                                onClick={xuLyThemNhaThau}
                            >
                                Thêm
                            </Button>
                        </div>
                    )}
            </PhieuInputCard>

            {laTaoMoi ? (
                <div className="no-print">
                    <Button type="primary" size="large" loading={dangThem} onClick={xuLyTaoMoi}>
                        Lập phiếu — tự động tính Bảng 1 từ Phiếu 2
                    </Button>
                </div>
            ) : (
                <div className="phieu-a4 phieu4-a4">
                    <PhieuHeader
                        title="BẢNG TỔNG HỢP ĐÁNH GIÁ & PHÂN BỔ SUẤT ĂN"
                        subtitle={`Số: ${phieu?.soHieu ?? ""}`}
                        infoItems={[
                            {
                                label: "Khoảng thời gian:",
                                value: tuNgay && denNgay ? `${tuNgay.format("DD/MM/YYYY")} — ${denNgay.format("DD/MM/YYYY")}` : "",
                            },
                        ]}
                    />

                    {/* BẢNG 1 — cấu trúc cố định, tự động tính */}
                    {bang1 && (
                        <div className="phieu4-bang-block">
                            <div className="phieu4-bang-title">
                                {bang1.tenBang}
                                {coTheSua && (
                                    <Button className="no-print ml-3" size="small" icon={<FaSyncAlt />} loading={dangTinhLai} onClick={xuLyTinhLai}>
                                        Tính lại từ Phiếu 2
                                    </Button>
                                )}
                            </div>
                            <div className="phieu4-table-scroll">
                                <table className="phieu-table phieu4-table phieu4-bang1-table">
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
                                        {dongNhom1Bang1 && (
                                            <tr className="dong-nhom-bang1">
                                                <td className="o-stt">I</td>
                                                <td className="o-noi-dung">{NHAN_NHOM_BANG1[1]}</td>
                                                <td className="o-dvt">{dongNhom1Bang1.dvt}</td>
                                                {cotNhaThau.map(c => (
                                                    <td key={c.nhaThauId} className="o-so">
                                                        {renderOGiaTri(dongNhom1Bang1, c.nhaThauId)}
                                                        {daChinhSuaThuCong(dongNhom1Bang1, c.nhaThauId) && (
                                                            <Tag className="o-tag-sua-tay" color="orange">tay</Tag>
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        )}

                                        {dongNhom2Bang1.length > 0 && (
                                            <>
                                                <tr className="dong-nhom-bang1">
                                                    <td className="o-stt">II</td>
                                                    <td className="o-noi-dung">{NHAN_NHOM_BANG1[2]}</td>
                                                    <td className="o-dvt" />
                                                    {cotNhaThau.map(c => (
                                                        <td key={c.nhaThauId} className="o-so o-so-tong">
                                                            {tongNhom2Bang1(c.nhaThauId) ?? "--"}
                                                        </td>
                                                    ))}
                                                </tr>
                                                {dongNhom2Bang1.map(dong => (
                                                    <tr key={dong.id}>
                                                        <td className="o-stt o-stt-con">{dong.stt}</td>
                                                        <td className="o-noi-dung">{NHAN_MUC_BANG1[dong.stt ?? 0] ?? dong.noiDung}</td>
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
                                            </>
                                        )}

                                        {dongNhom3Bang1 && (
                                            <tr className="dong-nhom-bang1">
                                                <td className="o-stt">III</td>
                                                <td className="o-noi-dung">{NHAN_NHOM_BANG1[3]}</td>
                                                <td className="o-dvt">{dongNhom3Bang1.dvt}</td>
                                                {cotNhaThau.map(c => (
                                                    <td key={c.nhaThauId} className="o-so">
                                                        {renderOGiaTri(dongNhom3Bang1, c.nhaThauId)}
                                                        {daChinhSuaThuCong(dongNhom3Bang1, c.nhaThauId) && (
                                                            <Tag className="o-tag-sua-tay" color="orange">tay</Tag>
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        )}

                                        {dongNhom4Bang1 && (
                                            <tr className="dong-nhom-bang1">
                                                <td className="o-stt">IV</td>
                                                <td className="o-noi-dung">{NHAN_NHOM_BANG1[4]}</td>
                                                <td className="o-dvt">{dongNhom4Bang1.dvt}</td>
                                                {cotNhaThau.map(c => (
                                                    <td key={c.nhaThauId} className="o-so">
                                                        {renderOGiaTri(dongNhom4Bang1, c.nhaThauId)}
                                                        {daChinhSuaThuCong(dongNhom4Bang1, c.nhaThauId) && (
                                                            <Tag className="o-tag-sua-tay" color="orange">tay</Tag>
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="text-xs text-gray-400 no-print mt-1">
                                "Tổng số suất ăn" nhập tay. Các dòng còn lại tự tính từ Phiếu 2 — bấm "Tính lại" sau khi cập nhật Tổng số suất ăn.
                            </div>
                        </div>
                    )}

                    {/* BẢNG 2-5 — mỗi NhomTieuChi là 1 mục la mã, tiêu chí con render bên dưới.
                        Nội dung dòng cố định theo master (Nhóm tiêu chí/Tiêu chí), không còn
                        thêm/sửa/xóa dòng thủ công — muốn đổi nội dung thì cấu hình lại ở trang
                        "Nhóm tiêu chí"/"Tiêu chí" (loại phiếu PHIEU4), phiếu sẽ tự đồng bộ. */}
                    {bangKhac.map(bang => {
                        const { nhomVaDong, dongKhongNhom } = nhomVaDongCuaBang(bang);
                        const soCot = 3 + cotNhaThau.length;
                        return (
                            <div className="phieu4-bang-block mt-4" key={bang.id}>
                                <div className="phieu4-bang-title">
                                    {coTheSua ? (
                                        <Tooltip title="Sửa tên bảng">
                                            <span
                                                className="phieu4-ten-bang-edit no-print"
                                                onClick={() => setDangSuaTenBang({ bangId: bang.id, ten: bang.tenBang ?? "" })}
                                            >
                                                {bang.tenBang} <FaEdit size={12} />
                                            </span>
                                        </Tooltip>
                                    ) : (
                                        bang.tenBang
                                    )}
                                    <span className="print-only">{bang.tenBang}</span>
                                </div>
                                <div className="phieu4-table-scroll">
                                    <table className="phieu-table phieu4-table">
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
                                            {nhomVaDong.map(({ nhom, dong: dongCuaNhom }, idxNhom) => (
                                                <React.Fragment key={nhom.id}>
                                                    <tr className="dong-nhom">
                                                        <td className="o-stt">{laMa(idxNhom + 1)}</td>
                                                        <td colSpan={soCot - 1}>{nhom.ten}</td>
                                                    </tr>
                                                    {dongCuaNhom.map((dong, idxDong) => (
                                                        <tr key={dong.id}>
                                                            <td className="o-stt o-stt-con">{idxDong + 1}</td>
                                                            <td className="o-noi-dung">{dong.noiDung}</td>
                                                            <td className="o-dvt">{dong.dvt}</td>
                                                            {cotNhaThau.map(c => (
                                                                <td key={c.nhaThauId} className="o-so">
                                                                    {renderOGiaTri(dong, c.nhaThauId)}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            ))}

                                            {dongKhongNhom.length > 0 && nhomVaDong.length > 0 && (
                                                <tr className="dong-nhom">
                                                    <td className="o-stt">-</td>
                                                    <td colSpan={soCot - 1}>Nội dung khác</td>
                                                </tr>
                                            )}
                                            {dongKhongNhom.map((dong, idxDong) => (
                                                <tr key={dong.id}>
                                                    <td className="o-stt o-stt-con">{idxDong + 1}</td>
                                                    <td className="o-noi-dung">{dong.noiDung}</td>
                                                    <td className="o-dvt">{dong.dvt}</td>
                                                    {cotNhaThau.map(c => (
                                                        <td key={c.nhaThauId} className="o-so">
                                                            {renderOGiaTri(dong, c.nhaThauId)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                            {nhomVaDong.length === 0 && dongKhongNhom.length === 0 && (
                                                <tr>
                                                    <td colSpan={soCot} className="text-center text-gray-400">
                                                        Chưa cấu hình nhóm/tiêu chí cho Bảng {bang.soBang} — vào trang "Nhóm tiêu chí"/"Tiêu chí" (loại phiếu PHIEU4) để thiết lập.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}

                    {/* CHỮ KÝ */}
                    <PhieuSignatures
                        columns={[
                            { title: "TRƯỞNG/PHÓ BỘ PHẬN (P.ĐN)", subTitle: "(Ký, ghi rõ họ tên)" },
                            { title: "TRƯỞNG/PHÓ BỘ PHẬN (P.ATMT)", subTitle: "(Ký, ghi rõ họ tên)" },
                            { title: "BAN GIÁM ĐỐC", subTitle: "(Ký, ghi rõ họ tên)" },
                        ]}
                    />
                </div>
            )}

            {!laTaoMoi && (
                <PhieuActions
                    coTheSua={coTheSua}
                    laTaoMoi={laTaoMoi}
                    trangThai={phieu?.trangThai}
                    dangLuu={dangLuuGiaTri}
                    dangGuiKy={dangGuiKy}
                    onLuu={luuGiaTri}
                    onGuiKy={xuLyGuiKy}
                    onXoa={xuLyXoaPhieu}
                />
            )}

            {!laTaoMoi && phieuId && phieu && phieu.trangThai !== "NHAP" && (
                <div className="no-print">
                    <TienDoKy
                        loaiDoiTuong="PHIEU4"
                        doiTuongId={phieuId}
                        onDaDongBo={() => dongBoTrangThaiPhieu4(phieuId)}
                    />
                </div>
            )}

            {/* MODAL SỬA TÊN BẢNG */}
            <Modal
                title="Sửa tên bảng"
                open={dangSuaTenBang !== null}
                onCancel={() => setDangSuaTenBang(null)}
                onOk={luuTenBang}
                okText="Lưu"
                cancelText="Hủy"
            >
                {dangSuaTenBang && (
                    <Input
                        value={dangSuaTenBang.ten}
                        onChange={e => setDangSuaTenBang({ ...dangSuaTenBang, ten: e.target.value })}
                    />
                )}
            </Modal>
        </LayoutV2Component>
    );
};

export default Phieu4FormPage;
