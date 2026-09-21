import { Button, Checkbox, Form, Input, Modal, Popconfirm, Space, Switch, Table, TableColumnsType, Tag } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { FiEdit2 } from "react-icons/fi";
import { IoSearchOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useDanhSachVaiTroQuery, useSuaVaiTroMutation, useThemVaiTroMutation, useXoaVaiTroMutation } from "../services/vaiTroApiV2";
import { useDanhSachQuyenQuery } from "../services/quyenApiV2";
import LayoutV2Component from "../components/LayoutV2Component";
import VaiTroModel from "../models/VaiTroModel";
import { setNotify } from "../store/notifycationSlide";
import { RootType } from "../store/types";
import { coQuyen, MA_QUYEN } from "../utils/quyenV2";

const VaiTroPageV2: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    const { data: danhSachVaiTro = [], isFetching } = useDanhSachVaiTroQuery();
    const { data: danhSachQuyen = [] } = useDanhSachQuyenQuery();
    const [themVaiTro, { isLoading: dangThem }] = useThemVaiTroMutation();
    const [suaVaiTro, { isLoading: dangSuaLoading }] = useSuaVaiTroMutation();
    const [xoaVaiTro] = useXoaVaiTroMutation();

    const [moModal, setMoModal] = useState(false);
    const [dangSua, setDangSua] = useState<VaiTroModel | null>(null);
    const [laQuanTriVien, setLaQuanTriVien] = useState(false);
    const [form] = useForm();
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        } else if (!coQuyen(authV2.nguoiDung, MA_QUYEN.QUAN_LY_VAI_TRO)) {
            navigator("/v2");
        }
    }, []);

    if (!authV2.isAuthenticated || !coQuyen(authV2.nguoiDung, MA_QUYEN.QUAN_LY_VAI_TRO)) {
        return null;
    }

    const tenQuyen = (quyenIds: number[]) =>
        danhSachQuyen.filter((q) => quyenIds.includes(q.id)).map((q) => q.ten);

    const moModalThem = () => {
        setDangSua(null);
        setLaQuanTriVien(false);
        form.resetFields();
        form.setFieldsValue({ laQuanTriVien: false, quyenIds: [] });
        setMoModal(true);
    };

    const moModalSua = (vaiTro: VaiTroModel) => {
        setDangSua(vaiTro);
        setLaQuanTriVien(vaiTro.laQuanTriVien);
        form.setFieldsValue({
            ma: vaiTro.ma,
            ten: vaiTro.ten,
            laQuanTriVien: vaiTro.laQuanTriVien,
            quyenIds: vaiTro.quyenIds,
        });
        setMoModal(true);
    };

    const luuVaiTro = async (values: any) => {
        const payload = {
            ma: values.ma,
            ten: values.ten,
            laQuanTriVien: !!values.laQuanTriVien,
            quyenIds: values.laQuanTriVien ? [] : (values.quyenIds || []),
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

    const tuKhoa = searchText.trim().toLowerCase();
    const danhSachDaLoc = tuKhoa
        ? danhSachVaiTro.filter(vt => `${vt.ma} ${vt.ten}`.toLowerCase().includes(tuKhoa))
        : danhSachVaiTro;

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
            title: 'Quản trị viên',
            dataIndex: 'laQuanTriVien',
            key: 'laQuanTriVien',
            width: 140,
            render: (laQuanTriVien) => laQuanTriVien ? <Tag color="red">Toàn quyền</Tag> : <Tag>Không</Tag>,
        },
        {
            title: 'Quyền được gán',
            dataIndex: 'quyenIds',
            key: 'quyenIds',
            render: (quyenIds: number[], record) =>
                record.laQuanTriVien
                    ? <span className="text-zinc-400 italic">Tất cả (quản trị viên)</span>
                    : tenQuyen(quyenIds).map((ten) => <Tag key={ten}>{ten}</Tag>),
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className="font-bold text-xl text-zinc-700">DANH MỤC VAI TRÒ</h2>
            <Button type="primary" icon={<FaPlus />} onClick={moModalThem}>
                Thêm vai trò
            </Button>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
            <Input
                className="w-full sm:w-[280px]"
                allowClear
                placeholder="Tìm theo mã/tên vai trò..."
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
                <Form.Item name="laQuanTriVien" valuePropName="checked">
                    <Switch
                        checkedChildren="Quản trị viên (toàn quyền)"
                        unCheckedChildren="Quản trị viên (toàn quyền)"
                        onChange={setLaQuanTriVien}
                    />
                </Form.Item>
                <Form.Item
                    label="Quyền được gán"
                    name="quyenIds"
                    extra={laQuanTriVien ? "Đã bật Quản trị viên — vai trò này tự động có mọi quyền, không cần chọn thêm." : undefined}
                >
                    <Checkbox.Group
                        disabled={laQuanTriVien}
                        options={danhSachQuyen.map((q) => ({ label: q.ten, value: q.id }))}
                        className="flex flex-col gap-1"
                    />
                </Form.Item>
            </Form>
        </Modal>
    </LayoutV2Component>;
};

export default VaiTroPageV2;
