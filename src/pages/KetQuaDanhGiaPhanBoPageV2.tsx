import React, { useState } from "react";
import { Button, DatePicker, Select, Table, TableColumnsType, Tag, Tooltip } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { FaBalanceScaleRight } from "react-icons/fa";
import { IoSearchOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootType } from "../store/types";
import LayoutV2Component from "../components/LayoutV2Component";
import KetQuaDanhGiaPhanBoModel from "../models/KetQuaDanhGiaPhanBoModel";
import { useDanhSachKetQuaDanhGiaPhanBoQuery } from "../services/ketQuaDanhGiaPhanBoApiV2";
import { useDanhSachDiaDiemNhaAnQuery } from "../services/diaDiemNhaAnApiV2";
import { useDanhSachBuaAnQuery } from "../services/buaAnApi";
import { coQuyen, MA_QUYEN } from "../utils/quyenV2";

const { RangePicker } = DatePicker;

// Rà soát số liệu GỐC (KetQuaDanhGia thô, CBNV tự chấm qua kiosk) vs ĐÃ PHÂN
// BỔ (co lại cho khớp DuLieuCom.Com_ThucTe khi bị trùng đánh giá) — xem
// 02. Phantich/modules/KetQuaDanhGiaPhanBo.md. Phieu3Service/Phieu4Service
// đọc đúng các cột "Đã phân bổ" ở đây để tính "Lượt đánh giá".
const KetQuaDanhGiaPhanBoPageV2: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const navigator = useNavigate();

    const homNay = dayjs().startOf("day");
    const macDinhKhoangNgay: [Dayjs, Dayjs] = [homNay.subtract(6, "day"), homNay];

    // State NHẬP (controlled input, đổi tự do) tách khỏi state ÁP DỤNG (dùng
    // để gọi API) — chỉ đồng bộ khi bấm "Tìm kiếm", tránh gọi API liên tục
    // mỗi lần đổi 1 ô lọc (cùng pattern nút "Tìm kiếm" ở LichSuKhaoSatPageV2).
    const [khoangNgayNhap, setKhoangNgayNhap] = useState<[Dayjs, Dayjs]>(macDinhKhoangNgay);
    const [diaDiemNhap, setDiaDiemNhap] = useState<number | undefined>(undefined);
    const [buaAnNhap, setBuaAnNhap] = useState<number | undefined>(undefined);

    const [boLocApDung, setBoLocApDung] = useState({
        khoangNgay: macDinhKhoangNgay,
        diaDiemLoc: undefined as number | undefined,
        buaAnLoc: undefined as number | undefined,
    });

    const { data: danhSachDiaDiem = [] } = useDanhSachDiaDiemNhaAnQuery();
    const { data: danhSachBuaAn = [] } = useDanhSachBuaAnQuery();
    const buaAnSapXep = danhSachBuaAn
        .filter((b) => b.codeBuaAn.toUpperCase() !== "ALL")
        .sort((a, b) => a.codeBuaAn.localeCompare(b.codeBuaAn));

    const { data: danhSach = [], isFetching, refetch } = useDanhSachKetQuaDanhGiaPhanBoQuery({
        diaDiemNhaAnId: boLocApDung.diaDiemLoc,
        idBuaAn: boLocApDung.buaAnLoc,
        tuNgay: boLocApDung.khoangNgay[0].format("YYYY-MM-DD"),
        denNgay: boLocApDung.khoangNgay[1].format("YYYY-MM-DD"),
    });

    const timKiem = () => {
        const locMoi = { khoangNgay: khoangNgayNhap, diaDiemLoc: diaDiemNhap, buaAnLoc: buaAnNhap };

        // Bộ lọc không đổi so với lần "Tìm kiếm" trước -> setBoLocApDung sẽ
        // không tạo ra args mới cho RTK Query nên KHÔNG tự fetch lại (dùng
        // cache). Trang này cần bấm "Tìm kiếm" luôn lấy dữ liệu MỚI NHẤT từ
        // server (VD để kiểm tra job Quartz TinhLaiKetQuaDanhGiaPhanBoJob vừa
        // chạy xong có cập nhật số liệu không) kể cả khi không đổi khoảng
        // ngày/địa điểm/bữa ăn -> chủ động refetch() để bỏ qua cache.
        const khongDoi =
            boLocApDung.diaDiemLoc === locMoi.diaDiemLoc &&
            boLocApDung.buaAnLoc === locMoi.buaAnLoc &&
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
                    className="w-full sm:w-[220px]"
                    allowClear
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
                <Button type="default" icon={<IoSearchOutline />} className="text-blue-600 border-blue-600" onClick={timKiem}>
                    Tìm kiếm
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
            />
        </LayoutV2Component>
    );
};

export default KetQuaDanhGiaPhanBoPageV2;
