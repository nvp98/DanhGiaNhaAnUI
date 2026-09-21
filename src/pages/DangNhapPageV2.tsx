import { Button, Form, Input, Spin } from "antd";
import React from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useDangNhapV2Mutation } from "../services/authApiV2";
import { setNotify } from "../store/notifycationSlide";

const DangNhapPageV2: React.FC = () => {
    const dispatch = useDispatch();
    const navigator = useNavigate();
    const [dangNhap, { isLoading }] = useDangNhapV2Mutation();

    const xuLyDangNhap = async (values: { tenDangNhap: string; matKhau: string }) => {
        try {
            await dangNhap(values).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đăng nhập thành công", messageNotify: "" }));
            navigator("/v2");
        } catch (error: any) {
            dispatch(setNotify({
                typeNotify: "error",
                titleNotify: error?.data?.message || "Sai tên đăng nhập hoặc mật khẩu",
                messageNotify: ""
            }));
        }
    };

    return <div className="flex justify-center min-h-[100vh]">
        <div className="flex flex-1 flex-col min-h-[100vh] items-center px-4 py-4 overflow-y-auto landscape:py-2">
            <button
                onClick={() => navigator("/")}
                className="self-start flex items-center gap-2 text-[#004aad] font-medium shrink-0"
            >
                <FaArrowLeft /> Quay lại
            </button>
            <div className="flex flex-1 flex-col justify-center items-center w-full">
                <img src="/assets/images/logo-inverse.png" className="h-[80px] w-[225px] md:w-[350px] md:h-[100px] landscape:h-[50px] landscape:w-[140px] landscape:md:h-[60px] landscape:md:w-[170px]" />
                <h2 className="mt-5 text-xl px-24 text-center uppercase font-bold md:text-3xl text-[#004aad] landscape:mt-2 landscape:text-base landscape:px-4" style={{ lineHeight: "40px" }}>
                    Đánh giá nhà ăn
                </h2>
                <div className="w-[90%] mt-8 pt-3 px-7 pb-9 border-2 border-[#004aad] flex flex-col justify-center items-center landscape:mt-3 landscape:pt-2 landscape:pb-4">
                    <h4 className="text-[#004aad] font-bold text-2xl">
                        ĐĂNG NHẬP
                    </h4>
                    <Form
                        name="form_dang_nhap_v2"
                        className="w-[100%] mt-4"
                        onFinish={xuLyDangNhap}
                    >
                        <label className="mt-5 font-medium" style={{ lineHeight: "35px" }}>Tên đăng nhập</label>
                        <Form.Item name="tenDangNhap" rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập!" }]}>
                            <Input className="border-[#004aad] px-3 py-2" />
                        </Form.Item>

                        <label className="font-medium mt-[-50px]" style={{ lineHeight: "35px" }}>Mật khẩu</label>
                        <Form.Item name="matKhau" rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}>
                            <Input.Password className="border-[#004aad] px-3 py-2" />
                        </Form.Item>

                        <Form.Item className="mt-5 w-[100%]">
                            {
                                isLoading ?
                                    <Button type="primary" className="w-[100%] py-5 bg-[#004aad] text-white font-bold" disabled>
                                        <Spin />
                                    </Button> :
                                    <Button type="primary" className="w-[100%] py-5 bg-[#004aad] text-white font-bold" htmlType="submit">
                                        ĐĂNG NHẬP
                                    </Button>
                            }
                        </Form.Item>

                        <div className="text-center">
                            Chưa có tài khoản? <Link to="/v2/dang-ky" className="text-[#004aad] font-medium">Đăng ký ngay</Link>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
        <div className="flex-[3] hidden md:block" style={{
            backgroundImage: "url('/assets/images/background-login.jpg')",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover"
        }}>
        </div>
    </div>;
};

export default DangNhapPageV2;
