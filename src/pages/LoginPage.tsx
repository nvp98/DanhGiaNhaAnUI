import { Button, Form,  Input, Spin } from "antd"
import React, { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { RootType } from "../store/types"
import { useNavigate } from "react-router-dom"
import { setNotify } from "../store/notifycationSlide"
import { login } from "../store/authSlice"

const LoginPage: React.FC = () => {
    
    const dispatch = useDispatch();
    const notify = useSelector((state : RootType)=>state.notify)
    const navigator = useNavigate()
    const [loadLogin, setLoadLogin] = useState(false);


    useEffect(()=>{
        console.log(notify.messageNotify)
    },[])
    

    return <div className="flex justify-center h-[100vh]">
        <div className="flex flex-1 flex-col h-[100vh] justify-center items-center">
            <img src="/assets/images/logo-inverse.png" className="h-[80px] w-[225px] md:w-[350px] md:h-[100px]" />
            <h2 className="mt-5 text-xl px-24 text-center uppercase font-bold md:text-3xl text-[#004aad]" style={{ lineHeight: "40px" }}>
            Khảo sát đánh giá chất lượng nhà ăn
            </h2>
            <div className="w-[90%] mt-8 pt-3 px-7 pb-9 border-2 border-[#004aad] flex flex-col justify-center items-center">
                <h4 className="text-[#004aad] font-bold text-2xl">
                    ĐĂNG NHẬP
                </h4>
                <Form name="form_item_path" className="w-[100%] mt-4" onFinish={async (values)=> {
                    await setLoadLogin(true)
                     const { manv, password } = values;
                    //  await LoginAction(manv, password, dispatch, navigator)
                    if(manv!= "HPDQKSNA"){
                   
                                 
                        await dispatch(setNotify({
                            messageNotify: "Login eror",
                            titleNotify: "Mã nhân viên của bản không đúng!",
                            typeNotify: "error"
                        }));  
                    }else if(password != "123456a@"){
                        await dispatch(setNotify({
                            messageNotify: "Login eror",
                            titleNotify: "Mật khẩu không chính sát!",
                            typeNotify: "error"
                        }));  
                    }else{
                        const now = new Date();

                        await dispatch(login({
                                        id: 1,
                                        maNv: "HPDQKSNA",
                                        hoTen: "Khảo sát nhà ăn",
                                        email: "",
                                        boPhan: "P.Đối Ngoại",
                                        viTriCongViec: "Quản lý nhà ăn",
                                        idVaiTro: 1,
                                        vaiTro: {
                                            id: 1,
                                            tenVaiTro: "Quản lý nhà ăn",
                                            trangThai: 1
                                        },
                                        trangThai: 1,
                                        refreshToken: "",
                                        tokenExpired: "",
                                        permission: {
                                            chucnang: {
                                                insert: true,
                                                update: true,
                                                view: true,
                                            },
                                            diadiem:  {
                                                insert: true,
                                                update: true,
                                                view: true,
                                            },
                                            kehoach:  {
                                                insert: true,
                                                update: true,
                                                view: true,
                                            },
                                            nhanvien:  {
                                                insert: true,
                                                update: true,
                                                view: true,
                                            },
                                            tuankiem: {
                                                insert: true,
                                                update: true,
                                                view: true,
                                            },
                                            vaitro: {
                                                insert: true,
                                                update: true,
                                                view: true,
                                            },
                                        },
                                        token: "",
                                        timesave: now
                                      }));

                        await dispatch(setNotify({
                            messageNotify: "Login succes",
                            titleNotify: "Đăng nhập thành công!",
                            typeNotify: "success"
                        })); 
                        navigator("/admin")
                    }
                    await setLoadLogin(false)
                    
                     }} >

                    <label className="mt-5 font-medium " style={{ lineHeight: "35px" }}>Mã Nhân viên</label>


                    <Form.Item name='manv'  rules={[{ required: true, min: 8, max:9, message: "Vui lòng nhập mã nhân viên của bạn!"}]}>
                        <Input className="border-[#004aad] px-3 py-2" defaultValue={"HPDQ"}/>
                    </Form.Item>
                    <label className=" font-medium mt-[-50px]" style={{ lineHeight: "35px" }}>Mật Khẩu</label>
                    <Form.Item name="password"  rules={[{ required: true , min: 5, message: "Vui lòng nhập đúng mật khẩu!"}]}>
                        <Input className="border-[#004aad] px-3 py-2" type="password" />
                    </Form.Item>
                    

                    <Form.Item className="mt-5 w-[100%]" >
                        {
                            loadLogin?
                            <Button type="primary" className="w-[100%] py-5 bg-[#004aad] text-white font-bold" disabled>
                            <Spin/>
                        </Button>:
                        <Button type="primary" className="w-[100%] py-5 bg-[#004aad] text-white font-bold" htmlType="submit">
                            ĐĂNG NHẬP
                        </Button>
                        }
                        
                        
                    </Form.Item>
                </Form>


            </div>
        </div>
        <div className="flex-[3] hidden h-[100vh] md:block" style={{
            backgroundImage: "url('/assets/images/background-login.jpg')",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover"
        }}>

        </div>
    </div>
}

export default LoginPage