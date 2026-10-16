import React, { useState } from "react";
import { Button, DatePicker, Form, Input, Modal, Popconfirm, Select, Table, TableColumnsType } from "antd";
import { useForm } from "antd/es/form/Form";
import dayjs, { Dayjs } from "dayjs";
import { FaExclamationTriangle, FaPlus, FaTrash } from "react-icons/fa";
import { IoSearchOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootType } from "../store/types";
import LayoutV2Component from "../components/LayoutV2Component";
import KetQuaDanhGiaLoaiTruModel from "../models/KetQuaDanhGiaLoaiTruModel";
import {
    useDanhSachKetQuaDanhGiaLoaiTruQuery,
    useThemKetQuaDanhGiaLoaiTruMutation,
    useXoaKetQuaDanhGiaLoaiTruMutation,
} from "../services/ketQuaDanhGiaLoaiTruApiV2";
import { useDanhSachDiaDiemNhaAnQuery } from "../services/diaDiemNhaAnApiV2";
import { useDanhSachBuaAnQuery } from "../services/buaAnApi";
import { setNotify } from "../store/notifycationSlide";
import { coQuyen, MA_QUYEN } from "../utils/quyenV2";

const { RangePicker } = DatePicker;

interface GiaTriForm {
    ngay: Dayjs;
    id_BuaAn: number;
    diaDiemNhaAnId: number;
    lyDo?: string;
}

