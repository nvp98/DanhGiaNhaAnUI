import { Button, Card, Form, Input, Popconfirm, Tag, Upload } from "antd";
import type { RcFile } from "antd/es/upload";
import React, { useEffect } from "react";
import { FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import LayoutV2Component from "../components/LayoutV2Component";
import { useDanhSachChuKyQuery, useKichHoatChuKyMutation, useUploadChuKyMutation, useXoaChuKyMutation } from "../services/chuKyApiV2";
import { ApiRootV2 } from "../services/LinkServerV2";
import { useDanhSachNhaThauQuery } from "../services/nhaThauApiV2";
import { useDanhSachPhongBanQuery } from "../services/phongBanApiV2";
import { useCapNhatProfileMutation, useDoiMatKhauMutation } from "../services/profileApiV2";
import { setNotify } from "../store/notifycationSlide";
import { RootType } from "../store/types";

const DUOI_CHO_PHEP = ["image/png", "image/jpeg"];
const DUNG_LUONG_TOI_DA = 2 * 1024 * 1024; // 2MB

const ProfilePageV2: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    const { data: danhSachPhongBan = [] } = useDanhSachPhongBanQuery();
    const { data: danhSachNhaThau = [] } = useDanhSachNhaThauQuery();

    const { data: danhSachChuKy = [], isFetching } = useDanhSachChuKyQuery();
    const [uploadChuKy, { isLoading: dangUpload }] = useUploadChuKyMutation();
    const [kichHoatChuKy] = useKichHoatChuKyMutation();
    const [xoaChuKy] = useXoaChuKyMutation();

    const [capNhatProfile, { isLoading: dangLuuThongTin }] = useCapNhatProfileMutation();
    const [doiMatKhau, { isLoading: dangDoiMatKhau }] = useDoiMatKhauMutation();

    const [formThongTin] = Form.useForm();
    const [formMatKhau] = Form.useForm();

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        }
    }, []);

    useEffect(() => {
        if (authV2.nguoiDung) {
            formThongTin.setFieldsValue({
                hoTen: authV2.nguoiDung.hoTen,
                email: authV2.nguoiDung.email,
                soDienThoai: authV2.nguoiDung.soDienThoai,
            });
        }
    }, [authV2.nguoiDung]);

    if (!authV2.isAuthenticated) {
        return null;
    }

    const nguoiDung = authV2.nguoiDung;
    const tenPhongBan = danhSachPhongBan.find(pb => pb.id === nguoiDung?.phongBanId)?.ten;
    const tenNhaThau = danhSachNhaThau.find(nt => nt.id === nguoiDung?.nhaThauId)?.ten;

    const xuLyLuuThongTin = async (values: any) => {
        try {
            await capNhatProfile({
                hoTen: values.hoTen,
                email: values.email || undefined,
                soDienThoai: values.soDienThoai || undefined,
            }).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã cập nhật thông tin", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Cập nhật thông tin thất bại", messageNotify: "" }));
        }
    };

    const xuLyDoiMatKhau = async (values: any) => {
        try {
            await doiMatKhau({
                matKhauHienTai: values.matKhauHienTai,
                matKhauMoi: values.matKhauMoi,
            }).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã đổi mật khẩu", messageNotify: "" }));
            formMatKhau.resetFields();
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Đổi mật khẩu thất bại", messageNotify: "" }));
        }
    };

    const xuLyUpload = async (file: RcFile): Promise<boolean> => {
        if (!DUOI_CHO_PHEP.includes(file.type)) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: "Chỉ chấp nhận file ảnh .png, .jpg, .jpeg", messageNotify: "" }));
            return false;
        }
        if (file.size > DUNG_LUONG_TOI_DA) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: "File chữ ký vượt quá 2MB", messageNotify: "" }));
            return false;
        }

        try {
            await uploadChuKy(file).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã tải lên chữ ký mới", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Tải lên chữ ký thất bại", messageNotify: "" }));
        }
        return false; // ngăn Upload tự gửi request riêng, đã xử lý bằng RTK Query ở trên
    };

    const xuLyKichHoat = async (id: number) => {
        try {
            await kichHoatChuKy(id).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã đặt làm chữ ký hiện hành", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Đặt chữ ký hiện hành thất bại", messageNotify: "" }));
        }
    };

    const xuLyXoa = async (id: number) => {
        try {
            await xoaChuKy(id).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã xóa chữ ký", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Xóa chữ ký thất bại", messageNotify: "" }));
        }
    };

    return <LayoutV2Component>
        <h2 className="font-bold text-xl text-zinc-700 mb-6">TRANG CÁ NHÂN</h2>

        <div className="flex flex-col gap-6">
            <Card title="Thông tin tài khoản">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 mb-4 text-sm">
                    <div><span className="text-gray-400">Tên đăng nhập:</span> {nguoiDung?.tenDangNhap}</div>
                    <div><span className="text-gray-400">Phòng ban:</span> {tenPhongBan || "--"}</div>
                    <div><span className="text-gray-400">Nhà thầu:</span> {tenNhaThau || "--"}</div>
                    <div>
                        <span className="text-gray-400">Vai trò:</span>{" "}
                        {nguoiDung?.danhSachVaiTro && nguoiDung.danhSachVaiTro.length > 0
                            ? nguoiDung.danhSachVaiTro.map(vt => <Tag key={vt} color="blue">{vt}</Tag>)
                            : "--"}
                    </div>
                </div>

                <Form form={formThongTin} layout="vertical" onFinish={xuLyLuuThongTin} className="max-w-[480px]">
                    <Form.Item label="Họ tên" name="hoTen" rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Email" name="email" rules={[{ type: "email", message: "Email không hợp lệ!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Số điện thoại" name="soDienThoai">
                        <Input />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={dangLuuThongTin}>Lưu thay đổi</Button>
                    </Form.Item>
                </Form>
            </Card>

            <Card title="Đổi mật khẩu">
                <Form form={formMatKhau} layout="vertical" onFinish={xuLyDoiMatKhau} className="max-w-[480px]">
                    <Form.Item label="Mật khẩu hiện tại" name="matKhauHienTai" rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại!" }]}>
                        <Input.Password />
                    </Form.Item>
                    <Form.Item label="Mật khẩu mới" name="matKhauMoi" rules={[{ required: true, min: 6, message: "Mật khẩu mới phải có ít nhất 6 ký tự!" }]}>
                        <Input.Password />
                    </Form.Item>
                    <Form.Item
                        label="Xác nhận mật khẩu mới"
                        name="xacNhanMatKhauMoi"
                        dependencies={["matKhauMoi"]}
                        rules={[
                            { required: true, message: "Vui lòng xác nhận mật khẩu mới!" },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue("matKhauMoi") === value) return Promise.resolve();
                                    return Promise.reject(new Error("Xác nhận mật khẩu không khớp!"));
                                },
                            }),
                        ]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={dangDoiMatKhau}>Đổi mật khẩu</Button>
                    </Form.Item>
                </Form>
            </Card>

            <Card
                title="Chữ ký"
                extra={
                    <Upload accept=".png,.jpg,.jpeg" showUploadList={false} beforeUpload={xuLyUpload}>
                        <Button type="primary" loading={dangUpload}>Tải lên chữ ký mới</Button>
                    </Upload>
                }
            >
                {isFetching ? <div>Đang tải...</div> : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {danhSachChuKy.map(ck => (
                            <Card
                                key={ck.id}
                                cover={<img src={`${ApiRootV2}${ck.duongDanChuKy}`} className="h-[120px] object-contain p-3 bg-white" />}
                                actions={ck.dangSuDung ? undefined : [
                                    <Button key="kich-hoat" type="link" onClick={() => xuLyKichHoat(ck.id)}>Đặt làm hiện hành</Button>,
                                    <Popconfirm
                                        key="xoa"
                                        title="Xóa chữ ký"
                                        description="Xóa chữ ký này? Không thể hoàn tác."
                                        okText="Xóa"
                                        okButtonProps={{ danger: true }}
                                        cancelText="Hủy"
                                        onConfirm={() => xuLyXoa(ck.id)}
                                    >
                                        <Button type="link" danger icon={<FaTrash />} />
                                    </Popconfirm>,
                                ]}
                            >
                                {ck.dangSuDung && <Tag color="success">Đang sử dụng</Tag>}
                            </Card>
                        ))}
                        {danhSachChuKy.length === 0 && <div className="text-gray-400">Chưa có chữ ký nào.</div>}
                    </div>
                )}
            </Card>
        </div>
    </LayoutV2Component>;
};

export default ProfilePageV2;
