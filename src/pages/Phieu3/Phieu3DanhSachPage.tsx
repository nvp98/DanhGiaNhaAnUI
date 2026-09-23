import { Button, Checkbox, DatePicker, Input, Modal, Popconfirm, Select, Table, TableColumnsType, Tag } from "antd";
import { Dayjs } from "dayjs";
import React, { useEffect, useState } from "react";
import { FaChartBar, FaSearch, FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import LayoutV2Component from "../../components/LayoutV2Component";
import { mauTrangThaiPhieu, tenTrangThaiPhieu, DS_TRANG_THAI_PHIEU, PhieuFilterBar, PhieuListHeader } from "../../components/phieu";
import Phieu3Model from "../../models/Phieu3Model";
import { useDanhSachNhaThauQuery } from "../../services/nhaThauApiV2";
import { locDanhMucChon, tenOptionDanhMuc } from "../../utils/danhMucHoatDong";
import { useDanhSachPhieu3Query, useThemPhieu3Mutation, useXoaPhieu3Mutation } from "../../services/phieu3Api";
import { setNotify } from "../../store/notifycationSlide";
import { RootType } from "../../store/types";

const { RangePicker } = DatePicker;

interface BoLocDaApDung {
    nhaThauId?: number;
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

const Phieu3DanhSachPage: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    const [nhapNhaThauId, setNhapNhaThauId] = useState<number | undefined>(undefined);
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

    // Popup "Lập báo cáo mới" — gọn ngay trên trang danh sách thay vì
    // chuyển sang /phieu3/moi (trang riêng chỉ để nhập đúng 3 trường này).
    const [moPopupTaoMoi, setMoPopupTaoMoi] = useState(false);
    const [moNhaThauId, setMoNhaThauId] = useState<number | undefined>(undefined);
    const [moThang, setMoThang] = useState<number>(new Date().getMonth() + 1);
    const [moNam, setMoNam] = useState<number>(new Date().getFullYear());
    const [themPhieu3, { isLoading: dangTao }] = useThemPhieu3Mutation();

    // Nhà thầu chỉ xem/lọc được đúng nhà thầu của chính mình (Phiếu 3 không
    // có bước nào nhà thầu ký, chỉ xem + gửi ý kiến phản hồi) — backend cũng
    // đã ép lọc theo claim nha_thau_id, xem Phieu3Controller/GetNhaThauId().
    const laTaiKhoanNhaThau = !!authV2.nguoiDung?.nhaThauId;

    // Admin xóa được báo cáo NGAY TỪ DANH SÁCH, ở BẤT KỲ trạng thái nào (khác
    // nút "Xóa phiếu" ở trang chi tiết chỉ cho báo cáo Nháp) — backend cũng tự
    // dọn dẹp dữ liệu luồng ký (ChuKyPhieu) liên quan, xem Phieu3Service.XoaAsync.
    const laAdmin = !!authV2.nguoiDung?.laAdmin;
    const [xoaPhieu3] = useXoaPhieu3Mutation();

    const xuLyXoaPhieu = async (id: number) => {
        try {
            await xoaPhieu3(id).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã xóa báo cáo", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Xóa báo cáo thất bại", messageNotify: "" }));
        }
    };

    const { data, isFetching } = useDanhSachPhieu3Query({
        ...boLoc,
        nhaThauId: laTaiKhoanNhaThau ? authV2.nguoiDung?.nhaThauId : boLoc.nhaThauId,
    });
    const danhSachPhieu = data?.items ?? [];
    const { data: danhSachNhaThau = [] } = useDanhSachNhaThauQuery();

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        }
    }, []);

    if (!authV2.isAuthenticated) {
        return null;
    }

    const xuLyTaoMoi = async () => {
        if (!moNhaThauId) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: "Vui lòng chọn nhà thầu", messageNotify: "" }));
            return;
        }
        try {
            const ketQua = await themPhieu3({ thang: moThang, nam: moNam, nhaThauId: moNhaThauId, doan: [] }).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã lập báo cáo — vào chi tiết báo cáo để khai báo đoạn thời gian/địa điểm phụ trách", messageNotify: "" }));
            setMoPopupTaoMoi(false);
            navigator(`/phieu3/${ketQua.phieu.id}`);
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Lập báo cáo thất bại", messageNotify: "" }));
        }
    };

    const tenNhaThau = (id: number) => danhSachNhaThau.find(nt => nt.id === id)?.ten ?? "";

    const danhSachNam = Array.from(
        new Set([new Date().getFullYear(), ...danhSachPhieu.map(p => p.nam)])
    ).sort((a, b) => b - a);

    const columns: TableColumnsType<Phieu3Model> = [
        {
            title: 'Số hiệu',
            dataIndex: 'soHieu',
            key: 'soHieu',
            width: 220,
            render: (soHieu, record) => <Link to={`/phieu3/${record.id}`} className="text-[#004aad] font-medium">{soHieu}</Link>,
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
            render: (_: unknown, record: Phieu3Model) => (
                <Popconfirm
                    title="Xóa báo cáo"
                    description="Admin xóa báo cáo này (kèm dữ liệu luồng ký liên quan)?"
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
            icon={<FaChartBar />}
            title="Báo cáo chất lượng dịch vụ suất ăn (theo tháng)"
            actionLabel={laTaiKhoanNhaThau ? undefined : "Lập báo cáo mới"}
            onAction={laTaiKhoanNhaThau ? undefined : () => {
                setMoNhaThauId(undefined);
                setMoThang(new Date().getMonth() + 1);
                setMoNam(new Date().getFullYear());
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
                {DS_TRANG_THAI_PHIEU.map(t => (
                    <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
                ))}
            </Select>
            {/* Phiếu 3 là báo cáo THEO THÁNG, không có ngày kiểm tra cụ thể —
                lọc theo NGÀY TẠO báo cáo (xem Phieu3Service.DanhSachAsync). */}
            <RangePicker
                className="w-full sm:w-[260px]"
                format="DD/MM/YYYY"
                placeholder={["Từ ngày tạo", "Đến ngày tạo"]}
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
                scroll={{ x: 900 }}
                pagination={{
                    current: boLoc.page,
                    pageSize: boLoc.pageSize,
                    total: data?.totalCount ?? 0,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng ${total} báo cáo`,
                    onChange: (page, pageSize) => setBoLoc(prev => ({ ...prev, page, pageSize })),
                }}
            />
        </div>

        <Modal
            title="Lập báo cáo mới"
            open={moPopupTaoMoi}
            onCancel={() => setMoPopupTaoMoi(false)}
            width={420}
            footer={[
                <Button key="cancel" onClick={() => setMoPopupTaoMoi(false)}>Hủy</Button>,
                <Button key="tao" type="primary" loading={dangTao} onClick={xuLyTaoMoi}>Lập báo cáo</Button>,
            ]}
        >
            <div className="flex flex-col gap-3 mt-2">
                <div>
                    <div className="mb-1 text-xs font-medium">Nhà thầu</div>
                    <Select
                        className="w-full"
                        placeholder="-- Chọn nhà thầu --"
                        showSearch
                        optionFilterProp="children"
                        value={moNhaThauId}
                        onChange={v => setMoNhaThauId(v)}
                    >
                        {locDanhMucChon(danhSachNhaThau, moNhaThauId).map(nt => (
                            <Select.Option key={nt.id} value={nt.id}>{tenOptionDanhMuc(nt)}</Select.Option>
                        ))}
                    </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <div className="mb-1 text-xs font-medium">Tháng</div>
                        <Select className="w-full" value={moThang} onChange={v => setMoThang(v)}>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(t => (
                                <Select.Option key={t} value={t}>Tháng {t}</Select.Option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <div className="mb-1 text-xs font-medium">Năm</div>
                        <Select className="w-full" value={moNam} onChange={v => setMoNam(v)}>
                            {[moNam - 1, moNam, moNam + 1].map(n => (
                                <Select.Option key={n} value={n}>{n}</Select.Option>
                            ))}
                        </Select>
                    </div>
                </div>
            </div>
        </Modal>
    </LayoutV2Component>;
};

export default Phieu3DanhSachPage;
