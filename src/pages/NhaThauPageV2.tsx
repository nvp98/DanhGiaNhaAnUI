import { Button, DatePicker, Form, Input, Modal, Popconfirm, Select, Space, Table, TableColumnsType, Tag } from "antd";
import { useForm } from "antd/es/form/Form";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { FiEdit2 } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useDanhSachNhaThauQuery, useSuaNhaThauMutation, useThemNhaThauMutation, useXoaNhaThauMutation } from "../services/nhaThauApiV2";
import LayoutV2Component from "../components/LayoutV2Component";
import NhaThauModel from "../models/NhaThauModel";
import { setNotify } from "../store/notifycationSlide";
import { RootType } from "../store/types";

const DS_TRANG_THAI = [
    { value: "HOAT_DONG", label: "Hoạt động", color: "success" },
    { value: "NGUNG_HOP_TAC", label: "Ngừng hợp tác", color: "default" },
];

const tenTrangThai = (trangThai: string) => DS_TRANG_THAI.find(t => t.value === trangThai)?.label ?? trangThai;
const mauTrangThai = (trangThai: string) => DS_TRANG_THAI.find(t => t.value === trangThai)?.color ?? "default";

const NhaThauPageV2: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    const [locTrangThai, setLocTrangThai] = useState<string | undefined>(undefined);

    const { data: danhSachNhaThau = [], isFetching } = useDanhSachNhaThauQuery({ trangThai: locTrangThai });
    const [themNhaThau, { isLoading: dangThem }] = useThemNhaThauMutation();
    const [suaNhaThau, { isLoading: dangSuaLoading }] = useSuaNhaThauMutation();
    const [xoaNhaThau] = useXoaNhaThauMutation();

    const [moModal, setMoModal] = useState(false);
    const [dangSua, setDangSua] = useState<NhaThauModel | null>(null);
    const [form] = useForm();

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        }
    }, []);

    if (!authV2.isAuthenticated) {
        return null;
    }

    const moModalThem = () => {
        setDangSua(null);
        form.resetFields();
        form.setFieldsValue({ trangThai: "HOAT_DONG" });
        setMoModal(true);
    };

    const moModalSua = (nhaThau: NhaThauModel) => {
        setDangSua(nhaThau);
        form.setFieldsValue({
            ma: nhaThau.ma,
            ten: nhaThau.ten,
            khoangHd: [
                nhaThau.ngayBatDauHd ? dayjs(nhaThau.ngayBatDauHd) : null,
                nhaThau.ngayKetThucHd ? dayjs(nhaThau.ngayKetThucHd) : null,
            ],
            trangThai: nhaThau.trangThai,
        });
        setMoModal(true);
    };

    const luuNhaThau = async (values: any) => {
        const [tuNgay, denNgay] = values.khoangHd || [null, null];
        const payload = {
            ma: values.ma,
            ten: values.ten,
            ngayBatDauHd: tuNgay ? tuNgay.format("YYYY-MM-DD") : undefined,
            ngayKetThucHd: denNgay ? denNgay.format("YYYY-MM-DD") : undefined,
            trangThai: values.trangThai,
        };

        try {
            if (dangSua) {
                await suaNhaThau({ id: dangSua.id, body: payload }).unwrap();
                dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã cập nhật nhà thầu", messageNotify: "" }));
            } else {
                await themNhaThau(payload).unwrap();
                dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã thêm nhà thầu", messageNotify: "" }));
            }
            setMoModal(false);
        } catch (error: any) {
            dispatch(setNotify({
                typeNotify: "error",
                titleNotify: error?.data?.message || (dangSua ? "Cập nhật nhà thầu thất bại" : "Thêm nhà thầu thất bại"),
                messageNotify: ""
            }));
        }
    };

    const xuLyXoaNhaThau = async (id: number) => {
        try {
            await xoaNhaThau(id).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã xóa nhà thầu", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Xóa nhà thầu thất bại", messageNotify: "" }));
        }
    };

    const columns: TableColumnsType<NhaThauModel> = [
        {
            title: 'Mã',
            dataIndex: 'ma',
            key: 'ma',
            width: 150,
            sorter: { compare: (a, b) => a.ma.localeCompare(b.ma) },
        },
        {
            title: 'Tên nhà thầu',
            dataIndex: 'ten',
            key: 'ten',
            sorter: { compare: (a, b) => a.ten.localeCompare(b.ten) },
        },
        {
            title: 'Ngày bắt đầu HĐ',
            dataIndex: 'ngayBatDauHd',
            key: 'ngayBatDauHd',
            render: (ngay) => ngay ? dayjs(ngay).format("DD/MM/YYYY") : "--",
        },
        {
            title: 'Ngày kết thúc HĐ',
            dataIndex: 'ngayKetThucHd',
            key: 'ngayKetThucHd',
            render: (ngay) => ngay ? dayjs(ngay).format("DD/MM/YYYY") : "--",
        },
        {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            key: 'trangThai',
            width: 160,
            render: (trangThai) => <Tag color={mauTrangThai(trangThai)}>{tenTrangThai(trangThai)}</Tag>,
        },
        {
            title: '',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button size="small" icon={<FiEdit2 />} onClick={() => moModalSua(record)} />
                    <Popconfirm
                        title="Xóa nhà thầu"
                        description={`Bạn có chắc muốn xóa "${record.ten}"?`}
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => xuLyXoaNhaThau(record.id)}
                    >
                        <Button size="small" danger icon={<FaTrash />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return <LayoutV2Component>
        <div className="flex justify-between items-center gap-3 mb-6">
            <h2 className="font-bold text-xl text-zinc-700">DANH MỤC NHÀ THẦU</h2>
            <Button type="primary" icon={<FaPlus />} onClick={moModalThem}>
                Thêm nhà thầu
            </Button>
        </div>

        <div className="flex gap-3 mb-4">
            <Select
                className="w-[220px]"
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
            dataSource={danhSachNhaThau}
            scroll={{ x: 900 }}
        />

        <Modal
            title={dangSua ? "Sửa nhà thầu" : "Thêm nhà thầu"}
            open={moModal}
            onCancel={() => setMoModal(false)}
            onOk={() => form.submit()}
            okButtonProps={{ loading: dangThem || dangSuaLoading }}
            okText="Lưu"
            cancelText="Hủy"
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={luuNhaThau}>
                <Form.Item label="Mã nhà thầu" name="ma" rules={[{ required: true, message: "Vui lòng nhập mã nhà thầu!" }]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Tên nhà thầu" name="ten" rules={[{ required: true, message: "Vui lòng nhập tên nhà thầu!" }]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Thời hạn hợp đồng" name="khoangHd">
                    <DatePicker.RangePicker className="w-full" format="DD/MM/YYYY" placeholder={['Từ ngày', 'Đến ngày']} />
                </Form.Item>
                <Form.Item label="Trạng thái" name="trangThai" rules={[{ required: true }]}>
                    <Select>
                        {DS_TRANG_THAI.map(t => (
                            <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
                        ))}
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    </LayoutV2Component>;
};

export default NhaThauPageV2;
