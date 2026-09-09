import { Button, DatePicker, Modal, Select, Table, TableColumnsType, Tag } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { FaTable } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import LayoutV2Component from "../../components/LayoutV2Component";
import { mauTrangThaiPhieu, tenTrangThaiPhieu, DS_TRANG_THAI_PHIEU, PhieuFilterBar, PhieuListHeader } from "../../components/phieu";
import NhaThauModel from "../../models/NhaThauModel";
import Phieu4Model from "../../models/Phieu4Model";
import { useDanhSachNhaThauQuery } from "../../services/nhaThauApiV2";
import { useDanhSachPhieu4Query, useThemPhieu4Mutation } from "../../services/phieu4Api";
import { setNotify } from "../../store/notifycationSlide";
import { RootType } from "../../store/types";

const Phieu4DanhSachPage: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    const [locTrangThai, setLocTrangThai] = useState<string | undefined>(undefined);

    const { data: danhSachPhieu = [], isFetching } = useDanhSachPhieu4Query({
        trangThai: locTrangThai,
    });
    const { data: danhSachNhaThau = [] } = useDanhSachNhaThauQuery();

    // Popup "Lập phiếu mới" — gọn ngay trên trang danh sách thay vì chuyển
    // sang /phieu4/moi (trang riêng chỉ để nhập đúng 3 trường này).
    const [moPopupTaoMoi, setMoPopupTaoMoi] = useState(false);
    const [moTuNgay, setMoTuNgay] = useState<dayjs.Dayjs | null>(dayjs().startOf("month"));
    const [moDenNgay, setMoDenNgay] = useState<dayjs.Dayjs | null>(dayjs().endOf("month"));
    const [moNhaThauIds, setMoNhaThauIds] = useState<number[]>([]);
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

    const xuLyTaoMoi = async () => {
        if (moNhaThauIds.length === 0) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: "Vui lòng chọn ít nhất 1 nhà thầu", messageNotify: "" }));
            return;
        }
        if (!moTuNgay || !moDenNgay) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: "Vui lòng chọn khoảng ngày", messageNotify: "" }));
            return;
        }
        try {
            const ketQua = await themPhieu4({
                tuNgay: moTuNgay.format("YYYY-MM-DD"),
                denNgay: moDenNgay.format("YYYY-MM-DD"),
                nhaThauIds: moNhaThauIds,
            }).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã lập phiếu tổng hợp", messageNotify: "" }));
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
    ];

    return <LayoutV2Component>
        <PhieuListHeader
            icon={<FaTable />}
            title="Bảng tổng hợp đánh giá & phân bổ suất ăn"
            actionLabel={laTaiKhoanNhaThau ? undefined : "Lập phiếu mới"}
            onAction={laTaiKhoanNhaThau ? undefined : () => {
                setMoTuNgay(dayjs().startOf("month"));
                setMoDenNgay(dayjs().endOf("month"));
                setMoNhaThauIds([]);
                setMoPopupTaoMoi(true);
            }}
        />

        <PhieuFilterBar>
            <Select
                className="w-full sm:w-[200px]"
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
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <div className="mb-1 text-xs font-medium">Từ ngày</div>
                        <DatePicker className="w-full" format="DD/MM/YYYY" value={moTuNgay} onChange={v => setMoTuNgay(v)} />
                    </div>
                    <div>
                        <div className="mb-1 text-xs font-medium">Đến ngày</div>
                        <DatePicker className="w-full" format="DD/MM/YYYY" value={moDenNgay} onChange={v => setMoDenNgay(v)} />
                    </div>
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
                        {danhSachNhaThau.map((nt: NhaThauModel) => (
                            <Select.Option key={nt.id} value={nt.id}>{nt.ten}</Select.Option>
                        ))}
                    </Select>
                </div>
            </div>
        </Modal>
    </LayoutV2Component>;
};

export default Phieu4DanhSachPage;
