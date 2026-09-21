import { Button, Checkbox, DatePicker, Input, Popconfirm, Select, Table, TableColumnsType, Tag } from "antd";
import { Dayjs } from "dayjs";
import React, { useEffect, useState } from "react";
import { FaSearch, FaTrash, FaUtensils } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import LayoutV2Component from "../../components/LayoutV2Component";
import { mauTrangThaiPhieu, tenTrangThaiPhieu, DS_TRANG_THAI_PHIEU, PhieuFilterBar, PhieuListHeader } from "../../components/phieu";
import Phieu2Model from "../../models/Phieu2Model";
import { useDanhSachBepAnQuery } from "../../services/bepAnApiV2";
import { useDanhSachDiaDiemNhaAnQuery } from "../../services/diaDiemNhaAnApiV2";
import { useDanhSachNhaThauQuery } from "../../services/nhaThauApiV2";
import { useDanhSachPhieu2Query, useXoaPhieu2Mutation } from "../../services/phieu2Api";
import { setNotify } from "../../store/notifycationSlide";
import { RootType } from "../../store/types";

const { RangePicker } = DatePicker;

interface BoLocDaApDung {
    nhaThauId?: number;
    bepAnId?: number;
    thang?: number;
    nam?: number;
    trangThai?: string;
    tuNgay?: string;
    denNgay?: string;
    tuKhoa?: string;
    chiCuaToi?: boolean;
    page: number;
    pageSize: number;
}

const BO_LOC_MAC_DINH: BoLocDaApDung = { page: 1, pageSize: 10 };

