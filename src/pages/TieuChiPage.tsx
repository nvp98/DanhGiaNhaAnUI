import { Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, TableColumnsType, Tag } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { FiEdit2 } from "react-icons/fi";
import { IoSearchOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import LayoutV2Component from "../components/LayoutV2Component";
import { DS_LOAI_PHIEU } from "./NhomTieuChiPage";
import TieuChiModel from "../models/TieuChiModel";
import { useDanhSachNhomTieuChiQuery } from "../services/nhomTieuChiApi";
import { useDanhSachTieuChiQuery, useSuaTieuChiMutation, useThemTieuChiMutation, useXoaTieuChiMutation } from "../services/tieuChiApi";
import { setNotify } from "../store/notifycationSlide";
import { RootType } from "../store/types";
import { coQuyen, MA_QUYEN } from "../utils/quyenV2";
import { locDanhMucChon, tenOptionDanhMuc } from "../utils/danhMucHoatDong";

const TieuChiPage: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    const [locLoaiPhieu, setLocLoaiPhieu] = useState<string | undefined>("PHIEU1");
    const [locNhomId, setLocNhomId] = useState<number | undefined>(undefined);

    const { data: danhSachNhom = [] } = useDanhSachNhomTieuChiQuery({ loaiPhieu: locLoaiPhieu });
    const { data: danhSachTieuChi = [], isFetching } = useDanhSachTieuChiQuery({ nhomId: locNhomId });
    const [themTieuChi, { isLoading: dangThem }] = useThemTieuChiMutation();
    const [suaTieuChi, { isLoading: dangSuaLoading }] = useSuaTieuChiMutation();
    const [xoaTieuChi] = useXoaTieuChiMutation();

    const [moModal, setMoModal] = useState(false);
    const [dangSua, setDangSua] = useState<TieuChiModel | null>(null);
    const [form] = useForm();
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        } else if (!coQuyen(authV2.nguoiDung, MA_QUYEN.QUAN_LY_TIEU_CHI)) {
            navigator("/v2");
        }
    }, []);

    useEffect(() => {
        // Đổi loại phiếu -> nhóm đang chọn có thể không còn thuộc loại phiếu mới, reset lại filter theo nhóm.
        setLocNhomId(undefined);
    }, [locLoaiPhieu]);

    if (!authV2.isAuthenticated || !coQuyen(authV2.nguoiDung, MA_QUYEN.QUAN_LY_TIEU_CHI)) {
        return null;
    }

    const tenNhom = (nhomId?: number) => danhSachNhom.find(n => n.id === nhomId)?.ten ?? "";

    const moModalThem = () => {
        setDangSua(null);
        form.resetFields();
        form.setFieldsValue({ nhomId: locNhomId, thuTu: 0, macDinh: true, dangHoatDong: true });
        setMoModal(true);
    };

    const moModalSua = (tieuChi: TieuChiModel) => {
        setDangSua(tieuChi);
        form.setFieldsValue({
            nhomId: tieuChi.nhomId,
            noiDung: tieuChi.noiDung,
            thuTu: tieuChi.thuTu,
            macDinh: tieuChi.macDinh,
            dangHoatDong: tieuChi.dangHoatDong,
            dvt: tieuChi.dvt,
            loaiDong: tieuChi.loaiDong,
            congThuc: tieuChi.congThuc,
        });
        setMoModal(true);
    };

    const luuTieuChi = async (values: any) => {
        const payload = {
            nhomId: values.nhomId || undefined,
            noiDung: values.noiDung,
            thuTu: values.thuTu ?? 0,
            macDinh: !!values.macDinh,
            dangHoatDong: !!values.dangHoatDong,
            dvt: locLoaiPhieu === "PHIEU4" ? (values.dvt || undefined) : undefined,
            loaiDong: locLoaiPhieu === "PHIEU4" ? (values.loaiDong || undefined) : undefined,
            congThuc: locLoaiPhieu === "PHIEU4" ? (values.congThuc || undefined) : undefined,
        };

        try {
            if (dangSua) {
                await suaTieuChi({ id: dangSua.id, body: payload }).unwrap();
                dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã cập nhật tiêu chí", messageNotify: "" }));
            } else {
                await themTieuChi(payload).unwrap();
                dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã thêm tiêu chí", messageNotify: "" }));
            }
            setMoModal(false);
        } catch (error: any) {
            dispatch(setNotify({
                typeNotify: "error",
                titleNotify: error?.data?.message || (dangSua ? "Cập nhật tiêu chí thất bại" : "Thêm tiêu chí thất bại"),
                messageNotify: ""
            }));
        }
    };

    const tuKhoa = searchText.trim().toLowerCase();
    const danhSachDaLoc = tuKhoa
        ? danhSachTieuChi.filter(tc => `${tc.noiDung} ${tenNhom(tc.nhomId)}`.toLowerCase().includes(tuKhoa))
        : danhSachTieuChi;

    const xuLyXoaTieuChi = async (id: number) => {
        try {
            await xoaTieuChi(id).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã xóa tiêu chí", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Xóa tiêu chí thất bại", messageNotify: "" }));
        }
    };

    const columns: TableColumnsType<TieuChiModel> = [
        {
            title: 'Thứ tự',
            dataIndex: 'thuTu',
            key: 'thuTu',
            width: 90,
            sorter: { compare: (a, b) => a.thuTu - b.thuTu },
        },
        {
            title: 'Nội dung tiêu chí',
            dataIndex: 'noiDung',
            key: 'noiDung',
        },
        {
            title: 'Nhóm tiêu chí',
            dataIndex: 'nhomId',
            key: 'nhomId',
            width: 220,
            render: (nhomId) => nhomId ? tenNhom(nhomId) : <span className="text-gray-400">--</span>,
        },
        ...(locLoaiPhieu === "PHIEU4" ? [{
            title: 'ĐVT',
            dataIndex: 'dvt',
            key: 'dvt',
            width: 100,
            render: (dvt: string | undefined) => dvt || <span className="text-gray-400">--</span>,
        }] as TableColumnsType<TieuChiModel> : []),
        {
            title: 'Mặc định',
            dataIndex: 'macDinh',
            key: 'macDinh',
            width: 110,
            render: (macDinh) => macDinh ? <Tag color="blue">Mặc định</Tag> : <Tag>Tự thêm</Tag>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'dangHoatDong',
            key: 'dangHoatDong',
            width: 160,
            render: (dangHoatDong) => dangHoatDong ? <Tag color="success">Đang hoạt động</Tag> : <Tag>Ngừng hoạt động</Tag>,
        },
        {
            title: '',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button size="small" icon={<FiEdit2 />} onClick={() => moModalSua(record)} />
                    <Popconfirm
                        title="Xóa tiêu chí"
                        description="Bạn có chắc muốn xóa tiêu chí này?"
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => xuLyXoaTieuChi(record.id)}
                    >
                        <Button size="small" danger icon={<FaTrash />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return <LayoutV2Component>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className="font-bold text-xl text-zinc-700">TIÊU CHÍ ĐÁNH GIÁ (CHECKLIST)</h2>
            <Button type="primary" icon={<FaPlus />} onClick={moModalThem}>
                Thêm tiêu chí
            </Button>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
            <Input
                className="w-full sm:w-[280px]"
                allowClear
                placeholder="Tìm theo nội dung tiêu chí..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<IoSearchOutline className="text-gray-400" />}
            />
            <Select
                className="w-full sm:w-[280px]"
                placeholder="-- Chọn loại phiếu --"
                value={locLoaiPhieu}
                onChange={(value) => setLocLoaiPhieu(value)}
            >
                {DS_LOAI_PHIEU.map(t => (
                    <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
                ))}
            </Select>
            <Select
                className="w-full sm:w-[280px]"
                allowClear
                placeholder="-- Tất cả nhóm tiêu chí --"
                value={locNhomId}
                onChange={(value) => setLocNhomId(value)}
            >
                {danhSachNhom.map(n => (
                    <Select.Option key={n.id} value={n.id}>{n.ten}</Select.Option>
                ))}
            </Select>
        </div>

        <Table
            rowKey="id"
            loading={isFetching}
            columns={columns}
            dataSource={danhSachDaLoc}
            scroll={{ x: 900 }}
        />

        <Modal
            title={dangSua ? "Sửa tiêu chí" : "Thêm tiêu chí"}
            open={moModal}
            onCancel={() => setMoModal(false)}
            onOk={() => form.submit()}
            okButtonProps={{ loading: dangThem || dangSuaLoading }}
            okText="Lưu"
            cancelText="Hủy"
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={luuTieuChi}>
                <Form.Item label="Nhóm tiêu chí" name="nhomId" rules={[{ required: true, message: "Vui lòng chọn nhóm tiêu chí!" }]}>
                    <Select placeholder="-- Chọn nhóm tiêu chí --">
                        {locDanhMucChon(danhSachNhom, dangSua?.nhomId).map(n => (
                            <Select.Option key={n.id} value={n.id}>{tenOptionDanhMuc(n)}</Select.Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item label="Nội dung tiêu chí" name="noiDung" rules={[{ required: true, message: "Vui lòng nhập nội dung tiêu chí!" }]}>
                    <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item label="Thứ tự hiển thị" name="thuTu">
                    <InputNumber className="w-full" min={0} />
                </Form.Item>
                {locLoaiPhieu === "PHIEU4" && (
                    <>
                        <Form.Item label="Đơn vị tính" name="dvt" tooltip="Sinh ra ở cột ĐVT của dòng khi lập phiếu Bảng tổng hợp mới.">
                            <Input placeholder="VD: Suất, Lượt, %, Điểm..." />
                        </Form.Item>
                        <Form.Item label="Loại dòng" name="loaiDong" tooltip="Chỉ mang tính mô tả (Bảng 2-5 nhập tay hoàn toàn) — để trống sẽ mặc định NHAP_TAY.">
                            <Input placeholder="VD: NHAP_TAY" />
                        </Form.Item>
                        <Form.Item label="Công thức (ghi chú)" name="congThuc">
                            <Input placeholder="Không bắt buộc" />
                        </Form.Item>
                    </>
                )}
                <Form.Item label="Là tiêu chí mặc định (không phải dòng tự thêm)" name="macDinh" valuePropName="checked">
                    <Switch />
                </Form.Item>
                <Form.Item label="Đang hoạt động" name="dangHoatDong" valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Form>
        </Modal>
    </LayoutV2Component>;
};

export default TieuChiPage;
