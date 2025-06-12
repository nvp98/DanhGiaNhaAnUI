import {
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import { Layout, Menu } from 'antd';
import React, { ReactNode } from 'react';
import {   MdOutlineHistory } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';
import UserDropdown from './UserDropdown';
import { IoLogOutOutline, IoSettingsOutline } from 'react-icons/io5';
import { IoMdHelpCircleOutline } from 'react-icons/io';
import { useDispatch, useSelector } from 'react-redux';
import LogoutAction from '../acctions/LogoutAction';
import { RootType } from '../store/types';
import { setMenu } from '../store/ShowMenuSlide';
const { Header, Sider, Content } = Layout;

interface LayoutProps {
  menuSelect: string,
  children: ReactNode;
}

const LayoutComponent: React.FC<LayoutProps> = ({ menuSelect, children }) => {
  // const [collapsed, setCollapsed] = useState(false);

  const auth = useSelector((state: RootType) => state.auth)
  const showMenu = useSelector((state: RootType) => state.showMenu)

  const dispatch = useDispatch();


  const navigate = useNavigate();

  

  return (
    <Layout className='h-[100hv-10px]  !w-[100vw-20px] min-w-[1500px] min-h-[700px]' >
      <Sider trigger={null} collapsible collapsed={showMenu.isShowMenu} className="!bg-white ">
        <Link to="/">
          {
            !showMenu.isShowMenu ?
              <div className="logo flex pt-4 mb-8 justify-center items-center" >
                <img className="h-[40px] " src='/assets/images/logo-inverse.png' />
              </div> :
              <div className="logo flex pt-4 mb-8 justify-center items-center" >
                <img className="h-[25px] bg-image-transparent" src='/assets/images/logo-HPDQ.png' />

              </div>
          }
        </Link>
        <div className='!flex !flex-col justify-between content-between !text-base font-semibold' style={{height: "calc(100vh - 100px)"}} >
        <Menu
        className='max-h-[80%]' style={{overflowY: "auto"}}
          theme="light"
          mode="inline"
          defaultSelectedKeys={[menuSelect]}
          items={
            
            [

              {
                key: 'history',
                icon: <MdOutlineHistory />,
                label: 'Lịch sử khảo sát',
                onClick: () => {
                  navigate('/admin')
                }
              },
               {
                key: 'dashboard',
                icon: <MdOutlineHistory />,
                label: 'Dashboard',
                onClick: () => {
                  navigate('/dashboard')
                }
              },
              
             
             
            ]
            
          }


        />
        <Menu
          theme="light"
          mode="inline"
          defaultSelectedKeys={[menuSelect]}
          items={
            [
              {
                key: 'profile',
                icon: <IoSettingsOutline />,
                label: 'Cài đặt',
                onClick: () => {
                  navigate('/profile')
                }
              },
              {
                key: 'help',
                icon: <IoMdHelpCircleOutline />,
                label: 'Giúp đỡ',
                onClick: () => {
                  // window.open("https://hoaphatcomvn-my.sharepoint.com/:w:/g/personal/nguyenchithang_hoaphat_com_vn/EUn6eLTKL2pFil9Gq_iRE40Bh9cBE_1kEKyJWhxJrKcEvQ?e=20ttR8"
                  //   , "_blank")
                  
                  }
              },
              {
                key: 'logout',
                icon: <IoLogOutOutline color='red' />,
                label: <span className='text-red-600'>Đăng xuất</span>,
                onClick: () => {
                  LogoutAction(dispatch, navigate)
                }
              },

              
            ]
          }


        />

        </div>
        
      </Sider>
      <Layout className="site-layout h-[100vh]">
        <Header className="!bg-white !px-5 flex justify-between items-center" >
          {React.createElement(showMenu.isShowMenu ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: 'trigger',
            onClick: () => dispatch(setMenu())
          })}
          <div className='flex justify-end space-x-5 items-center'>
            <span className='font-semibold'><span className='text-green-500'>HI! </span>{auth.user?.hoTen}</span>
            <UserDropdown />

          </div>

        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: "500px",
            
            background: "white"

          }}
        >
          {
            children
          }

        </Content>
      </Layout>


    </Layout>
  );
};

export default LayoutComponent;