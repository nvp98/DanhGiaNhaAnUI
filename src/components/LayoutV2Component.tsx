import { Dropdown, Layout, MenuProps, Tag } from "antd";
import React, { ReactNode } from "react";
import { FaChevronDown, FaUserCircle } from "react-icons/fa";
import { IoLogOutOutline, IoPersonOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useDangXuatV2Mutation } from "../services/authApiV2";
import { RootType } from "../store/types";

const { Header, Content } = Layout;

interface LayoutV2Props {
    children: ReactNode;
}

const LayoutV2Component: React.FC<LayoutV2Props> = ({ children }) => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const navigator = useNavigate();
    const [dangXuat] = useDangXuatV2Mutation();

    const xuLyDangXuat = async () => {
        try {
            await dangXuat().unwrap();
        } catch (error) {
            console.error("Đăng xuất lỗi:", error);
        } finally {
            navigator("/v2/dang-nhap");
        }
    };

    const menuItems: MenuProps["items"] = [
        {
            key: "profile",
            label: "Trang cá nhân",
            icon: <IoPersonOutline />,
        },
        { type: "divider" },
        {
            key: "logout",
            label: "Đăng xuất",
            icon: <IoLogOutOutline />,
            danger: true,
        },
    ];

    const xuLyClickMenu: MenuProps["onClick"] = ({ key }) => {
        if (key === "profile") navigator("/v2/profile");
        if (key === "logout") xuLyDangXuat();
    };

    return (
        <Layout className="min-h-[100vh]">
            <Header className="!bg-white !px-5 flex justify-between items-center border-b">
                <Link to="/v2" className="flex items-center">
                    <img className="h-[35px]" src='/assets/images/logo-inverse.png' />
                </Link>
                <div className="flex justify-end items-center gap-4">
                    {authV2.nguoiDung?.danhSachVaiTro.map(vt => <Tag key={vt} color="blue">{vt}</Tag>)}
                    <Dropdown menu={{ items: menuItems, onClick: xuLyClickMenu }} trigger={["click"]}>
                        <div className="flex items-center gap-2 cursor-pointer select-none px-2 py-1 rounded-lg hover:bg-zinc-100">
                            <FaUserCircle className="text-xl text-[#004aad]" />
                            <span className="font-semibold">{authV2.nguoiDung?.hoTen}</span>
                            <FaChevronDown className="text-xs text-zinc-400" />
                        </div>
                    </Dropdown>
                </div>
            </Header>
            <Content style={{ margin: '24px 16px', padding: 24, minHeight: "500px", background: "white" }}>
                {children}
            </Content>
        </Layout>
    );
};

export default LayoutV2Component;
