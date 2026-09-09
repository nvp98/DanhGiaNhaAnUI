
import './App.css'
import { Route, Routes } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootType } from './store/types'
import { message } from 'antd'
import HomePage from './pages/HomePage'
import { unsetNotify } from './store/notifycationSlide'

import ErrorPage from './pages/ErrorPage'
import { useEffect } from 'react'
import DangNhapPageV2 from './pages/DangNhapPageV2'
import LichSuKhaoSatPageV2 from './pages/LichSuKhaoSatPageV2'
import DashboardPageV2 from './pages/DashboardPageV2'
import DangKyPageV2 from './pages/DangKyPageV2'
import TrangChuV2Page from './pages/TrangChuV2Page'
import BepAnPageV2 from './pages/BepAnPageV2'
import DiaDiemNhaAnPageV2 from './pages/DiaDiemNhaAnPageV2'
import NhaThauPageV2 from './pages/NhaThauPageV2'
import VaiTroPageV2 from './pages/VaiTroPageV2'
import PhongBanPageV2 from './pages/PhongBanPageV2'
import QuanLyTaiKhoanPageV2 from './pages/QuanLyTaiKhoanPageV2'
import ProfilePageV2 from './pages/ProfilePageV2'
import NhomTieuChiPage from './pages/NhomTieuChiPage'
import TieuChiPage from './pages/TieuChiPage'
import MauLuongKyPage from './pages/MauLuongKyPage'
import Phieu1DanhSachPage from './pages/Phieu1/Phieu1DanhSachPage'
import Phieu1FormPage from './pages/Phieu1/Phieu1FormPage'
import Phieu2DanhSachPage from './pages/Phieu2/Phieu2DanhSachPage'
import Phieu2FormPage from './pages/Phieu2/Phieu2FormPage'
import Phieu3DanhSachPage from './pages/Phieu3/Phieu3DanhSachPage'
import Phieu3FormPage from './pages/Phieu3/Phieu3FormPage'
import Phieu4DanhSachPage from './pages/Phieu4/Phieu4DanhSachPage'
import Phieu4FormPage from './pages/Phieu4/Phieu4FormPage'




type MessageType = 'info' | 'success' | 'error' | 'warning';

function App() {
  const notify = useSelector((state: RootType) => state.notify)
  const [messageApi, contextHolder] = message.useMessage();
  const dispatch = useDispatch();

  const callMessage = ( type: MessageType, content: string) => {
    messageApi.open({
      type: type,
      content: content,
    });
    dispatch(unsetNotify())


    
  };


  useEffect(() => {
    if (notify.isNotify) {
      callMessage(notify.typeNotify, notify.titleNotify)
    }
   
  },[notify])




  return (
    <>
      {contextHolder}
      <Routes>
      <Route path='/v2' element={<TrangChuV2Page/>} />
      <Route path='/v2/lich-su-khao-sat' element={<LichSuKhaoSatPageV2/>} />
      <Route path='/v2/dashboard' element={<DashboardPageV2/>} />
      <Route path='/v2/dang-nhap' element={<DangNhapPageV2/>} />
      <Route path='/v2/dang-ky' element={<DangKyPageV2/>} />
      <Route path='/v2/bep-an' element={<BepAnPageV2/>} />
      <Route path='/v2/dia-diem-nha-an' element={<DiaDiemNhaAnPageV2/>} />
      <Route path='/v2/nha-thau' element={<NhaThauPageV2/>} />
      <Route path='/v2/vai-tro' element={<VaiTroPageV2/>} />
      <Route path='/v2/phong-ban' element={<PhongBanPageV2/>} />
      <Route path='/v2/quan-ly-tai-khoan' element={<QuanLyTaiKhoanPageV2/>} />
      <Route path='/v2/profile' element={<ProfilePageV2/>} />
      <Route path='/nhom-tieu-chi' element={<NhomTieuChiPage/>} />
      <Route path='/tieu-chi' element={<TieuChiPage/>} />
      <Route path='/mau-luong-ky' element={<MauLuongKyPage/>} />
      <Route path='/phieu1' element={<Phieu1DanhSachPage/>} />
      <Route path='/phieu1/:id' element={<Phieu1FormPage/>} />
      <Route path='/phieu2' element={<Phieu2DanhSachPage/>} />
      <Route path='/phieu2/:id' element={<Phieu2FormPage/>} />
      <Route path='/phieu3' element={<Phieu3DanhSachPage/>} />
      <Route path='/phieu3/:id' element={<Phieu3FormPage/>} />
      <Route path='/phieu4' element={<Phieu4DanhSachPage/>} />
      <Route path='/phieu4/:id' element={<Phieu4FormPage/>} />
      <Route path='/' element={<HomePage/>} />
      <Route path='/*' element={<ErrorPage/>} />
      </Routes>
      
      {/* <NotificationComponent /> */}
    </>
  )
}

export default App


