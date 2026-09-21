import { Button, Checkbox, DatePicker, Input, Popconfirm, Select, Table, TableColumnsType, Tag } from "antd";
import { Dayjs } from "dayjs";
import React, { useEffect, useState } from "react";
import { FaClipboardCheck, FaSearch, FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import LayoutV2Component from "../../components/LayoutV2Component";
import Phieu1Model from "../../models/Phieu1Model";
import { useDanhSachBepAnQuery } from "../../services/bepAnApiV2";
import { useDanhSachNhaThauQuery } from "../../services/nhaThauApiV2";
import { useDanhSachPhieu1Query, useXoaPhieu1Mutation } from "../../services/phieu1Api";
import { useDanhSachPhongBanQuery } from "../../services/phongBanApiV2";
import { setNotify } from "../../store/notifycationSlide";
import { RootType } from "../../store/types";
import { PhieuListHeader } from "../../components/phieu";

const { RangePicker } = DatePicker;

const DS_TRANG_THAI = [
    { value: "NHAP", label: "Nháp", color: "default" },
    { value: "CHO_KY", label: "Chờ ký", color: "processing" },
    { value: "DA_DUYET", label: "Đã duyệt", color: "success" },
    { value: "TU_CHOI", label: "Bị từ chối", color: "error" },
];

export const tenTrangThaiPhieu = (trangThai: string) => DS_TRANG_THAI.find(t => t.value === trangThai)?.label ?? trangThai;
export const mauTrangThaiPhieu = (trangThai: string) => DS_TRANG_THAI.find(t => t.value === trangThai)?.color ?? "default";

interface BoLocDaApDung {
    bepAnId?: number;
    nhaThauId?: number;
    phongBanId?: number;
    trangThai?: string;
    tuNgay?: string;
    denNgay?: string;
    tuKhoa?: string;
    chiCuaToi?: boolean;
    page: number;
    pageSize: number;
}

const BO_LOC_MAC_DINH: BoLocDaApDung = { page: 1, pageSize: 10 };

const Phieu1DanhSachPage: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    // Nhà thầu chỉ xem/lọc được đúng nhà thầu của chính mình (backend cũng đã
    // ép lọc theo claim nha_thau_id, xem Phieu1Controller/GetNhaThauId()).
    const laTaiKhoanNhaThau = !!authV2.nguoiDung?.nhaThauId;

    // Admin xóa được phiếu NGAY TỪ DANH SÁCH, ở BẤT KỲ trạng thái nào (khác
    // nút "Xóa phiếu" ở trang chi tiết chỉ cho phiếu Nháp) — backend cũng tự
    // dọn dẹp dữ liệu luồng ký (ChuKyPhieu) liên quan, xem Phieu1Service.XoaAsync.
    const laAdmin = !!authV2.nguoiDung?.laAdmin;
    const [xoaPhieu1] = useXoaPhieu1Mutation();

    const xuLyXoaPhieu = async (id: number) => {
        try {
            await xoaPhieu1(id).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã xóa phiếu kiểm tra", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Xóa phiếu thất bại", messageNotify: "" }));
        }
    };

    // Ô nhập (draft) — chỉ áp dụng thật (gọi API) khi bấm "Tìm", tránh gọi
    // API liên tục khi đang gõ/chọn dở — kể cả các Select vốn trước đây lọc
    // ngay khi đổi, nay đồng bộ chung 1 kiểu tương tác với các trường mới.
    const [nhapBepAnId, setNhapBepAnId] = useState<number | undefined>(undefined);
    const [nhapNhaThauId, setNhapNhaThauId] = useState<number | undefined>(undefined);
    const [nhapPhongBanId, setNhapPhongBanId] = useState<number | undefined>(undefined);
    const [nhapTrangThai, setNhapTrangThai] = useState<string | undefined>(undefined);
    const [nhapTuKhoa, setNhapTuKhoa] = useState("");
    const [nhapKhoangNgay, setNhapKhoangNgay] = useState<[Dayjs | null, Dayjs | null] | null>(null);
    const [nhapChiCuaToi, setNhapChiCuaToi] = useState(false);

    // Bộ lọc ĐÃ ÁP DỤNG — truyền thẳng vào query, chỉ đổi khi bấm "Tìm" hoặc
    // đổi trang.
    const [boLoc, setBoLoc] = useState<BoLocDaApDung>(BO_LOC_MAC_DINH);

    const xuLyTim = () => {
        setBoLoc({
            bepAnId: nhapBepAnId,
            nhaThauId: nhapNhaThauId,
            phongBanId: nhapPhongBanId,
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
    const { data, isFetching } = useDanhSachPhieu1Query({
        ...boLoc,
        nhaThauId: laTaiKhoanNhaThau ? authV2.nguoiDung?.nhaThauId : boLoc.nhaThauId,
    }, { refetchOnMountOrArgChange: true });
    const danhSachPhieu = data?.items ?? [];
    const { data: danhSachBepAn = [] } = useDanhSachBepAnQuery();
    const { data: danhSachNhaThau = [] } = useDanhSachNhaThauQuery();
    const { data: danhSachPhongBan = [] } = useDanhSachPhongBanQuery();

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        }
    }, []);

    if (!authV2.isAuthenticated) {
        return null;
    }

    const tenBepAn = (id: number) => danhSachBepAn.find(b => b.id === id)?.ten ?? "";
    const tenNhaThau = (id: number) => danhSachNhaThau.find(nt => nt.id === id)?.ten ?? "";
    const tenPhongBan = (id: number) => danhSachPhongBan.find(pb => pb.id === id)?.ten ?? "";

    const columns: TableColumnsType<Phieu1Model> = [
        {
            title: 'Số hiệu',
            dataIndex: 'soHieu',
            key: 'soHieu',
            width: 400,
            render: (soHieu, record) => <Link to={`/phieu1/${record.id}`} className="text-[#004aad] font-medium">{soHieu}</Link>,
        },
        {
            title: 'Ngày kiểm tra',
            dataIndex: 'ngayKiemTra',
            key: 'ngayKiemTra',
            width: 140,
            render: (ngay) => new Date(ngay).toLocaleDateString("vi-VN"),
            sorter: { compare: (a, b) => a.ngayKiemTra.localeCompare(b.ngayKiemTra) },
        },
        {
            title: 'Bếp ăn',
            dataIndex: 'bepAnId',
            key: 'bepAnId',
            width: 220,
            render: (id) => tenBepAn(id),
        },
        {
            title: 'Nhà thầu',
            dataIndex: 'nhaThauId',
            key: 'nhaThauId',
            width: 300,
            render: (id) => tenNhaThau(id),
        },
        {
            title: 'Phòng ban lập phiếu',
            dataIndex: 'phongBanId',
            key: 'phongBanId',
            width: 300,
            render: (id) => tenPhongBan(id),
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
            render: (_: unknown, record: Phieu1Model) => (
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
                     icon={<FaClipboardCheck />}
                     title="Phiếu kiểm tra công tác VSATTP"
                     actionLabel={laTaiKhoanNhaThau ? undefined : "Lập phiếu mới"}
                     onAction={laTaiKhoanNhaThau ? undefined : () => navigator("/phieu1/moi")}
                 />

        <div className="flex flex-wrap items-end gap-3 mb-4">
            <div className="w-full sm:w-[220px]">
                <div className="mb-1 text-xs font-medium">Số hiệu</div>
                <Input
                    allowClear
                    placeholder="Tìm theo số hiệu..."
                    prefix={<FaSearch className="text-gray-400" />}
                    value={nhapTuKhoa}
                    onChange={(e) => setNhapTuKhoa(e.target.value)}
                    onPressEnter={xuLyTim}
                />
            </div>
            <div className="w-full sm:w-[240px]">
                <div className="mb-1 text-xs font-medium">Bếp ăn</div>
                <Select
                    className="w-full"
                    allowClear
                    placeholder="-- Tất cả bếp ăn --"
                    showSearch
                    optionFilterProp="children"
                    value={nhapBepAnId}
                    onChange={(value) => setNhapBepAnId(value)}
                >
                    {danhSachBepAn.map(b => (
                        <Select.Option key={b.id} value={b.id}>{b.ten}</Select.Option>
                    ))}
                </Select>
            </div>
            {!laTaiKhoanNhaThau && (
                <div className="w-full sm:w-[220px]">
                    <div className="mb-1 text-xs font-medium">Nhà thầu</div>
                    <Select
                        className="w-full"
                        allowClear
                        placeholder="-- Tất cả nhà thầu --"
                        showSearch
                        optionFilterProp="children"
                        value={nhapNhaThauId}
                        onChange={(value) => setNhapNhaThauId(value)}
                    >
                        {danhSachNhaThau.map(nt => (
                            <Select.Option key={nt.id} value={nt.id}>{nt.ten}</Select.Option>
                        ))}
                    </Select>
                </div>
            )}
            <div className="w-full sm:w-[220px]">
                <div className="mb-1 text-xs font-medium">Phòng ban</div>
                <Select
                    className="w-full"
                    allowClear
                    placeholder="-- Tất cả phòng ban --"
                    value={nhapPhongBanId}
                    onChange={(value) => setNhapPhongBanId(value)}
                >
                    {danhSachPhongBan.map(pb => (
                        <Select.Option key={pb.id} value={pb.id}>{pb.ten}</Select.Option>
                    ))}
                </Select>
            </div>
            <div className="w-full sm:w-[200px]">
                <div className="mb-1 text-xs font-medium">Trạng thái</div>
                <Select
                    className="w-full"
                    allowClear
                    placeholder="-- Tất cả trạng thái --"
                    value={nhapTrangThai}
                    onChange={(value) => setNhapTrangThai(value)}
                >
                    {/* Nhà thầu không thấy phiếu Nháp/Bị từ chối — backend cũng đã
                        ép lọc, đây chỉ là để không hiện lựa chọn vô nghĩa. Tương
                        tự, tài khoản nội bộ không phải Admin chỉ thấy phiếu
                        Nháp/Chờ ký/Bị từ chối của ĐÚNG phòng ban mình (phòng ban
                        khác chỉ thấy khi Đã duyệt) — backend ép lọc ở
                        Phieu1Service.DanhSachAsync, FE không cần chặn thêm ở đây
                        vì user vẫn hợp lệ khi chọn lọc theo phòng ban mình. */}
                    {DS_TRANG_THAI
                        .filter(t => !laTaiKhoanNhaThau || t.value === "CHO_KY" || t.value === "DA_DUYET")
                        .map(t => (
                            <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
                        ))}
                </Select>
            </div>
            <div className="w-full sm:w-[260px]">
                <div className="mb-1 text-xs font-medium">Khoảng ngày kiểm tra</div>
                <RangePicker
                    className="w-full"
                    format="DD/MM/YYYY"
                    value={nhapKhoangNgay}
                    onChange={(v) => setNhapKhoangNgay(v as [Dayjs | null, Dayjs | null] | null)}
                />
            </div>
            {!laTaiKhoanNhaThau && (
                <div className="pb-1.5">
                    <Checkbox checked={nhapChiCuaToi} onChange={(e) => setNhapChiCuaToi(e.target.checked)}>
                        Chỉ phiếu tôi lập
                    </Checkbox>
                </div>
            )}
            <Button type="primary" icon={<FaSearch />} onClick={xuLyTim}>
                Tìm
            </Button>
        </div>

        <Table
            rowKey="id"
            loading={isFetching}
            columns={columns}
            dataSource={danhSachPhieu}
            scroll={{ x: 2000 }}
            pagination={{
                current: boLoc.page,
                pageSize: boLoc.pageSize,
                total: data?.totalCount ?? 0,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} phiếu`,
                onChange: (page, pageSize) => setBoLoc(prev => ({ ...prev, page, pageSize })),
            }}
        />
    </LayoutV2Component>;
};

export default Phieu1DanhSachPage;
