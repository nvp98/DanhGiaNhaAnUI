import { Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, TableColumnsType, Tag } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { FiEdit2 } from "react-icons/fi";
import { IoSearchOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import LayoutV2Component from "../components/LayoutV2Component";
import NhomTieuChiModel from "../models/NhomTieuChiModel";
import { useDanhSachNhomTieuChiQuery, useSuaNhomTieuChiMutation, useThemNhomTieuChiMutation, useXoaNhomTieuChiMutation } from "../services/nhomTieuChiApi";
import { setNotify } from "../store/notifycationSlide";
import { RootType } from "../store/types";
import { coQuyen, MA_QUYEN } from "../utils/quyenV2";

export const DS_LOAI_PHIEU = [
    { value: "PHIEU1", label: "Phiếu 1 - Kiểm tra VSATTP" },
    { value: "PHIEU2", label: "Phiếu 2 - Đánh giá dịch vụ suất ăn" },
    { value: "PHIEU3", label: "Phiếu 3 - Báo cáo tháng" },
    { value: "PHIEU4", label: "Phiếu 4 - Tổng hợp phân bổ" },
];

export const tenLoaiPhieu = (loaiPhieu: string) => DS_LOAI_PHIEU.find(t => t.value === loaiPhieu)?.label ?? loaiPhieu;

const NhomTieuChiPage: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    const [locLoaiPhieu, setLocLoaiPhieu] = useState<string | undefined>("PHIEU1");

    const { data: danhSachNhom = [], isFetching } = useDanhSachNhomTieuChiQuery({ loaiPhieu: locLoaiPhieu });
    const [themNhomTieuChi, { isLoading: dangThem }] = useThemNhomTieuChiMutation();
    const [suaNhomTieuChi, { isLoading: dangSuaLoading }] = useSuaNhomTieuChiMutation();
    const [xoaNhomTieuChi] = useXoaNhomTieuChiMutation();

    const [moModal, setMoModal] = useState(false);
    const [dangSua, setDangSua] = useState<NhomTieuChiModel | null>(null);
    const [form] = useForm();
    const loaiPhieuDangChon = Form.useWatch("loaiPhieu", form);
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        } else if (!coQuyen(authV2.nguoiDung, MA_QUYEN.QUAN_LY_TIEU_CHI)) {
            navigator("/v2");
        }
    }, []);

    if (!authV2.isAuthenticated || !coQuyen(authV2.nguoiDung, MA_QUYEN.QUAN_LY_TIEU_CHI)) {
        return null;
    }

    const moModalThem = () => {
        setDangSua(null);
        form.resetFields();
        form.setFieldsValue({ loaiPhieu: locLoaiPhieu ?? "PHIEU1", thuTu: 0, dangHoatDong: true });
        setMoModal(true);
    };

    const moModalSua = (nhom: NhomTieuChiModel) => {
        setDangSua(nhom);
        form.setFieldsValue({
            loaiPhieu: nhom.loaiPhieu,
            ma: nhom.ma,
            ten: nhom.ten,
            thuTu: nhom.thuTu,
            dangHoatDong: nhom.dangHoatDong,
            soBang: nhom.soBang,
        });
        setMoModal(true);
    };

    const luuNhom = async (values: any) => {
        const payload = {
            loaiPhieu: values.loaiPhieu,
            ma: values.ma || undefined,
            ten: values.ten,
            thuTu: values.thuTu ?? 0,
            dangHoatDong: !!values.dangHoatDong,
            soBang: values.loaiPhieu === "PHIEU4" ? values.soBang : undefined,
        };

        try {
            if (dangSua) {
                await suaNhomTieuChi({ id: dangSua.id, body: payload }).unwrap();
                dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã cập nhật nhóm tiêu chí", messageNotify: "" }));
            } else {
                await themNhomTieuChi(payload).unwrap();
                dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã thêm nhóm tiêu chí", messageNotify: "" }));
            }
            setMoModal(false);
        } catch (error: any) {
            dispatch(setNotify({
                typeNotify: "error",
                titleNotify: error?.data?.message || (dangSua ? "Cập nhật nhóm tiêu chí thất bại" : "Thêm nhóm tiêu chí thất bại"),
                messageNotify: ""
            }));
        }
    };

    const tuKhoa = searchText.trim().toLowerCase();
    const danhSachDaLoc = tuKhoa
        ? danhSachNhom.filter(n => `${n.ma ?? ""} ${n.ten}`.toLowerCase().includes(tuKhoa))
        : danhSachNhom;

    const xuLyXoaNhom = async (id: number) => {
        try {
            await xoaNhomTieuChi(id).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã xóa nhóm tiêu chí", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Xóa nhóm tiêu chí thất bại", messageNotify: "" }));
        }
    };

    const columns: TableColumnsType<NhomTieuChiModel> = [
        {
            title: 'Thứ tự',
            dataIndex: 'thuTu',
            key: 'thuTu',
            width: 90,
            sorter: { compare: (a, b) => a.thuTu - b.thuTu },
        },
        {
            title: 'Mã',
            dataIndex: 'ma',
            key: 'ma',
            width: 150,
        },
        {
            title: 'Tên nhóm tiêu chí',
            dataIndex: 'ten',
            key: 'ten',
            sorter: { compare: (a, b) => a.ten.localeCompare(b.ten) },
        },
        {
            title: 'Loại phiếu',
            dataIndex: 'loaiPhieu',
            key: 'loaiPhieu',
            width: 240,
            render: (loaiPhieu) => <Tag color="blue">{tenLoaiPhieu(loaiPhieu)}</Tag>,
        },
        {
            title: 'Bảng',
            dataIndex: 'soBang',
            key: 'soBang',
            width: 90,
            render: (soBang) => soBang ? <Tag>Bảng {soBang}</Tag> : <span className="text-gray-400">--</span>,
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
                        title="Xóa nhóm tiêu chí"
                        description={`Bạn có chắc muốn xóa "${record.ten}"? Các tiêu chí thuộc nhóm này sẽ không còn nhóm.`}
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => xuLyXoaNhom(record.id)}
                    >
                        <Button size="small" danger icon={<FaTrash />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return <LayoutV2Component>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className="font-bold text-xl text-zinc-700">NHÓM TIÊU CHÍ ĐÁNH GIÁ</h2>
            <Button type="primary" icon={<FaPlus />} onClick={moModalThem}>
                Thêm nhóm tiêu chí
            </Button>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
            <Input
                className="w-full sm:w-[280px]"
                allowClear
                placeholder="Tìm theo mã/tên nhóm tiêu chí..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<IoSearchOutline className="text-gray-400" />}
            />
            <Select
                className="w-full sm:w-[280px]"
                allowClear
                placeholder="-- Tất cả loại phiếu --"
                value={locLoaiPhieu}
                onChange={(value) => setLocLoaiPhieu(value)}
            >
                {DS_LOAI_PHIEU.map(t => (
                    <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
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
            title={dangSua ? "Sửa nhóm tiêu chí" : "Thêm nhóm tiêu chí"}
            open={moModal}
            onCancel={() => setMoModal(false)}
            onOk={() => form.submit()}
            okButtonProps={{ loading: dangThem || dangSuaLoading }}
            okText="Lưu"
            cancelText="Hủy"
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={luuNhom}>
                <Form.Item label="Loại phiếu" name="loaiPhieu" rules={[{ required: true, message: "Vui lòng chọn loại phiếu!" }]}>
                    <Select>
                        {DS_LOAI_PHIEU.map(t => (
                            <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item label="Mã" name="ma">
                    <Input />
                </Form.Item>
                <Form.Item label="Tên nhóm tiêu chí" name="ten" rules={[{ required: true, message: "Vui lòng nhập tên nhóm tiêu chí!" }]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Thứ tự hiển thị" name="thuTu">
                    <InputNumber className="w-full" min={0} />
                </Form.Item>
                {loaiPhieuDangChon === "PHIEU4" && (
                    <Form.Item
                        label="Thuộc Bảng"
                        name="soBang"
                        rules={[{ required: true, message: "Vui lòng chọn bảng!" }]}
                        tooltip="Bảng 1 có cấu trúc cố định (tự tính từ Phiếu 2), không cấu hình qua đây. Chọn Bảng 2-5 để nhóm/tiêu chí này tự động sinh dòng khi lập phiếu tổng hợp mới."
                    >
                        <Select placeholder="-- Chọn bảng --">
                            {[2, 3, 4, 5].map(n => (
                                <Select.Option key={n} value={n}>Bảng {n}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                )}
                <Form.Item label="Đang hoạt động" name="dangHoatDong" valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Form>
        </Modal>
    </LayoutV2Component>;
};

export default NhomTieuChiPage;
