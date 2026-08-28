import { Button, Select, Table, TableColumnsType, Tag } from "antd";
import React, { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import LayoutV2Component from "../../components/LayoutV2Component";
import Phieu1Model from "../../models/Phieu1Model";
import { useDanhSachBepAnQuery } from "../../services/bepAnApiV2";
import { useDanhSachPhieu1Query } from "../../services/phieu1Api";
import { useDanhSachPhongBanQuery } from "../../services/phongBanApiV2";
import { RootType } from "../../store/types";

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
    const [locPhongBanId, setLocPhongBanId] = useState<number | undefined>(undefined);
    const [locTrangThai, setLocTrangThai] = useState<string | undefined>(undefined);

    const { data: danhSachPhieu = [], isFetching } = useDanhSachPhieu1Query({
        bepAnId: locBepAnId,
        phongBanId: locPhongBanId,
        trangThai: locTrangThai,
    });
    const { data: danhSachBepAn = [] } = useDanhSachBepAnQuery();
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
    const tenPhongBan = (id: number) => danhSachPhongBan.find(pb => pb.id === id)?.ten ?? "";

    const columns: TableColumnsType<Phieu1Model> = [
        {
            title: 'Số hiệu',
            dataIndex: 'soHieu',
            key: 'soHieu',
            width: 220,
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
            title: 'Phòng ban lập phiếu',
            dataIndex: 'phongBanId',
            key: 'phongBanId',
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
        <div className="flex justify-between items-center gap-3 mb-6">
            <h2 className="font-bold text-xl text-zinc-700">PHIẾU KIỂM TRA VSATTP</h2>
            <Button type="primary" icon={<FaPlus />} onClick={() => navigator("/phieu1/moi")}>
                Lập phiếu mới
            </Button>
        </div>

        <div className="flex gap-3 mb-4">
            <Select
                className="w-[240px]"
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
            <Select
                className="w-[220px]"
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
                className="w-[200px]"
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
