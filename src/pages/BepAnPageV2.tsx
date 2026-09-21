import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, TableColumnsType, Tag } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { FiEdit2 } from "react-icons/fi";
import { IoSearchOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useDanhSachBepAnQuery, useSuaBepAnMutation, useThemBepAnMutation, useXoaBepAnMutation } from "../services/bepAnApiV2";
import { useDanhSachNhaThauQuery } from "../services/nhaThauApiV2";
import LayoutV2Component from "../components/LayoutV2Component";
import BepAnModel from "../models/BepAnModel";
import { setNotify } from "../store/notifycationSlide";
import { RootType } from "../store/types";
import { coQuyen, MA_QUYEN } from "../utils/quyenV2";

const DS_TRANG_THAI = [
    { value: "HOAT_DONG", label: "Hoạt động", color: "success" },
    { value: "NGUNG_HOAT_DONG", label: "Ngừng hoạt động", color: "default" },
];

const tenTrangThai = (trangThai: string) => DS_TRANG_THAI.find(t => t.value === trangThai)?.label ?? trangThai;
const mauTrangThai = (trangThai: string) => DS_TRANG_THAI.find(t => t.value === trangThai)?.color ?? "default";

const BepAnPageV2: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    const [locNhaThauId, setLocNhaThauId] = useState<number | undefined>(undefined);
    const [locTrangThai, setLocTrangThai] = useState<string | undefined>(undefined);

    const { data: danhSachBepAn = [], isFetching } = useDanhSachBepAnQuery({ nhaThauId: locNhaThauId, trangThai: locTrangThai });
    const { data: danhSachNhaThau = [] } = useDanhSachNhaThauQuery();
    const [themBepAn, { isLoading: dangThem }] = useThemBepAnMutation();
    const [suaBepAn, { isLoading: dangSuaLoading }] = useSuaBepAnMutation();
    const [xoaBepAn] = useXoaBepAnMutation();

    const [moModal, setMoModal] = useState(false);
    const [dangSua, setDangSua] = useState<BepAnModel | null>(null);
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

    const tenNhaThau = (nhaThauId?: number) => danhSachNhaThau.find(nt => nt.id === nhaThauId)?.ten ?? "";

    const moModalThem = () => {
        setDangSua(null);
        form.resetFields();
        form.setFieldsValue({ trangThai: "HOAT_DONG" });
        setMoModal(true);
    };

    const moModalSua = (bepAn: BepAnModel) => {
        setDangSua(bepAn);
        form.setFieldsValue({
            ma: bepAn.ma,
            ten: bepAn.ten,
            viTri: bepAn.viTri,
            nhaThauId: bepAn.nhaThauId,
            trangThai: bepAn.trangThai,
        });
        setMoModal(true);
    };

    const luuBepAn = async (values: any) => {
        const payload = {
            ma: values.ma,
            ten: values.ten,
            viTri: values.viTri || undefined,
            nhaThauId: values.nhaThauId || undefined,
            trangThai: values.trangThai,
        };

        try {
            if (dangSua) {
                await suaBepAn({ id: dangSua.id, body: payload }).unwrap();
                dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã cập nhật bếp ăn", messageNotify: "" }));
            } else {
                await themBepAn(payload).unwrap();
                dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã thêm bếp ăn", messageNotify: "" }));
            }
            setMoModal(false);
        } catch (error: any) {
            dispatch(setNotify({
                typeNotify: "error",
                titleNotify: error?.data?.message || (dangSua ? "Cập nhật bếp ăn thất bại" : "Thêm bếp ăn thất bại"),
                messageNotify: ""
            }));
        }
    };

    const tuKhoa = searchText.trim().toLowerCase();
    const danhSachDaLoc = tuKhoa
        ? danhSachBepAn.filter(ba => `${ba.ma} ${ba.ten} ${ba.viTri ?? ""} ${tenNhaThau(ba.nhaThauId)}`.toLowerCase().includes(tuKhoa))
        : danhSachBepAn;

    const xuLyXoaBepAn = async (id: number) => {
        try {
            await xoaBepAn(id).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã xóa bếp ăn", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Xóa bếp ăn thất bại", messageNotify: "" }));
        }
    };

    const columns: TableColumnsType<BepAnModel> = [
        {
            title: 'Mã',
            dataIndex: 'ma',
            key: 'ma',
            width: 150,
            sorter: { compare: (a, b) => a.ma.localeCompare(b.ma) },
        },
        {
            title: 'Tên bếp ăn',
            dataIndex: 'ten',
            key: 'ten',
            sorter: { compare: (a, b) => a.ten.localeCompare(b.ten) },
        },
        {
            title: 'Vị trí',
            dataIndex: 'viTri',
            key: 'viTri',
        },
        {
            title: 'Nhà thầu vận hành',
            dataIndex: 'nhaThauId',
            key: 'nhaThauId',
            render: (nhaThauId) => nhaThauId ? tenNhaThau(nhaThauId) : <span className="text-gray-400">--</span>,
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
                        title="Xóa bếp ăn"
                        description={`Bạn có chắc muốn xóa "${record.ten}"?`}
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => xuLyXoaBepAn(record.id)}
                    >
                        <Button size="small" danger icon={<FaTrash />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return <LayoutV2Component>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className="font-bold text-xl text-zinc-700">DANH MỤC BẾP ĂN</h2>
            <Button type="primary" icon={<FaPlus />} onClick={moModalThem}>
                Thêm bếp ăn
            </Button>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
            <Input
                className="w-full sm:w-[280px]"
                allowClear
                placeholder="Tìm theo mã/tên/vị trí bếp ăn..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<IoSearchOutline className="text-gray-400" />}
            />
            <Select
                className="w-full sm:w-[280px]"
                allowClear
                placeholder="-- Lọc theo nhà thầu --"
                showSearch
                optionFilterProp="children"
                value={locNhaThauId}
                onChange={(value) => setLocNhaThauId(value)}
            >
                {danhSachNhaThau.map(nt => (
                    <Select.Option key={nt.id} value={nt.id}>{nt.ten}</Select.Option>
                ))}
            </Select>
            <Select
                className="w-full sm:w-[220px]"
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
            dataSource={danhSachDaLoc}
            scroll={{ x: 900 }}
        />

        <Modal
            title={dangSua ? "Sửa bếp ăn" : "Thêm bếp ăn"}
            open={moModal}
            onCancel={() => setMoModal(false)}
            onOk={() => form.submit()}
            okButtonProps={{ loading: dangThem || dangSuaLoading }}
            okText="Lưu"
            cancelText="Hủy"
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={luuBepAn}>
                <Form.Item label="Mã bếp ăn" name="ma" rules={[{ required: true, message: "Vui lòng nhập mã bếp ăn!" }]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Tên bếp ăn" name="ten" rules={[{ required: true, message: "Vui lòng nhập tên bếp ăn!" }]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Vị trí" name="viTri">
                    <Input />
                </Form.Item>
                <Form.Item label="Nhà thầu vận hành" name="nhaThauId">
                    <Select allowClear placeholder="-- Chọn nhà thầu --" showSearch optionFilterProp="children">
                        {danhSachNhaThau.map(nt => (
                            <Select.Option key={nt.id} value={nt.id}>{nt.ten}</Select.Option>
                        ))}
                    </Select>
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

export default BepAnPageV2;
