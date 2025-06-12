import axios from "axios";
import LinkServer from "./LinkServer";
import KhaoSatModel from "../models/KhaoSatModel";



const GetKhaoSatAction = async (start: string, end: string): Promise<KhaoSatModel[]> => {
   
    const url = `${LinkServer}/Evaluates?TuNgay=${start}&DenNgay=${end}`;

    try {
        const res = await axios({
            method: "get",
            url: url
        });
console.log(res.data)
        if (res.status === 200) {
            console.log(res.data)
            const data: KhaoSatModel[] =  res.data.data ? res.data.data.map(
                (e : any, index: number)=>{
                    const resuft: KhaoSatModel = {
                        ...e,
                        stt : index+1,
                        diemDanhGia: e.diemDanhGia == 1? "Rất không hài lòng": e.diemDanhGia == 2? "Không hài lòng": e.diemDanhGia == 3? "Bình thường": e.diemDanhGia == 4? "Hài lòng": "Rất hài lòng", 
                        thoiGianDanhGia : e.thoiGianDanhGia!=null?e.thoiGianDanhGia.slice(0,10)+" "+e.thoiGianDanhGia.slice(11,16):"",
                         }
                    return resuft
                }
            ) : [];
            return data
            
            

        } else {
            return []
            
        }
    } catch (error) {
        console.error("Login error:", error);
        return []
    }
};

export default GetKhaoSatAction;
