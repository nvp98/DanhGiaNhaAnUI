import { Button, Checkbox, DatePicker, Input, Modal, Popconfirm, Select, Table, TableColumnsType, Tag } from "antd";
import { Dayjs } from "dayjs";
import React, { useEffect, useState } from "react";
import { FaSearch, FaTable, FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import LayoutV2Component from "../../components/LayoutV2Component";
import { mauTrangThaiPhieu, tenTrangThaiPhieu, DS_TRANG_THAI_PHIEU, PhieuFilterBar, PhieuListHeader } from "../../components/phieu";
import NhaThauModel from "../../models/NhaThauModel";
import Phieu4Model from "../../models/Phieu4Model";
import { useDanhSachNhaThauQuery } from "../../services/nhaThauApiV2";
import { locDanhMucChon, tenOptionDanhMuc } from "../../utils/danhMucHoatDong";
import { useDanhSachPhieu4Query, useThemPhieu4Mutation, useXoaPhieu4Mutation } from "../../services/phieu4Api";
import { setNotify } from "../../store/notifycationSlide";
import { RootType } from "../../store/types";

const { RangePicker } = DatePicker;

interface BoLocDaApDung {
    trangThai?: string;
    tuNgay?: string;
    denNgay?: string;
    tuKhoa?: string;
    chiCuaToi?: boolean;
    page: number;
    pageSize: number;
}

const BO_LOC_MAC_DINH: BoLocDaApDung = { page: 1, pageSize: 10 };

const Phieu4DanhSachPage: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    const [nhapTrangThai, setNhapTrangThai] = useState<string | undefined>(undefined);
    const [nhapTuKhoa, setNhapTuKhoa] = useState("");
    const [nhapKhoangNgay, setNhapKhoangNgay] = useState<[Dayjs | null, Dayjs | null] | null>(null);
    const [nhapChiCuaToi, setNhapChiCuaToi] = useState(false);

    const [boLoc, setBoLoc] = useState<BoLocDaApDung>(BO_LOC_MAC_DINH);

    const xuLyTim = () => {
        setBoLoc({
            trangThai: nhapTrangThai,
            tuNgay: nhapKhoangNgay?.[0]?.format("YYYY-MM-DD"),
            denNgay: nhapKhoangNgay?.[1]?.format("YYYY-MM-DD"),
            tuKhoa: nhapTuKhoa.trim() || undefined,
            chiCuaToi: nhapChiCuaToi,
            page: 1,
            pageSize: boLoc.pageSize,
        });
    };

    const { data, isFetching } = useDanhSachPhieu4Query(boLoc);
    const danhSachPhieu = data?.items ?? [];
    const { data: danhSachNhaThau = [] } = useDanhSachNhaThauQuery();

    // Popup "Lập phiếu mới" — gọn ngay trên trang danh sách: chọn nhà thầu
    // (cột trong bảng) + khoảng ngày lập phiếu (CỐ ĐỊNH suốt vòng đời phiếu,
    // xem Phieu4Service.ThemAsync) — mỗi cột nhà thầu khai báo đoạn thời
    // gian/địa điểm riêng ở trang chi tiết sau khi tạo, nhưng phải nằm TRONG
    // khoảng ngày này (xem DoanBuilder ngayToiThieu/ngayToiDa ở Phieu4FormPage.tsx).
    const [moPopupTaoMoi, setMoPopupTaoMoi] = useState(false);
    const [moNhaThauIds, setMoNhaThauIds] = useState<number[]>([]);
    const [moKhoangNgay, setMoKhoangNgay] = useState<[Dayjs | null, Dayjs | null] | null>(null);
    const [themPhieu4, { isLoading: dangTao }] = useThemPhieu4Mutation();

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        }
    }, []);

    if (!authV2.isAuthenticated) {
        return null;
    }

    // Phiếu 4 chặn 403 hoàn toàn với tài khoản nhà thầu (mọi action, xem
    // Phieu4Controller.ChanTaiKhoanNhaThau) — ẩn luôn nút tạo phiếu để nhất
    // quán, dù thực tế trang này cũng không tải được dữ liệu cho nhà thầu.
    const laTaiKhoanNhaThau = !!authV2.nguoiDung?.nhaThauId;

    // Admin xóa được phiếu NGAY TỪ DANH SÁCH, ở BẤT KỲ trạng thái nào (khác
    // nút "Xóa phiếu" ở trang chi tiết chỉ cho phiếu Nháp) — backend cũng tự
    // dọn dẹp dữ liệu luồng ký (ChuKyPhieu) liên quan, xem Phieu4Service.XoaAsync.
    const laAdmin = !!authV2.nguoiDung?.laAdmin;
    const [xoaPhieu4] = useXoaPhieu4Mutation();

    const xuLyXoaPhieu = async (id: number) => {
        try {
            await xoaPhieu4(id).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã xóa phiếu tổng hợp", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Xóa phiếu thất bại", messageNotify: "" }));
        }
    };

    const xuLyTaoMoi = async () => {
        if (moNhaThauIds.length === 0) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: "Vui lòng chọn ít nhất 1 nhà thầu", messageNotify: "" }));
            return;
        }
        if (!moKhoangNgay?.[0] || !moKhoangNgay?.[1]) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: "Vui lòng chọn khoảng ngày lập phiếu", messageNotify: "" }));
            return;
        }
        try {
            const ketQua = await themPhieu4({
                tuNgay: moKhoangNgay[0].format("YYYY-MM-DD"),
                denNgay: moKhoangNgay[1].format("YYYY-MM-DD"),
                nhaThau: moNhaThauIds.map((nhaThauId) => ({ nhaThauId, doan: [] })),
            }).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã lập phiếu tổng hợp — vào chi tiết phiếu để khai báo đoạn thời gian/địa điểm cho từng nhà thầu", messageNotify: "" }));
            setMoPopupTaoMoi(false);
            navigator(`/phieu4/${ketQua.phieu.id}`);
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Lập phiếu thất bại", messageNotify: "" }));
        }
    };

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
        ...(laAdmin ? [{
            title: 'Thao tác',
            key: 'thaoTac',
            width: 90,
            fixed: 'right' as const,
            render: (_: unknown, record: Phieu4Model) => (
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
            icon={<FaTable />}
            title="Bảng tổng hợp đánh giá & phân bổ suất ăn"
            actionLabel={laTaiKhoanNhaThau ? undefined : "Lập phiếu mới"}
            onAction={laTaiKhoanNhaThau ? undefined : () => {
                setMoNhaThauIds([]);
                setMoKhoangNgay(null);
                setMoPopupTaoMoi(true);
            }}
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
            <Select
                className="w-full sm:w-[200px]"
                allowClear
                placeholder="-- Lọc theo trạng thái --"
                value={nhapTrangThai}
                onChange={(value) => setNhapTrangThai(value)}
            >
                {DS_TRANG_THAI_PHIEU.map(t => (
                    <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
                ))}
            </Select>
            <RangePicker
                className="w-full sm:w-[260px]"
                format="DD/MM/YYYY"
                placeholder={["Từ ngày", "Đến ngày"]}
                value={nhapKhoangNgay}
                onChange={(v) => setNhapKhoangNgay(v as [Dayjs | null, Dayjs | null] | null)}
            />
            <Checkbox checked={nhapChiCuaToi} onChange={(e) => setNhapChiCuaToi(e.target.checked)}>
                Chỉ phiếu tôi lập
            </Checkbox>
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
                scroll={{ x: 800 }}
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

        <Modal
            title="Lập phiếu mới"
            open={moPopupTaoMoi}
            onCancel={() => setMoPopupTaoMoi(false)}
            width={460}
            footer={[
                <Button key="cancel" onClick={() => setMoPopupTaoMoi(false)}>Hủy</Button>,
                <Button key="tao" type="primary" loading={dangTao} onClick={xuLyTaoMoi}>Lập phiếu</Button>,
            ]}
        >
            <div className="flex flex-col gap-3 mt-2">
                <div>
                    <div className="mb-1 text-xs font-medium">Khoảng ngày lập phiếu</div>
                    <RangePicker
                        className="w-full"
                        format="DD/MM/YYYY"
                        value={moKhoangNgay}
                        onChange={v => setMoKhoangNgay(v)}
                    />
                </div>
                <div>
                    <div className="mb-1 text-xs font-medium">Nhà thầu (cột trong bảng)</div>
                    <Select
                        className="w-full"
                        mode="multiple"
                        placeholder="-- Chọn các nhà thầu --"
                        showSearch
                        optionFilterProp="children"
                        value={moNhaThauIds}
                        onChange={v => setMoNhaThauIds(v)}
                    >
                        {locDanhMucChon(danhSachNhaThau, moNhaThauIds).map((nt: NhaThauModel) => (
                            <Select.Option key={nt.id} value={nt.id}>{tenOptionDanhMuc(nt)}</Select.Option>
                        ))}
                    </Select>
                </div>
                <div className="text-xs text-gray-400">
                    Khai báo đoạn thời gian & địa điểm phụ trách của từng nhà thầu ở trang chi tiết sau khi lập phiếu — chỉ chọn được trong khoảng ngày lập phiếu ở trên.
                </div>
            </div>
        </Modal>
    </LayoutV2Component>;
};

export default Phieu4DanhSachPage;
