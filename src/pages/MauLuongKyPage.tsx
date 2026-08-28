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
import { useDanhSachVaiTroQuery } from "../services/vaiTroApiV2";
import { setNotify } from "../store/notifycationSlide";
import { RootType } from "../store/types";

const DS_LOAI_NGUOI_KY = [
    { value: "PHONG_BAN", label: "Phòng ban" },
    { value: "NHA_THAU", label: "Nhà thầu (của chính phiếu)" },
    { value: "VAI_TRO", label: "Vai trò" },
];

const MauLuongKyPage: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    const [locLoaiPhieu, setLocLoaiPhieu] = useState<string | undefined>("PHIEU1");

    const { data: danhSachMau = [], isFetching } = useDanhSachMauLuongKyQuery({ loaiPhieu: locLoaiPhieu });
    const { data: danhSachPhongBan = [] } = useDanhSachPhongBanQuery();
    const { data: danhSachVaiTro = [] } = useDanhSachVaiTroQuery();
    const [themMauLuongKy, { isLoading: dangThem }] = useThemMauLuongKyMutation();
    const [suaMauLuongKy, { isLoading: dangSuaLoading }] = useSuaMauLuongKyMutation();
    const [xoaMauLuongKy] = useXoaMauLuongKyMutation();

    const [moModal, setMoModal] = useState(false);
    const [dangSua, setDangSua] = useState<MauLuongKyModel | null>(null);
    const [loaiNguoiKyDangChon, setLoaiNguoiKyDangChon] = useState<string>("VAI_TRO");
    const [form] = useForm();

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        }
    }, []);

    if (!authV2.isAuthenticated) {
        return null;
    }

    const tenPhongBan = (id?: number) => danhSachPhongBan.find(pb => pb.id === id)?.ten ?? "";
    const tenVaiTro = (id?: number) => danhSachVaiTro.find(vt => vt.id === id)?.ten ?? "";

    const moModalThem = () => {
        setDangSua(null);
        form.resetFields();
        setLoaiNguoiKyDangChon("VAI_TRO");
        form.setFieldsValue({ loaiPhieu: locLoaiPhieu ?? "PHIEU1", buocThuTu: 1, loaiNguoiKy: "VAI_TRO", batBuoc: true });
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
            vaiTroId: mau.vaiTroId,
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
            vaiTroId: values.loaiNguoiKy === "VAI_TRO" ? values.vaiTroId : undefined,
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
        if (mau.loaiNguoiKy === "VAI_TRO") return `Vai trò: ${tenVaiTro(mau.vaiTroId)}`;
        return "Nhà thầu (của chính phiếu)";
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
        <div className="flex justify-between items-center gap-3 mb-6">
            <h2 className="font-bold text-xl text-zinc-700">CẤU HÌNH LUỒNG KÝ</h2>
            <Button type="primary" icon={<FaPlus />} onClick={moModalThem}>
                Thêm bước ký
            </Button>
        </div>

        <div className="flex gap-3 mb-4">
            <Select
                className="w-[280px]"
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
                {loaiNguoiKyDangChon === "VAI_TRO" && (
                    <Form.Item label="Vai trò" name="vaiTroId" rules={[{ required: true, message: "Vui lòng chọn vai trò!" }]}>
                        <Select placeholder="-- Chọn vai trò --" showSearch optionFilterProp="children">
                            {danhSachVaiTro.map(vt => (
                                <Select.Option key={vt.id} value={vt.id}>{vt.ten}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                )}
                <Form.Item label="Bắt buộc" name="batBuoc" valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Form>
        </Modal>
    </LayoutV2Component>;
};

export default MauLuongKyPage;
