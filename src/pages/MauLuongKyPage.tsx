import { Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, TableColumnsType, Tag } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { FiEdit2 } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import LayoutV2Component from "../components/LayoutV2Component";
import MauLuongKyModel from "../models/MauLuongKyModel";
import { DS_LOAI_PHIEU, tenLoaiPhieu } from "./NhomTieuChiPage";
import { useDanhSachMauLuongKyQuery, useSuaMauLuongKyMutation, useThemMauLuongKyMutation, useXoaMauLuongKyMutation } from "../services/mauLuongKyApi";
import { useDanhSachPhongBanQuery } from "../services/phongBanApiV2";
import { setNotify } from "../store/notifycationSlide";
import { RootType } from "../store/types";
import { coQuyen, MA_QUYEN } from "../utils/quyenV2";

const DS_LOAI_NGUOI_KY = [
    { value: "PHONG_BAN", label: "Phòng ban" },
    { value: "NHA_THAU", label: "Nhà thầu (của chính phiếu)" },
    { value: "TRUC_TIEP", label: "Gán trực tiếp từng người (Quản lý tài khoản)" },
];

const MauLuongKyPage: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    const [locLoaiPhieu, setLocLoaiPhieu] = useState<string | undefined>("PHIEU1");

    const { data: danhSachMau = [], isFetching } = useDanhSachMauLuongKyQuery({ loaiPhieu: locLoaiPhieu });
    const { data: danhSachPhongBan = [] } = useDanhSachPhongBanQuery();
    const [themMauLuongKy, { isLoading: dangThem }] = useThemMauLuongKyMutation();
    const [suaMauLuongKy, { isLoading: dangSuaLoading }] = useSuaMauLuongKyMutation();
    const [xoaMauLuongKy] = useXoaMauLuongKyMutation();

    const [moModal, setMoModal] = useState(false);
    const [dangSua, setDangSua] = useState<MauLuongKyModel | null>(null);
    const [loaiNguoiKyDangChon, setLoaiNguoiKyDangChon] = useState<string>("TRUC_TIEP");
    const [form] = useForm();

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        } else if (!coQuyen(authV2.nguoiDung, MA_QUYEN.QUAN_LY_LUONG_KY)) {
            navigator("/v2");
        }
    }, []);

    if (!authV2.isAuthenticated || !coQuyen(authV2.nguoiDung, MA_QUYEN.QUAN_LY_LUONG_KY)) {
        return null;
    }

    const tenPhongBan = (id?: number) => danhSachPhongBan.find(pb => pb.id === id)?.ten ?? "";

    const moModalThem = () => {
        setDangSua(null);
        form.resetFields();
        setLoaiNguoiKyDangChon("TRUC_TIEP");
        form.setFieldsValue({ loaiPhieu: locLoaiPhieu ?? "PHIEU1", buocThuTu: 1, loaiNguoiKy: "TRUC_TIEP", batBuoc: true });
        setMoModal(true);
    };

    const moModalSua = (mau: MauLuongKyModel) => {
        setDangSua(mau);
        setLoaiNguoiKyDangChon(mau.loaiNguoiKy);
        form.setFieldsValue({
            loaiPhieu: mau.loaiPhieu,
            buocThuTu: mau.buocThuTu,
            tenBuoc: mau.tenBuoc,
            loaiNguoiKy: mau.loaiNguoiKy,
            phongBanId: mau.phongBanId,
            batBuoc: mau.batBuoc,
        });
        setMoModal(true);
    };

    const luuMau = async (values: any) => {
        const payload = {
            loaiPhieu: values.loaiPhieu,
            buocThuTu: values.buocThuTu,
            tenBuoc: values.tenBuoc,
            loaiNguoiKy: values.loaiNguoiKy,
            phongBanId: values.loaiNguoiKy === "PHONG_BAN" ? values.phongBanId : undefined,
            batBuoc: !!values.batBuoc,
        };

        try {
            if (dangSua) {
                await suaMauLuongKy({ id: dangSua.id, body: payload }).unwrap();
                dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã cập nhật bước ký", messageNotify: "" }));
            } else {
                await themMauLuongKy(payload).unwrap();
                dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã thêm bước ký", messageNotify: "" }));
            }
            setMoModal(false);
        } catch (error: any) {
            dispatch(setNotify({
                typeNotify: "error",
                titleNotify: error?.data?.message || (dangSua ? "Cập nhật bước ký thất bại" : "Thêm bước ký thất bại"),
                messageNotify: ""
            }));
        }
    };

    const xuLyXoaMau = async (id: number) => {
        try {
            await xoaMauLuongKy(id).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã xóa bước ký", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Xóa bước ký thất bại", messageNotify: "" }));
        }
    };

    const moTaNguoiKy = (mau: MauLuongKyModel) => {
        if (mau.loaiNguoiKy === "PHONG_BAN") return `Phòng ban: ${tenPhongBan(mau.phongBanId)}`;
        if (mau.loaiNguoiKy === "NHA_THAU") return "Nhà thầu (của chính phiếu)";
        return "Gán trực tiếp (xem Quản lý tài khoản)";
    };

    const columns: TableColumnsType<MauLuongKyModel> = [
        {
            title: 'Bước',
            dataIndex: 'buocThuTu',
            key: 'buocThuTu',
            width: 80,
            sorter: { compare: (a, b) => a.buocThuTu - b.buocThuTu },
        },
        {
            title: 'Tên bước',
            dataIndex: 'tenBuoc',
            key: 'tenBuoc',
        },
        {
            title: 'Loại phiếu',
            dataIndex: 'loaiPhieu',
            key: 'loaiPhieu',
            width: 220,
            render: (loaiPhieu) => <Tag color="blue">{tenLoaiPhieu(loaiPhieu)}</Tag>,
        },
        {
            title: 'Người ký',
            key: 'nguoiKy',
            render: (_, record) => moTaNguoiKy(record),
        },
        {
            title: 'Bắt buộc',
            dataIndex: 'batBuoc',
            key: 'batBuoc',
            width: 110,
            render: (batBuoc) => batBuoc ? <Tag color="success">Bắt buộc</Tag> : <Tag>Tùy chọn</Tag>,
        },
        {
            title: '',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button size="small" icon={<FiEdit2 />} onClick={() => moModalSua(record)} />
                    <Popconfirm
                        title="Xóa bước ký"
                        description={`Bạn có chắc muốn xóa bước "${record.tenBuoc}"?`}
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => xuLyXoaMau(record.id)}
                    >
                        <Button size="small" danger icon={<FaTrash />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return <LayoutV2Component>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className="font-bold text-xl text-zinc-700">CẤU HÌNH LUỒNG KÝ</h2>
            <Button type="primary" icon={<FaPlus />} onClick={moModalThem}>
                Thêm bước ký
            </Button>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
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
            dataSource={danhSachMau}
            scroll={{ x: 900 }}
        />

        <Modal
            title={dangSua ? "Sửa bước ký" : "Thêm bước ký"}
            open={moModal}
            onCancel={() => setMoModal(false)}
            onOk={() => form.submit()}
            okButtonProps={{ loading: dangThem || dangSuaLoading }}
            okText="Lưu"
            cancelText="Hủy"
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={luuMau}>
                <Form.Item label="Loại phiếu" name="loaiPhieu" rules={[{ required: true, message: "Vui lòng chọn loại phiếu!" }]}>
                    <Select>
                        {DS_LOAI_PHIEU.map(t => (
                            <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item label="Bước thứ tự" name="buocThuTu" rules={[{ required: true, message: "Vui lòng nhập bước thứ tự!" }]}>
                    <InputNumber className="w-full" min={1} />
                </Form.Item>
                <Form.Item label="Tên bước" name="tenBuoc" rules={[{ required: true, message: "Vui lòng nhập tên bước!" }]}>
                    <Input placeholder="VD: Nhà thầu ký, Người đánh giá ký..." />
                </Form.Item>
                <Form.Item label="Loại người ký" name="loaiNguoiKy" rules={[{ required: true }]}>
                    <Select onChange={(value) => setLoaiNguoiKyDangChon(value)}>
                        {DS_LOAI_NGUOI_KY.map(t => (
                            <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
                        ))}
                    </Select>
                </Form.Item>
                {loaiNguoiKyDangChon === "PHONG_BAN" && (
                    <Form.Item label="Phòng ban" name="phongBanId" rules={[{ required: true, message: "Vui lòng chọn phòng ban!" }]}>
                        <Select placeholder="-- Chọn phòng ban --" showSearch optionFilterProp="children">
                            {danhSachPhongBan.map(pb => (
                                <Select.Option key={pb.id} value={pb.id}>{pb.ten}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                )}
                {loaiNguoiKyDangChon === "TRUC_TIEP" && (
                    <div className="mb-4 text-gray-500 text-sm bg-gray-50 rounded p-2">
                        Ai ký được bước này sẽ gán trực tiếp cho từng tài khoản ở màn
                        "Quản lý tài khoản" (khối "Phân quyền theo Phiếu"), sau khi lưu bước này.
                    </div>
                )}
                <Form.Item label="Bắt buộc" name="batBuoc" valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Form>
        </Modal>
    </LayoutV2Component>;
};

export default MauLuongKyPage;