const Phieu2DanhSachPage: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    // Nhà thầu chỉ xem/lọc được đúng nhà thầu của chính mình — không cho chọn
    // nhà thầu khác (backend cũng đã ép lọc theo claim nha_thau_id, xem
    // Phieu2Controller/GetNhaThauId()).
    const laTaiKhoanNhaThau = !!authV2.nguoiDung?.nhaThauId;

    // Admin xóa được phiếu NGAY TỪ DANH SÁCH, ở BẤT KỲ trạng thái nào (khác
    // nút "Xóa phiếu" ở trang chi tiết chỉ cho phiếu Nháp) — backend cũng tự
    // dọn dẹp dữ liệu luồng ký (ChuKyPhieu) liên quan, xem Phieu2Service.XoaAsync.
    const laAdmin = !!authV2.nguoiDung?.laAdmin;
    const [xoaPhieu2] = useXoaPhieu2Mutation();

    const xuLyXoaPhieu = async (id: number) => {
        try {
            await xoaPhieu2(id).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã xóa phiếu đánh giá", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Xóa phiếu thất bại", messageNotify: "" }));
        }
    };

    const [nhapNhaThauId, setNhapNhaThauId] = useState<number | undefined>(undefined);
    const [nhapBepAnId, setNhapBepAnId] = useState<number | undefined>(undefined);
    const [nhapThang, setNhapThang] = useState<number | undefined>(undefined);
    const [nhapNam, setNhapNam] = useState<number | undefined>(undefined);
    const [nhapTrangThai, setNhapTrangThai] = useState<string | undefined>(undefined);
    const [nhapTuKhoa, setNhapTuKhoa] = useState("");
    const [nhapKhoangNgay, setNhapKhoangNgay] = useState<[Dayjs | null, Dayjs | null] | null>(null);
    const [nhapChiCuaToi, setNhapChiCuaToi] = useState(false);

    const [boLoc, setBoLoc] = useState<BoLocDaApDung>(BO_LOC_MAC_DINH);

    const xuLyTim = () => {
        setBoLoc({
            nhaThauId: nhapNhaThauId,
            bepAnId: nhapBepAnId,
            thang: nhapThang,
            nam: nhapNam,
            trangThai: nhapTrangThai,
            tuNgay: nhapKhoangNgay?.[0]?.format("YYYY-MM-DD"),
            denNgay: nhapKhoangNgay?.[1]?.format("YYYY-MM-DD"),
            tuKhoa: nhapTuKhoa.trim() || undefined,
            chiCuaToi: nhapChiCuaToi,
            page: 1,
            pageSize: boLoc.pageSize,
        });
    };

    // refetchOnMountOrArgChange: quay lại danh sách sau khi xem/ký ở phiên
    // khác cũng cần dữ liệu mới nhất, không dùng cache cũ — cùng lý do với
    // Phieu1FormPage.tsx.
    const { data, isFetching } = useDanhSachPhieu2Query({
        ...boLoc,
        nhaThauId: laTaiKhoanNhaThau ? authV2.nguoiDung?.nhaThauId : boLoc.nhaThauId,
    }, { refetchOnMountOrArgChange: true });
    const danhSachPhieu = data?.items ?? [];
    const { data: danhSachNhaThau = [] } = useDanhSachNhaThauQuery();
    const { data: danhSachBepAn = [] } = useDanhSachBepAnQuery();
    const { data: danhSachNhaAn = [] } = useDanhSachDiaDiemNhaAnQuery();

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        }
    }, []);

    if (!authV2.isAuthenticated) {
        return null;
    }

    const tenNhaThau = (id: number) => danhSachNhaThau.find(nt => nt.id === id)?.ten ?? "";
    const tenBepAn = (id?: number) => (id ? danhSachBepAn.find(b => b.id === id)?.ten ?? "" : "");
    const tenNhaAn = (id?: number) => (id ? danhSachNhaAn.find(n => n.id === id)?.diaDiem ?? "" : "");

    const danhSachNam = Array.from(
        new Set([new Date().getFullYear(), ...danhSachPhieu.map(p => p.nam)])
    ).sort((a, b) => b - a);

    const columns: TableColumnsType<Phieu2Model> = [
        {
            title: 'Số hiệu',
            dataIndex: 'soHieu',
            key: 'soHieu',
            width: 220,
            render: (soHieu, record) => <Link to={`/phieu2/${record.id}`} className="text-[#004aad] font-medium">{soHieu}</Link>,
        },
        {
            title: 'Tháng/Năm',
            key: 'thangNam',
            width: 110,
            render: (_, record) => `${record.thang.toString().padStart(2, '0')}/${record.nam}`,
        },
        {
            title: 'Nhà thầu',
            dataIndex: 'nhaThauId',
            key: 'nhaThauId',
            width: 220,
            render: (id) => tenNhaThau(id),
        },
        {
            title: 'Bếp ăn',
            dataIndex: 'bepAnId',
            key: 'bepAnId',
            width: 180,
            render: (id) => tenBepAn(id),
        },
        {
            title: 'Nhà ăn',
            dataIndex: 'nhaAnIds',
            key: 'nhaAnIds',
            width: 220,
            render: (ids?: number[]) => (ids ?? []).map(id => tenNhaAn(id)).filter(Boolean).join(', '),
        },
        {
            title: 'Địa điểm',
            dataIndex: 'diaDiem',
            key: 'diaDiem',
            width: 160,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            key: 'trangThai',
            width: 140,
            render: (trangThai) => <Tag color={mauTrangThaiPhieu(trangThai)}>{tenTrangThaiPhieu(trangThai)}</Tag>,
        },
        {
            title: 'Nhà thầu đã ký',
            dataIndex: 'tenNhaThauDaKy',
            key: 'tenNhaThauDaKy',
            width: 200,
            render: (ten) => ten || <span className="text-gray-400">Chưa ký</span>,
        },
        {
            title: 'Người đã ký',
            dataIndex: 'tenNguoiDaKy',
            key: 'tenNguoiDaKy',
            width: 200,
            render: (ten) => ten || <span className="text-gray-400">Chưa ký</span>,
        },
        ...(laAdmin ? [{
            title: 'Thao tác',
            key: 'thaoTac',
            width: 90,
            fixed: 'right' as const,
            render: (_: unknown, record: Phieu2Model) => (
                <Popconfirm
                    title="Xóa phiếu"
                    description="Admin xóa phiếu này (kèm dữ liệu luồng ký liên quan)?"
                    okText="Xóa"
                    cancelText="Hủy"
                    onConfirm={() => xuLyXoaPhieu(record.id)}
                >
                    <Button danger size="small" icon={<FaTrash />} />
                </Popconfirm>
            ),
        }] : []),
    ];

    return <LayoutV2Component>
        <PhieuListHeader
            icon={<FaUtensils />}
            title="Phiếu đánh giá chất lượng dịch vụ suất ăn"
            actionLabel={laTaiKhoanNhaThau ? undefined : "Lập phiếu mới"}
            onAction={laTaiKhoanNhaThau ? undefined : () => navigator("/phieu2/moi")}
        />

        <PhieuFilterBar>
            <Input
                className="w-full sm:w-[220px]"
                allowClear
                placeholder="Tìm theo số hiệu..."
                prefix={<FaSearch className="text-gray-400" />}
                value={nhapTuKhoa}
                onChange={(e) => setNhapTuKhoa(e.target.value)}
                onPressEnter={xuLyTim}
            />
            {!laTaiKhoanNhaThau && (
                <Select
                    className="w-full sm:w-[220px]"
                    allowClear
                    placeholder="-- Lọc theo nhà thầu --"
                    showSearch
                    optionFilterProp="children"
                    value={nhapNhaThauId}
                    onChange={(value) => setNhapNhaThauId(value)}
                >
                    {danhSachNhaThau.map(nt => (
                        <Select.Option key={nt.id} value={nt.id}>{nt.ten}</Select.Option>
                    ))}
                </Select>
            )}
            <Select
                className="w-full sm:w-[220px]"
                allowClear
                placeholder="-- Lọc theo bếp ăn --"
                showSearch
                optionFilterProp="children"
                value={nhapBepAnId}
                onChange={(value) => setNhapBepAnId(value)}
            >
                {danhSachBepAn.map(b => (
                    <Select.Option key={b.id} value={b.id}>{b.ten}</Select.Option>
                ))}
            </Select>
            <Select
                className="w-full sm:w-[140px]"
                allowClear
                placeholder="-- Tháng --"
                value={nhapThang}
                onChange={(value) => setNhapThang(value)}
            >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(t => (
                    <Select.Option key={t} value={t}>Tháng {t}</Select.Option>
                ))}
            </Select>
            <Select
                className="w-full sm:w-[120px]"
                allowClear
                placeholder="-- Năm --"
                value={nhapNam}
                onChange={(value) => setNhapNam(value)}
            >
                {danhSachNam.map(n => (
                    <Select.Option key={n} value={n}>{n}</Select.Option>
                ))}
            </Select>
            <Select
                className="w-full sm:w-[200px]"
                allowClear
                placeholder="-- Lọc theo trạng thái --"
                value={nhapTrangThai}
                onChange={(value) => setNhapTrangThai(value)}
            >
                {/* Nhà thầu không thấy phiếu Nháp/Bị từ chối — backend cũng đã
                    ép lọc, đây chỉ là để không hiện lựa chọn vô nghĩa. */}
                {DS_TRANG_THAI_PHIEU
                    .filter(t => !laTaiKhoanNhaThau || t.value === "CHO_KY" || t.value === "DA_DUYET")
                    .map(t => (
                        <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
                    ))}
            </Select>
            <RangePicker
                className="w-full sm:w-[260px]"
                format="DD/MM/YYYY"
                placeholder={["Từ ngày KT", "Đến ngày KT"]}
                value={nhapKhoangNgay}
                onChange={(v) => setNhapKhoangNgay(v as [Dayjs | null, Dayjs | null] | null)}
            />
            {!laTaiKhoanNhaThau && (
                <Checkbox checked={nhapChiCuaToi} onChange={(e) => setNhapChiCuaToi(e.target.checked)}>
                    Chỉ phiếu tôi lập
                </Checkbox>
            )}
            <Button type="primary" icon={<FaSearch />} onClick={xuLyTim}>
                Tìm
            </Button>
        </PhieuFilterBar>

        <div className="rounded-xl overflow-hidden border border-zinc-100">
            <Table
                rowKey="id"
                loading={isFetching}
                columns={columns}
                dataSource={danhSachPhieu}
                scroll={{ x: 1800 }}
                pagination={{
                    current: boLoc.page,
                    pageSize: boLoc.pageSize,
                    total: data?.totalCount ?? 0,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng ${total} phiếu`,
                    onChange: (page, pageSize) => setBoLoc(prev => ({ ...prev, page, pageSize })),
                }}
            />
        </div>
    </LayoutV2Component>;
};

export default Phieu2DanhSachPage;
