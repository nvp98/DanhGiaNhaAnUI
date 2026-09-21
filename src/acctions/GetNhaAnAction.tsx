import axios from "axios";
import NhaAnModel from "../models/NhaAnModel";
import LinkServerV2 from "../services/LinkServerV2";



const GetNhaAnAction = async (): Promise<NhaAnModel[]> => {
   
    const url = `${LinkServerV2}/Location`;

    try {
        const res = await axios({
            method: "get",
            url: url
        });
console.log(res.data)
        if (res.status === 200) {
            const data: NhaAnModel[] =  res.data ? res.data.map(
                (e : any)=>{
                    const resuft: NhaAnModel = {
                        ...e,
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

export default GetNhaAnAction;
