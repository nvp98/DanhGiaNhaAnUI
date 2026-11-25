import React, { useState } from "react";
import { Button, DatePicker, Modal, Select, Table, TableColumnsType, Tag, Tooltip } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { FaBalanceScaleRight, FaCalculator, FaExclamationTriangle, FaFileExcel } from "react-icons/fa";
import { IoSearchOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootType } from "../store/types";
import LayoutV2Component from "../components/LayoutV2Component";
import KetQuaDanhGiaPhanBoModel from "../models/KetQuaDanhGiaPhanBoModel";
import {
    useDanhSachKetQuaDanhGiaPhanBoQuery,
    useLazyXuatKetQuaDanhGiaPhanBoQuery,
    useTinhLaiKhoangKetQuaDanhGiaPhanBoMutation,
} from "../services/ketQuaDanhGiaPhanBoApiV2";
import { useDanhSachDiaDiemNhaAnQuery } from "../services/diaDiemNhaAnApiV2";
import { useDanhSachBuaAnQuery } from "../services/buaAnApi";
import { setNotify } from "../store/notifycationSlide";
import { coQuyen, MA_QUYEN } from "../utils/quyenV2";
import { xuatExcelKetQuaDanhGiaPhanBo } from "../utils/xuatExcelKetQuaDanhGiaPhanBo";

const { RangePicker } = DatePicker;

