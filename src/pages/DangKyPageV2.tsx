import { Button, Form, Input, Select, Spin } from "antd";
import React from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useDangKyV2Mutation } from "../services/authApiV2";
import { useDanhSachNhaThauQuery } from "../services/nhaThauApiV2";
import { useDanhSachPhongBanQuery } from "../services/phongBanApiV2";
import { setNotify } from "../store/notifycationSlide";

const DangKyPageV2: React.FC = () => {
    const dispatch = useDispatch();
    const navigator = useNavigate();
    const [dangKy, { isLoading }] = useDangKyV2Mutation();
    const { data: danhSachPhongBan = [] } = useDanhSachPhongBanQuery({ dangHoatDong: true });
    const { data: danhSachNhaThau = [] } = useDanhSachNhaThauQuery({ trangThai: "HOAT_DONG" });

    const xuLyDangKy = async (values: any) => {
        try {
            const res = await dangKy({
                tenDangNhap: values.tenDangNhap,
                matKhau: values.matKhau,
                hoTen: values.hoTen,
                email: values.email || undefined,
                soDienThoai: values.soDienThoai || undefined,
                phongBanId: values.phongBanId || undefined,
                nhaThauId: values.nhaThauId || undefined,
            }).unwrap();
            dispatch(setNotify({
                typeNotify: "success",
                titleNotify: res.message || "Đăng ký thành công, vui lòng chờ duyệt tài khoản.",
                messageNotify: ""
            }));
            navigator("/v2/dang-nhap");
        } catch (error: any) {
            dispatch(setNotify({
                typeNotify: "error",
                titleNotify: error?.data?.message || "Đăng ký thất bại",
                messageNotify: ""
            }));
        }
    };

    return <div className="flex justify-center min-h-[100vh] py-10">
        <div className="w-[90%] md:w-[500px] pt-3 px-7 pb-9 border-2 border-[#004aad] flex flex-col justify-center items-center h-fit">
            <img src="/assets/images/logo-inverse.png" className="h-[60px] mt-3" />
            <h4 className="text-[#004aad] font-bold text-2xl mt-3">
                ĐĂNG KÝ TÀI KHOẢN
            </h4>
            <Form
                name="form_dang_ky_v2"
                layout="vertical"
                className="w-[100%] mt-4"
                onFinish={xuLyDangKy}
            >
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

                <Form.Item className="mt-5 w-[100%]">
                    {
                        isLoading ?
                            <Button type="primary" className="w-[100%] py-5 bg-[#004aad] text-white font-bold" disabled>
                                <Spin />
                            </Button> :
                            <Button type="primary" className="w-[100%] py-5 bg-[#004aad] text-white font-bold" htmlType="submit">
                                ĐĂNG KÝ
                            </Button>
                    }
                </Form.Item>

                <div className="text-center">
                    Đã có tài khoản? <Link to="/v2/dang-nhap" className="text-[#004aad] font-medium">Đăng nhập</Link>
                </div>
            </Form>
        </div>
    </div>;
};

export default DangKyPageV2;
