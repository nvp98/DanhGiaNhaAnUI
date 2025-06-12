import { setNotify } from "../store/notifycationSlide";
import { Dispatch } from "redux";
import { NavigateFunction } from "react-router-dom";
import {  logout } from "../store/authSlice";

const LogoutAction = async (dispatch: Dispatch, navigator:  NavigateFunction): Promise<void> => {
            await dispatch(logout())
            await dispatch(setNotify({
                messageNotify: "Logout successful",
                titleNotify: "Đăng xuất thành công",
                typeNotify: "success"
            }));
            navigator("/login")
    }

export default LogoutAction;
