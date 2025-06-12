import axios from "axios";
import LinkServer from "./LinkServer";
import { setNotify } from "../store/notifycationSlide";
import { Dispatch } from "redux";
import { NavigateFunction } from "react-router-dom";
import { login } from "../store/authSlice";

const LoginAction = async (_manv: string, password: string, dispatch: Dispatch, navigator:  NavigateFunction): Promise<void> => {
    const body = {
        manv: _manv,
        password: password
    };

    const url = `${LinkServer}Auth/login`;

    try {
        const res = await axios.post(url, body);

        
console.log(res)
        if (res.status === 200) {
            const now = new Date();

            const data = res.data

            await dispatch(login({
                id: data.nhanVien.id,
                maNv: data.nhanVien.maNhanVien,
                hoTen: data.nhanVien.hoTen,
                email: data.nhanVien.email,
                boPhan: data.nhanVien.boPhan,
                viTriCongViec: data.nhanVien.viTriCongViec,
                idVaiTro: data.nhanVien.idVaiTro,
                vaiTro: {
                    ...data.nhanVien.vaiTro
                },
                trangThai: data.nhanVien.trangThai,
                refreshToken: data.nhanVien.refreshToken || "",
                tokenExpired: data.nhanVien.tokenExpired || "",
                permission: {
                  ...data.nhanVien.permission
                },
                token: data.token,
                timesave: now
              }));
            
            await dispatch(setNotify({
                messageNotify: "Login successful",
                titleNotify: "Đăng nhập thành công",
                typeNotify: "success"
            }));
            navigator("/")
        } else {
            console
            // Handle non-200 responses (e.g., display error message)
            dispatch(setNotify({
                messageNotify: "Login failed",
                titleNotify: "Mã nhân viên hoặc pass của bạn không đúng!",
                typeNotify: "error"
            }));
        }
    } catch (error) {
        console.error("Login error:", error);
        dispatch(setNotify({
            messageNotify: "An error occurred",
            titleNotify: "Mã nhân viên hoặc pass của bạn không đúng!",
            typeNotify: "error"
        }));
    }
};

export default LoginAction;
