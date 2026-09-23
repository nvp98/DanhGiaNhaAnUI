import { Button, Card, Checkbox, Drawer, Form, Input, Modal, Popconfirm, Select, Space, Table, TableColumnsType, Tag, Tooltip, Upload } from "antd";
import type { RcFile } from "antd/es/upload";
import React, { useEffect, useState } from "react";
import { FaKey, FaLock, FaLockOpen, FaTrash } from "react-icons/fa";
import { IoSearchOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import LayoutV2Component from "../components/LayoutV2Component";
import NguoiDungListItemModel from "../models/NguoiDungListItemModel";
import NguoiDungPhieuQuyenModel from "../models/NguoiDungPhieuQuyenModel";
import { ApiRootV2 } from "../services/LinkServerV2";
import {
    useCapNhatLuongKyNguoiDungMutation,
    useCapNhatPhieuQuyenNguoiDungMutation,
    useCapNhatVaiTroNguoiDungMutation,
    useDanhSachChuKyNguoiDungQuery,
    useDanhSachNguoiDungQuery,
    useDuyetNguoiDungMutation,
    useKhoaNguoiDungMutation,
    useKichHoatChuKyNguoiDungMutation,
    useLuongKyKhaDungNguoiDungQuery,
    useMoKhoaNguoiDungMutation,
    useResetMatKhauNguoiDungMutation,
    useTaoNguoiDungMutation,
    useTuChoiNguoiDungMutation,
    useUploadChuKyNguoiDungMutation,
    useXoaChuKyNguoiDungMutation,
    useXoaVinhVienNguoiDungMutation,
} from "../services/nguoiDungApiV2";
import { useDanhSachMauLuongKyQuery } from "../services/mauLuongKyApi";
import { useDanhSachNhaThauQuery } from "../services/nhaThauApiV2";
import { locDanhMucChon } from "../utils/danhMucHoatDong";
import { useDanhSachPhongBanQuery } from "../services/phongBanApiV2";
import { useDanhSachVaiTroQuery } from "../services/vaiTroApiV2";
import { setNotify } from "../store/notifycationSlide";
import { RootType } from "../store/types";
import { coQuyen, MA_QUYEN } from "../utils/quyenV2";
import { DS_LOAI_PHIEU, tenLoaiPhieu } from "./NhomTieuChiPage";

const DS_TRANG_THAI = [
    { value: "CHO_DUYET", label: "Chờ duyệt", color: "warning" },
    { value: "HOAT_DONG", label: "Hoạt động", color: "success" },
    { value: "KHOA", label: "Đã khóa", color: "error" },
];

const DUOI_CHU_KY_CHO_PHEP = ["image/png", "image/jpeg"];
const DUNG_LUONG_CHU_KY_TOI_DA = 2 * 1024 * 1024; // 2MB

const tenTrangThai = (trangThai: string) => DS_TRANG_THAI.find(t => t.value === trangThai)?.label ?? trangThai;
const mauTrangThai = (trangThai: string) => DS_TRANG_THAI.find(t => t.value === trangThai)?.color ?? "default";

const QuanLyTaiKhoanPageV2: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    // Mặc định vào trang là xem TẤT CẢ trạng thái (không chỉ riêng CHO_DUYET).
    const [locTrangThai, setLocTrangThai] = useState<string | undefined>(undefined);
    const [searchText, setSearchText] = useState("");

    const { data: danhSachNguoiDung = [], isFetching } = useDanhSachNguoiDungQuery({ trangThai: locTrangThai });
    const { data: danhSachPhongBan = [] } = useDanhSachPhongBanQuery();
    const { data: danhSachNhaThau = [] } = useDanhSachNhaThauQuery();
    const { data: danhSachVaiTro = [] } = useDanhSachVaiTroQuery();

    const [duyetNguoiDung] = useDuyetNguoiDungMutation();
    const [tuChoiNguoiDung] = useTuChoiNguoiDungMutation();
    const [khoaNguoiDung] = useKhoaNguoiDungMutation();
    const [moKhoaNguoiDung] = useMoKhoaNguoiDungMutation();
    const [xoaVinhVien] = useXoaVinhVienNguoiDungMutation();
    const [capNhatVaiTro, { isLoading: dangLuuVaiTro }] = useCapNhatVaiTroNguoiDungMutation();
    const [taoNguoiDung, { isLoading: dangTao }] = useTaoNguoiDungMutation();
    const [resetMatKhau] = useResetMatKhauNguoiDungMutation();

    const [moModalVaiTro, setMoModalVaiTro] = useState(false);
    const [nguoiDungDangGan, setNguoiDungDangGan] = useState<NguoiDungListItemModel | null>(null);
    const [vaiTroDaChon, setVaiTroDaChon] = useState<number[]>([]);

    const [moModalTao, setMoModalTao] = useState(false);
    const [formTao] = Form.useForm();

    const [nguoiDungXemChiTiet, setNguoiDungXemChiTiet] = useState<NguoiDungListItemModel | null>(null);
    const [nguoiDungDangPhanQuyenPhieu, setNguoiDungDangPhanQuyenPhieu] = useState<NguoiDungListItemModel | null>(null);

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        } else if (!coQuyen(authV2.nguoiDung, MA_QUYEN.QUAN_LY_TAI_KHOAN)) {
            navigator("/v2");
        }
    }, []);

    if (!authV2.isAuthenticated || !coQuyen(authV2.nguoiDung, MA_QUYEN.QUAN_LY_TAI_KHOAN)) {
        return null;
    }

    const tenPhongBan = (id?: number) => danhSachPhongBan.find(pb => pb.id === id)?.ten ?? "";
    const tenNhaThau = (id?: number) => danhSachNhaThau.find(nt => nt.id === id)?.ten ?? "";

    const tuKhoa = searchText.trim().toLowerCase();
    const danhSachDaLoc = tuKhoa
        ? danhSachNguoiDung.filter(nd =>
            `${nd.tenDangNhap} ${nd.hoTen} ${nd.email ?? ""} ${nd.soDienThoai ?? ""}`.toLowerCase().includes(tuKhoa)
        )
        : danhSachNguoiDung;

    const goiHanhDong = async (fn: () => Promise<any>, thanhCong: string, thatBaiMacDinh: string) => {
        try {
            await fn();
            dispatch(setNotify({ typeNotify: "success", titleNotify: thanhCong, messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || thatBaiMacDinh, messageNotify: "" }));
        }
    };

    const moModalGanVaiTro = (nguoiDung: NguoiDungListItemModel) => {
        setNguoiDungDangGan(nguoiDung);
        setVaiTroDaChon(danhSachVaiTro.filter(vt => nguoiDung.danhSachVaiTro.includes(vt.ma)).map(vt => vt.id));
        setMoModalVaiTro(true);
    };

    const luuVaiTro = async () => {
        if (!nguoiDungDangGan) return;
        try {
            await capNhatVaiTro({ id: nguoiDungDangGan.id, vaiTroIds: vaiTroDaChon }).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Cập nhật vai trò thành công", messageNotify: "" }));
            setMoModalVaiTro(false);
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Cập nhật vai trò thất bại", messageNotify: "" }));
        }
    };

    const xuLyTaoTaiKhoan = async (values: any) => {
        try {
            await taoNguoiDung({
                tenDangNhap: values.tenDangNhap,
                matKhau: values.matKhau,
                hoTen: values.hoTen,
                email: values.email || undefined,
                soDienThoai: values.soDienThoai || undefined,
                phongBanId: values.phongBanId || undefined,
                nhaThauId: values.nhaThauId || undefined,
                vaiTroIds: values.vaiTroIds || [],
            }).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Tạo tài khoản thành công", messageNotify: "" }));
            setMoModalTao(false);
            formTao.resetFields();
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Tạo tài khoản thất bại", messageNotify: "" }));
        }
    };

    const columns: TableColumnsType<NguoiDungListItemModel> = [
        {
            title: 'Tên đăng nhập',
            dataIndex: 'tenDangNhap',
            key: 'tenDangNhap',
            width: 150,
            render: (tenDangNhap, record) => (
                <a onClick={() => setNguoiDungXemChiTiet(record)}>{tenDangNhap}</a>
            ),
        },
        {
            title: 'Họ tên',
            dataIndex: 'hoTen',
            key: 'hoTen',
        },
        {
            title: 'Email / SĐT',
            key: 'lienHe',
            render: (_, record) => <div>
                <div>{record.email || "--"}</div>
                <div className="text-gray-400">{record.soDienThoai || ""}</div>
            </div>,
        },
        {
            title: 'Phòng ban / Nhà thầu',
            key: 'phongBanNhaThau',
            render: (_, record) => <div>
                <div>{record.phongBanId ? tenPhongBan(record.phongBanId) : "--"}</div>
                {record.nhaThauId ? <div className="text-gray-400">{tenNhaThau(record.nhaThauId)}</div> : null}
            </div>,
        },
        {
            title: 'Vai trò',
            dataIndex: 'danhSachVaiTro',
            key: 'danhSachVaiTro',
            render: (danhSachVaiTro: string[]) => danhSachVaiTro.map(vt => <Tag key={vt} color="blue">{vt}</Tag>),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            key: 'trangThai',
            width: 130,
            render: (trangThai) => <Tag color={mauTrangThai(trangThai)}>{tenTrangThai(trangThai)}</Tag>,
        },
        {
            title: '',
            key: 'actions',
            width: 420,
            render: (_, record) => (
                <Space wrap>
                    {record.trangThai === "CHO_DUYET" && <>
                        <Popconfirm
                            title="Duyệt tài khoản"
                            description={`Duyệt tài khoản "${record.tenDangNhap}"?`}
                            okText="Duyệt"
                            cancelText="Hủy"
                            onConfirm={() => goiHanhDong(() => duyetNguoiDung(record.id).unwrap(), "Đã duyệt tài khoản", "Duyệt tài khoản thất bại")}
                        >
                            <Button size="small" type="primary">Duyệt</Button>
                        </Popconfirm>
                        <Popconfirm
                            title="Từ chối đăng ký"
                            description={`Xóa hẳn đăng ký của "${record.tenDangNhap}"? Không thể hoàn tác.`}
                            okText="Từ chối"
                            cancelText="Hủy"
                            onConfirm={() => goiHanhDong(() => tuChoiNguoiDung(record.id).unwrap(), "Đã từ chối đăng ký", "Từ chối đăng ký thất bại")}
                        >
                            <Button size="small" danger>Từ chối</Button>
                        </Popconfirm>
                    </>}
                    {record.trangThai === "HOAT_DONG" && (
                        <Popconfirm
                            title="Khóa tài khoản"
                            description={`Khóa tài khoản "${record.tenDangNhap}"?`}
                            okText="Khóa"
                            cancelText="Hủy"
                            onConfirm={() => goiHanhDong(() => khoaNguoiDung(record.id).unwrap(), "Đã khóa tài khoản", "Khóa tài khoản thất bại")}
                        >
                            <Button size="small" danger icon={<FaLock />}>Khóa</Button>
                        </Popconfirm>
                    )}
                    {record.trangThai === "KHOA" && (
                        <Popconfirm
                            title="Mở khóa tài khoản"
                            description={`Mở khóa tài khoản "${record.tenDangNhap}"?`}
                            okText="Mở khóa"
                            cancelText="Hủy"
                            onConfirm={() => goiHanhDong(() => moKhoaNguoiDung(record.id).unwrap(), "Đã mở khóa tài khoản", "Mở khóa tài khoản thất bại")}
                        >
                            <Button size="small" icon={<FaLockOpen />}>Mở khóa</Button>
                        </Popconfirm>
                    )}
                    <Button size="small" onClick={() => moModalGanVaiTro(record)}>Gán vai trò</Button>
                    <Button size="small" onClick={() => setNguoiDungDangPhanQuyenPhieu(record)}>Phân quyền theo Phiếu</Button>
                    <Popconfirm
                        title="Reset mật khẩu"
                        description={`Đặt lại mật khẩu của "${record.tenDangNhap}" về mặc định "HPDQ@1234"?`}
                        okText="Reset"
                        cancelText="Hủy"
                        onConfirm={() => goiHanhDong(() => resetMatKhau(record.id).unwrap(), "Đã đặt lại mật khẩu về mặc định", "Reset mật khẩu thất bại")}
                    >
                        <Button size="small" icon={<FaKey />}>Reset mật khẩu</Button>
                    </Popconfirm>
                    <Button size="small" onClick={() => setNguoiDungXemChiTiet(record)}>Chi tiết</Button>
                    {record.trangThai !== "CHO_DUYET" && record.id !== authV2.nguoiDung?.id && (
                        <Popconfirm
                            title="Xóa vĩnh viễn tài khoản"
                            description={`Xóa HẲN tài khoản "${record.tenDangNhap}" khỏi hệ thống? Không thể hoàn tác. Sẽ bị từ chối nếu tài khoản đã lập/ký phiếu — khóa tài khoản thay vì xóa trong trường hợp đó.`}
                            okText="Xóa vĩnh viễn"
                            okButtonProps={{ danger: true }}
                            cancelText="Hủy"
                            onConfirm={() => goiHanhDong(() => xoaVinhVien(record.id).unwrap(), "Đã xóa vĩnh viễn tài khoản", "Xóa vĩnh viễn thất bại")}
                        >
                            <Button size="small" danger icon={<FaTrash />}>Xóa vĩnh viễn</Button>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    return <LayoutV2Component>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className="font-bold text-xl text-zinc-700">QUẢN LÝ TÀI KHOẢN</h2>
            <Button type="primary" onClick={() => setMoModalTao(true)}>Tạo tài khoản</Button>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
            <Input
                className="w-full sm:w-[280px]"
                allowClear
                placeholder="Tìm theo tên đăng nhập/họ tên/email/SĐT..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<IoSearchOutline className="text-gray-400" />}
            />
            <Select
                className="w-full sm:w-[220px]"
                allowClear
                placeholder="-- Tất cả trạng thái --"
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
            scroll={{ x: 1100 }}
        />

        {/* Modal gán vai trò */}
        <Modal
            title={`Gán vai trò — ${nguoiDungDangGan?.hoTen ?? ""}`}
            open={moModalVaiTro}
            onCancel={() => setMoModalVaiTro(false)}
            onOk={luuVaiTro}
            okButtonProps={{ loading: dangLuuVaiTro }}
            okText="Lưu"
            cancelText="Hủy"
            destroyOnClose
        >
            <Checkbox.Group
                className="flex flex-col gap-2"
                value={vaiTroDaChon}
                onChange={(values) => setVaiTroDaChon(values as number[])}
            >
                {danhSachVaiTro.map(vt => (
                    <Checkbox key={vt.id} value={vt.id}>{vt.ten}{vt.laQuanTriVien ? " (Quản trị viên — toàn quyền)" : ""}</Checkbox>
                ))}
            </Checkbox.Group>
        </Modal>

        {/* Modal tạo tài khoản */}
        <Modal
            title="Tạo tài khoản mới"
            open={moModalTao}
            onCancel={() => setMoModalTao(false)}
            onOk={() => formTao.submit()}
            okButtonProps={{ loading: dangTao }}
            okText="Tạo tài khoản"
            cancelText="Hủy"
            destroyOnClose
        >
            <Form form={formTao} layout="vertical" onFinish={xuLyTaoTaiKhoan}>
                <Form.Item label="Tên đăng nhập" name="tenDangNhap" rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập!" }]}>
                    <Input />
                </Form.Item>

                <Form.Item label="Mật khẩu" name="matKhau" rules={[{ required: true, min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" }]}>
                    <Input.Password />
                </Form.Item>

                <Form.Item label="Họ tên" name="hoTen" rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}>
                    <Input />
                </Form.Item>

                <Form.Item label="Email" name="email" rules={[{ type: "email", message: "Email không hợp lệ!" }]}>
                    <Input />
                </Form.Item>

                <Form.Item label="Số điện thoại" name="soDienThoai">
                    <Input />
                </Form.Item>

                <Form.Item label="Phòng ban" name="phongBanId">
                    <Select allowClear placeholder="-- Chọn phòng ban --" showSearch optionFilterProp="children">
                        {locDanhMucChon(danhSachPhongBan).map(pb => (
                            <Select.Option key={pb.id} value={pb.id}>{pb.ten}</Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item label="Nhà thầu (nếu là tài khoản nhà thầu)" name="nhaThauId">
                    <Select allowClear placeholder="-- Chọn nhà thầu --" showSearch optionFilterProp="children">
                        {locDanhMucChon(danhSachNhaThau).map(nt => (
                            <Select.Option key={nt.id} value={nt.id}>{nt.ten}</Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item label="Vai trò" name="vaiTroIds">
                    <Checkbox.Group className="flex flex-col gap-2">
                        {danhSachVaiTro.map(vt => (
                            <Checkbox key={vt.id} value={vt.id}>{vt.ten}{vt.laQuanTriVien ? " (Quản trị viên — toàn quyền)" : ""}</Checkbox>
                        ))}
                    </Checkbox.Group>
                </Form.Item>
            </Form>
        </Modal>

        {/* Drawer chi tiết tài khoản + quản lý chữ ký */}
        <ChiTietTaiKhoanDrawer
            nguoiDung={nguoiDungXemChiTiet}
            tenPhongBan={tenPhongBan}
            tenNhaThau={tenNhaThau}
            onDong={() => setNguoiDungXemChiTiet(null)}
        />

        {/* Modal Phân quyền theo Phiếu — ký + đánh giá/quản lý tiêu chí, tách
            biệt hoàn toàn khỏi Vai trò (chỉ còn dùng cho quyền quản trị). */}
        <PhanQuyenPhieuModal
            nguoiDung={nguoiDungDangPhanQuyenPhieu}
            onDong={() => setNguoiDungDangPhanQuyenPhieu(null)}
        />
    </LayoutV2Component>;
};

interface ChiTietTaiKhoanDrawerProps {
    nguoiDung: NguoiDungListItemModel | null;
    tenPhongBan: (id?: number) => string;
    tenNhaThau: (id?: number) => string;
    onDong: () => void;
}

const ChiTietTaiKhoanDrawer: React.FC<ChiTietTaiKhoanDrawerProps> = ({ nguoiDung, tenPhongBan, tenNhaThau, onDong }) => {
    const dispatch = useDispatch();
    const id = nguoiDung?.id;

    const { data: danhSachChuKy = [], isFetching: dangTaiChuKy } = useDanhSachChuKyNguoiDungQuery(id!, { skip: !id });
    const [uploadChuKy, { isLoading: dangUpload }] = useUploadChuKyNguoiDungMutation();
    const [kichHoatChuKy] = useKichHoatChuKyNguoiDungMutation();
    const [xoaChuKy] = useXoaChuKyNguoiDungMutation();

    // Tra tên bước ký từ ID (danhSachMauLuongKyId chỉ là số) — dùng danh sách
    // TẤT CẢ luồng ký (không lọc loaiPhieu) để hiển thị tóm tắt "Phân quyền
    // theo Phiếu" ngay trong Chi tiết, không cần mở modal mới thấy được đã
    // gán gì (xem yêu cầu: modal cũ không lưu vết rõ ràng khi mở lại).
    const { data: tatCaMauLuongKy = [] } = useDanhSachMauLuongKyQuery();
    const buocKyDaGan = (nguoiDung?.danhSachMauLuongKyId ?? [])
        .map(mlkId => tatCaMauLuongKy.find(m => m.id === mlkId))
        .filter((m): m is NonNullable<typeof m> => !!m);

    const xuLyUpload = async (file: RcFile): Promise<boolean> => {
        if (!id) return false;
        if (!DUOI_CHU_KY_CHO_PHEP.includes(file.type)) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: "Chỉ chấp nhận file ảnh .png, .jpg, .jpeg", messageNotify: "" }));
            return false;
        }
        if (file.size > DUNG_LUONG_CHU_KY_TOI_DA) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: "File chữ ký vượt quá 2MB", messageNotify: "" }));
            return false;
        }

        try {
            await uploadChuKy({ id, file }).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã tải lên chữ ký mới", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Tải lên chữ ký thất bại", messageNotify: "" }));
        }
        return false; // ngăn Upload tự gửi request riêng, đã xử lý bằng RTK Query ở trên
    };

    const xuLyKichHoat = async (chuKyId: number) => {
        if (!id) return;
        try {
            await kichHoatChuKy({ id, chuKyId }).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã đặt làm chữ ký hiện hành", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Đặt chữ ký hiện hành thất bại", messageNotify: "" }));
        }
    };

    const xuLyXoaChuKy = async (chuKyId: number) => {
        if (!id) return;
        try {
            await xoaChuKy({ id, chuKyId }).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã xóa chữ ký", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Xóa chữ ký thất bại", messageNotify: "" }));
        }
    };

    return (
        <Drawer
            title={`Chi tiết tài khoản — ${nguoiDung?.hoTen ?? ""}`}
            open={!!nguoiDung}
            onClose={onDong}
            width="min(520px, 100vw)"
            destroyOnClose
        >
            {nguoiDung && (
                <div className="flex flex-col gap-5">
                    <Card size="small" title="Thông tin tài khoản">
                        <div className="flex flex-col gap-2">
                            <div><span className="text-gray-400">Tên đăng nhập:</span> {nguoiDung.tenDangNhap}</div>
                            <div><span className="text-gray-400">Họ tên:</span> {nguoiDung.hoTen}</div>
                            <div><span className="text-gray-400">Email:</span> {nguoiDung.email || "--"}</div>
                            <div><span className="text-gray-400">Số điện thoại:</span> {nguoiDung.soDienThoai || "--"}</div>
                            <div><span className="text-gray-400">Phòng ban:</span> {nguoiDung.phongBanId ? tenPhongBan(nguoiDung.phongBanId) : "--"}</div>
                            <div><span className="text-gray-400">Nhà thầu:</span> {nguoiDung.nhaThauId ? tenNhaThau(nguoiDung.nhaThauId) : "--"}</div>
                            <div><span className="text-gray-400">Trạng thái:</span> <Tag color={mauTrangThai(nguoiDung.trangThai)}>{tenTrangThai(nguoiDung.trangThai)}</Tag></div>
                            <div>
                                <span className="text-gray-400">Vai trò:</span>{" "}
                                {nguoiDung.danhSachVaiTro.length > 0
                                    ? nguoiDung.danhSachVaiTro.map(vt => <Tag key={vt} color="blue">{vt}</Tag>)
                                    : "--"}
                            </div>
                        </div>
                    </Card>

                    <Card size="small" title="Phân quyền theo Phiếu">
                        <div className="flex flex-col gap-3">
                            {DS_LOAI_PHIEU.map(t => {
                                const quyen = nguoiDung.phieuQuyen.find(pq => pq.loaiPhieu === t.value);
                                const buocCuaPhieu = buocKyDaGan
                                    .filter(b => b.loaiPhieu === t.value)
                                    .sort((a, b) => a.buocThuTu - b.buocThuTu);
                                const coGiDo = quyen?.duocDanhGia || quyen?.duocQuanLyTieuChi || buocCuaPhieu.length > 0;

                                return (
                                    <div key={t.value}>
                                        <div className="font-medium text-sm">{tenLoaiPhieu(t.value)}</div>
                                        {coGiDo ? (
                                            <div className="flex flex-col gap-1 mt-1">
                                                <div className="flex flex-wrap gap-1">
                                                    {quyen?.duocDanhGia && <Tag color="blue">Đánh giá / nhập liệu</Tag>}
                                                    {quyen?.duocQuanLyTieuChi && <Tag color="purple">Quản lý tiêu chí</Tag>}
                                                </div>
                                                {buocCuaPhieu.map(b => (
                                                    <Tag key={b.id} color="green" className="w-fit">
                                                        Ký — Bước {b.buocThuTu}: {b.tenBuoc}
                                                    </Tag>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-gray-400 text-sm">-- Chưa phân quyền --</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    <Card
                        size="small"
                        title="Chữ ký"
                        extra={
                            <Upload accept=".png,.jpg,.jpeg" showUploadList={false} beforeUpload={xuLyUpload}>
                                <Button size="small" type="primary" loading={dangUpload}>Tải lên chữ ký mới</Button>
                            </Upload>
                        }
                    >
                        {dangTaiChuKy ? <div>Đang tải...</div> : (
                            <div className="grid grid-cols-2 gap-3">
                                {danhSachChuKy.map(ck => (
                                    <Card
                                        key={ck.id}
                                        size="small"
                                        cover={<img src={`${ApiRootV2}${ck.duongDanChuKy}`} className="h-[100px] object-contain p-2 bg-white" />}
                                        actions={ck.dangSuDung ? undefined : [
                                            <Button key="kich-hoat" size="small" type="link" onClick={() => xuLyKichHoat(ck.id)}>Đặt làm hiện hành</Button>,
                                            <Popconfirm
                                                key="xoa"
                                                title="Xóa chữ ký"
                                                description="Xóa chữ ký này? Không thể hoàn tác."
                                                okText="Xóa"
                                                okButtonProps={{ danger: true }}
                                                cancelText="Hủy"
                                                onConfirm={() => xuLyXoaChuKy(ck.id)}
                                            >
                                                <Button size="small" type="link" danger icon={<FaTrash />} />
                                            </Popconfirm>,
                                        ]}
                                    >
                                        {ck.dangSuDung && <Tag color="success">Đang sử dụng</Tag>}
                                    </Card>
                                ))}
                                {danhSachChuKy.length === 0 && <div className="text-gray-400 col-span-2">Chưa có chữ ký nào.</div>}
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </Drawer>
    );
};

interface PhanQuyenPhieuModalProps {
    nguoiDung: NguoiDungListItemModel | null;
    onDong: () => void;
}

// Khối "Phân quyền theo Phiếu": Ký (gán trực tiếp vào bước MauLuongKy, chỉ
// hiện các bước đủ điều kiện cấu trúc phòng ban/nhà thầu của user) + Đánh
// giá/Quản lý tiêu chí (theo LoaiPhieu, không liên quan gì tới Vai trò) —
// xem 02. Phantich/modules/VaiTro.md mục 9.
const PhanQuyenPhieuModal: React.FC<PhanQuyenPhieuModalProps> = ({ nguoiDung, onDong }) => {
    const dispatch = useDispatch();
    const id = nguoiDung?.id;

    const { data: buocKhaDung = [], isFetching } = useLuongKyKhaDungNguoiDungQuery(id!, { skip: !id });
    const [capNhatLuongKy, { isLoading: dangLuuLuongKy }] = useCapNhatLuongKyNguoiDungMutation();
    const [capNhatPhieuQuyen, { isLoading: dangLuuPhieuQuyen }] = useCapNhatPhieuQuyenNguoiDungMutation();

    const [mauLuongKyDaChon, setMauLuongKyDaChon] = useState<number[]>([]);
    const [phieuQuyenDaChon, setPhieuQuyenDaChon] = useState<Record<string, { duocDanhGia: boolean; duocQuanLyTieuChi: boolean }>>({});

    useEffect(() => {
        if (!nguoiDung) return;
        setMauLuongKyDaChon(nguoiDung.danhSachMauLuongKyId ?? []);
        const map: Record<string, { duocDanhGia: boolean; duocQuanLyTieuChi: boolean }> = {};
        DS_LOAI_PHIEU.forEach(t => { map[t.value] = { duocDanhGia: false, duocQuanLyTieuChi: false }; });
        (nguoiDung.phieuQuyen ?? []).forEach(pq => {
            map[pq.loaiPhieu] = { duocDanhGia: pq.duocDanhGia, duocQuanLyTieuChi: pq.duocQuanLyTieuChi };
        });
        setPhieuQuyenDaChon(map);
    }, [nguoiDung]);

    const toggleBuocKy = (mauLuongKyId: number, checked: boolean) => {
        setMauLuongKyDaChon(prev => checked ? [...prev, mauLuongKyId] : prev.filter(x => x !== mauLuongKyId));
    };

    const toggleQuyenPhieu = (loaiPhieu: string, field: "duocDanhGia" | "duocQuanLyTieuChi", checked: boolean) => {
        setPhieuQuyenDaChon(prev => ({ ...prev, [loaiPhieu]: { ...prev[loaiPhieu], [field]: checked } }));
    };

    const luu = async () => {
        if (!id) return;
        try {
            // Chỉ gửi lên đúng những gì ĐANG HIỆN trong modal (nằm trong
            // loaiPhieuApDung — trần phòng ban/nhà thầu hiện tại) — không gửi
            // lại nguyên trạng thái cũ. Vì "Lưu" là THAY THẾ TOÀN BỘ
            // (CapNhatPhieuQuyenAsync/CapNhatLuongKyAsync), nếu phòng ban vừa
            // bị thu hẹp trần (VD không còn xử lý Phiếu 2 nữa) mà vẫn gửi lại
            // dữ liệu Phiếu 2 cũ (đã ẩn khỏi UI nhưng còn sót trong state) thì
            // backend sẽ từ chối CẢ request — tự lọc ở đây để dữ liệu ngoài
            // trần cũ tự bị dọn (xóa) ngay lần Lưu tiếp theo, không cần Admin
            // reset tay từng tài khoản.
            const loaiPhieuApDung = nguoiDung?.loaiPhieuApDung ?? [];
            const mauLuongKyHopLe = mauLuongKyDaChon.filter(mlkId => {
                const buoc = buocKhaDung.find(b => b.mauLuongKyId === mlkId);
                return !buoc || loaiPhieuApDung.includes(buoc.loaiPhieu);
            });
            await capNhatLuongKy({ id, mauLuongKyIds: mauLuongKyHopLe }).unwrap();

            const danhSach: NguoiDungPhieuQuyenModel[] = DS_LOAI_PHIEU
                .filter(t => loaiPhieuApDung.includes(t.value))
                .map(t => ({
                    loaiPhieu: t.value,
                    duocDanhGia: !!phieuQuyenDaChon[t.value]?.duocDanhGia,
                    duocQuanLyTieuChi: !!phieuQuyenDaChon[t.value]?.duocQuanLyTieuChi,
                }));
            await capNhatPhieuQuyen({ id, danhSach }).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Cập nhật phân quyền theo Phiếu thành công", messageNotify: "" }));
            onDong();
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Cập nhật phân quyền thất bại", messageNotify: "" }));
        }
    };

    return (
        <Modal
            title={`Phân quyền theo Phiếu — ${nguoiDung?.hoTen ?? ""}`}
            open={!!nguoiDung}
            onCancel={onDong}
            onOk={luu}
            okButtonProps={{ loading: dangLuuLuongKy || dangLuuPhieuQuyen }}
            okText="Lưu"
            cancelText="Hủy"
            width={640}
            destroyOnClose
        >
            <div className="flex flex-col gap-4">
                {DS_LOAI_PHIEU
                    // Chỉ hiện Card của loại phiếu nằm trong "trần" phòng
                    // ban/nhà thầu của tài khoản này (loaiPhieuApDung) — VD
                    // phòng ban chỉ xử lý Phiếu 1 thì các Card còn lại ẩn hẳn,
                    // không hiện ra rồi disable (xem VaiTro.md mục 10).
                    .filter(t => (nguoiDung?.loaiPhieuApDung ?? []).includes(t.value))
                    .map(t => {
                        // Phiếu 3, Phiếu 4 không còn luồng ký — chỉ Phiếu 1, Phiếu 2 mới có bước ký.
                        const buocCuaPhieu = (t.value === "PHIEU3" || t.value === "PHIEU4")
                            ? []
                            : buocKhaDung.filter(b => b.loaiPhieu === t.value);
                        const quyen = phieuQuyenDaChon[t.value] ?? { duocDanhGia: false, duocQuanLyTieuChi: false };
                        // Nhà thầu chỉ có quyền Ký/Từ chối — không bao giờ có
                        // Đánh giá/nhập liệu hay Quản lý tiêu chí (backend chặn
                        // 403 nếu cố lưu, xem NguoiDungService.CapNhatPhieuQuyenAsync).
                        const laNhaThau = !!nguoiDung?.nhaThauId;
                        return (
                            <Card key={t.value} size="small" title={tenLoaiPhieu(t.value)} loading={isFetching}>
                                <div className="flex flex-col gap-2">
                                    {!laNhaThau && (
                                        <div className="flex gap-4">
                                            <Checkbox
                                                checked={quyen.duocDanhGia}
                                                onChange={(e) => toggleQuyenPhieu(t.value, "duocDanhGia", e.target.checked)}
                                            >
                                                Đánh giá / nhập liệu
                                            </Checkbox>
                                            <Checkbox
                                                checked={quyen.duocQuanLyTieuChi}
                                                onChange={(e) => toggleQuyenPhieu(t.value, "duocQuanLyTieuChi", e.target.checked)}
                                            >
                                                Quản lý tiêu chí
                                            </Checkbox>
                                        </div>
                                    )}

                                    {buocCuaPhieu.length > 0 && (
                                        <div>
                                            <div className="text-gray-400 text-sm mb-1">Ký:</div>
                                            <div className="flex flex-col gap-1">
                                                {buocCuaPhieu.map(b => {
                                                    const duDieuKien = b.duDieuKienCauTruc && b.duDieuKienPhongBan;
                                                    const o = (
                                                        <Checkbox
                                                            key={b.mauLuongKyId}
                                                            disabled={!duDieuKien}
                                                            checked={mauLuongKyDaChon.includes(b.mauLuongKyId)}
                                                            onChange={(e) => toggleBuocKy(b.mauLuongKyId, e.target.checked)}
                                                        >
                                                            Bước {b.buocThuTu} — {b.tenBuoc}
                                                        </Checkbox>
                                                    );
                                                    if (duDieuKien) return o;
                                                    const lyDo = !b.duDieuKienCauTruc
                                                        ? "Không đủ điều kiện phòng ban/nhà thầu cho bước này"
                                                        : "Phòng ban/Nhà thầu của tài khoản không xử lý loại phiếu này";
                                                    return (
                                                        <Tooltip key={b.mauLuongKyId} title={lyDo}>
                                                            {o}
                                                        </Tooltip>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
            </div>
        </Modal>
    );
};

export default QuanLyTaiKhoanPageV2;
