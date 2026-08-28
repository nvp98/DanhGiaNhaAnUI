import { Button, InputNumber, Select, Tag, Tooltip } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { FaEdit, FaImage, FaSyncAlt } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import LayoutV2Component from "../../components/LayoutV2Component";
import {
    GhiChuHtml,
    PhieuActions,
    PhieuHeader,
    PhieuInputCard,
    PhieuSignatures,
    PhieuToolbar,
    TienDoKy,
    TinyMceModal,
} from "../../components/phieu";

import NhaThauModel from "../../models/NhaThauModel";
import PhongBanModel from "../../models/PhongBanModel";
import { Phieu3Bang1DongModel, Phieu3Bang2DongModel } from "../../models/Phieu3ResponseModel";

import { useDanhSachNhaThauQuery } from "../../services/nhaThauApiV2";
import { useDanhSachPhieu1Query } from "../../services/phieu1Api";
import { useDanhSachPhieu2Query } from "../../services/phieu2Api";
import {
    Phieu3Bang1DongRequest,
    Phieu3Bang2DongRequest,
    useChiTietPhieu3Query,
    useDongBoTrangThaiPhieu3Mutation,
    useGuiKyPhieu3Mutation,
    usePhanHoiYKienNhaThauPhieu3Mutation,
    useSuaPhieu3Mutation,
    useThemPhieu3Mutation,
    useTinhLaiPhieu3Mutation,
    useXoaPhieu3Mutation,
} from "../../services/phieu3Api";
import { useDanhSachPhongBanQuery } from "../../services/phongBanApiV2";

import { setNotify } from "../../store/notifycationSlide";
import { RootType } from "../../store/types";

import "./Phieu3FormPage.scss";

const MA_TIEU_CHI_BANG2 = ["TC1", "TC2", "TC3", "TC4", "TC5", "TC6"];

// Tên đầy đủ 6 tiêu chí Bảng 2 — khớp thứ tự với Phiếu 2 (VSATTP, định lượng thực đơn,
// thái độ phối hợp, điều khoản khác) + 2 tiêu chí riêng của Bảng 2 (đa dạng thực đơn,
// phản hồi sự cố). Chỉ là nhãn hiển thị — MaTieuChi lưu DB vẫn là TC1..TC6.
const TEN_TIEU_CHI_BANG2: Record<string, string> = {
    TC1: "Tuân thủ đúng quy định về vệ sinh an toàn thực phẩm",
    TC2: "Tuân thủ định lượng theo thực đơn đã được phê duyệt",
    TC3: "Đa dạng thực đơn",
    TC4: "Tuân thủ hợp đồng, bản cam kết, quy trình báo cáo",
    TC5: "Thái độ phối hợp, cầu thị cải tiến",
    TC6: "Phản hồi sự cố, xử lý khiếu nại nhanh chóng",
};
const tenTieuChiBang2 = (ma: string) => TEN_TIEU_CHI_BANG2[ma] ?? ma;

// Nối danh sách chuỗi kiểu "A, B và C" (dùng cho danh sách ngày kiểm tra)
const noiVaCuoi = (items: string[]): string => {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    return `${items.slice(0, -1).join(", ")} và ${items[items.length - 1]}`;
};

const chuaNoiDungHtml = (text?: string): boolean => {
    if (!text) return false;
    return /<[a-z][\s\S]*>/i.test(text);
};

const tenDongBang1 = (maDong: string) => {
    switch (maDong) {
        case "LUOT_CBNV_THAM_GIA": return "Lượt CBNV tham gia đánh giá";
        case "TONG_SUAT_AN": return "Tổng suất ăn tại chỗ";
        case "TY_LE_PHAN_TRAM": return "Tỷ lệ % tiêu chí đạt";
        default: return maDong;
    }
};

