import { Button, Card, Checkbox, Drawer, Form, Input, Modal, Popconfirm, Select, Space, Table, TableColumnsType, Tag, Upload } from "antd";
import type { RcFile } from "antd/es/upload";
import React, { useEffect, useState } from "react";
import { FaKey, FaLock, FaLockOpen } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import LayoutV2Component from "../components/LayoutV2Component";
import NguoiDungListItemModel from "../models/NguoiDungListItemModel";
import { ApiRootV2 } from "../services/LinkServerV2";
import {
    useCapNhatVaiTroNguoiDungMutation,
    useDanhSachChuKyNguoiDungQuery,
    useDanhSachNguoiDungQuery,
    useDuyetNguoiDungMutation,
    useKhoaNguoiDungMutation,
    useKichHoatChuKyNguoiDungMutation,
    useMoKhoaNguoiDungMutation,
    useResetMatKhauNguoiDungMutation,
    useTaoNguoiDungMutation,
    useTuChoiNguoiDungMutation,
    useUploadChuKyNguoiDungMutation,
} from "../services/nguoiDungApiV2";
import { useDanhSachNhaThauQuery } from "../services/nhaThauApiV2";
import { useDanhSachPhongBanQuery } from "../services/phongBanApiV2";
import { useDanhSachVaiTroQuery } from "../services/vaiTroApiV2";
import { setNotify } from "../store/notifycationSlide";
import { RootType } from "../store/types";

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

    const { data: danhSachNguoiDung = [], isFetching } = useDanhSachNguoiDungQuery({ trangThai: locTrangThai });
    const { data: danhSachPhongBan = [] } = useDanhSachPhongBanQuery();
    const { data: danhSachNhaThau = [] } = useDanhSachNhaThauQuery();
    const { data: danhSachVaiTro = [] } = useDanhSachVaiTroQuery();

    const [duyetNguoiDung] = useDuyetNguoiDungMutation();
    const [tuChoiNguoiDung] = useTuChoiNguoiDungMutation();
    const [khoaNguoiDung] = useKhoaNguoiDungMutation();
    const [moKhoaNguoiDung] = useMoKhoaNguoiDungMutation();
    const [capNhatVaiTro, { isLoading: dangLuuVaiTro }] = useCapNhatVaiTroNguoiDungMutation();
    const [taoNguoiDung, { isLoading: dangTao }] = useTaoNguoiDungMutation();
    const [resetMatKhau] = useResetMatKhauNguoiDungMutation();

    const [moModalVaiTro, setMoModalVaiTro] = useState(false);
    const [nguoiDungDangGan, setNguoiDungDangGan] = useState<NguoiDungListItemModel | null>(null);
    const [vaiTroDaChon, setVaiTroDaChon] = useState<number[]>([]);

    const [moModalTao, setMoModalTao] = useState(false);
    const [formTao] = Form.useForm();

    const [nguoiDungXemChiTiet, setNguoiDungXemChiTiet] = useState<NguoiDungListItemModel | null>(null);

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        }
    }, []);

    if (!authV2.isAuthenticated) {
        return null;
    }

    const tenPhongBan = (id?: number) => danhSachPhongBan.find(pb => pb.id === id)?.ten ?? "";
    const tenNhaThau = (id?: number) => danhSachNhaThau.find(nt => nt.id === id)?.ten ?? "";

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
                </Space>
            ),
        },
    ];

    return <LayoutV2Component>
        <div className="flex justify-between items-center gap-3 mb-6">
            <h2 className="font-bold text-xl text-zinc-700">QUẢN LÝ TÀI KHOẢN</h2>
            <Button type="primary" onClick={() => setMoModalTao(true)}>Tạo tài khoản</Button>
        </div>

        <div className="flex gap-3 mb-4">
            <Select
                className="w-[220px]"
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
            dataSource={danhSachNguoiDung}
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
                    <Checkbox key={vt.id} value={vt.id}>{vt.ten}{vt.coQuyenDuyetTk ? " (có quyền duyệt TK)" : ""}</Checkbox>
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
                        {danhSachPhongBan.map(pb => (
                            <Select.Option key={pb.id} value={pb.id}>{pb.ten}</Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item label="Nhà thầu (nếu là tài khoản nhà thầu)" name="nhaThauId">
                    <Select allowClear placeholder="-- Chọn nhà thầu --" showSearch optionFilterProp="children">
                        {danhSachNhaThau.map(nt => (
                            <Select.Option key={nt.id} value={nt.id}>{nt.ten}</Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item label="Vai trò" name="vaiTroIds">
                    <Checkbox.Group className="flex flex-col gap-2">
                        {danhSachVaiTro.map(vt => (
                            <Checkbox key={vt.id} value={vt.id}>{vt.ten}{vt.coQuyenDuyetTk ? " (có quyền duyệt TK)" : ""}</Checkbox>
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

    return (
        <Drawer
            title={`Chi tiết tài khoản — ${nguoiDung?.hoTen ?? ""}`}
            open={!!nguoiDung}
            onClose={onDong}
            width={520}
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
                                            <Button key="kich-hoat" size="small" type="link" onClick={() => xuLyKichHoat(ck.id)}>Đặt làm hiện hành</Button>
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

export default QuanLyTaiKhoanPageV2;
