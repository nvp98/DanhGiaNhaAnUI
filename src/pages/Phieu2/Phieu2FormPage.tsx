import { Button, DatePicker, Input, InputNumber, Select, Tooltip } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { FaEdit, FaImage } from "react-icons/fa";
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
    tenTrangThaiPhieu,
} from "../../components/phieu";

import BepAnModel from "../../models/BepAnModel";
import NhaAnModel from "../../models/NhaAnModel";
import NhaThauModel from "../../models/NhaThauModel";

import { useDanhSachBepAnQuery } from "../../services/bepAnApiV2";
import { useDanhSachDiaDiemNhaAnQuery } from "../../services/diaDiemNhaAnApiV2";
import { useDanhSachNhaThauQuery } from "../../services/nhaThauApiV2";
import { useChiTietPhieu1Query } from "../../services/phieu1Api";
import {
    Phieu2TieuChiRequest,
    useChiTietPhieu2Query,
    useDanhSachPhieu1KhaDungQuery,
    useDongBoTrangThaiPhieu2Mutation,
    useGuiKyPhieu2Mutation,
    usePhanHoiYKienNhaThauMutation,
    useSuaPhieu2Mutation,
    useThemPhieu2Mutation,
    useXoaPhieu2Mutation,
} from "../../services/phieu2Api";

import { setNotify } from "../../store/notifycationSlide";
import { RootType } from "../../store/types";

import "./Phieu2FormPage.scss";

// 5 tiêu chí cố định — phải khớp với TieuChiCoDinh ở backend (Phieu2Service.cs)
const TIEU_CHI_CO_DINH: { ma: string; ten: string; thuTu: number }[] = [
    { ma: "VSATTP", ten: "Tuân thủ điều kiện vệ sinh an toàn thực phẩm", thuTu: 0 },
    { ma: "DINH_LUONG_THUC_DON", ten: "Thực đơn và định lượng suất ăn", thuTu: 1 },
    { ma: "THAI_DO_PHOI_HOP", ten: "Thái độ phục vụ và phối hợp", thuTu: 2 },
    { ma: "PHAN_HOI_SU_CO", ten: "Xử lý phản hồi và sự cố", thuTu: 3 },
    { ma: "DIEU_KHOAN_KHAC", ten: "Các điều khoản thỏa thuận khác", thuTu: 4 },
];

interface DongTieuChi extends Phieu2TieuChiRequest { }

interface ModalGhiChuState {
    open: boolean;
    loai: "TIEU_CHI" | "Y_KIEN";
    maTieuChi?: string;
    title: string;
    subtitle?: string;
    value: string;
}

const chuaNoiDungHtml = (text?: string): boolean => {
    if (!text) return false;
    return /<[a-z][\s\S]*>/i.test(text);
};

const khoiTaoTieuChi = (): DongTieuChi[] =>
    TIEU_CHI_CO_DINH.map(m => ({
        maTieuChi: m.ma,
        tenTieuChi: m.ten,
        dat: false,
        khongDat: false,
        diem: undefined,
        ghiChu: "",
        thuTu: m.thuTu,
    }));

