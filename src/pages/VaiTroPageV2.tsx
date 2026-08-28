import { Button, Checkbox, Form, Input, Modal, Popconfirm, Space, Table, TableColumnsType, Tag } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { FiEdit2 } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useDanhSachVaiTroQuery, useSuaVaiTroMutation, useThemVaiTroMutation, useXoaVaiTroMutation } from "../services/vaiTroApiV2";
import LayoutV2Component from "../components/LayoutV2Component";
import VaiTroModel from "../models/VaiTroModel";
import { setNotify } from "../store/notifycationSlide";
import { RootType } from "../store/types";

const VaiTroPageV2: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    const { data: danhSachVaiTro = [], isFetching } = useDanhSachVaiTroQuery();
    const [themVaiTro, { isLoading: dangThem }] = useThemVaiTroMutation();
    const [suaVaiTro, { isLoading: dangSuaLoading }] = useSuaVaiTroMutation();
    const [xoaVaiTro] = useXoaVaiTroMutation();

    const [moModal, setMoModal] = useState(false);
    const [dangSua, setDangSua] = useState<VaiTroModel | null>(null);
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
        form.setFieldsValue({ coQuyenDuyetTk: false });
        setMoModal(true);
    };

    const moModalSua = (vaiTro: VaiTroModel) => {
        setDangSua(vaiTro);
        form.setFieldsValue({
            ma: vaiTro.ma,
            ten: vaiTro.ten,
            coQuyenDuyetTk: vaiTro.coQuyenDuyetTk,
        });
        setMoModal(true);
    };

    const luuVaiTro = async (values: any) => {
        const payload = {
            ma: values.ma,
            ten: values.ten,
            coQuyenDuyetTk: !!values.coQuyenDuyetTk,
        };

        try {
            if (dangSua) {
                await suaVaiTro({ id: dangSua.id, body: payload }).unwrap();
                dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã cập nhật vai trò", messageNotify: "" }));
            } else {
                await themVaiTro(payload).unwrap();
                dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã thêm vai trò", messageNotify: "" }));
            }
            setMoModal(false);
        } catch (error: any) {
            dispatch(setNotify({
                typeNotify: "error",
                titleNotify: error?.data?.message || (dangSua ? "Cập nhật vai trò thất bại" : "Thêm vai trò thất bại"),
                messageNotify: ""
            }));
        }
    };

    const xuLyXoaVaiTro = async (id: number) => {
        try {
            await xoaVaiTro(id).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã xóa vai trò", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Xóa vai trò thất bại", messageNotify: "" }));
        }
    };

    const columns: TableColumnsType<VaiTroModel> = [
        {
            title: 'Mã',
            dataIndex: 'ma',
            key: 'ma',
            width: 150,
            sorter: { compare: (a, b) => a.ma.localeCompare(b.ma) },
        },
        {
            title: 'Tên vai trò',
            dataIndex: 'ten',
            key: 'ten',
            sorter: { compare: (a, b) => a.ten.localeCompare(b.ten) },
        },
        {
            title: 'Quyền duyệt tài khoản',
            dataIndex: 'coQuyenDuyetTk',
            key: 'coQuyenDuyetTk',
            width: 200,
            render: (coQuyen) => coQuyen ? <Tag color="blue">Có</Tag> : <Tag>Không</Tag>,
        },
        {
            title: '',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button size="small" icon={<FiEdit2 />} onClick={() => moModalSua(record)} />
                    <Popconfirm
                        title="Xóa vai trò"
                        description={`Bạn có chắc muốn xóa "${record.ten}"?`}
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => xuLyXoaVaiTro(record.id)}
                    >
                        <Button size="small" danger icon={<FaTrash />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return <LayoutV2Component>
        <div className="flex justify-between items-center gap-3 mb-6">
            <h2 className="font-bold text-xl text-zinc-700">DANH MỤC VAI TRÒ</h2>
            <Button type="primary" icon={<FaPlus />} onClick={moModalThem}>
                Thêm vai trò
            </Button>
        </div>

        <Table
            rowKey="id"
            loading={isFetching}
            columns={columns}
            dataSource={danhSachVaiTro}
            scroll={{ x: 700 }}
        />

        <Modal
            title={dangSua ? "Sửa vai trò" : "Thêm vai trò"}
            open={moModal}
            onCancel={() => setMoModal(false)}
            onOk={() => form.submit()}
            okButtonProps={{ loading: dangThem || dangSuaLoading }}
            okText="Lưu"
            cancelText="Hủy"
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={luuVaiTro}>
                <Form.Item label="Mã vai trò" name="ma" rules={[{ required: true, message: "Vui lòng nhập mã vai trò!" }]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Tên vai trò" name="ten" rules={[{ required: true, message: "Vui lòng nhập tên vai trò!" }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="coQuyenDuyetTk" valuePropName="checked">
                    <Checkbox>Có quyền duyệt tài khoản</Checkbox>
                </Form.Item>
            </Form>
        </Modal>
    </LayoutV2Component>;
};

export default VaiTroPageV2;
