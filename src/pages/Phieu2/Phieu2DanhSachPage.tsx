import { Select, Table, TableColumnsType, Tag } from "antd";
import React, { useEffect, useState } from "react";
import { FaUtensils } from "react-icons/fa";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import LayoutV2Component from "../../components/LayoutV2Component";
import { mauTrangThaiPhieu, tenTrangThaiPhieu, DS_TRANG_THAI_PHIEU, PhieuFilterBar, PhieuListHeader } from "../../components/phieu";
import Phieu2Model from "../../models/Phieu2Model";
import { useDanhSachBepAnQuery } from "../../services/bepAnApiV2";
import { useDanhSachDiaDiemNhaAnQuery } from "../../services/diaDiemNhaAnApiV2";
import { useDanhSachNhaThauQuery } from "../../services/nhaThauApiV2";
import { useDanhSachPhieu2Query } from "../../services/phieu2Api";
import { RootType } from "../../store/types";

const Phieu2DanhSachPage: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const navigator = useNavigate();

    const [locNhaThauId, setLocNhaThauId] = useState<number | undefined>(undefined);
    const [locBepAnId, setLocBepAnId] = useState<number | undefined>(undefined);
    const [locThang, setLocThang] = useState<number | undefined>(undefined);
    const [locNam, setLocNam] = useState<number | undefined>(undefined);
    const [locTrangThai, setLocTrangThai] = useState<string | undefined>(undefined);

    const { data: danhSachPhieu = [], isFetching } = useDanhSachPhieu2Query({
        nhaThauId: locNhaThauId,
        bepAnId: locBepAnId,
        thang: locThang,
        nam: locNam,
        trangThai: locTrangThai,
    });
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
            render: (id) => tenNhaThau(id),
        },
        {
            title: 'Bếp ăn',
            dataIndex: 'bepAnId',
            key: 'bepAnId',
            render: (id) => tenBepAn(id),
        },
        {
            title: 'Nhà ăn',
            dataIndex: 'nhaAnId',
            key: 'nhaAnId',
            render: (id) => tenNhaAn(id),
        },
        {
            title: 'Địa điểm',
            dataIndex: 'diaDiem',
            key: 'diaDiem',
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
            icon={<FaUtensils />}
            title="Phiếu đánh giá chất lượng dịch vụ suất ăn"
            actionLabel="Lập phiếu mới"
            onAction={() => navigator("/phieu2/moi")}
        />

        <PhieuFilterBar>
            <Select
                className="w-[220px]"
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
            <Select
                className="w-[220px]"
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
                className="w-[140px]"
                allowClear
                placeholder="-- Tháng --"
                value={locThang}
                onChange={(value) => setLocThang(value)}
            >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(t => (
                    <Select.Option key={t} value={t}>Tháng {t}</Select.Option>
                ))}
            </Select>
            <Select
                className="w-[120px]"
                allowClear
                placeholder="-- Năm --"
                value={locNam}
                onChange={(value) => setLocNam(value)}
            >
                {danhSachNam.map(n => (
                    <Select.Option key={n} value={n}>{n}</Select.Option>
                ))}
            </Select>
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
                scroll={{ x: 900 }}
            />
        </div>
    </LayoutV2Component>;
};

export default Phieu2DanhSachPage;