// Rà soát số liệu GỐC (KetQuaDanhGia thô, CBNV tự chấm qua kiosk) vs ĐÃ PHÂN
// BỔ (co lại cho khớp DuLieuCom.Com_ThucTe khi bị trùng đánh giá) — xem
// 02. Phantich/modules/KetQuaDanhGiaPhanBo.md. Phieu3Service/Phieu4Service
// đọc đúng các cột "Đã phân bổ" ở đây để tính "Lượt đánh giá".
const KetQuaDanhGiaPhanBoPageV2: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    const homNay = dayjs().startOf("day");
    const macDinhKhoangNgay: [Dayjs, Dayjs] = [homNay.subtract(6, "day"), homNay];

    // State NHẬP (controlled input, đổi tự do) tách khỏi state ÁP DỤNG (dùng
    // để gọi API) — chỉ đồng bộ khi bấm "Tìm kiếm", tránh gọi API liên tục
    // mỗi lần đổi 1 ô lọc (cùng pattern nút "Tìm kiếm" ở LichSuKhaoSatPageV2).
    const [khoangNgayNhap, setKhoangNgayNhap] = useState<[Dayjs, Dayjs]>(macDinhKhoangNgay);
    // Mảng rỗng = "Tất cả địa điểm" (Select mode="multiple"). Nút "Phân bổ
    // lại" (BE chỉ nhận 1 id) bị khóa khi chọn nhiều hơn 1 — xem khoaPhanBoLaiDoChonNhieuDiaDiem.
    const [diaDiemNhap, setDiaDiemNhap] = useState<number[]>([]);
    const [buaAnNhap, setBuaAnNhap] = useState<number | undefined>(undefined);
    // true = "Đã co giãn" (Tong != TongGoc), false = "Giữ nguyên", undefined
    // = tất cả trạng thái.
    const [trangThaiNhap, setTrangThaiNhap] = useState<boolean | undefined>(undefined);

    const [boLocApDung, setBoLocApDung] = useState({
        khoangNgay: macDinhKhoangNgay,
        diaDiemLoc: [] as number[],
        buaAnLoc: undefined as number | undefined,
        trangThaiLoc: undefined as boolean | undefined,
        page: 1,
        pageSize: 20,
    });

    const { data: danhSachDiaDiem = [] } = useDanhSachDiaDiemNhaAnQuery();
    const { data: danhSachBuaAn = [] } = useDanhSachBuaAnQuery();
    const buaAnSapXep = danhSachBuaAn
        .filter((b) => b.codeBuaAn.toUpperCase() !== "ALL")
        .sort((a, b) => a.codeBuaAn.localeCompare(b.codeBuaAn));

    const { data, isFetching, refetch } = useDanhSachKetQuaDanhGiaPhanBoQuery({
        diaDiemNhaAnIds: boLocApDung.diaDiemLoc.length > 0 ? boLocApDung.diaDiemLoc : undefined,
        idBuaAn: boLocApDung.buaAnLoc,
        tuNgay: boLocApDung.khoangNgay[0].format("YYYY-MM-DD"),
        denNgay: boLocApDung.khoangNgay[1].format("YYYY-MM-DD"),
        daCoGian: boLocApDung.trangThaiLoc,
        page: boLocApDung.page,
        pageSize: boLocApDung.pageSize,
    });
    const danhSach = data?.items ?? [];
    const [tinhLaiKhoang, { isLoading: dangPhanBo }] = useTinhLaiKhoangKetQuaDanhGiaPhanBoMutation();
    const [goiLayDanhSachXuat] = useLazyXuatKetQuaDanhGiaPhanBoQuery();
    const [dangXuatExcel, setDangXuatExcel] = useState(false);

    // Số ngày đang chọn ở form search (ô nhập, chưa cần bấm "Tìm kiếm") —
    // dùng để chặn nút "Phân bổ lại" khi khoảng ngày quá 2 ngày (quét hết
    // bữa x địa điểm active cho mỗi ngày, khoảng dài dễ quá tải DB — xác
    // nhận nghiệp vụ 2026-10-19).
    const soNgayDangChon = khoangNgayNhap[1].startOf("day").diff(khoangNgayNhap[0].startOf("day"), "day") + 1;
    const khoangNgayQuaDai = soNgayDangChon > 2;
    // "Phân bổ lại" (POST tinh-lai-khoang) chỉ nhận 1 địa điểm — chọn nhiều
    // hơn 1 ở ô lọc (multi-select) thì khóa nút này lại, tránh hiểu nhầm là
    // phân bổ lại cho TẤT CẢ các địa điểm đang chọn.
    const khoaPhanBoLaiDoChonNhieuDiaDiem = diaDiemNhap.length > 1;
    const diaDiemDonLePhanBo = diaDiemNhap.length === 1 ? diaDiemNhap[0] : undefined;

    const tenBuaAnChon = (id?: number) => (id ? danhSachBuaAn.find((b) => b.id === id)?.tenBuaAn ?? `#${id}` : "Tất cả bữa ăn");
    const tenDiaDiemChon = (id?: number) => (id ? danhSachDiaDiem.find((d) => d.id === id)?.diaDiem ?? `#${id}` : "Tất cả địa điểm");

    // Phân bổ lại theo đúng bộ lọc ĐANG CHỌN ở form search (không cần bấm
    // "Tìm kiếm" trước) — 1 ngày + 1 bữa ăn cụ thể thì tính ngay 1 tổ hợp,
    // chọn khoảng/để trống bữa ăn thì BE tự quét theo khoảng (đã giới hạn
    // tối đa 2 ngày ở trên) và tự bỏ qua các tổ hợp NGÀY ĐÃ QUA đã tính đủ
    // từ trước (xem KetQuaDanhGiaPhanBoService.TinhLaiTheoKhoangAsync).
    const phanBoLai = () => {
        if (khoangNgayQuaDai || khoaPhanBoLaiDoChonNhieuDiaDiem) return;

        Modal.confirm({
            title: "Xác nhận phân bổ lại",
            icon: <FaExclamationTriangle className="text-amber-500" />,
            content: (
                <div className="mt-3">
                    <p className="mb-3">
                        Tính lại số liệu đã phân bổ cho <b>{tenBuaAnChon(buaAnNhap)}</b>, <b>{tenDiaDiemChon(diaDiemDonLePhanBo)}</b>, từ{" "}
                        <b>{khoangNgayNhap[0].format("DD/MM/YYYY")}</b> đến <b>{khoangNgayNhap[1].format("DD/MM/YYYY")}</b>?
                    </p>
                    <p className="text-gray-500 text-sm m-0">
                        Những ngày đã qua và đã tính đủ từ trước sẽ được tự động bỏ qua, không tính lại.
                    </p>
                </div>
            ),
            okText: "Phân bổ lại",
            cancelText: "Hủy",
            onOk: async () => {
                try {
                    const ketQua = await tinhLaiKhoang({
                        tuNgay: khoangNgayNhap[0].format("YYYY-MM-DD"),
                        denNgay: khoangNgayNhap[1].format("YYYY-MM-DD"),
                        id_BuaAn: buaAnNhap,
                        diaDiemNhaAnId: diaDiemDonLePhanBo,
                    }).unwrap();

                    dispatch(setNotify({
                        typeNotify: "success",
                        titleNotify: "Đã phân bổ lại",
                        messageNotify: `Đã tính ${ketQua.soToHopDaTinh} tổ hợp (ngày x bữa ăn), bỏ qua ${ketQua.soToHopBoQua} tổ hợp đã tính đủ, ghi ${ketQua.tongDongGhi} dòng.`,
                    }));
                    refetch();
                } catch (error: any) {
                    dispatch(setNotify({
                        typeNotify: "error",
                        titleNotify: error?.data?.message || "Phân bổ lại thất bại",
                        messageNotify: "",
                    }));
                }
            },
        });
    };

    // Bấm "Tìm kiếm" luôn quay về trang 1 — bộ lọc mới có thể cho ra ít
    // trang hơn trang đang xem (cùng pattern Phieu1DanhSachPage.tsx).
    const timKiem = () => {
        const locMoi = {
            khoangNgay: khoangNgayNhap, diaDiemLoc: diaDiemNhap, buaAnLoc: buaAnNhap, trangThaiLoc: trangThaiNhap,
            page: 1, pageSize: boLocApDung.pageSize,
        };

        // Bộ lọc không đổi so với lần "Tìm kiếm" trước -> setBoLocApDung sẽ
        // không tạo ra args mới cho RTK Query nên KHÔNG tự fetch lại (dùng
        // cache). Trang này cần bấm "Tìm kiếm" luôn lấy dữ liệu MỚI NHẤT từ
        // server (VD để kiểm tra job Quartz TinhLaiKetQuaDanhGiaPhanBoJob vừa
        // chạy xong có cập nhật số liệu không) kể cả khi không đổi khoảng
        // ngày/địa điểm/bữa ăn/trạng thái -> chủ động refetch() để bỏ qua cache.
        const diaDiemKhongDoi =
            [...boLocApDung.diaDiemLoc].sort((a, b) => a - b).join(",") ===
            [...locMoi.diaDiemLoc].sort((a, b) => a - b).join(",");
        const khongDoi =
            diaDiemKhongDoi &&
            boLocApDung.buaAnLoc === locMoi.buaAnLoc &&
            boLocApDung.trangThaiLoc === locMoi.trangThaiLoc &&
            boLocApDung.page === locMoi.page &&
            boLocApDung.khoangNgay[0].isSame(locMoi.khoangNgay[0], "day") &&
            boLocApDung.khoangNgay[1].isSame(locMoi.khoangNgay[1], "day");

        setBoLocApDung(locMoi);
        if (khongDoi) refetch();
    };

    React.useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        } else if (!coQuyen(authV2.nguoiDung, MA_QUYEN.QUAN_LY_PHAN_BO_DANH_GIA)) {
            navigator("/v2");
        }
    }, []);

    if (!authV2.isAuthenticated || !coQuyen(authV2.nguoiDung, MA_QUYEN.QUAN_LY_PHAN_BO_DANH_GIA)) {
        return null;
    }

    const tenDiaDiem = (id: number) => danhSachDiaDiem.find((d) => d.id === id)?.diaDiem ?? `#${id}`;

    // Xuất Excel: KHÔNG dùng lại "danhSach" đang hiển thị trên bảng — gọi tay
    // API lấy dữ liệu MỚI NHẤT theo đúng điều kiện lọc ĐANG CHỌN ở form
    // search (ô nhập, không cần bấm "Tìm kiếm" trước, cùng pattern nút
    // "Phân bổ lại" ở trên).
    const xuLyXuatExcel = async () => {
        setDangXuatExcel(true);
        try {
            const ketQua = await goiLayDanhSachXuat({
                diaDiemNhaAnIds: diaDiemNhap.length > 0 ? diaDiemNhap : undefined,
                idBuaAn: buaAnNhap,
                tuNgay: khoangNgayNhap[0].format("YYYY-MM-DD"),
                denNgay: khoangNgayNhap[1].format("YYYY-MM-DD"),
                daCoGian: trangThaiNhap,
            }).unwrap();

            if (ketQua.length === 0) {
                dispatch(setNotify({ typeNotify: "warning", titleNotify: "Không có dữ liệu khớp điều kiện lọc để xuất", messageNotify: "" }));
                return;
            }

            await xuatExcelKetQuaDanhGiaPhanBo(ketQua, tenDiaDiem, {
                tuNgay: khoangNgayNhap[0].format("DD/MM/YYYY"),
                denNgay: khoangNgayNhap[1].format("DD/MM/YYYY"),
                tenBuaAnLoc: tenBuaAnChon(buaAnNhap),
                tenDiaDiemLoc: diaDiemNhap.length > 0
                    ? diaDiemNhap.map((id) => tenDiaDiem(id)).join(", ")
                    : "Tất cả địa điểm",
                tenTrangThaiLoc: trangThaiNhap === true
                    ? "Đã co giãn"
                    : trangThaiNhap === false
                        ? "Giữ nguyên"
                        : "Tất cả trạng thái",
            });
        } catch {
            dispatch(setNotify({ typeNotify: "error", titleNotify: "Xuất Excel thất bại", messageNotify: "" }));
        } finally {
            setDangXuatExcel(false);
        }
    };

    const columns: TableColumnsType<KetQuaDanhGiaPhanBoModel> = [
        {
            title: "Ngày",
            dataIndex: "ngay",
            key: "ngay",
            width: 110,
            fixed: "left",
            sorter: { compare: (a, b) => a.ngay.localeCompare(b.ngay) },
            render: (ngay) => dayjs(ngay).format("DD/MM/YYYY"),
        },
        {
            title: "Bữa ăn",
            dataIndex: "tenBuaAn",
            key: "tenBuaAn",
            width: 100,
            fixed: "left",
        },
        {
            title: "Địa điểm",
            dataIndex: "diaDiemNhaAnId",
            key: "diaDiemNhaAnId",
            width: 200,
            fixed: "left",
            render: (id) => tenDiaDiem(id),
        },
        {
            title: "Suất ăn thực tế",
            dataIndex: "comThucTe",
            key: "comThucTe",
            width: 120,
            align: "right",
            render: (v) => (v === null || v === undefined ? <span className="text-gray-400">--</span> : v),
        },
        {
            title: "Số liệu gốc (kiosk)",
            children: [
                { title: "1 - Rất không hài lòng", dataIndex: "diem1Goc", key: "diem1Goc", width: 60, align: "right" },
                { title: "2 - Không hài lòng", dataIndex: "diem2Goc", key: "diem2Goc", width: 60, align: "right" },
                { title: "3 - Bình thường", dataIndex: "diem3Goc", key: "diem3Goc", width: 60, align: "right" },
                { title: "4 - Hài lòng", dataIndex: "diem4Goc", key: "diem4Goc", width: 60, align: "right" },
                { title: "5 - Rất hài lòng", dataIndex: "diem5Goc", key: "diem5Goc", width: 60, align: "right" },
                { title: "Tổng", dataIndex: "tongGoc", key: "tongGoc", width: 70, align: "right", className: "font-semibold" },
            ],
        },
        {
            title: "Đã phân bổ",
            children: [
                { title: "1 - Rất không hài lòng", dataIndex: "diem1", key: "diem1", width: 60, align: "right" },
                { title: "2 - Không hài lòng", dataIndex: "diem2", key: "diem2", width: 60, align: "right" },
                { title: "3 - Bình thường", dataIndex: "diem3", key: "diem3", width: 60, align: "right" },
                { title: "4 - Hài lòng", dataIndex: "diem4", key: "diem4", width: 60, align: "right" },
                { title: "5 - Rất hài lòng", dataIndex: "diem5", key: "diem5", width: 60, align: "right" },
                { title: "Tổng", dataIndex: "tong", key: "tong", width: 70, align: "right", className: "font-semibold" },
            ],
        },
        {
            title: "Trạng thái",
            key: "trangThai",
            width: 130,
            render: (_, record) =>
                record.tong !== record.tongGoc ? (
                    <Tooltip title={`Tổng gốc ${record.tongGoc} > Suất ăn thực tế ${record.comThucTe} — đã co lại theo phương pháp số dư lớn nhất`}>
                        <Tag color="warning">Đã co giãn</Tag>
                    </Tooltip>
                ) : (
                    <Tag color="success">Giữ nguyên</Tag>
                ),
        },
        {
            title: "Thời gian tính",
            dataIndex: "thoiGianTinh",
            key: "thoiGianTinh",
            width: 150,
            render: (v) => dayjs(v).format("DD/MM/YYYY HH:mm"),
        },
    ];

    return (
        <LayoutV2Component>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div className="flex justify-start items-center gap-3">
                    <div className="w-[60px] h-[60px] flex justify-center items-center bg-gray-100 rounded-md shrink-0">
                        <FaBalanceScaleRight className="text-2xl text-black" />
                    </div>
                    <div>
                        <h2 className="font-bold text-xl text-zinc-700">RÀ SOÁT PHÂN BỔ ĐÁNH GIÁ THEO SUẤT ĂN</h2>
                        <p className="text-gray-500 text-sm m-0">
                            So sánh số lượt đánh giá GỐC (kiosk) với số ĐÃ PHÂN BỔ (khớp suất ăn thực tế) — Phiếu 3/4 dùng cột "Đã phân bổ".
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-4">
                <RangePicker
                    value={khoangNgayNhap}
                    format="DD/MM/YYYY"
                    allowClear={false}
                    onChange={(values) => {
                        if (values && values[0] && values[1]) setKhoangNgayNhap([values[0], values[1]]);
                    }}
                />
                <Select
                    className="w-full sm:w-[280px]"
                    mode="multiple"
                    allowClear
                    maxTagCount="responsive"
                    placeholder="-- Tất cả địa điểm --"
                    value={diaDiemNhap}
                    onChange={(value) => setDiaDiemNhap(value)}
                >
                    {danhSachDiaDiem.map((dd) => (
                        <Select.Option key={dd.id} value={dd.id}>{dd.diaDiem}</Select.Option>
                    ))}
                </Select>
                <Select
                    className="w-full sm:w-[180px]"
                    allowClear
                    placeholder="-- Tất cả bữa ăn --"
                    value={buaAnNhap}
                    onChange={(value) => setBuaAnNhap(value)}
                >
                    {buaAnSapXep.map((b) => (
                        <Select.Option key={b.id} value={b.id}>{b.tenBuaAn}</Select.Option>
                    ))}
                </Select>
                <Select
                    className="w-full sm:w-[180px]"
                    allowClear
                    placeholder="-- Tất cả trạng thái --"
                    value={trangThaiNhap}
                    onChange={(value) => setTrangThaiNhap(value)}
                >
                    <Select.Option value={true}>Đã co giãn</Select.Option>
                    <Select.Option value={false}>Giữ nguyên</Select.Option>
                </Select>
                <Button type="default" icon={<IoSearchOutline />} className="text-blue-600 border-blue-600" onClick={timKiem}>
                    Tìm kiếm
                </Button>
                <Tooltip
                    title={
                        khoangNgayQuaDai
                            ? "Chỉ được chọn khoảng thời gian tối đa 2 ngày để phân bổ lại"
                            : khoaPhanBoLaiDoChonNhieuDiaDiem
                                ? "Chỉ chọn 1 hoặc không chọn địa điểm (tất cả) để phân bổ lại"
                                : ""
                    }
                >
                    <Button
                        type="primary"
                        icon={<FaCalculator />}
                        loading={dangPhanBo}
                        disabled={khoangNgayQuaDai || khoaPhanBoLaiDoChonNhieuDiaDiem}
                        onClick={phanBoLai}
                    >
                        Phân bổ lại
                    </Button>
                </Tooltip>
                <Button
                    icon={<FaFileExcel />}
                    loading={dangXuatExcel}
                    onClick={xuLyXuatExcel}
                >
                    Xuất Excel
                </Button>
            </div>

            <Table
                rowKey="id"
                loading={isFetching}
                columns={columns}
                dataSource={danhSach}
                scroll={{ x: 1300, y: "55vh" }}
                bordered
                size="small"
                pagination={{
                    current: boLocApDung.page,
                    pageSize: boLocApDung.pageSize,
                    total: data?.totalCount ?? 0,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng ${total} dòng`,
                    onChange: (page, pageSize) => setBoLocApDung((prev) => ({ ...prev, page, pageSize })),
                }}
            />
        </LayoutV2Component>
    );
};

export default KetQuaDanhGiaPhanBoPageV2;