// Đánh dấu (Ngày, Bữa ăn, Địa điểm) máy kiosk hỏng — loại trừ khỏi "Lượt
// đánh giá" của Phiếu 3/4, xem 02. Phantich/modules/KetQuaDanhGiaPhanBo.md,
// mục "Loại trừ do lỗi thiết bị". KHÔNG ảnh hưởng "Tổng suất ăn" (vẫn tính
// bình thường từ DuLieuCom).
const KetQuaDanhGiaLoaiTruPageV2: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    const homNay = dayjs().startOf("day");
    const macDinhKhoangNgay: [Dayjs, Dayjs] = [homNay.subtract(29, "day"), homNay];

    // Cùng pattern "Tìm kiếm" của KetQuaDanhGiaPhanBoPageV2 — ô nhập tách
    // khỏi bộ lọc áp dụng, chỉ gọi API khi bấm nút.
    const [khoangNgayNhap, setKhoangNgayNhap] = useState<[Dayjs, Dayjs]>(macDinhKhoangNgay);
    const [diaDiemNhap, setDiaDiemNhap] = useState<number | undefined>(undefined);
    const [buaAnNhap, setBuaAnNhap] = useState<number | undefined>(undefined);

    const [boLocApDung, setBoLocApDung] = useState({
        khoangNgay: macDinhKhoangNgay,
        diaDiemLoc: undefined as number | undefined,
        buaAnLoc: undefined as number | undefined,
    });

    const { data: danhSachDiaDiem = [] } = useDanhSachDiaDiemNhaAnQuery();
    const { data: danhSachBuaAn = [] } = useDanhSachBuaAnQuery();
    const buaAnSapXep = danhSachBuaAn
        .filter((b) => b.codeBuaAn.toUpperCase() !== "ALL")
        .sort((a, b) => a.codeBuaAn.localeCompare(b.codeBuaAn));
    const diaDiemChon = danhSachDiaDiem.filter((dd) => dd.isActive);

    const { data: danhSach = [], isFetching } = useDanhSachKetQuaDanhGiaLoaiTruQuery({
        diaDiemNhaAnId: boLocApDung.diaDiemLoc,
        idBuaAn: boLocApDung.buaAnLoc,
        tuNgay: boLocApDung.khoangNgay[0].format("YYYY-MM-DD"),
        denNgay: boLocApDung.khoangNgay[1].format("YYYY-MM-DD"),
    });
    const [themDanhDau, { isLoading: dangThem }] = useThemKetQuaDanhGiaLoaiTruMutation();
    const [xoaDanhDau] = useXoaKetQuaDanhGiaLoaiTruMutation();

    const [moModal, setMoModal] = useState(false);
    const [form] = useForm<GiaTriForm>();

    const timKiem = () => {
        setBoLocApDung({ khoangNgay: khoangNgayNhap, diaDiemLoc: diaDiemNhap, buaAnLoc: buaAnNhap });
    };

    React.useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        } else if (!coQuyen(authV2.nguoiDung, MA_QUYEN.QUAN_LY_LOAI_TRU_THIET_BI)) {
            navigator("/v2");
        }
    }, []);

    if (!authV2.isAuthenticated || !coQuyen(authV2.nguoiDung, MA_QUYEN.QUAN_LY_LOAI_TRU_THIET_BI)) {
        return null;
    }

    const tenDiaDiem = (id: number) => danhSachDiaDiem.find((d) => d.id === id)?.diaDiem ?? `#${id}`;
    const tenBuaAn = (id: number) => danhSachBuaAn.find((b) => b.id === id)?.tenBuaAn ?? `#${id}`;

    const moModalThem = () => {
        form.resetFields();
        setMoModal(true);
    };

    // Submit form chỉ MỞ XÁC NHẬN — chưa gọi API ngay, để người dùng đọc lại
    // đúng Ngày/Bữa ăn/Địa điểm sắp bị loại trừ trước khi chốt (yêu cầu
    // nghiệp vụ: phải hỏi xác nhận rõ ràng vì ảnh hưởng số liệu Phiếu 3/4).
    const xacNhanTruocKhiLuu = (values: GiaTriForm) => {
        Modal.confirm({
            title: "Xác nhận đánh dấu loại trừ",
            icon: <FaExclamationTriangle className="text-amber-500" />,
            content: (
                <div className="mt-2">
                    <p className="mb-2">
                        Bạn có chắc chắn đánh dấu <b>địa điểm "{tenDiaDiem(values.diaDiemNhaAnId)}"</b>, bữa{" "}
                        <b>"{tenBuaAn(values.id_BuaAn)}"</b>, ngày <b>{values.ngay.format("DD/MM/YYYY")}</b> là
                        "máy hỏng — không lấy dữ liệu" không?
                    </p>
                    <p className="text-gray-500 text-sm m-0">
                        Toàn bộ lượt đánh giá tại đúng thời điểm này sẽ KHÔNG được tính vào "Lượt đánh giá" của Phiếu 3/4 nữa.
                    </p>
                </div>
            ),
            okText: "Xác nhận đánh dấu",
            cancelText: "Hủy",
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    await themDanhDau({
                        ngay: values.ngay.format("YYYY-MM-DD"),
                        id_BuaAn: values.id_BuaAn,
                        diaDiemNhaAnId: values.diaDiemNhaAnId,
                        lyDo: values.lyDo,
                    }).unwrap();
                    dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã đánh dấu loại trừ", messageNotify: "" }));
                    setMoModal(false);
                } catch (error: any) {
                    dispatch(setNotify({
                        typeNotify: "error",
                        titleNotify: error?.data?.message || "Đánh dấu loại trừ thất bại",
                        messageNotify: "",
                    }));
                }
            },
        });
    };

    const xuLyXoa = async (id: number) => {
        try {
            await xoaDanhDau(id).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã hủy đánh dấu", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Hủy đánh dấu thất bại", messageNotify: "" }));
        }
    };

    const columns: TableColumnsType<KetQuaDanhGiaLoaiTruModel> = [
        {
            title: "Ngày",
            dataIndex: "ngay",
            key: "ngay",
            width: 110,
            sorter: { compare: (a, b) => a.ngay.localeCompare(b.ngay) },
            render: (ngay) => dayjs(ngay).format("DD/MM/YYYY"),
        },
        {
            title: "Bữa ăn",
            dataIndex: "tenBuaAn",
            key: "tenBuaAn",
            width: 100,
            render: (ten, record) => ten ?? tenBuaAn(record.id_BuaAn),
        },
        {
            title: "Địa điểm",
            dataIndex: "tenDiaDiem",
            key: "tenDiaDiem",
            width: 200,
            render: (ten, record) => ten ?? tenDiaDiem(record.diaDiemNhaAnId),
        },
        {
            title: "Lý do",
            dataIndex: "lyDo",
            key: "lyDo",
            render: (lyDo) => lyDo || <span className="text-gray-400">--</span>,
        },
        {
            title: "Người đánh dấu",
            dataIndex: "nguoiTaoTen",
            key: "nguoiTaoTen",
            width: 160,
            render: (ten) => ten || <span className="text-gray-400">--</span>,
        },
        {
            title: "Thời điểm đánh dấu",
            dataIndex: "ngayTao",
            key: "ngayTao",
            width: 160,
            render: (v) => dayjs(v).format("DD/MM/YYYY HH:mm"),
        },
        {
            title: "",
            key: "actions",
            width: 80,
            render: (_, record) => (
                <Popconfirm
                    title="Hủy đánh dấu loại trừ"
                    description="Lượt đánh giá tại đúng thời điểm này sẽ được tính lại vào Phiếu 3/4. Bạn có chắc không?"
                    okText="Hủy đánh dấu"
                    cancelText="Đóng"
                    onConfirm={() => xuLyXoa(record.id)}
                >
                    <Button size="small" danger icon={<FaTrash />} />
                </Popconfirm>
            ),
        },
    ];

    return (
        <LayoutV2Component>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div className="flex justify-start items-center gap-3">
                    <div className="w-[60px] h-[60px] flex justify-center items-center bg-gray-100 rounded-md shrink-0">
                        <FaExclamationTriangle className="text-2xl text-amber-500" />
                    </div>
                    <div>
                        <h2 className="font-bold text-xl text-zinc-700">ĐÁNH DẤU LOẠI TRỪ DO LỖI THIẾT BỊ</h2>
                        <p className="text-gray-500 text-sm m-0">
                            Các (Ngày, Bữa ăn, Địa điểm) máy kiosk hỏng — không tính vào "Lượt đánh giá" của Phiếu 3/4.
                        </p>
                    </div>
                </div>
                <Button type="primary" icon={<FaPlus />} onClick={moModalThem}>
                    Đánh dấu loại trừ
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-4">
                <RangePicker
                    value={khoangNgayNhap}
                    format="DD/MM/YYYY"
                    allowClear={false}
                    onChange={(values) => {
                        if (values && values[0] && values[1]) setKhoangNgayNhap([values[0], values[1]]);
                    }}
                />
                <Select
                    className="w-full sm:w-[220px]"
                    allowClear
                    placeholder="-- Tất cả địa điểm --"
                    value={diaDiemNhap}
                    onChange={(value) => setDiaDiemNhap(value)}
                >
                    {danhSachDiaDiem.map((dd) => (
                        <Select.Option key={dd.id} value={dd.id}>{dd.diaDiem}</Select.Option>
                    ))}
                </Select>
                <Select
                    className="w-full sm:w-[180px]"
                    allowClear
                    placeholder="-- Tất cả bữa ăn --"
                    value={buaAnNhap}
                    onChange={(value) => setBuaAnNhap(value)}
                >
                    {buaAnSapXep.map((b) => (
                        <Select.Option key={b.id} value={b.id}>{b.tenBuaAn}</Select.Option>
                    ))}
                </Select>
                <Button type="default" icon={<IoSearchOutline />} className="text-blue-600 border-blue-600" onClick={timKiem}>
                    Tìm kiếm
                </Button>
            </div>

            <Table
                rowKey="id"
                loading={isFetching}
                columns={columns}
                dataSource={danhSach}
                scroll={{ x: 1000 }}
            />

            <Modal
                title="Đánh dấu loại trừ (máy kiosk hỏng)"
                open={moModal}
                onCancel={() => setMoModal(false)}
                onOk={() => form.submit()}
                okButtonProps={{ loading: dangThem }}
                okText="Tiếp tục"
                cancelText="Hủy"
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={xacNhanTruocKhiLuu}>
                    <Form.Item label="Ngày" name="ngay" rules={[{ required: true, message: "Vui lòng chọn ngày!" }]}>
                        <DatePicker className="w-full" format="DD/MM/YYYY" />
                    </Form.Item>
                    <Form.Item label="Bữa ăn" name="id_BuaAn" rules={[{ required: true, message: "Vui lòng chọn bữa ăn!" }]}>
                        <Select placeholder="-- Chọn bữa ăn --">
                            {buaAnSapXep.map((b) => (
                                <Select.Option key={b.id} value={b.id}>{b.tenBuaAn}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item label="Địa điểm" name="diaDiemNhaAnId" rules={[{ required: true, message: "Vui lòng chọn địa điểm!" }]}>
                        <Select showSearch optionFilterProp="children" placeholder="-- Chọn địa điểm --">
                            {diaDiemChon.map((dd) => (
                                <Select.Option key={dd.id} value={dd.id}>{dd.diaDiem}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item label="Lý do" name="lyDo">
                        <Input.TextArea rows={3} placeholder="VD: Máy kiosk Nhà ăn A hỏng nguồn 12-15/10" />
                    </Form.Item>
                </Form>
            </Modal>
        </LayoutV2Component>
    );
};

export default KetQuaDanhGiaLoaiTruPageV2;
