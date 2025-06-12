
import './App.css'
import { Route, Routes } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootType } from './store/types'
import { message } from 'antd'
import HomePage from './pages/HomePage'
import { unsetNotify } from './store/notifycationSlide'

import ErrorPage from './pages/ErrorPage'
import { useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import DashboardPage from './pages/DashboardPage'




type MessageType = 'info' | 'success' | 'error' | 'warning';

function App() {
  const auth = useSelector((state: RootType) => state.auth)
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
   
  },[auth,notify])




  return (
    <>
      {contextHolder}
      <Routes>
      <Route path='/admin' element={<AdminPage/>} />
      <Route path='/dashboard' element={<DashboardPage/>} />
      <Route path='/login' element={<LoginPage/>} />
      <Route path='/' element={<HomePage/>} />
      <Route path='/*' element={<ErrorPage/>} />
      </Routes>
      
      {/* <NotificationComponent /> */}
    </>
  )
}

export default App


