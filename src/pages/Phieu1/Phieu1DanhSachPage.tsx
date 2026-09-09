import { Select, Table, TableColumnsType, Tag } from "antd";
import React, { useEffect, useState } from "react";
import { FaClipboardCheck } from "react-icons/fa";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import LayoutV2Component from "../../components/LayoutV2Component";
import Phieu1Model from "../../models/Phieu1Model";
import { useDanhSachBepAnQuery } from "../../services/bepAnApiV2";
import { useDanhSachNhaThauQuery } from "../../services/nhaThauApiV2";
import { useDanhSachPhieu1Query } from "../../services/phieu1Api";
import { useDanhSachPhongBanQuery } from "../../services/phongBanApiV2";
import { RootType } from "../../store/types";
import { PhieuListHeader } from "../../components/phieu";

const DS_TRANG_THAI = [
    { value: "NHAP", label: "Nháp", color: "default" },
    { value: "CHO_KY", label: "Chờ ký", color: "processing" },
    { value: "DA_DUYET", label: "Đã duyệt", color: "success" },
    { value: "TU_CHOI", label: "Bị từ chối", color: "error" },
];

export const tenTrangThaiPhieu = (trangThai: string) => DS_TRANG_THAI.find(t => t.value === trangThai)?.label ?? trangThai;
export const mauTrangThaiPhieu = (trangThai: string) => DS_TRANG_THAI.find(t => t.value === trangThai)?.color ?? "default";

const Phieu1DanhSachPage: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const navigator = useNavigate();

    const [locBepAnId, setLocBepAnId] = useState<number | undefined>(undefined);
    const [locNhaThauId, setLocNhaThauId] = useState<number | undefined>(undefined);
    const [locPhongBanId, setLocPhongBanId] = useState<number | undefined>(undefined);
    const [locTrangThai, setLocTrangThai] = useState<string | undefined>(undefined);

    // Nhà thầu chỉ xem/lọc được đúng nhà thầu của chính mình (backend cũng đã
    // ép lọc theo claim nha_thau_id, xem Phieu1Controller/GetNhaThauId()).
    const laTaiKhoanNhaThau = !!authV2.nguoiDung?.nhaThauId;

    const { data: danhSachPhieu = [], isFetching } = useDanhSachPhieu1Query({
        bepAnId: locBepAnId,
        nhaThauId: laTaiKhoanNhaThau ? authV2.nguoiDung?.nhaThauId : locNhaThauId,
        phongBanId: locPhongBanId,
        trangThai: locTrangThai,
    });
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
    ];

    return <LayoutV2Component>
         <PhieuListHeader
                     icon={<FaClipboardCheck />}
                     title="Phiếu kiểm tra công tác VSATTP"
                     actionLabel={laTaiKhoanNhaThau ? undefined : "Lập phiếu mới"}
                     onAction={laTaiKhoanNhaThau ? undefined : () => navigator("/phieu1/moi")}
                 />

        <div className="flex flex-wrap gap-3 mb-4">
            <Select
                className="w-full sm:w-[240px]"
                allowClear
                placeholder="-- Lọc theo bếp ăn --"
                showSearch
                optionFilterProp="children"
                value={locBepAnId}
                onChange={(value) => setLocBepAnId(value)}
            >
                {danhSachBepAn.map(b => (
                    <Select.Option key={b.id} value={b.id}>{b.ten}</Select.Option>
                ))}
            </Select>
            {!laTaiKhoanNhaThau && (
                <Select
                    className="w-full sm:w-[220px]"
                    allowClear
                    placeholder="-- Lọc theo nhà thầu --"
                    showSearch
                    optionFilterProp="children"
                    value={locNhaThauId}
                    onChange={(value) => setLocNhaThauId(value)}
                >
                    {danhSachNhaThau.map(nt => (
                        <Select.Option key={nt.id} value={nt.id}>{nt.ten}</Select.Option>
                    ))}
                </Select>
            )}
            <Select
                className="w-full sm:w-[220px]"
                allowClear
                placeholder="-- Lọc theo phòng ban --"
                value={locPhongBanId}
                onChange={(value) => setLocPhongBanId(value)}
            >
                {danhSachPhongBan.map(pb => (
                    <Select.Option key={pb.id} value={pb.id}>{pb.ten}</Select.Option>
                ))}
            </Select>
            <Select
                className="w-full sm:w-[200px]"
                allowClear
                placeholder="-- Lọc theo trạng thái --"
                value={locTrangThai}
                onChange={(value) => setLocTrangThai(value)}
            >
                {DS_TRANG_THAI.map(t => (
                    <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
                ))}
            </Select>
        </div>

        <Table
            rowKey="id"
            loading={isFetching}
            columns={columns}
            dataSource={danhSachPhieu}
            scroll={{ x: 900 }}
        />
    </LayoutV2Component>;
};

export default Phieu1DanhSachPage;
