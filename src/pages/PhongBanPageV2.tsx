import { Button, Form, Input, Modal, Popconfirm, Space, Switch, Table, TableColumnsType, Tag } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { FiEdit2 } from "react-icons/fi";
import { IoSearchOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useDanhSachPhongBanQuery, useSuaPhongBanMutation, useThemPhongBanMutation, useXoaPhongBanMutation } from "../services/phongBanApiV2";
import LayoutV2Component from "../components/LayoutV2Component";
import PhongBanModel from "../models/PhongBanModel";
import { setNotify } from "../store/notifycationSlide";
import { RootType } from "../store/types";
import { coQuyen, MA_QUYEN } from "../utils/quyenV2";

const PhongBanPageV2: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    const { data: danhSachPhongBan = [], isFetching } = useDanhSachPhongBanQuery();
    const [themPhongBan, { isLoading: dangThem }] = useThemPhongBanMutation();
    const [suaPhongBan, { isLoading: dangSuaLoading }] = useSuaPhongBanMutation();
    const [xoaPhongBan] = useXoaPhongBanMutation();

    const [moModal, setMoModal] = useState(false);
    const [dangSua, setDangSua] = useState<PhongBanModel | null>(null);
    const [form] = useForm();
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        } else if (!coQuyen(authV2.nguoiDung, MA_QUYEN.QUAN_LY_PHONG_BAN)) {
            navigator("/v2");
        }
    }, []);

    if (!authV2.isAuthenticated || !coQuyen(authV2.nguoiDung, MA_QUYEN.QUAN_LY_PHONG_BAN)) {
        return null;
    }

    const moModalThem = () => {
        setDangSua(null);
        form.resetFields();
        form.setFieldsValue({ dangHoatDong: true });
        setMoModal(true);
    };

    const moModalSua = (phongBan: PhongBanModel) => {
        setDangSua(phongBan);
        form.setFieldsValue({
            ma: phongBan.ma,
            ten: phongBan.ten,
            dangHoatDong: phongBan.dangHoatDong,
        });
        setMoModal(true);
    };

    const luuPhongBan = async (values: any) => {
        const payload = {
            ma: values.ma,
            ten: values.ten,
            dangHoatDong: !!values.dangHoatDong,
        };

        try {
            if (dangSua) {
                await suaPhongBan({ id: dangSua.id, body: payload }).unwrap();
                dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã cập nhật phòng ban", messageNotify: "" }));
            } else {
                await themPhongBan(payload).unwrap();
                dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã thêm phòng ban", messageNotify: "" }));
            }
            setMoModal(false);
        } catch (error: any) {
            dispatch(setNotify({
                typeNotify: "error",
                titleNotify: error?.data?.message || (dangSua ? "Cập nhật phòng ban thất bại" : "Thêm phòng ban thất bại"),
                messageNotify: ""
            }));
        }
    };

    const tuKhoa = searchText.trim().toLowerCase();
    const danhSachDaLoc = tuKhoa
        ? danhSachPhongBan.filter(pb => `${pb.ma} ${pb.ten}`.toLowerCase().includes(tuKhoa))
        : danhSachPhongBan;

    const xuLyXoaPhongBan = async (id: number) => {
        try {
            await xoaPhongBan(id).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã xóa phòng ban", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Xóa phòng ban thất bại", messageNotify: "" }));
        }
    };

    const columns: TableColumnsType<PhongBanModel> = [
        {
            title: 'Mã',
            dataIndex: 'ma',
            key: 'ma',
            width: 150,
            sorter: { compare: (a, b) => a.ma.localeCompare(b.ma) },
        },
        {
            title: 'Tên phòng ban',
            dataIndex: 'ten',
            key: 'ten',
            sorter: { compare: (a, b) => a.ten.localeCompare(b.ten) },
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
                        title="Xóa phòng ban"
                        description={`Bạn có chắc muốn xóa "${record.ten}"?`}
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => xuLyXoaPhongBan(record.id)}
                    >
                        <Button size="small" danger icon={<FaTrash />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return <LayoutV2Component>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className="font-bold text-xl text-zinc-700">DANH MỤC PHÒNG BAN</h2>
            <Button type="primary" icon={<FaPlus />} onClick={moModalThem}>
                Thêm phòng ban
            </Button>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
            <Input
                className="w-full sm:w-[280px]"
                allowClear
                placeholder="Tìm theo mã/tên phòng ban..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<IoSearchOutline className="text-gray-400" />}
            />
        </div>

        <Table
            rowKey="id"
            loading={isFetching}
            columns={columns}
            dataSource={danhSachDaLoc}
            scroll={{ x: 700 }}
        />

        <Modal
            title={dangSua ? "Sửa phòng ban" : "Thêm phòng ban"}
            open={moModal}
            onCancel={() => setMoModal(false)}
            onOk={() => form.submit()}
            okButtonProps={{ loading: dangThem || dangSuaLoading }}
            okText="Lưu"
            cancelText="Hủy"
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={luuPhongBan}>
                <Form.Item label="Mã phòng ban" name="ma" rules={[{ required: true, message: "Vui lòng nhập mã phòng ban!" }]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Tên phòng ban" name="ten" rules={[{ required: true, message: "Vui lòng nhập tên phòng ban!" }]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Đang hoạt động" name="dangHoatDong" valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Form>
        </Modal>
    </LayoutV2Component>;
};

export default PhongBanPageV2;