const Phieu3FormPage: React.FC = () => {
    const { id } = useParams();
    const laTaoMoi = !id || id === "moi";
    const phieuId = laTaoMoi ? undefined : Number(id);

    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    // ============================================================
    // QUERIES & MUTATIONS
    // ============================================================

    const { data: chiTietPhieu, isFetching: dangTaiPhieu } = useChiTietPhieu3Query(
        phieuId!,
        { skip: laTaoMoi }
    );
    const { data: danhSachNhaThau = [] } = useDanhSachNhaThauQuery();
    const { data: danhSachPhongBan = [] } = useDanhSachPhongBanQuery();

    const [themPhieu3, { isLoading: dangThem }] = useThemPhieu3Mutation();
    const [suaPhieu3, { isLoading: dangSua }] = useSuaPhieu3Mutation();
    const [tinhLaiPhieu3, { isLoading: dangTinhLai }] = useTinhLaiPhieu3Mutation();
    const [xoaPhieu3] = useXoaPhieu3Mutation();
    const [guiKyPhieu3, { isLoading: dangGuiKy }] = useGuiKyPhieu3Mutation();
    const [dongBoTrangThaiPhieu3] = useDongBoTrangThaiPhieu3Mutation();
    const [phanHoiYKienNhaThau] = usePhanHoiYKienNhaThauPhieu3Mutation();

    // ============================================================
    // LOCAL STATES
    // ============================================================

    const [nhaThauId, setNhaThauId] = useState<number | undefined>(undefined);
    const [thang, setThang] = useState<number>(new Date().getMonth() + 1);
    const [nam, setNam] = useState<number>(new Date().getFullYear());
    const [bang1, setBang1] = useState<Phieu3Bang1DongModel[]>([]);
    const [bang2, setBang2] = useState<Phieu3Bang2DongModel[]>([]);
    const [daKhoiTao, setDaKhoiTao] = useState(false);

    const [yKien, setYKien] = useState("");
    const [modalYKienMo, setModalYKienMo] = useState(false);

    // Danh sách Phiếu 1 / Phiếu 2 trong tháng — dùng để tự tổng hợp mục "1. Căn cứ đánh giá"
    const dauThang = dayjs(`${nam}-${String(thang).padStart(2, "0")}-01`).startOf("month");
    const { data: danhSachPhieu2ThangNay = [] } = useDanhSachPhieu2Query(
        { nhaThauId, thang, nam },
        { skip: laTaoMoi || !nhaThauId }
    );
    const { data: danhSachPhieu1ThangNay = [] } = useDanhSachPhieu1Query(
        {
            nhaThauId,
            tuNgay: dauThang.format("YYYY-MM-DD"),
            denNgay: dauThang.endOf("month").format("YYYY-MM-DD"),
        },
        { skip: laTaoMoi || !nhaThauId }
    );

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        }
    }, [authV2.isAuthenticated, navigator]);

    useEffect(() => {
        setDaKhoiTao(false);
    }, [id]);

    useEffect(() => {
        if (daKhoiTao) return;
        if (!laTaoMoi && (dangTaiPhieu || !chiTietPhieu)) return;

        if (chiTietPhieu) {
            setNhaThauId(chiTietPhieu.phieu.nhaThauId);
            setThang(chiTietPhieu.phieu.thang);
            setNam(chiTietPhieu.phieu.nam);
            setBang1(chiTietPhieu.bang1);
            setBang2(chiTietPhieu.bang2);
            setYKien(chiTietPhieu.yKienNhaThau?.yKien ?? "");
        }

        setDaKhoiTao(true);
    }, [chiTietPhieu, dangTaiPhieu, laTaoMoi, daKhoiTao]);

    if (!authV2.isAuthenticated) {
        return null;
    }

    const phieu = chiTietPhieu?.phieu;
    const coTheSua =
        laTaoMoi ||
        !phieu ||
        phieu.trangThai === "NHAP" ||
        phieu.trangThai === "TU_CHOI";

    const tenNhaThau = (idNt?: number) =>
        idNt ? danhSachNhaThau.find((nt: NhaThauModel) => nt.id === idNt)?.ten ?? "" : "";
    const tenPhongBan = (idPb: number) =>
        danhSachPhongBan.find((pb: PhongBanModel) => pb.id === idPb)?.ten ?? `Phòng ban #${idPb}`;

    // "1. Căn cứ đánh giá": tự tổng hợp từ các Phiếu 2 (Bảng đánh giá) và Phiếu 1
    // (phiếu kiểm tra VSATTP) đã lập trong tháng/nhà thầu của báo cáo này.
    const dsSoHieuPhieu2 = danhSachPhieu2ThangNay.map(p => p.soHieu);

    const ngayKiemTraTheoPhongBan = new Map<number, Set<string>>();
    danhSachPhieu1ThangNay.forEach(p => {
        const ngay = dayjs(p.ngayKiemTra).format("DD/MM/YYYY");
        if (!ngayKiemTraTheoPhongBan.has(p.phongBanId)) {
            ngayKiemTraTheoPhongBan.set(p.phongBanId, new Set());
        }
        ngayKiemTraTheoPhongBan.get(p.phongBanId)!.add(ngay);
    });
    const canCuPhieu1 = Array.from(ngayKiemTraTheoPhongBan.entries()).map(([phongBanId, ngaySet]) => ({
        phongBanId,
        danhSachNgay: Array.from(ngaySet).sort(
            (a, b) => dayjs(a, "DD/MM/YYYY").valueOf() - dayjs(b, "DD/MM/YYYY").valueOf()
        ),
    }));

    // ============================================================
    // CẬP NHẬT Ô BẢNG 1 / BẢNG 2 (state cục bộ)
    // ============================================================

    const capNhatOBang1 = (maDong: string, cot: keyof Phieu3Bang1DongModel, giaTri: number | null) => {
        setBang1(ds => ds.map(d => (d.maDong === maDong ? { ...d, [cot]: giaTri ?? undefined } : d)));
    };

    const capNhatOBang2 = (dongId: number, maTieuChi: string, giaTri: number | null) => {
        setBang2(ds =>
            ds.map(d =>
                d.id !== dongId
                    ? d
                    : {
                        ...d,
                        giaTri: d.giaTri.map(g =>
                            g.maTieuChi === maTieuChi ? { ...g, giaTri: giaTri ?? undefined } : g
                        ),
                    }
            )
        );
    };

    // ============================================================
    // LƯU / TẠO MỚI / TÍNH LẠI
    // ============================================================

    const xuLyTaoMoi = async () => {
        if (!nhaThauId) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: "Vui lòng chọn nhà thầu", messageNotify: "" }));
            return;
        }
        try {
            const ketQua = await themPhieu3({ thang, nam, nhaThauId }).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã lập báo cáo", messageNotify: "" }));
            navigator(`/phieu3/${ketQua.phieu.id}`);
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Lập báo cáo thất bại", messageNotify: "" }));
        }
    };

    const luuPhieu = async () => {
        if (laTaoMoi) {
            await xuLyTaoMoi();
            return;
        }
        const bang1Req: Phieu3Bang1DongRequest[] = bang1.map(d => ({
            maDong: d.maDong,
            diem1: d.diem1 ?? null,
            diem2: d.diem2 ?? null,
            diem3: d.diem3 ?? null,
            diem4: d.diem4 ?? null,
            diem5: d.diem5 ?? null,
            tong: d.tong ?? null,
        }));
        const bang2Req: Phieu3Bang2DongRequest[] = bang2.map(d => ({
            phongBanId: d.phongBanId,
            giaTri: d.giaTri.map(g => ({ maTieuChi: g.maTieuChi, giaTri: g.giaTri ?? null })),
        }));

        try {
            await suaPhieu3({ id: phieuId!, body: { bang1: bang1Req, bang2: bang2Req } }).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã lưu báo cáo", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Lưu báo cáo thất bại", messageNotify: "" }));
        }
    };

    const xuLyTinhLai = async () => {
        try {
            await tinhLaiPhieu3(phieuId!).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã tính lại Bảng 1 (giữ nguyên ô đã sửa tay)", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Tính lại thất bại", messageNotify: "" }));
        }
    };

    const xuLyXoaPhieu = async () => {
        try {
            await xoaPhieu3(phieuId!).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã xóa báo cáo", messageNotify: "" }));
            navigator("/phieu3");
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Xóa báo cáo thất bại", messageNotify: "" }));
        }
    };

    const xuLyGuiKy = async () => {
        try {
            await luuPhieu();
            await guiKyPhieu3(phieuId!).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã gửi ký", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Gửi ký thất bại", messageNotify: "" }));
        }
    };

    const xuLyLuuYKien = async (html?: string) => {
        if (!phieuId) return;
        try {
            await phanHoiYKienNhaThau({ id: phieuId, body: { yKien: html ?? yKien } }).unwrap();
            if (html !== undefined) setYKien(html);
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã lưu ý kiến phản hồi nhà thầu", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Lưu ý kiến thất bại", messageNotify: "" }));
        } finally {
            setModalYKienMo(false);
        }
    };

    // Ô Bảng 1: render input hoặc giá trị tĩnh + badge "đã sửa tay"
    const renderOBang1 = (dong: Phieu3Bang1DongModel, cot: "diem1" | "diem2" | "diem3" | "diem4" | "diem5" | "tong") => {
        const giaTri = dong[cot];
        if (coTheSua) {
            return (
                <InputNumber
                    className="o-input-so"
                    bordered={false}
                    value={giaTri ?? null}
                    onChange={v => capNhatOBang1(dong.maDong, cot, v)}
                />
            );
        }
        if (giaTri === undefined || giaTri === null) return <span>--</span>;
        if (dong.maDong === "TY_LE_PHAN_TRAM") {
            return (
                <span>
                    {Number(giaTri).toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                </span>
            );
        }
        return <span>{Number(giaTri).toLocaleString("vi-VN")}</span>;
    };

    const renderOBang2 = (dong: Phieu3Bang2DongModel, maTieuChi: string) => {
        const oGiaTri = dong.giaTri.find(g => g.maTieuChi === maTieuChi);
        if (coTheSua) {
            return (
                <InputNumber
                    className="o-input-so"
                    bordered={false}
                    value={oGiaTri?.giaTri ?? null}
                    onChange={v => capNhatOBang2(dong.id, maTieuChi, v)}
                />
            );
        }
        if (oGiaTri?.giaTri === undefined || oGiaTri?.giaTri === null) return <span>--</span>;
        return (
            <span>
                {Number(oGiaTri.giaTri).toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
        );
    };

    return (
        <LayoutV2Component>
            {/* 1. TOOLBAR CHUNG */}
            <PhieuToolbar
                title={
                    laTaoMoi
                        ? "Lập báo cáo chất lượng dịch vụ suất ăn theo tháng"
                        : `Báo cáo tháng — ${phieu?.soHieu ?? ""}`
                }
                trangThai={phieu?.trangThai}
                onPrint={() => window.print()}
            />

            {/* 2. FORM THÔNG TIN NHẬP LIỆU (NO-PRINT) — chỉ chọn được lúc tạo mới */}
            <PhieuInputCard title="Thông tin báo cáo">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <div className="mb-1 font-medium">Nhà thầu</div>
                        <Select
                            className="w-full"
                            placeholder="-- Chọn nhà thầu --"
                            showSearch
                            optionFilterProp="children"
                            disabled={!laTaoMoi}
                            value={nhaThauId}
                            onChange={v => setNhaThauId(v)}
                        >
                            {danhSachNhaThau.map((nt: NhaThauModel) => (
                                <Select.Option key={nt.id} value={nt.id}>{nt.ten}</Select.Option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <div className="mb-1 font-medium">Tháng</div>
                        <Select className="w-full" disabled={!laTaoMoi} value={thang} onChange={v => setThang(v)}>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(t => (
                                <Select.Option key={t} value={t}>Tháng {t}</Select.Option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <div className="mb-1 font-medium">Năm</div>
                        <Select className="w-full" disabled={!laTaoMoi} value={nam} onChange={v => setNam(v)}>
                            {[nam - 1, nam, nam + 1].map(n => (
                                <Select.Option key={n} value={n}>{n}</Select.Option>
                            ))}
                        </Select>
                    </div>
                </div>
                {!laTaoMoi && (
                    <div className="text-xs text-gray-400 mt-2">
                        Nhà thầu / Tháng / Năm cố định từ lúc lập báo cáo, không sửa được sau khi tạo.
                    </div>
                )}
            </PhieuInputCard>

            {laTaoMoi ? (
                <div className="no-print">
                    <Button type="primary" size="large" loading={dangThem} onClick={xuLyTaoMoi}>
                        Lập báo cáo — tự động tính Bảng 1 từ Phiếu 2
                    </Button>
                </div>
            ) : (
                <div className="phieu-a4">
                    <PhieuHeader title="BÁO CÁO CHẤT LƯỢNG DỊCH VỤ SUẤT ĂN" />
                    <div className="phieu3-header-info">
                        <div>Nhà thầu: {tenNhaThau(nhaThauId) || "........................"}</div>
                        <div>Tháng {String(thang).padStart(2, "0")}/{nam}</div>
                    </div>

                    {/* 1. CĂN CỨ ĐÁNH GIÁ — tự tổng hợp từ Phiếu 1/Phiếu 2 trong tháng */}
                    <div className="phieu3-section-title">1. Căn cứ đánh giá</div>
                    <div className="phieu3-can-cu-list">
                        <div>- Hợp đồng suất ăn công nghiệp số ........................;</div>
                        {dsSoHieuPhieu2.length > 0 && (
                            <div>
                                - Căn cứ kết quả đánh giá thực tế từ CBNV và phòng chức năng theo các Bảng đánh giá số{" "}
                                {dsSoHieuPhieu2.join("; ")};
                            </div>
                        )}
                        {canCuPhieu1.map(({ phongBanId, danhSachNgay }) => (
                            <div key={phongBanId}>
                                - Căn cứ phiếu kiểm tra VSATTP ngày {noiVaCuoi(danhSachNgay)} của {tenPhongBan(phongBanId)}.
                            </div>
                        ))}
                    </div>

                    {/* 2. ĐÁNH GIÁ CHẤT LƯỢNG DỊCH VỤ */}
                    <div className="phieu3-section-title mt-3">
                        2. Đánh giá chất lượng dịch vụ theo phương án phân bổ số lượng suất ăn
                    </div>

                    {/* BẢNG 1 */}
                    <div className="phieu3-bang-title no-print-mb">
                        2.1. Đánh giá trong tháng từ CBNV
                        {coTheSua && (
                            <Button
                                className="no-print ml-3"
                                size="small"
                                icon={<FaSyncAlt />}
                                loading={dangTinhLai}
                                onClick={xuLyTinhLai}
                            >
                                Tính lại từ Phiếu 2
                            </Button>
                        )}
                    </div>
                    <table className="phieu-table phieu3-bang1-table">
                        <thead>
                            <tr>
                                <th rowSpan={2} className="cot-noi-dung">Nội dung</th>
                                <th colSpan={5}>Tiêu chí đánh giá</th>
                                <th rowSpan={2}>Tổng</th>
                            </tr>
                            <tr>
                                <th>1-Rất không hài lòng</th>
                                <th>2-Không hài lòng</th>
                                <th>3-Bình thường</th>
                                <th>4-Hài lòng</th>
                                <th>5-Rất hài lòng</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bang1.map(dong => (
                                <tr key={dong.maDong}>
                                    <td className="o-noi-dung">
                                        {tenDongBang1(dong.maDong)}
                                        {dong.chinhSuaThuCong && (
                                            <Tag className="ml-2" color="orange">Đã sửa tay</Tag>
                                        )}
                                    </td>
                                    <td className="o-so">{renderOBang1(dong, "diem1")}</td>
                                    <td className="o-so">{renderOBang1(dong, "diem2")}</td>
                                    <td className="o-so">{renderOBang1(dong, "diem3")}</td>
                                    <td className="o-so">{renderOBang1(dong, "diem4")}</td>
                                    <td className="o-so">{renderOBang1(dong, "diem5")}</td>
                                    <td className="o-so o-so-tong">{renderOBang1(dong, "tong")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="text-xs text-gray-400 no-print mt-1">
                        "Tổng suất ăn tại chỗ" nhập tay hoàn toàn. "Tỷ lệ % tiêu chí đạt" tự tính = Lượt CBNV / Tổng suất ăn — bấm "Tính lại" sau khi nhập Tổng suất ăn.
                    </div>

                    {/* BẢNG 2 */}
                    <div className="phieu3-bang-title mt-4">2.2. Đánh giá trong tháng từ phòng ban liên quan</div>
                    <table className="phieu-table phieu3-bang2-table">
                        <thead>
                            <tr>
                                <th rowSpan={2} className="cot-noi-dung">Bộ phận đánh giá</th>
                                <th colSpan={MA_TIEU_CHI_BANG2.length}>Điểm đánh giá theo tiêu chí (thang điểm 1-5)</th>
                            </tr>
                            <tr>
                                {MA_TIEU_CHI_BANG2.map(tc => (
                                    <th key={tc}>{tenTieuChiBang2(tc)}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {bang2.map(dong => (
                                <tr key={dong.id}>
                                    <td className="o-noi-dung">{tenPhongBan(dong.phongBanId)}</td>
                                    {MA_TIEU_CHI_BANG2.map(tc => (
                                        <td key={tc} className="o-so">{renderOBang2(dong, tc)}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="text-xs text-gray-400 no-print mt-1">
                        TC1..TC6 nhập tay hoàn toàn — nội dung tiêu chí hiển thị đã khớp theo mẫu báo cáo giấy.
                    </div>

                    {/* Ý KIẾN NHÀ THẦU */}
                    <div className="phieu-y-kien mt-4">
                        <div className="phieu-ket-luan-title">Ý kiến / phản hồi của nhà thầu trong tháng</div>
                        {chuaNoiDungHtml(yKien) ? (
                            <div className="flex items-start justify-between gap-1">
                                <GhiChuHtml className="ghi-chu-rich-preview flex-1" html={yKien} />
                                <Tooltip title="Sửa ý kiến / ảnh">
                                    <Button className="no-print" size="small" icon={<FaEdit />} onClick={() => setModalYKienMo(true)} />
                                </Tooltip>
                            </div>
                        ) : (
                            <div className="no-print">
                                <Button size="small" icon={<FaImage />} onClick={() => setModalYKienMo(true)}>
                                    Nhập ý kiến phản hồi
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* CHỮ KÝ */}
                    <PhieuSignatures
                        columns={[
                            { title: "NGƯỜI LẬP PHIẾU", subTitle: "(Ký, ghi rõ họ tên)" },
                            { title: "TRƯỞNG/PHÓ BỘ PHẬN", subTitle: "(Ký, ghi rõ họ tên)" },
                        ]}
                    />
                </div>
            )}

            {/* 4. THANH NÚT ACTION */}
            {!laTaoMoi && (
                <PhieuActions
                    coTheSua={coTheSua}
                    laTaoMoi={laTaoMoi}
                    trangThai={phieu?.trangThai}
                    dangLuu={dangSua}
                    dangGuiKy={dangGuiKy}
                    onLuu={luuPhieu}
                    onGuiKy={xuLyGuiKy}
                    onXoa={xuLyXoaPhieu}
                />
            )}

            {/* 5. TIẾN ĐỘ KÝ */}
            {!laTaoMoi && phieuId && phieu && phieu.trangThai !== "NHAP" && (
                <div className="no-print">
                    <TienDoKy
                        loaiDoiTuong="PHIEU3"
                        doiTuongId={phieuId}
                        onDaDongBo={() => dongBoTrangThaiPhieu3(phieuId)}
                    />
                </div>
            )}

            {/* 6. MODAL Ý KIẾN NHÀ THẦU (TINYMCE) */}
            <TinyMceModal
                open={modalYKienMo}
                title="Soạn ý kiến phản hồi nhà thầu"
                subtitle="Ý kiến / phản hồi của nhà thầu về kết quả đánh giá trong tháng"
                initialValue={yKien}
                onSave={html => { xuLyLuuYKien(html); }}
                onCancel={() => setModalYKienMo(false)}
            />
        </LayoutV2Component>
    );
};

export default Phieu3FormPage;
