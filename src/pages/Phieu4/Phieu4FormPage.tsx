import { Button, DatePicker, InputNumber, Popconfirm, Select, Tag } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import { FaFileWord, FaPlus, FaTimes } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import LayoutV2Component from "../../components/LayoutV2Component";
import {
    BangCoDinhTable,
    DoanBuilder,
    DoanBuilderItem,
    PhieuActions,
    PhieuHeader,
    PhieuInputCard,
    PhieuToolbar,
} from "../../components/phieu";

import { PHIEU4_BANG1_CONFIG, PHIEU4_BANG2_CONFIG } from "../../config/phieu4BangConfig";
import { DoanRequest } from "../../models/DoanModel";
import NhaThauModel from "../../models/NhaThauModel";
import { Phieu4DongModel } from "../../models/Phieu4ResponseModel";

import { useTienDoKyQuery } from "../../services/chuKyPhieuApi";
import { useDanhSachNhaThauQuery } from "../../services/nhaThauApiV2";
import { laHoatDong, locDanhMucChon, tenOptionDanhMuc } from "../../utils/danhMucHoatDong";
import {
    useCapNhatGiaTriPhieu4Mutation,
    useChiTietPhieu4Query,
    useThemDoanPhieu4Mutation,
    useThemNhaThauPhieu4Mutation,
    useThemPhieu4Mutation,
    useXoaDoanPhieu4Mutation,
    useXoaNhaThauPhieu4Mutation,
    useTinhLaiPhieu4Mutation,
    useXoaPhieu4Mutation,
} from "../../services/phieu4Api";

import { setNotify } from "../../store/notifycationSlide";
import { RootType } from "../../store/types";
import xuatWordPhieu4 from "../../utils/xuatWordPhieu4";

import "./Phieu4FormPage.scss";

