import { Input, Modal, Select, Spin } from "antd";
import React, { useEffect, useState } from "react";
import { FaCheck } from "react-icons/fa";
import NhaAnModel from "../models/NhaAnModel";
import GetNhaAnAction from "../acctions/GetNhaAnAction";
import { setNotify } from "../store/notifycationSlide";
import { useDispatch, useSelector } from "react-redux";
import { set } from "../store/NhaAnSlice";
import { RootType } from "../store/types";
import KhaoSatAction from "../acctions/KhaoSatAction";
import { BsFullscreen, BsFullscreenExit } from "react-icons/bs";
import { BiLock, BiLockOpen } from "react-icons/bi";



const HomePage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [select, setSelect] = useState(0);
    const [selectNhaAn, setSelectNhaAn] = useState(0);
    const [dataNhaAn, setDataNhaAn] = useState<NhaAnModel[]>([]);
    const dispatch = useDispatch()
    const nhaAn = useSelector((state: RootType) => state.nhaAn)
    const [isFullScreen, setIsFullScreen] = useState(false);
    // const [isModal, setIsModal] = useState(false);
    const [isModalPass, setIsModalPass] = useState(false);
    const [isBlock, setIsBlock] = useState(true);
    const [pass, setPass] = useState("")
    const getData = async () => {
        setLoading(true)
        const listNhaAn = await GetNhaAnAction()
        await setDataNhaAn(listNhaAn)
        await setSelectNhaAn(nhaAn.idNhaAn)
        
        setLoading(false)
    }
    useEffect(
        () => {
            getData()
            console.log(nhaAn.idNhaAn)
            
        }, []
    )

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
          setIsFullScreen(true);
        } else {
          document.exitFullscreen();
          setIsFullScreen(false);
        }
      };


 
    return <>
        {loading ? <div className="flex justify-center w-[100vw] h-[100vh] items-center">
            <Spin/>
            </div>: 
            <div className="w-[100vw] h-[100vh] bg-no-repeat bg-cover  flex flex-col  " style={{backgroundImage: 'url("/assets/images/bg_nha_an.jpg")', backgroundSize: "100% 100%"}}>
            <div className="flex justify-between items-center py-2">
            <img className="w-[250px] max-lg:w-[150px] max-md:w-[130px]" src="/assets/images/logo.png"></img>
            <div className="flex gap-5 max-lg:gap-2 mr-[20px] items-center">
            <p className="text-white text-base  max-lg:text-sm max-md:text-[10px]">Nhà ăn: {
                dataNhaAn.find(e => e.id == selectNhaAn)?.diaDiem || ""
                }</p>
                <button onClick={toggleFullScreen} className="text-white border-[1px] p-2 rounded-md">
                    {!isFullScreen?<BsFullscreen/>: <BsFullscreenExit/>}
                </button>
            {
                isBlock? null:
                <Select  className="h-[40px]  w-[200px]  " 
                             showSearch
                             optionFilterProp="children"
                             defaultValue={selectNhaAn}
                             onChange={async (e)=>{
                                await setSelectNhaAn(e);
                                await dispatch(set(e));
                             }}

                            >
                                {
                                    dataNhaAn.length == 0 ? <></> :
                                        <>
                                            {
                                                dataNhaAn.map((nhaAn: NhaAnModel) => {
                                                        if(nhaAn.isActive){
                                                            return <Select.Option className="!py-2" value={nhaAn.id}>{nhaAn.diaDiem}</Select.Option>
                                                        }
                                                        
                                                    

                                                })
                                            }
                                        </>
                                }
                </Select>
                
            }
            {
                isBlock?<button onClick={()=>setIsModalPass(true)} className="text-white border-[1px] p-2 rounded-md">
                <BiLock/>
                </button>:
                <button onClick={()=>setIsBlock(true)} className="text-white border-[1px] p-2 rounded-md">
                     <BiLockOpen/>
                </button>
            
            }
            
            </div>
            
            </div>
            {/* <h1 className="uppercase text-white text-4xl font-bold text-center px-[20%] max-lg:px-[10%] max-lg:text-2xl max-md:text-lg">Khảo sát đánh giá chất lượng nhà ăn</h1> */}
            <p className=" text-white text-xl mt-5 text-center px-[20%] max-lg:px-[10%] max-lg:text-xl max-md:my-5 max-md:text-base font-bold">Bạn có hài lòng khi sử dụng dịch vụ cung cấp suất ăn tại nhà ăn không?</p>
         
            <div className="flex justify-center w-[90vw] mx-auto mt-10 items-center gap-10 max-lg:gap-4 max-md:mt-4">
                
                <div className={select!=1?"flex-1  bg-white rounded-md p-2 ":"flex-1  bg-green-500 rounded-md p-2"} onClick={()=>setSelect(1)} >
                    <div className={select!=1?"w-[20px] h-[20px] max-md:w-[10px] max-md:h-[9px] bg-white rounded-sm flex justify-center items-center opacity-0":"w-[20px] h-[20px] max-md:w-[10px] max-md:h-[9px] bg-white rounded-sm flex justify-center items-center "} >
                        <FaCheck className="text-green-500 "/>
                    </div>
                    <div className="flex justify-center flex-col items-center">
  
                    <img className="w-[90px] h-[90px] max-lg:w-[50px] max-lg:h-[50px]" src="/assets/images/ratkhonghailong.png"></img>
           
                    
                    <p className="text-base max-md:text-[8px] font-bold text-center max-lg:text-[10px]">1 - Rất không hài lòng</p>
                    </div>
                    
                </div>
                <div className={select!==2?"flex-1  bg-white rounded-md p-2 ":"flex-1  bg-green-500 rounded-md p-2"} onClick={()=>setSelect(2)} >
                    <div className={select!=2?"w-[20px] h-[20px] max-md:w-[10px] max-md:h-[9px] bg-white rounded-sm flex justify-center items-center opacity-0":"w-[20px] h-[20px] max-md:w-[10px] max-md:h-[9px] bg-white rounded-sm flex justify-center items-center "} >
                        <FaCheck className="text-green-500 "/>
                    </div>
                    <div className="flex justify-center flex-col items-center">
                    <img className="w-[90px] h-[90px] max-lg:w-[50px] max-lg:h-[50px]" src="/assets/images/khonghailong.png"></img>
                    <p className="text-base max-md:text-[8px] font-bold text-center max-lg:text-[10px]">2 - Không hài lòng</p>
                    </div>
                    
                </div>
                <div className={select!=3?"flex-1  bg-white rounded-md p-2 ":"flex-1  bg-green-500 rounded-md p-2"} onClick={()=>setSelect(3)} >
                    <div className={select!=3?"w-[20px] h-[20px] max-md:w-[10px] max-md:h-[9px] bg-white rounded-sm flex justify-center items-center opacity-0":"w-[20px] h-[20px] max-md:w-[10px] max-md:h-[9px] bg-white rounded-sm flex justify-center items-center "} >
                        <FaCheck className="text-green-500 "/>
                    </div>
                    <div className="flex justify-center flex-col items-center">
                    <img className="w-[90px] h-[90px] max-lg:w-[50px] max-lg:h-[50px]" src="/assets/images/binhthuong.png"></img>
                    <p className="text-base max-md:text-[8px] font-bold text-center max-lg:text-[10px]">3 - Bình thường</p>
                    </div>
                    
                </div>
                <div className={select!=4?"flex-1  bg-white rounded-md p-2 ":"flex-1  bg-green-500 rounded-md p-2"} onClick={()=>setSelect(4)} >
                    <div className={select!=4?"w-[20px] h-[20px] max-md:w-[10px] max-md:h-[9px] bg-white rounded-sm flex justify-center items-center opacity-0":"w-[20px] h-[20px] max-md:w-[10px] max-md:h-[9px] bg-white rounded-sm flex justify-center items-center "} >
                        <FaCheck className="text-green-500 "/>
                    </div>
                    <div className="flex justify-center flex-col items-center">
                    <img className="w-[90px] h-[90px] max-lg:w-[50px] max-lg:h-[50px]" src="/assets/images/hailong.png"></img>
                    <p className="text-base max-md:text-[8px] font-bold text-center max-lg:text-[10px]">4 - Hài lòng</p>
                    </div>
                    
                </div>
                <div className={select!=5?"flex-1  bg-white rounded-md p-2 ":"flex-1  bg-green-500 rounded-md p-2"} onClick={()=>setSelect(5)} >
                    <div className={select!=5?"w-[20px] h-[20px] max-md:w-[10px] max-md:h-[9px] bg-white rounded-sm flex justify-center items-center opacity-0":"w-[20px] h-[20px] max-md:w-[10px] max-md:h-[9px] bg-white rounded-sm flex justify-center items-center "} >
                        <FaCheck className="text-green-500 "/>
                    </div>
                    <div className="flex justify-center flex-col items-center">
                    <img className="w-[90px] h-[90px] max-lg:w-[50px] max-lg:h-[50px]" src="/assets/images/rathailong.png"></img>
                    <p className="text-base max-md:text-[8px] font-bold text-center max-lg:text-[10px]">5 - Rất hài lòng</p>
                    </div>
                    
                </div>

                
               
                
                
            </div>
            <div className="flex justify-center">

            
            <button className="mt-10 max-lg:mt-5 max-lg:w-[150px] max-lg:py-2 max-lg:text-sm max-md:text-xs max-md:mt-3 py-3 max-md:px-1 max-md:py-2 max-md:w-[130px]  rounded-2xl w-[200px] text-white font-bold  border-[2px] opacity-85 hover:opacity-100" 
            onClick={async ()=>{
                if(selectNhaAn == 0){
                    await dispatch(setNotify({
                        messageNotify: "lỗi",
                        titleNotify: "Vui lòng chọn trước nhà ăn",
                        typeNotify: "error"
                    }));
                }else  if(select == 0 ){
                    await dispatch(setNotify({
                                   messageNotify: "lỗi",
                                   titleNotify: "Vui lòng chọn ý kiến của bạn",
                                   typeNotify: "error"
                               }));
               }else{
                await KhaoSatAction(selectNhaAn, select, dispatch) 
    
                    await setSelect(0)
                          


               }
            }}
            style={{background: 'linear-gradient(90deg, rgba(0,151,208,1) 0%, rgba(5,65,138,1) 100%)'}}>XÁC NHẬN</button>
            </div>
            <p className=" absolute bottom-2 text-white text-xl mt-5 text-center px-[20%] max-lg:px-[10%] max-lg:text-sm max-md:text-[8px] max-md:mt-2 max-md:leading-[10px]">Chúng tôi trân trọng ý kiến của bạn! Khảo sát này giúp chúng tôi thu thập phản hồi về chất lượng dịch vụ và thực phẩm từ đó cải thiện và mang đến trải nghiệm tốt hơn cho bạn. Cảm ơn bạn đã tham gia!</p>

            
         </div>  }

         {/* <Modal  className="max-lg:!w-[400px]"
          centered  
         open={isModal} onCancel={()=>setIsModal(false)} title={<h4 className="text-lg uppercase font-bold text-green-600 max-lg:text-base">Xác nhận khảo sát!</h4>} footer={null}>
            <p className="text-lg mt-4 max-lg:text-sm">Bạn cảm nhận chất lượng nhà ăn của chúng tôi:</p>
            <p className="text-lg font-bold max-lg:text-sm">{select == 5? "Rất hài lòng":select == 4? "Hài lòng": select == 3? "Bình thường": select == 2? "Không hài lòng": "Rất không hài lòng"}</p>
            <div className="flex justify-end gap-3 text-lg font-semibold mt-4">
                <button onClick={()=>setIsModal(false)} className="px-10 py-3 max-lg:py-2 max-lg:px-5 bg-gray-200 hover:bg-gray-400 rounded-lg max-lg:text-sm">Đóng</button>
                <button onClick={async ()=>{
                    
                }} className="px-10 py-3 max-lg:text-sm bg-green-500 max-lg:py-2 max-lg:px-5 hover:bg-green-600 rounded-lg text-white">Xác nhận</button>
            </div>
            
                
           
         </Modal> */}


         <Modal className="max-lg:!w-[350px]"
          centered  
         open={isModalPass} onCancel={()=>{setIsModalPass(false); setPass("")}} title={<h4 className="text-lg uppercase font-bold text-green-600 max-lg:text-base">Vui lòng nhập mật khẩu!</h4>} footer={null}>
            <p className="mt-3 mb-1">Mật khẩu</p>
           <Input type="password"  className="text-base py-2" value={pass} onChange={e=> setPass(e.target.value)}></Input>
            <div className="flex justify-end gap-3 text-lg font-semibold mt-4">
                <button onClick={()=>{setIsModalPass(false); setPass("")}} className=" max-lg:py-2 max-lg:px-5 max-lg:text-sm px-10 py-3 bg-gray-200 hover:bg-gray-400 rounded-lg">Đóng</button>
                <button onClick={async ()=>{
                    // await KhaoSatAction(selectNhaAn, select, dispatch) 
                    // await setIsModal(false)
                    // await setSelect(0)
                    if(pass == "998877123456"){
               
                        setIsBlock(false);
                        setIsModalPass(false)
                        setPass("")
                    }else{
                        await dispatch(setNotify({
                            messageNotify: "lỗi",
                            titleNotify: "Mật khẩu của bạn không chính sát",
                            typeNotify: "error"
                        }));
                    }
                }} className="px-10 py-3 bg-green-500 max-lg:py-2 max-lg:px-5 max-lg:text-sm  hover:bg-green-600 rounded-lg text-white">Xác nhận</button>
            </div>
            
                
           
         </Modal>
    </>



}

export default HomePage;