const Phieu2FormPage: React.FC = () => {
    const { id } = useParams();
    const laTaoMoi = !id || id === "moi";
    const phieuId = laTaoMoi ? undefined : Number(id);

    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    // ============================================================
    // QUERIES & MUTATIONS
    // ============================================================

    const { data: chiTietPhieu, isFetching: dangTaiPhieu } = useChiTietPhieu2Query(
        phieuId!,
        { skip: laTaoMoi }
    );
    const { data: danhSachBepAn = [] } = useDanhSachBepAnQuery();
    const { data: danhSachNhaThau = [] } = useDanhSachNhaThauQuery();

    const [themPhieu2, { isLoading: dangThem }] = useThemPhieu2Mutation();
    const [suaPhieu2, { isLoading: dangSua }] = useSuaPhieu2Mutation();
    const [xoaPhieu2] = useXoaPhieu2Mutation();
    const [guiKyPhieu2, { isLoading: dangGuiKy }] = useGuiKyPhieu2Mutation();
    const [dongBoTrangThaiPhieu2] = useDongBoTrangThaiPhieu2Mutation();
    const [phanHoiYKienNhaThau, { isLoading: dangLuuYKien }] = usePhanHoiYKienNhaThauMutation();

    // ============================================================
    // LOCAL STATES
    // ============================================================

    const [nhaThauId, setNhaThauId] = useState<number | undefined>(undefined);
    const [bepAnId, setBepAnId] = useState<number | undefined>(undefined);
    const [nhaAnId, setNhaAnId] = useState<number | undefined>(undefined);
    const [thang, setThang] = useState<number>(dayjs().month() + 1);
    const [nam, setNam] = useState<number>(dayjs().year());
    const [thoiGianTu, setThoiGianTu] = useState<dayjs.Dayjs | null>(null);
    const [thoiGianKiemTraText, setThoiGianKiemTraText] = useState("");
    const [phieu1Id, setPhieu1Id] = useState<number | undefined>(undefined);
    const [danhSachTieuChi, setDanhSachTieuChi] = useState<DongTieuChi[]>(khoiTaoTieuChi());
    const [daKhoiTao, setDaKhoiTao] = useState(false);

    // Ý kiến nhà thầu — lưu độc lập qua API riêng
    const [yKien, setYKien] = useState("");
    const [nguoiPhanHoi, setNguoiPhanHoi] = useState("");
    const [ngayPhanHoi, setNgayPhanHoi] = useState<dayjs.Dayjs | null>(null);

    // Modal soạn TinyMCE
    const [modalGhiChu, setModalGhiChu] = useState<ModalGhiChuState>({
        open: false,
        loai: "TIEU_CHI",
        title: "",
        value: "",
    });

    // Danh sách Nhà ăn để chọn — lấy từ danh mục DiaDiemNhaAn có sẵn (hệ chấm
    // điểm bữa ăn cũ), cho chọn tự do, không ràng buộc lọc theo Bếp ăn đã
    // chọn (đã xác nhận nghiệp vụ 2026-08-27, xem Phieu2_DanhGiaSuatAn.md).
    const { data: danhSachDiaDiemNhaAnGoc = [] } = useDanhSachDiaDiemNhaAnQuery();
    const danhSachNhaAn = danhSachDiaDiemNhaAnGoc.filter(n => n.isActive);

    // Danh sách Phiếu 1 khả dụng để chọn liên kết (theo nhà thầu + bếp ăn đã
    // chọn) — KHÔNG bắt buộc: ngày đó có thể không lập Phiếu 1 cho bếp ăn,
    // khi đó bỏ trống để nhập tay điểm VSATTP sau.
    const { data: danhSachPhieu1KhaDung = [] } = useDanhSachPhieu1KhaDungQuery(
        { nhaThauId: nhaThauId!, bepAnId },
        { skip: !nhaThauId }
    );

    // Chi tiết Phiếu 1 đã chọn — để lấy điểm VSATTP xem trước
    const { data: chiTietPhieu1DaChon } = useChiTietPhieu1Query(
        phieu1Id!,
        { skip: !phieu1Id }
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
            const p = chiTietPhieu.phieu;
            setNhaThauId(p.nhaThauId);
            setBepAnId(p.bepAnId);
            setNhaAnId(p.nhaAnId);
            setThang(p.thang);
            setNam(p.nam);
            setThoiGianTu(p.thoiGianTu ? dayjs(p.thoiGianTu) : null);
            setThoiGianKiemTraText(p.thoiGianKiemTraText ?? "");
            setPhieu1Id(p.phieu1Id);

            const daLuu = chiTietPhieu.tieuChi;
            setDanhSachTieuChi(
                TIEU_CHI_CO_DINH.map(m => {
                    const luu = daLuu.find(x => x.maTieuChi === m.ma);
                    return {
                        maTieuChi: m.ma,
                        tenTieuChi: luu?.tenTieuChi ?? m.ten,
                        dat: luu?.dat ?? false,
                        khongDat: luu?.khongDat ?? false,
                        diem: luu?.diem,
                        ghiChu: luu?.ghiChu ?? "",
                        thuTu: m.thuTu,
                    };
                })
            );

            if (chiTietPhieu.yKienNhaThau) {
                setYKien(chiTietPhieu.yKienNhaThau.yKien ?? "");
                setNguoiPhanHoi(chiTietPhieu.yKienNhaThau.nguoiPhanHoi ?? "");
                setNgayPhanHoi(
                    chiTietPhieu.yKienNhaThau.ngayPhanHoi
                        ? dayjs(chiTietPhieu.yKienNhaThau.ngayPhanHoi)
                        : null
                );
            }
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

    const tenNhaThau = (id?: number) =>
        id ? danhSachNhaThau.find((nt: NhaThauModel) => nt.id === id)?.ten ?? "" : "";

    // Vị trí kiểm tra: tự động lấy theo Nhà ăn đã chọn (nơi phát suất ăn, nơi
    // thực tế diễn ra kiểm tra) — kèm tên bếp ăn nấu cho nhà ăn đó, không nhập tay
    const bepAnHienTai = bepAnId
        ? danhSachBepAn.find((b: BepAnModel) => b.id === bepAnId)
        : undefined;
    const nhaAnHienTai = nhaAnId
        ? danhSachDiaDiemNhaAnGoc.find((n: NhaAnModel) => n.id === nhaAnId)
        : undefined;
    const viTriKiemTra = nhaAnHienTai
        ? bepAnHienTai
            ? `${nhaAnHienTai.diaDiem} (Bếp ăn: ${bepAnHienTai.ten})`
            : nhaAnHienTai.diaDiem
        : "";

    // Điểm VSATTP xem trước: lấy từ kết luận của Phiếu 1 đang chọn khi đạt
    const diemVsattpXemTruoc = chiTietPhieu1DaChon?.ketLuan?.diemDanhGia;

    const capNhatTieuChi = (maTieuChi: string, thayDoi: Partial<DongTieuChi>) => {
        setDanhSachTieuChi(ds =>
            ds.map(tc => (tc.maTieuChi === maTieuChi ? { ...tc, ...thayDoi } : tc))
        );
    };

    const chonKetQua = (tc: DongTieuChi, ketQua: "DAT" | "KHONG_DAT") => {
        if (!coTheSua) return;
        if (ketQua === "DAT") {
            const datMoi = !tc.dat;
            capNhatTieuChi(tc.maTieuChi, {
                dat: datMoi,
                khongDat: datMoi ? false : tc.khongDat,
                diem:
                    tc.maTieuChi === "VSATTP" && datMoi
                        ? diemVsattpXemTruoc ?? tc.diem
                        : tc.diem,
            });
        } else {
            const khongDatMoi = !tc.khongDat;
            capNhatTieuChi(tc.maTieuChi, {
                khongDat: khongDatMoi,
                dat: khongDatMoi ? false : tc.dat,
            });
        }
    };

    // ============================================================
    // SOẠN GHI CHÚ / HÌNH ẢNH TINYMCE
    // ============================================================

    const moModalGhiChuTieuChi = (tc: DongTieuChi) => {
        setModalGhiChu({
            open: true,
            loai: "TIEU_CHI",
            maTieuChi: tc.maTieuChi,
            title: "Soạn ghi chú & Chèn hình ảnh",
            subtitle: tc.tenTieuChi,
            value: tc.ghiChu || "",
        });
    };

    const moModalYKien = () => {
        setModalGhiChu({
            open: true,
            loai: "Y_KIEN",
            title: "Soạn ý kiến phản hồi nhà thầu",
            subtitle: "Ý kiến / phản hồi của nhà thầu về kết quả đánh giá",
            value: yKien || "",
        });
    };

    const luuGhiChuModal = (html: string) => {
        if (modalGhiChu.loai === "TIEU_CHI" && modalGhiChu.maTieuChi) {
            capNhatTieuChi(modalGhiChu.maTieuChi, { ghiChu: html });
        } else if (modalGhiChu.loai === "Y_KIEN") {
            setYKien(html);
        }
        setModalGhiChu(prev => ({ ...prev, open: false }));
    };

    // ============================================================
    // LƯU & XỬ LÝ PHIẾU
    // ============================================================

    const luuPhieu = async () => {
        if (!nhaThauId || !nhaAnId) {
            dispatch(
                setNotify({
                    typeNotify: "error",
                    titleNotify: "Vui lòng chọn nhà thầu và nhà ăn",
                    messageNotify: "",
                })
            );
            return;
        }

        const payload = {
            thang,
            nam,
            nhaThauId,
            bepAnId,
            nhaAnId,
            thoiGianTu: thoiGianTu?.toISOString(),
            diaDiem: viTriKiemTra,
            thoiGianKiemTraText,
            phieu1Id,
            tieuChi: danhSachTieuChi,
        };

        try {
            if (laTaoMoi) {
                const ketQua = await themPhieu2(payload).unwrap();
                dispatch(
                    setNotify({
                        typeNotify: "success",
                        titleNotify: "Đã lập phiếu đánh giá",
                        messageNotify: "",
                    })
                );
                navigator(`/phieu2/${ketQua.phieu.id}`);
            } else {
                await suaPhieu2({ id: phieuId!, body: payload }).unwrap();
                dispatch(
                    setNotify({
                        typeNotify: "success",
                        titleNotify: "Đã cập nhật phiếu đánh giá",
                        messageNotify: "",
                    })
                );
            }
        } catch (error: any) {
            dispatch(
                setNotify({
                    typeNotify: "error",
                    titleNotify: error?.data?.message || "Lưu phiếu thất bại",
                    messageNotify: "",
                })
            );
        }
    };

    const xuLyXoaPhieu = async () => {
        try {
            await xoaPhieu2(phieuId!).unwrap();
            dispatch(
                setNotify({
                    typeNotify: "success",
                    titleNotify: "Đã xóa phiếu đánh giá",
                    messageNotify: "",
                })
            );
            navigator("/phieu2");
        } catch (error: any) {
            dispatch(
                setNotify({
                    typeNotify: "error",
                    titleNotify: error?.data?.message || "Xóa phiếu thất bại",
                    messageNotify: "",
                })
            );
        }
    };

    const xuLyGuiKy = async () => {
        try {
            await luuPhieu();
            await guiKyPhieu2(phieuId!).unwrap();
            dispatch(
                setNotify({
                    typeNotify: "success",
                    titleNotify: "Đã gửi ký",
                    messageNotify: "",
                })
            );
        } catch (error: any) {
            dispatch(
                setNotify({
                    typeNotify: "error",
                    titleNotify: error?.data?.message || "Gửi ký thất bại",
                    messageNotify: "",
                })
            );
        }
    };

    const xuLyLuuYKien = async () => {
        if (!phieuId) return;
        try {
            await phanHoiYKienNhaThau({
                id: phieuId,
                body: {
                    yKien,
                    nguoiPhanHoi,
                    ngayPhanHoi: ngayPhanHoi?.format("YYYY-MM-DD"),
                },
            }).unwrap();
            dispatch(
                setNotify({
                    typeNotify: "success",
                    titleNotify: "Đã lưu ý kiến phản hồi nhà thầu",
                    messageNotify: "",
                })
            );
        } catch (error: any) {
            dispatch(
                setNotify({
                    typeNotify: "error",
                    titleNotify: error?.data?.message || "Lưu ý kiến thất bại",
                    messageNotify: "",
                })
            );
        }
    };

    const soTieuChiDat = danhSachTieuChi.filter(tc => tc.dat).length;
    const soTieuChiKhongDat = danhSachTieuChi.filter(tc => tc.khongDat).length;

    // Helper render ô Ghi chú (giống Phiếu 1)
    const renderOGhiChu = (tc: DongTieuChi) => {
        const coHtml = chuaNoiDungHtml(tc.ghiChu);

        if (coHtml) {
            return (
                <div className="ghi-chu-cell-wrapper">
                    <GhiChuHtml
                        className="ghi-chu-rich-preview ghi-chu-content"
                        html={tc.ghiChu || ""}
                    />
                    {coTheSua && (
                        <Tooltip title="Chỉnh sửa ghi chú / ảnh minh chứng">
                            <Button
                                className="no-print ghi-chu-btn-edit"
                                size="small"
                                icon={<FaEdit />}
                                onClick={() => moModalGhiChuTieuChi(tc)}
                            />
                        </Tooltip>
                    )}
                </div>
            );
        }

        if (coTheSua) {
            return (
                <div className="ghi-chu-cell-wrapper">
                    <div className="ghi-chu-content">
                        <Input.TextArea
                            bordered={false}
                            autoSize={{ minRows: 1, maxRows: 4 }}
                            placeholder="Ghi chú (bắt buộc nếu không đạt)..."
                            value={tc.ghiChu}
                            onChange={e =>
                                capNhatTieuChi(tc.maTieuChi, { ghiChu: e.target.value })
                            }
                        />
                    </div>
                    <Tooltip title="Chèn hình ảnh / Soạn chi tiết">
                        <Button
                            className="no-print ghi-chu-btn-edit"
                            size="small"
                            icon={<FaImage />}
                            onClick={() => moModalGhiChuTieuChi(tc)}
                        />
                    </Tooltip>
                </div>
            );
        }

        return <div className="ghi-chu-rich-preview">{tc.ghiChu}</div>;
    };

    return (
        <LayoutV2Component>
            {/* 1. TOOLBAR CHUNG */}
            <PhieuToolbar
                title={
                    laTaoMoi
                        ? "Lập phiếu đánh giá chất lượng dịch vụ suất ăn"
                        : `Phiếu đánh giá suất ăn — ${phieu?.soHieu ?? ""}`
                }
                trangThai={phieu?.trangThai}
                onPrint={() => window.print()}
            />

            {/* 2. FORM THÔNG TIN NHẬP LIỆU (NO-PRINT) */}
            <PhieuInputCard>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <div className="mb-1 font-medium">Nhà thầu</div>
                            <Select
                                className="w-full"
                                placeholder="-- Chọn nhà thầu --"
                                showSearch
                                optionFilterProp="children"
                                disabled={!coTheSua}
                                value={nhaThauId}
                                onChange={v => {
                                    setNhaThauId(v);
                                    setPhieu1Id(undefined);
                                }}
                            >
                                {danhSachNhaThau.map((nt: NhaThauModel) => (
                                    <Select.Option key={nt.id} value={nt.id}>
                                        {nt.ten}
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <div className="mb-1 font-medium">Bếp ăn (nơi nấu)</div>
                            <Select
                                className="w-full"
                                allowClear
                                placeholder="-- Chọn bếp ăn --"
                                showSearch
                                optionFilterProp="children"
                                disabled={!coTheSua}
                                value={bepAnId}
                                onChange={v => {
                                    setBepAnId(v);
                                    setPhieu1Id(undefined);
                                }}
                            >
                                {danhSachBepAn.map((b: BepAnModel) => (
                                    <Select.Option key={b.id} value={b.id}>
                                        {b.ten}
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <div className="mb-1 font-medium">Nhà ăn (nơi phát suất ăn)</div>
                            <Select
                                className="w-full"
                                placeholder="-- Chọn nhà ăn --"
                                showSearch
                                optionFilterProp="children"
                                disabled={!coTheSua}
                                value={nhaAnId}
                                onChange={v => setNhaAnId(v)}
                            >
                                {danhSachNhaAn.map((n: NhaAnModel) => (
                                    <Select.Option key={n.id} value={n.id}>
                                        {n.diaDiem}
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <div className="mb-1 font-medium">Phiếu 1 (VSATTP) liên kết</div>
                            <Select
                                className="w-full"
                                allowClear
                                placeholder="-- Không có Phiếu 1 (nhập điểm VSATTP tay) --"
                                disabled={!coTheSua || !nhaThauId}
                                value={phieu1Id}
                                onChange={v => setPhieu1Id(v)}
                            >
                                {danhSachPhieu1KhaDung.map(p1 => (
                                    <Select.Option key={p1.id} value={p1.id}>
                                        {p1.soHieu} — {new Date(p1.ngayKiemTra).toLocaleDateString("vi-VN")} ({tenTrangThaiPhieu(p1.trangThai)})
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <div className="mb-1 font-medium">Tháng / Năm</div>
                            <div className="flex gap-2">
                                <Select
                                    className="w-full"
                                    disabled={!coTheSua}
                                    value={thang}
                                    onChange={v => setThang(v)}
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(t => (
                                        <Select.Option key={t} value={t}>Tháng {t}</Select.Option>
                                    ))}
                                </Select>
                                <Select
                                    className="w-full"
                                    disabled={!coTheSua}
                                    value={nam}
                                    onChange={v => setNam(v)}
                                >
                                    {[nam - 1, nam, nam + 1].map(n => (
                                        <Select.Option key={n} value={n}>{n}</Select.Option>
                                    ))}
                                </Select>
                            </div>
                        </div>

                        <div>
                            <div className="mb-1 font-medium">Ngày kiểm tra</div>
                            <DatePicker
                                className="w-full"
                                format="DD/MM/YYYY"
                                disabled={!coTheSua}
                                value={thoiGianTu}
                                onChange={v => setThoiGianTu(v)}
                            />
                        </div>

                        <div>
                            <div className="mb-1 font-medium">Vị trí kiểm tra</div>
                            <Input disabled value={viTriKiemTra} placeholder="Tự động lấy theo Nhà ăn đã chọn" />
                        </div>
                    </div>
            </PhieuInputCard>

            {/* 3. TỜ PHIẾU IN A4 */}
            <div className="phieu-a4">
                <PhieuHeader
                    title="PHIẾU ĐÁNH GIÁ CHẤT LƯỢNG DỊCH VỤ SUẤT ĂN"
                    subtitle={`Số: ${phieu?.soHieu ?? "........................"}`}
                    infoItems={[
                        { label: "Nhà thầu:", value: tenNhaThau(nhaThauId) || "........................" },
                        {
                            label: "Ngày kiểm tra:",
                            value: thoiGianTu ? thoiGianTu.format("DD/MM/YYYY") : "........................",
                        },
                    ]}
                />

                <table className="phieu-table phieu2-table">
                    <thead>
                        <tr>
                            <th rowSpan={2} className="cot-thoi-gian">Thời gian kiểm tra</th>
                            <th rowSpan={2} className="cot-vi-tri">Vị trí kiểm tra</th>
                            {danhSachTieuChi.map(tc => (
                                <th key={tc.maTieuChi} colSpan={2} className="cot-tieu-chi-ten">
                                    {tc.tenTieuChi}
                                </th>
                            ))}
                        </tr>
                        <tr>
                            {danhSachTieuChi.map((tc, index) => {
                                const laCotCuoi = index === danhSachTieuChi.length - 1;
                                return (
                                    <React.Fragment key={tc.maTieuChi}>
                                        <th className="cot-dat-sub">
                                            Đạt
                                            {tc.maTieuChi === "VSATTP" && (
                                                <div className="ghi-chu-note-header">
                                                    {phieu1Id ? "(tự động theo Phiếu 1)" : "(không có Phiếu 1 — nhập tay)"}
                                                </div>
                                            )}
                                        </th>
                                        <th className={`cot-khong-dat-sub ${laCotCuoi ? "cot-khong-dat-sub-lon" : ""}`}>
                                            K-Đạt
                                        </th>
                                    </React.Fragment>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="dong-tieu-chi">
                            <td className="o-thoi-gian">
                                {coTheSua ? (
                                    <Input.TextArea
                                        bordered={false}
                                        className="input-table"
                                        autoSize={{ minRows: 1, maxRows: 3 }}
                                        placeholder="VD: Từ 16h30 đến 19h00"
                                        value={thoiGianKiemTraText}
                                        onChange={e => setThoiGianKiemTraText(e.target.value)}
                                    />
                                ) : (
                                    thoiGianKiemTraText || "........................"
                                )}
                            </td>
                            <td className="o-vi-tri">{viTriKiemTra || "........................"}</td>
                            {danhSachTieuChi.map(tc => (
                                <React.Fragment key={tc.maTieuChi}>
                                    <td
                                        className={`o-ket-qua ${tc.dat ? "da-chon" : ""}`}
                                        onClick={() => chonKetQua(tc, "DAT")}
                                    >
                                        {tc.dat && "✓"}
                                        {tc.dat && tc.maTieuChi === "VSATTP" && (
                                            !phieu1Id && coTheSua ? (
                                                <div className="o-diem-inline" onClick={e => e.stopPropagation()}>
                                                    <InputNumber
                                                        size="small"
                                                        min={0}
                                                        max={5}
                                                        step={0.01}
                                                        placeholder="Nhập điểm"
                                                        value={tc.diem}
                                                        onChange={v =>
                                                            capNhatTieuChi(tc.maTieuChi, { diem: v ?? undefined })
                                                        }
                                                    />
                                                </div>
                                            ) : (
                                                tc.diem !== undefined &&
                                                tc.diem !== null && (
                                                    <div className="o-diem-inline">
                                                        {Number(tc.diem).toLocaleString("vi-VN", {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                        đ
                                                    </div>
                                                )
                                            )
                                        )}
                                    </td>
                                    <td
                                        className={`o-ket-qua o-khong-dat ${tc.khongDat ? "da-chon" : ""}`}
                                        onClick={() => chonKetQua(tc, "KHONG_DAT")}
                                    >
                                        {tc.khongDat && "✓"}
                                        {tc.khongDat && (
                                            <div className="o-khong-dat-ghichu" onClick={e => e.stopPropagation()}>
                                                {renderOGhiChu(tc)}
                                            </div>
                                        )}
                                    </td>
                                </React.Fragment>
                            ))}
                        </tr>
                    </tbody>
                </table>

                {/* Kết quả tổng hợp */}
                <div className="phieu-ket-luan">
                    <div className="phieu-ket-luan-title">Kết quả</div>
                    <div className="ket-qua-tong-hop">
                        Đạt: <strong>{soTieuChiDat}/5</strong>
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        Không đạt: <strong>{soTieuChiKhongDat}/5</strong>
                    </div>
                </div>

                {/* Ý kiến nhà thầu */}
                <div className="phieu-y-kien">
                    <div className="phieu-ket-luan-title">Ý kiến / phản hồi của nhà thầu</div>
                    {!laTaoMoi ? (
                        <>
                            {chuaNoiDungHtml(yKien) ? (
                                <div className="flex items-start justify-between gap-1">
                                    <GhiChuHtml
                                        className="ghi-chu-rich-preview flex-1"
                                        html={yKien}
                                    />
                                    <Tooltip title="Sửa ý kiến / ảnh">
                                        <Button
                                            className="no-print"
                                            size="small"
                                            icon={<FaEdit />}
                                            onClick={moModalYKien}
                                        />
                                    </Tooltip>
                                </div>
                            ) : (
                                <div className="no-print">
                                    <Input.TextArea
                                        autoSize={{ minRows: 2, maxRows: 4 }}
                                        placeholder="Ý kiến phản hồi của nhà thầu..."
                                        value={yKien}
                                        onChange={e => setYKien(e.target.value)}
                                    />
                                    <Button
                                        className="mt-2"
                                        size="small"
                                        icon={<FaImage />}
                                        onClick={moModalYKien}
                                    >
                                        Chèn hình ảnh / Soạn chi tiết
                                    </Button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 no-print">
                                <div>
                                    <div className="mb-1 font-medium">Người phản hồi</div>
                                    <Input
                                        value={nguoiPhanHoi}
                                        onChange={e => setNguoiPhanHoi(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <div className="mb-1 font-medium">Ngày phản hồi</div>
                                    <DatePicker
                                        className="w-full"
                                        format="DD/MM/YYYY"
                                        value={ngayPhanHoi}
                                        onChange={v => setNgayPhanHoi(v)}
                                    />
                                </div>
                            </div>

                            <Button
                                className="mt-3 no-print"
                                loading={dangLuuYKien}
                                onClick={xuLyLuuYKien}
                            >
                                Lưu ý kiến phản hồi
                            </Button>
                        </>
                    ) : (
                        <div className="text-gray-400 no-print">
                            Lập phiếu trước khi nhập ý kiến phản hồi nhà thầu.
                        </div>
                    )}
                </div>

                {/* Khối Chữ ký */}
                <PhieuSignatures
                    columns={[
                        { title: "ĐẠI DIỆN NHÀ THẦU", subTitle: "(Ký, ghi rõ họ tên)" },
                        { title: "NGƯỜI ĐÁNH GIÁ", subTitle: "(Ký, ghi rõ họ tên)" },
                    ]}
                />

                {/* Ghi chú cuối phiếu */}
                <div className="phieu-ghi-chu-footer">
                    <div className="ghi-chu-footer-title">Ghi chú:</div>
                    <div className="ghi-chu-footer-item">- Kết quả ĐẠT, đánh dấu tick.</div>
                    <div className="ghi-chu-footer-item">
                        - Đối với kết quả KHÔNG ĐẠT, người đánh giá ghi rõ lý do và hình kèm ảnh minh chứng theo nếu có.
                    </div>
                </div>
            </div>

            {/* 4. THANH NÚT ACTION */}
            <PhieuActions
                coTheSua={coTheSua}
                laTaoMoi={laTaoMoi}
                trangThai={phieu?.trangThai}
                dangLuu={dangThem || dangSua}
                dangGuiKy={dangGuiKy}
                onLuu={luuPhieu}
                onGuiKy={xuLyGuiKy}
                onXoa={xuLyXoaPhieu}
            />

            {/* 5. TIẾN ĐỘ KÝ */}
            {!laTaoMoi && phieuId && phieu && phieu.trangThai !== "NHAP" && (
                <div className="no-print">
                    <TienDoKy
                        loaiDoiTuong="PHIEU2"
                        doiTuongId={phieuId}
                        onDaDongBo={() => dongBoTrangThaiPhieu2(phieuId)}
                    />
                </div>
            )}

            {/* 6. MODAL SOẠN GHI CHÚ & CHÈN HÌNH ẢNH (TINYMCE) */}
            <TinyMceModal
                open={modalGhiChu.open}
                title={modalGhiChu.title}
                subtitle={modalGhiChu.subtitle}
                initialValue={modalGhiChu.value}
                onSave={luuGhiChuModal}
                onCancel={() => setModalGhiChu(prev => ({ ...prev, open: false }))}
            />
        </LayoutV2Component>
    );
};

export default Phieu2FormPage;
