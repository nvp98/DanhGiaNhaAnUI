import { Button, Form, Input, Modal, Popconfirm, Select, Space, Switch, Table, TableColumnsType, Tag } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { FiEdit2 } from "react-icons/fi";
import { IoSearchOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useDanhSachDiaDiemNhaAnQuery, useSuaDiaDiemNhaAnMutation, useThemDiaDiemNhaAnMutation, useXoaDiaDiemNhaAnMutation } from "../services/diaDiemNhaAnApiV2";
import LayoutV2Component from "../components/LayoutV2Component";
import NhaAnModel from "../models/NhaAnModel";
import { setNotify } from "../store/notifycationSlide";
import { RootType } from "../store/types";
import { coQuyen, MA_QUYEN } from "../utils/quyenV2";

const DiaDiemNhaAnPageV2: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    const [locHoatDong, setLocHoatDong] = useState<boolean | undefined>(undefined);

    const { data: danhSachDiaDiem = [], isFetching } = useDanhSachDiaDiemNhaAnQuery({ isActive: locHoatDong });
    const [themDiaDiem, { isLoading: dangThem }] = useThemDiaDiemNhaAnMutation();
    const [suaDiaDiem, { isLoading: dangSuaLoading }] = useSuaDiaDiemNhaAnMutation();
    const [xoaDiaDiem] = useXoaDiaDiemNhaAnMutation();

    const [moModal, setMoModal] = useState(false);
    const [dangSua, setDangSua] = useState<NhaAnModel | null>(null);
    const [form] = useForm();
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        } else if (!coQuyen(authV2.nguoiDung, MA_QUYEN.QUAN_LY_DANH_MUC)) {
            navigator("/v2");
        }
    }, []);

    if (!authV2.isAuthenticated || !coQuyen(authV2.nguoiDung, MA_QUYEN.QUAN_LY_DANH_MUC)) {
        return null;
    }

    const moModalThem = () => {
        setDangSua(null);
        form.resetFields();
        form.setFieldsValue({ isActive: true });
        setMoModal(true);
    };

    const moModalSua = (diaDiem: NhaAnModel) => {
        setDangSua(diaDiem);
        form.setFieldsValue({
            diaDiem: diaDiem.diaDiem,
            codeDiemAn: diaDiem.codeDiemAn,
            isActive: diaDiem.isActive,
        });
        setMoModal(true);
    };

    const luuDiaDiem = async (values: { diaDiem: string; codeDiemAn?: string; isActive: boolean }) => {
        const payload = {
            diaDiem: values.diaDiem,
            codeDiemAn: values.codeDiemAn || undefined,
            isActive: !!values.isActive,
        };

        try {
            if (dangSua) {
                await suaDiaDiem({ id: dangSua.id, body: payload }).unwrap();
                dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã cập nhật địa điểm nhà ăn", messageNotify: "" }));
            } else {
                await themDiaDiem(payload).unwrap();
                dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã thêm địa điểm nhà ăn", messageNotify: "" }));
            }
            setMoModal(false);
        } catch (error: any) {
            dispatch(setNotify({
                typeNotify: "error",
                titleNotify: error?.data?.message || (dangSua ? "Cập nhật địa điểm nhà ăn thất bại" : "Thêm địa điểm nhà ăn thất bại"),
                messageNotify: ""
            }));
        }
    };

    const tuKhoa = searchText.trim().toLowerCase();
    const danhSachDaLoc = tuKhoa
        ? danhSachDiaDiem.filter(dd => `${dd.diaDiem} ${dd.codeDiemAn ?? ""}`.toLowerCase().includes(tuKhoa))
        : danhSachDiaDiem;

    const xuLyXoaDiaDiem = async (id: number) => {
        try {
            await xoaDiaDiem(id).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã xóa địa điểm nhà ăn", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Xóa địa điểm nhà ăn thất bại", messageNotify: "" }));
        }
    };

    const columns: TableColumnsType<NhaAnModel> = [
        {
            title: 'Tên địa điểm',
            dataIndex: 'diaDiem',
            key: 'diaDiem',
            sorter: { compare: (a, b) => a.diaDiem.localeCompare(b.diaDiem) },
        },
        {
            title: 'Mã điểm ăn',
            dataIndex: 'codeDiemAn',
            key: 'codeDiemAn',
            width: 180,
            render: (codeDiemAn) => codeDiemAn || <span className="text-gray-400">--</span>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 160,
            render: (isActive) => isActive ? <Tag color="success">Hoạt động</Tag> : <Tag>Ngừng hoạt động</Tag>,
        },
        {
            title: '',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button size="small" icon={<FiEdit2 />} onClick={() => moModalSua(record)} />
                    <Popconfirm
                        title="Xóa địa điểm nhà ăn"
                        description={`Bạn có chắc muốn xóa "${record.diaDiem}"?`}
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => xuLyXoaDiaDiem(record.id)}
                    >
                        <Button size="small" danger icon={<FaTrash />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return <LayoutV2Component>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className="font-bold text-xl text-zinc-700">DANH MỤC ĐỊA ĐIỂM NHÀ ĂN</h2>
            <Button type="primary" icon={<FaPlus />} onClick={moModalThem}>
                Thêm địa điểm
            </Button>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
            <Input
                className="w-full sm:w-[280px]"
                allowClear
                placeholder="Tìm theo tên/mã địa điểm..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<IoSearchOutline className="text-gray-400" />}
            />
            <Select
                className="w-full sm:w-[220px]"
                allowClear
                placeholder="-- Lọc theo trạng thái --"
                value={locHoatDong}
                onChange={(value) => setLocHoatDong(value)}
            >
                <Select.Option value={true}>Hoạt động</Select.Option>
                <Select.Option value={false}>Ngừng hoạt động</Select.Option>
            </Select>
        </div>

        <Table
            rowKey="id"
            loading={isFetching}
            columns={columns}
            dataSource={danhSachDaLoc}
            scroll={{ x: 700 }}
        />

        <Modal
            title={dangSua ? "Sửa địa điểm nhà ăn" : "Thêm địa điểm nhà ăn"}
            open={moModal}
            onCancel={() => setMoModal(false)}
            onOk={() => form.submit()}
            okButtonProps={{ loading: dangThem || dangSuaLoading }}
            okText="Lưu"
            cancelText="Hủy"
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={luuDiaDiem}>
                <Form.Item label="Tên địa điểm" name="diaDiem" rules={[{ required: true, message: "Vui lòng nhập tên địa điểm!" }]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Mã điểm ăn" name="codeDiemAn">
                    <Input />
                </Form.Item>
                <Form.Item label="Hoạt động" name="isActive" valuePropName="checked">
                    <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngừng hoạt động" />
                </Form.Item>
            </Form>
        </Modal>
    </LayoutV2Component>;
};

export default DiaDiemNhaAnPageV2;