const { RangePicker } = DatePicker;

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
    // Tiến độ ký — chỉ còn dùng để in trạng thái/ngày ký vào bảng chữ ký khi
    // xuất Word (xem xuLyXuatWord); phần mềm không còn luồng ký/duyệt nội bộ,
    // việc ký diễn ra ngoài phần mềm trên bản in.
    const { data: tienDoKy = [] } = useTienDoKyQuery(
        { loaiDoiTuong: "PHIEU4", doiTuongId: phieuId! },
        { skip: laTaoMoi }
    );

    const [themPhieu4, { isLoading: dangThem }] = useThemPhieu4Mutation();
    const [xoaPhieu4] = useXoaPhieu4Mutation();
    const [tinhLaiPhieu4, { isLoading: dangTinhLai }] = useTinhLaiPhieu4Mutation();
    const [themNhaThauPhieu4, { isLoading: dangThemNhaThau }] = useThemNhaThauPhieu4Mutation();
    const [xoaNhaThauPhieu4, { isLoading: dangXoaNhaThau }] = useXoaNhaThauPhieu4Mutation();
    const [capNhatGiaTriPhieu4, { isLoading: dangLuuGiaTri }] = useCapNhatGiaTriPhieu4Mutation();
    const [themDoanPhieu4, { isLoading: dangThemDoan }] = useThemDoanPhieu4Mutation();
    const [xoaDoanPhieu4] = useXoaDoanPhieu4Mutation();

    // ============================================================
    // LOCAL STATES
    // ============================================================

    // tuNgay/denNgay giờ chỉ để HIỂN THỊ (server tự tính = MIN/MAX toàn bộ
    // đoạn của mọi cột nhà thầu) — không còn nhập tay lúc tạo mới.
    const [tuNgay, setTuNgay] = useState<dayjs.Dayjs | null>(null);
    const [denNgay, setDenNgay] = useState<dayjs.Dayjs | null>(null);
    const [nhaThauIds, setNhaThauIds] = useState<number[]>([]);
    const [nhaThauMoiId, setNhaThauMoiId] = useState<number | undefined>(undefined);
    const [dangXuatWord, setDangXuatWord] = useState(false);
    // Đoạn thời gian & địa điểm — build mode (form tạo mới, chưa có phiếu),
    // khóa theo nhaThauId đang chọn, key tạm; xem DoanBuilder.
    const [doanTheoNhaThauMoi, setDoanTheoNhaThauMoi] = useState<Record<number, DoanBuilderItem[]>>({});
    // Ô "Đa dạng thực đơn" (Bảng 2, NhomSo=1/Stt=3) — DUY NHẤT còn nhập tay
    // (không có nguồn tự động, xem Phieu4Service.TieuChiBang2), khóa theo
    // NhaThauId, chỉ chứa ô người dùng vừa sửa (chưa lưu).
    const [suaDaDangThucDon, setSuaDaDangThucDon] = useState<Record<number, number | null>>({});

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        }
    }, [authV2.isAuthenticated, navigator]);

    useEffect(() => {
        setSuaDaDangThucDon({});
    }, [id]);

    useEffect(() => {
        if (chiTietPhieu) {
            setTuNgay(dayjs(chiTietPhieu.phieu.tuNgay));
            setDenNgay(dayjs(chiTietPhieu.phieu.denNgay));
            setNhaThauIds(chiTietPhieu.nhaThau.map(n => n.nhaThauId));
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
    const bang2 = chiTietPhieu?.bang.find(b => b.soBang === 2);
    const dongDaDangThucDon = bang2?.dong.find(d => d.nhomSo === 1 && d.stt === 3);
    const dongTrongSo = bang2?.dong.find(d => d.nhomSo === 3 && d.stt === 13);
    // 7 dòng "phía trên" dùng để tính trung bình cho dòng trọng số — Stt 1-6
    // nhóm P.ĐN + Stt 7 VSATTP P.ATMT (xem Phieu4Service.DongBoBang2CoDinhAsync).
    const dongTrenTrongSo = bang2?.dong.filter(
        d => (d.nhomSo === 1 && (d.stt ?? 0) >= 1 && (d.stt ?? 0) <= 6) || (d.nhomSo === 2 && d.stt === 7)
    ) ?? [];

    // Chỉ render Bảng 1/2 qua BangCoDinhTable (component dùng chung) — cấu
    // trúc dòng khai báo ở PHIEU4_BANG1_CONFIG/PHIEU4_BANG2_CONFIG. Bảng 3/4/5
    // đã bỏ khỏi UI (vẫn còn ở backend/API, không đụng tới).

    // ============================================================
    // GIÁ TRỊ Ô (overlay cục bộ + gốc)
    // ============================================================

    // Số liệu Bảng 1/2 giờ chỉ hiển thị, lấy hoàn toàn từ hệ thống (tự tính,
    // xem "Làm mới") — ngoại lệ DUY NHẤT: ô "Đa dạng thực đơn" (Bảng 2) không
    // có nguồn tự động nên vẫn cho nhập tay + lưu (xem PhieuActions.onLuu).
    const layGiaTri = (dong: Phieu4DongModel, nhaThauId: number): number | null | undefined =>
        dong.giaTri.find(g => g.nhaThauId === nhaThauId)?.giaTri;

    const daChinhSuaThuCong = (dong: Phieu4DongModel, nhaThauId: number): boolean =>
        dong.giaTri.find(g => g.nhaThauId === nhaThauId)?.chinhSuaThuCong ?? false;

    // Giá trị "đang hiệu lực" của 1 ô — với ô "Đa dạng thực đơn" đang sửa dở
    // (chưa lưu) thì lấy giá trị mới gõ, chưa lưu vẫn phải tính vào trung
    // bình ngay (đúng yêu cầu "tự nhảy khi có event nhập").
    const layGiaTriHieuDung = (dong: Phieu4DongModel, nhaThauId: number): number | null | undefined =>
        dongDaDangThucDon && dong.id === dongDaDangThucDon.id && nhaThauId in suaDaDangThucDon
            ? suaDaDangThucDon[nhaThauId]
            : layGiaTri(dong, nhaThauId);

    // "Điểm đánh giá trung bình... theo trọng số" — BE không tính (xem
    // DongBoBang2CoDinhAsync), FE tự tính lại mỗi lần render từ 7 dòng trên,
    // gửi kèm số này khi lưu "Đa dạng thực đơn" (xem xuLyLuuGiaTri).
    const tinhDiemTrongSo = (nhaThauId: number): number | null => {
        const cacGiaTri = dongTrenTrongSo
            .map(d => layGiaTriHieuDung(d, nhaThauId))
            .filter((v): v is number => v !== null && v !== undefined);
        if (cacGiaTri.length === 0) return null;
        return Math.round((cacGiaTri.reduce((a, b) => a + b, 0) / cacGiaTri.length) * 100) / 100;
    };

    const renderOGiaTri = (dong: Phieu4DongModel, nhaThauId: number) => {
        if (dongTrongSo && dong.id === dongTrongSo.id) {
            const v = tinhDiemTrongSo(nhaThauId);
            return <span>{v ?? "--"}</span>;
        }

        const giaTri = layGiaTri(dong, nhaThauId);

        if (coTheSua && dongDaDangThucDon && dong.id === dongDaDangThucDon.id) {
            const giaTriDangSua = nhaThauId in suaDaDangThucDon ? suaDaDangThucDon[nhaThauId] : giaTri ?? null;
            return (
                <>
                    <InputNumber
                        className="no-print"
                        size="small"
                        min={1}
                        max={5}
                        step={0.1}
                        value={giaTriDangSua ?? undefined}
                        onChange={v => setSuaDaDangThucDon(prev => ({ ...prev, [nhaThauId]: v === null || v === undefined ? null : Number(v) }))}
                    />
                    <span className="print-only">{giaTriDangSua ?? "--"}</span>
                </>
            );
        }

        return <span>{giaTri ?? "--"}</span>;
    };

    // ============================================================
    // TẠO MỚI / TÍNH LẠI
    // ============================================================

    const xuLyTaoMoi = async () => {
        if (nhaThauIds.length === 0) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: "Vui lòng chọn ít nhất 1 nhà thầu", messageNotify: "" }));
            return;
        }
        if (!tuNgay || !denNgay) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: "Vui lòng chọn khoảng ngày lập phiếu", messageNotify: "" }));
            return;
        }
        try {
            const nhaThau = nhaThauIds.map((nhaThauId) => ({
                nhaThauId,
                doan: (doanTheoNhaThauMoi[nhaThauId] ?? []).map(({ key, ...rest }) => rest),
            }));
            const ketQua = await themPhieu4({
                tuNgay: tuNgay.format("YYYY-MM-DD"),
                denNgay: denNgay.format("YYYY-MM-DD"),
                nhaThau,
            }).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã lập phiếu tổng hợp", messageNotify: "" }));
            navigator(`/phieu4/${ketQua.phieu.id}`);
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Lập phiếu thất bại", messageNotify: "" }));
        }
    };

    // Build mode (form tạo mới) — chỉ mutate state cục bộ theo từng nhà
    // thầu đang chọn, gộp vào body lúc bấm "Lập phiếu" (xem xuLyTaoMoi).
    const xuLyThemDoanMoi = (nhaThauId: number, doan: DoanRequest) => {
        setDoanTheoNhaThauMoi((prev) => ({
            ...prev,
            [nhaThauId]: [...(prev[nhaThauId] ?? []), { ...doan, key: `tam-${Date.now()}-${(prev[nhaThauId] ?? []).length}` }],
        }));
    };
    const xuLyXoaDoanMoi = (nhaThauId: number, key: number | string) => {
        setDoanTheoNhaThauMoi((prev) => ({
            ...prev,
            [nhaThauId]: (prev[nhaThauId] ?? []).filter((d) => d.key !== key),
        }));
    };

    // API mode (phiếu đã tồn tại, còn Nháp/Từ chối) — gọi API ngay theo
    // đúng cột nhà thầu, tag invalidation của RTK Query tự refetch chi tiết.
    const xuLyThemDoan = async (nhaThauId: number, doan: DoanRequest) => {
        try {
            await themDoanPhieu4({ id: phieuId!, nhaThauId, body: doan }).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã thêm đoạn", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Thêm đoạn thất bại", messageNotify: "" }));
        }
    };
    const xuLyXoaDoan = async (nhaThauId: number, key: number | string) => {
        try {
            await xoaDoanPhieu4({ id: phieuId!, nhaThauId, doanId: Number(key) }).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã xóa đoạn", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Xóa đoạn thất bại", messageNotify: "" }));
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

    const xuLyXoaNhaThau = async (nhaThauId: number) => {
        try {
            await xoaNhaThauPhieu4({ id: phieuId!, nhaThauId }).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã xóa nhà thầu khỏi phiếu", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Xóa nhà thầu thất bại", messageNotify: "" }));
        }
    };

    // Lưu ô "Đa dạng thực đơn" (Bảng 2) — DUY NHẤT còn nhập tay ở Phiếu 4.
    // Gửi kèm luôn số "Điểm đánh giá trung bình... theo trọng số" đã tính ở
    // FE (tinhDiemTrongSo) cho đúng những nhà thầu vừa sửa — BE chỉ lưu lại,
    // không tự tính (xem DongBoBang2CoDinhAsync).
    const xuLyLuuGiaTri = async () => {
        if (!dongDaDangThucDon || Object.keys(suaDaDangThucDon).length === 0) return;
        try {
            const giaTriTC3 = Object.entries(suaDaDangThucDon).map(([nhaThauId, giaTri]) => ({
                dongId: dongDaDangThucDon.id,
                nhaThauId: Number(nhaThauId),
                giaTri: giaTri ?? undefined,
            }));
            const giaTriTrongSo = dongTrongSo
                ? Object.keys(suaDaDangThucDon).map(nhaThauId => ({
                    dongId: dongTrongSo.id,
                    nhaThauId: Number(nhaThauId),
                    giaTri: tinhDiemTrongSo(Number(nhaThauId)) ?? undefined,
                }))
                : [];
            await capNhatGiaTriPhieu4({
                id: phieuId!,
                body: {
                    giaTri: [...giaTriTC3, ...giaTriTrongSo],
                    giaTriChung: [],
                },
            }).unwrap();
            setSuaDaDangThucDon({});
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã lưu thay đổi", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Lưu thất bại", messageNotify: "" }));
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

    const xuLyXuatWord = async () => {
        setDangXuatWord(true);
        try {
            // Ghi đè dòng trọng số bằng số vừa tính ở FE (tinhDiemTrongSo) —
            // tránh xuất ra số cũ đã lưu trong DB nếu chưa kịp "Lưu thay đổi"
            // sau lần "Làm mới" gần nhất (xem renderOGiaTri).
            const bang2ChoXuatWord = bang2 && dongTrongSo
                ? {
                    ...bang2,
                    dong: bang2.dong.map(d =>
                        d.id === dongTrongSo.id
                            ? {
                                ...d,
                                giaTri: cotNhaThau.map(c => ({
                                    id: d.giaTri.find(g => g.nhaThauId === c.nhaThauId)?.id ?? 0,
                                    dongId: d.id,
                                    nhaThauId: c.nhaThauId,
                                    giaTri: tinhDiemTrongSo(c.nhaThauId) ?? undefined,
                                    chinhSuaThuCong: false,
                                })),
                            }
                            : d
                    ),
                }
                : bang2;

            await xuatWordPhieu4({
                soHieu: phieu?.soHieu,
                ngayLap: phieu?.ngayTao,
                tuNgay: phieu?.tuNgay,
                denNgay: phieu?.denNgay,
                cotNhaThau: cotNhaThau.map(c => ({ nhaThauId: c.nhaThauId, ten: tenNhaThau(c.nhaThauId) })),
                bang1,
                bang2: bang2ChoXuatWord,
                chuKy: tienDoKy.map(b => ({
                    tenBuoc: b.tenBuoc,
                    buocThuTu: b.buocThuTu,
                    trangThai: b.trangThai,
                    ghiChu: b.ghiChu,
                    ngayKy: b.ngayKy,
                })),
            });
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: "Xuất Word thất bại", messageNotify: "" }));
        } finally {
            setDangXuatWord(false);
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
                extraButtons={
                    !laTaoMoi && (
                        <Button
                            className="no-print"
                            icon={<FaFileWord />}
                            loading={dangXuatWord}
                            onClick={xuLyXuatWord}
                        >
                            Xuất Word
                        </Button>
                    )
                }
            />

            <PhieuInputCard title="Thông tin phiếu">
                {laTaoMoi ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <div className="mb-1 text-xs font-medium">Khoảng ngày lập phiếu</div>
                                <RangePicker
                                    className="w-full"
                                    size="small"
                                    format="DD/MM/YYYY"
                                    value={[tuNgay, denNgay]}
                                    onChange={(v) => {
                                        setTuNgay(v?.[0] ?? null);
                                        setDenNgay(v?.[1] ?? null);
                                    }}
                                />
                            </div>
                            <div>
                                <div className="mb-1 text-xs font-medium">Nhà thầu (cột trong bảng)</div>
                                <Select
                                    className="w-full"
                                    size="small"
                                    mode="multiple"
                                    placeholder="-- Chọn các nhà thầu --"
                                    showSearch
                                    optionFilterProp="children"
                                    value={nhaThauIds}
                                    onChange={v => setNhaThauIds(v)}
                                >
                                    {locDanhMucChon(danhSachNhaThau, nhaThauIds).map((nt: NhaThauModel) => (
                                        <Select.Option key={nt.id} value={nt.id}>{tenOptionDanhMuc(nt)}</Select.Option>
                                    ))}
                                </Select>
                            </div>
                        </div>
                        {nhaThauIds.length > 0 && (
                            // Mỗi nhà thầu 1 CỘT gọn (không còn xếp chồng cả chiều
                            // ngang lẫn dọc) — bọc flex-wrap để tự xuống dòng ở màn
                            // hẹp thay vì buộc cuộn ngang.
                            <div className="mt-3 flex flex-wrap gap-2 items-start">
                                {nhaThauIds.map(nhaThauId => (
                                    <div key={nhaThauId} className="border rounded p-2 flex-1 min-w-[320px]">
                                        <div className="text-xs font-medium mb-1 truncate" title={tenNhaThau(nhaThauId)}>
                                            {tenNhaThau(nhaThauId)}
                                        </div>
                                        <DoanBuilder
                                            items={doanTheoNhaThauMoi[nhaThauId] ?? []}
                                            coTheSua
                                            onThem={(doan) => xuLyThemDoanMoi(nhaThauId, doan)}
                                            onXoa={(key) => xuLyXoaDoanMoi(nhaThauId, key)}
                                            ngayToiThieu={tuNgay ?? undefined}
                                            ngayToiDa={denNgay ?? undefined}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                            <div>
                                <div className="mb-1 text-xs font-medium">Từ ngày</div>
                                <DatePicker className="w-full" size="small" format="DD/MM/YYYY" disabled value={tuNgay} />
                            </div>
                            <div>
                                <div className="mb-1 text-xs font-medium">Đến ngày</div>
                                <DatePicker className="w-full" size="small" format="DD/MM/YYYY" disabled value={denNgay} />
                            </div>
                            <div className="sm:col-span-2">
                                <div className="mb-1 text-xs font-medium">
                                    Nhà thầu hiện tại{coTheSua && " (bấm x để xóa)"}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {cotNhaThau.map(cot => coTheSua ? (
                                        <Popconfirm
                                            key={cot.nhaThauId}
                                            title="Xóa nhà thầu khỏi phiếu"
                                            description={`Toàn bộ số liệu đã nhập của "${tenNhaThau(cot.nhaThauId)}" sẽ bị xóa.`}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                            okButtonProps={{ danger: true, loading: dangXoaNhaThau }}
                                            disabled={cotNhaThau.length <= 1}
                                            onConfirm={() => xuLyXoaNhaThau(cot.nhaThauId)}
                                        >
                                            <Tag
                                                className={cotNhaThau.length > 1 ? "cursor-pointer" : ""}
                                                color="blue"
                                                title={cotNhaThau.length <= 1 ? "Phiếu phải có ít nhất 1 nhà thầu" : undefined}
                                            >
                                                {tenNhaThau(cot.nhaThauId)}
                                                {cotNhaThau.length > 1 && <FaTimes className="inline ml-1.5 align-[-1px]" />}
                                            </Tag>
                                        </Popconfirm>
                                    ) : (
                                        <Tag key={cot.nhaThauId} color="blue">{tenNhaThau(cot.nhaThauId)}</Tag>
                                    ))}
                                </div>
                            </div>
                            {coTheSua && (
                                <div>
                                    <div className="mb-1 text-xs font-medium">Thêm nhà thầu</div>
                                    <div className="flex gap-2">
                                        <Select
                                            className="flex-1"
                                            size="small"
                                            placeholder="-- Chọn nhà thầu --"
                                            showSearch
                                            optionFilterProp="children"
                                            value={nhaThauMoiId}
                                            onChange={v => setNhaThauMoiId(v)}
                                        >
                                            {/* Thêm cột mới: chỉ nhà thầu còn hoạt động; cột đã có
                                                (kể cả nhà thầu đã ngừng) vẫn hiện ở Tag phía trên. */}
                                            {danhSachNhaThau
                                                .filter((nt: NhaThauModel) => laHoatDong(nt) && !cotNhaThau.some(c => c.nhaThauId === nt.id))
                                                .map((nt: NhaThauModel) => (
                                                    <Select.Option key={nt.id} value={nt.id}>{nt.ten}</Select.Option>
                                                ))}
                                        </Select>
                                        <Button
                                            size="small"
                                            icon={<FaPlus />}
                                            loading={dangThemNhaThau}
                                            disabled={!nhaThauMoiId}
                                            onClick={xuLyThemNhaThau}
                                        >
                                            Thêm
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                            Khoảng ngày cố định theo lúc lập phiếu, không đổi được nữa.
                            {coTheSua ? " Có thể thêm/bớt nhà thầu." : " Danh sách nhà thầu không còn sửa được nữa."}
                        </div>

                        {/* Đoạn thời gian & địa điểm — theo TỪNG cột nhà thầu (mỗi
                            cột tương đương 1 "Phiếu 3 con"), thay cho suy luận tự
                            động cũ. Mỗi nhà thầu 1 CỘT gọn, xếp cạnh nhau (flex-wrap
                            tự xuống dòng ở màn hẹp) thay vì xếp chồng cả trang.
                            Chỉ cho chọn ngày TRONG khoảng ngày lập phiếu (tuNgay/
                            denNgay — cố định từ lúc tạo, xem Phieu4Service.ThemAsync). */}
                        <div className="mt-3 flex flex-wrap gap-2 items-start">
                            {cotNhaThau.map(cot => (
                                <div key={cot.nhaThauId} className="border rounded p-2 flex-1 min-w-[320px]">
                                    <div className="text-xs font-medium mb-1 truncate" title={tenNhaThau(cot.nhaThauId)}>
                                        {tenNhaThau(cot.nhaThauId)}
                                    </div>
                                    <DoanBuilder
                                        items={cot.doan.map(d => ({ ...d, key: d.id }))}
                                        coTheSua={coTheSua}
                                        dangThem={dangThemDoan}
                                        onThem={(doan) => xuLyThemDoan(cot.nhaThauId, doan)}
                                        onXoa={(key) => xuLyXoaDoan(cot.nhaThauId, key)}
                                        ngayToiThieu={tuNgay ?? undefined}
                                        ngayToiDa={denNgay ?? undefined}
                                    />
                                </div>
                            ))}
                        </div>
                    </>
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
                        maPhieu="PHIEU4"
                        soHieu={phieu?.soHieu}
                        title="BẢNG TỔNG HỢP ĐÁNH GIÁ & PHÂN BỔ SUẤT ĂN"
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
                            </div>
                            <div className="phieu4-table-scroll">
                                Theo dữ liệu đánh giá chất lượng dịch vụ suất ăn công nghiệp trên phần mềm từ ngày {tuNgay ? tuNgay.format("DD/MM/YYYY"): ''} đến ngày {denNgay ? denNgay.format("DD/MM/YYYY") : ''}, kết quả đánh giá từ CBNV như sau:
                                <BangCoDinhTable
                                    config={PHIEU4_BANG1_CONFIG}
                                    bang={bang1}
                                    cotNhaThau={cotNhaThau}
                                    tenNhaThau={tenNhaThau}
                                    layGiaTri={layGiaTri}
                                    renderOGiaTri={renderOGiaTri}
                                    daChinhSuaThuCong={daChinhSuaThuCong}
                                />
                            </div>
                            <div className="text-xs text-gray-400 no-print mt-1">
                                Toàn bộ số liệu tự động tính từ Phiếu 2 (và dữ liệu cơm) trong khoảng ngày của phiếu — bấm "Làm mới" (thanh nút cuối trang) để cập nhật.
                            </div>
                        </div>
                    )}

                    {/* BẢNG 2 — cấu trúc cố định, giống Bảng 2 của Phiếu 3 (2 nhóm
                        P.ĐN/P.ATMT × 6 tiêu chí) nhưng cột là nhà thầu thay vì tiêu chí.
                        P.ĐN đa số tự động từ Phiếu 2, P.ATMT chỉ VSATTP tự động từ
                        Phiếu 1 — xem Phieu4Service.TinhLaiBang2Async. */}
                    {bang2 && (
                        <div className="phieu4-bang-block">
                            <div className="phieu4-bang-title">
                                {bang2.tenBang}
                            </div>
                            <div className="phieu4-table-scroll">
                                Qua kiểm tra thực tế về tình hình phục vụ của các Nhà thầu từ ngày  {tuNgay ? tuNgay.format("DD/MM/YYYY"): ''} đến ngày {denNgay ? denNgay.format("DD/MM/YYYY") : ''}, các phòng ban chức nang đánh giá chất lượng dịch vụ của Nhà thầu như sau:
                                <BangCoDinhTable
                                    config={PHIEU4_BANG2_CONFIG}
                                    bang={bang2}
                                    cotNhaThau={cotNhaThau}
                                    tenNhaThau={tenNhaThau}
                                    layGiaTri={layGiaTri}
                                    renderOGiaTri={renderOGiaTri}
                                    daChinhSuaThuCong={daChinhSuaThuCong}
                                />
                            </div>
                            <div className="text-xs text-gray-400 no-print mt-1">
                                Dòng P.ĐN: đa số tự động tính từ Phiếu 2 trong khoảng ngày (bấm "Làm mới" để cập nhật), riêng "Đa dạng thực đơn" luôn nhập tay.
                                Dòng P.ATMT: chỉ 1 tiêu chí VSATTP, tự động tính từ Phiếu 1.
                                "Điểm đánh giá trung bình... theo trọng số" tự tính = trung bình cộng 7 dòng trên, luôn cập nhật ngay khi lưu.
                            </div>
                        </div>
                    )}

                </div>
            )}

            {/* Không còn "Gửi ký": Bảng 1/2 hầu hết chỉ hiển thị số liệu hệ
                thống, việc ký diễn ra bên ngoài phần mềm trên bản in. Riêng
                "Lưu thay đổi" vẫn còn — dùng để lưu ô "Đa dạng thực đơn" (Bảng
                2), ô nhập tay duy nhất còn lại. */}
            {!laTaoMoi && (
                <PhieuActions
                    coTheSua={coTheSua}
                    laTaoMoi={laTaoMoi}
                    trangThai={phieu?.trangThai}
                    dangLuu={dangLuuGiaTri}
                    dangLamMoi={dangTinhLai}
                    onLuu={xuLyLuuGiaTri}
                    onLamMoi={xuLyTinhLai}
                    onXoa={xuLyXoaPhieu}
                />
            )}
        </LayoutV2Component>
    );
};

export default Phieu4FormPage;
