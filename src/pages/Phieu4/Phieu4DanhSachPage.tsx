import { Select, Table, TableColumnsType, Tag } from "antd";
import React, { useEffect, useState } from "react";
import { FaTable } from "react-icons/fa";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import LayoutV2Component from "../../components/LayoutV2Component";
import { mauTrangThaiPhieu, tenTrangThaiPhieu, DS_TRANG_THAI_PHIEU, PhieuFilterBar, PhieuListHeader } from "../../components/phieu";
import Phieu4Model from "../../models/Phieu4Model";
import { useDanhSachPhieu4Query } from "../../services/phieu4Api";
import { RootType } from "../../store/types";

const Phieu4DanhSachPage: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const navigator = useNavigate();

    const [locTrangThai, setLocTrangThai] = useState<string | undefined>(undefined);

    const { data: danhSachPhieu = [], isFetching } = useDanhSachPhieu4Query({
        trangThai: locTrangThai,
    });

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        }
    }, []);

    if (!authV2.isAuthenticated) {
        return null;
    }

    const columns: TableColumnsType<Phieu4Model> = [
        {
            title: 'Số hiệu',
            dataIndex: 'soHieu',
            key: 'soHieu',
            width: 180,
            render: (soHieu, record) => <Link to={`/phieu4/${record.id}`} className="text-[#004aad] font-medium">{soHieu}</Link>,
        },
        {
            title: 'Từ ngày',
            dataIndex: 'tuNgay',
            key: 'tuNgay',
            width: 120,
            render: (ngay) => new Date(ngay).toLocaleDateString("vi-VN"),
        },
        {
            title: 'Đến ngày',
            dataIndex: 'denNgay',
            key: 'denNgay',
            width: 120,
            render: (ngay) => new Date(ngay).toLocaleDateString("vi-VN"),
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
            icon={<FaTable />}
            title="Bảng tổng hợp đánh giá & phân bổ suất ăn"
            actionLabel="Lập phiếu mới"
            onAction={() => navigator("/phieu4/moi")}
        />

        <PhieuFilterBar>
            <Select
                className="w-[200px]"
                allowClear
                placeholder="-- Lọc theo trạng thái --"
                value={locTrangThai}
                onChange={(value) => setLocTrangThai(value)}
            >
                {DS_TRANG_THAI_PHIEU.map(t => (
                    <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
                ))}
            </Select>
        </PhieuFilterBar>

        <div className="rounded-xl overflow-hidden border border-zinc-100">
            <Table
                rowKey="id"
                loading={isFetching}
                columns={columns}
                dataSource={danhSachPhieu}
                scroll={{ x: 600 }}
            />
        </div>
    </LayoutV2Component>;
};

export default Phieu4DanhSachPage;
