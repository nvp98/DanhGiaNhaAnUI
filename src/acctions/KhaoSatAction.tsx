import axios from "axios";
import LinkServer from "./LinkServer";
import { setNotify } from "../store/notifycationSlide";
import { Dispatch } from "redux";

const KhaoSatAction = async (_diaDiem_ID: number, _diemDanhGia: number, dispatch: Dispatch): Promise<void> => {
    const body = {
        id: 0,
        diaDiem_ID: _diaDiem_ID,
        diemDanhGia: _diemDanhGia
    };

    const url = `${LinkServer}/Evaluates`;

    try {
        const res = await axios.post(url, body);
        if (res.status == 201) {
            
            
            await dispatch(setNotify({
                messageNotify: "successful",
                titleNotify: "Khảo sát thành công!",
                typeNotify: "success"
            }));

        } else {

            dispatch(setNotify({
                messageNotify: "Failed",
                titleNotify: "Khảo sát không thành công!",
                typeNotify: "error"
            }));
        }
    } catch (error) {
        console.error("Login error:", error);
        dispatch(setNotify({
            messageNotify: "An error occurred",
            titleNotify: "Khảo sát không thành công!",
            typeNotify: "error"
        }));
    }
};

export default KhaoSatAction;
