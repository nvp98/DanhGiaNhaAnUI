import React from "react";
import { Link, useNavigate } from "react-router-dom";
import type { MenuProps } from 'antd';
import { Button, Dropdown, Tag } from 'antd';
import { Avatar, Card } from 'antd';
import { FaRegUser } from "react-icons/fa"
import { TbLogout } from "react-icons/tb"
import { FiHelpCircle } from "react-icons/fi"
import { useDispatch, useSelector } from "react-redux";
import { RootType } from "../store/types";
import LogoutAction from "../acctions/LogoutAction";

const { Meta } = Card;

// interface typeprops {
//   handelLogout: () => Promise<void>
// }

const UserDropdown: React.FC = () => {


  const dispatch = useDispatch();

  const navigator = useNavigate();

  const auth = useSelector((state: RootType) => state.auth)

  const items: MenuProps['items'] = [
    {
      key: 'card1',
      label: (
        <Card style={{ width: 230 }} className="user-item-menu m-2  max-sm:!w-[150px]">
          <Meta className="!py-0"
            avatar={<Avatar className="!rounded-full w-[30px] h-[30px] max-sm:!w-[30px] max-sm:!h-[30px]">
              <FaRegUser />
            </Avatar>}
            title={<h5 className="truncate w-[180px] text-sm max-sm:!w-[100px]  max-sm:text-xs">{auth.user?.hoTen}</h5>}
            description={<Tag color="success">{auth.user?.boPhan}</Tag>}

          />
        </Card>
      )
    },
    {
      key: 'card2',
      label: (<hr className="!mb-1" />
      ),
    },

    {
      key: 'card3',
      label: (
        <Link to={"/profile"}>
          <p className="!px-6 py-2  w-[100%] max-sm:text-xs flex justify-start items-center text-sm space-x-2 !text-gray-600 font-medium user-list-action duration-450">
            <FaRegUser className="w-[16px] h-[16px]" />
            <p>View Profile</p>

          </p>

        </Link>

      )
    },

    {
      key: 'card7',
      label: (
        <a  target="_blank">
          <p className="!px-6 py-2  w-[100%] max-sm:text-xs flex justify-start items-center text-sm space-x-2 !text-gray-600 font-medium user-list-action duration-450">
            <FiHelpCircle className="w-[16px] h-[16px]" />
            <p>Help</p>

          </p>
        </a>


      )
    },
    {
      key: 'card8',
      label: (<hr className="!mt-1" />
      ),
    },
    {
      key: 'card9',
      label: (
        <p
          className="w-[100%] pl-5 pb-4 text-sm font-medium !pt-3 flex justify-start items-center text-red-500 hover:!text-red-500 !space-x-2 cursor-pointer"><TbLogout className="w-[20px] h-[20px] text-red-500" /><p>Sign Out</p></p>
      ),
      onClick: () => {
        LogoutAction(dispatch, navigator)
      }
    },
  ];

  return (
    <Dropdown menu={{ items }} placement="bottomRight" className="max-sm:hidden" arrow>
      <Button className="!p-0 border-none bg-gray-100 !min-w-[40px] max-sm:text-xs !h-[40px] max-sm:!min-w-[30px] max-sm:!h-[30px] rounded-full flex justify-center items-center">
        <div className="text-base"><FaRegUser /></div></Button>
    </Dropdown>
  );
}

export default UserDropdown;