import { Drawer, Dropdown, Grid, Layout, Menu, MenuProps, Tag } from "antd";
import React, { ReactNode, useEffect, useRef, useState } from "react";
import { FaAngleDoubleLeft, FaAngleDoubleRight, FaArrowLeft, FaBars, FaChevronDown, FaExchangeAlt, FaHome, FaUserCircle } from "react-icons/fa";
import { IoLogOutOutline, IoPersonOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { layNhomMenuHienThi } from "../config/menuV2";
import { useDangXuatV2Mutation } from "../services/authApiV2";
import { useLayHoSoQuery } from "../services/profileApiV2";
import { RootType } from "../store/types";
import { publicAsset } from "../utils/publicAsset";

const { Header, Content, Sider } = Layout;

const KHOA_LUU_THU_GON = "v2SidebarCollapsed";
// Khớp với chiều cao mặc định của antd Layout Header — 2 thanh (thanh trên
// cùng của sidebar và Header bên phải) phải cùng cao để thẳng hàng nhau.
const CHIEU_CAO_THANH_TREN = 64;
const CHIEU_RONG_SIDEBAR = 260;
const CHIEU_RONG_SIDEBAR_THU_GON = 80;

interface LayoutV2Props {
    children: ReactNode;
}

const LayoutV2Component: React.FC<LayoutV2Props> = ({ children }) => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const navigator = useNavigate();
    const location = useLocation();
    const [dangXuat] = useDangXuatV2Mutation();

    // Dưới breakpoint "lg" (< 992px, xem antd Grid) — màn hình di
    // động/tablet dọc — Sider cố định không còn phù hợp (chiếm quá nhiều
    // chiều ngang), chuyển sang Drawer trượt từ trái, mở bằng nút hamburger
    // trên Header.
    const screens = Grid.useBreakpoint();
    const laManHinhDiDong = screens.lg === false;
    const [moMenuDiDong, setMoMenuDiDong] = useState(false);

    useEffect(() => {
        // Đổi trang xong (hoặc chuyển từ mobile sang desktop) thì tự đóng
        // Drawer, tránh việc nó còn mở khi quay lại từ trang khác.
        setMoMenuDiDong(false);
    }, [location.pathname, laManHinhDiDong]);

    // Mỗi trang tự bọc <LayoutV2Component> riêng (route phẳng ở App.tsx,
    // không dùng <Outlet/> layout lồng nhau) nên component này bị mount lại
    // mỗi lần chuyển trang — lưu trạng thái thu gọn vào localStorage để
    // sidebar không tự bung ra lại mỗi khi bấm sang module khác.
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem(KHOA_LUU_THU_GON) === "1";
        } catch {
            return false;
        }
    });

    const doiThuGon = (value: boolean) => {
        setCollapsed(value);
        try {
            localStorage.setItem(KHOA_LUU_THU_GON, value ? "1" : "0");
        } catch {
            // Bỏ qua nếu trình duyệt chặn localStorage (VD chế độ ẩn danh) —
            // chỉ mất tính năng nhớ trạng thái, không ảnh hưởng chức năng chính.
        }
    };

    // Thanh cuộn sidebar ẩn mặc định, chỉ hiện trong lúc đang cuộn rồi tự ẩn
    // lại (xem .sidebar-v2-scroll ở index.css) — bật class .dang-cuon khi có
    // sự kiện scroll, tắt lại sau 800ms không cuộn tiếp.
    const [dangCuonSidebar, setDangCuonSidebar] = useState(false);
    const anCuonTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const xuLyScrollSidebar = () => {
        setDangCuonSidebar(true);
        if (anCuonTimeoutRef.current) clearTimeout(anCuonTimeoutRef.current);
        anCuonTimeoutRef.current = setTimeout(() => setDangCuonSidebar(false), 800);
    };

    useEffect(() => () => {
        if (anCuonTimeoutRef.current) clearTimeout(anCuonTimeoutRef.current);
    }, []);

    // Chia sẻ chiều rộng sidebar hiện tại ra ngoài qua CSS variable — cho các
    // khối "fixed" độc lập với layout này (VD PhieuActions.tsx, thanh nút
    // Lưu/Gửi ký cố định ở đáy màn hình) tự né đúng mép sidebar mà không cần
    // import ngược lại component này.
    useEffect(() => {
        // Trên mobile, sidebar là Drawer nổi (không nằm trong luồng layout)
        // nên không có mép nào để né — 0px để các khối "fixed" (VD
        // PhieuActions.tsx) chiếm trọn chiều ngang màn hình.
        document.documentElement.style.setProperty(
            "--v2-sidebar-width",
            laManHinhDiDong ? "0px" : `${collapsed ? CHIEU_RONG_SIDEBAR_THU_GON : CHIEU_RONG_SIDEBAR}px`
        );
    }, [collapsed, laManHinhDiDong]);

    const xuLyDangXuat = async () => {
        try {
            await dangXuat().unwrap();
        } catch (error) {
            console.error("Đăng xuất lỗi:", error);
        } finally {
            navigator("/v2/dang-nhap");
        }
    };

    const userMenuItems: MenuProps["items"] = [
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

    const xuLyClickUserMenu: MenuProps["onClick"] = ({ key }) => {
        if (key === "profile") navigator("/v2/profile");
        if (key === "logout") xuLyDangXuat();
    };

    // Quyền theo Phiếu có hiệu lực NGAY (không cần đăng xuất/đăng nhập lại)
    // -> đọc live qua API riêng thay vì nhét vào JWT (xem profileApiV2.ts).
    const { data: hoSo } = useLayHoSoQuery(undefined, { skip: !authV2.isAuthenticated });
    const nhomMenu = layNhomMenuHienThi(authV2.nguoiDung, hoSo?.danhSachLoaiPhieuDuocXem);
    const sidebarItems: MenuProps["items"] = [
        { key: "/v2", icon: <FaHome />, label: "Trang chủ" },
        ...nhomMenu.map(nhom => ({
            key: nhom.tieuDe,
            type: "group" as const,
            label: nhom.tieuDe,
            children: nhom.items.map(muc => ({
                key: muc.to,
                icon: muc.icon,
                label: muc.title,
            })),
        })),
    ];

    // Danh sách module dùng chung cho cả Menu trong Sider (desktop) và trong
    // Drawer (mobile) — tránh viết trùng 2 lần.
    const menuModule = (
        <Menu
            mode="inline"
            theme="light"
            selectedKeys={[location.pathname]}
            items={sidebarItems}
            onClick={({ key }) => navigator(key)}
            style={{ borderRight: 0 }}
        />
    );

    return (
        <Layout className="min-h-[100vh]">
            {!laManHinhDiDong && (
                <Sider
                    collapsed={collapsed}
                    trigger={null}
                    theme="light"
                    width={CHIEU_RONG_SIDEBAR}
                    collapsedWidth={CHIEU_RONG_SIDEBAR_THU_GON}
                    className="!border-r border-zinc-200"
                    style={{ height: "100vh", position: "sticky", top: 0, left: 0 }}
                >
                    {/* Thanh trên cùng (logo + nút thu gọn/mở rộng) — fixed để
                        luôn hiển thị bất kể phần menu bên dưới có đang cuộn hay
                        không, nằm ngang hàng với Header bên phải. */}
                    <div
                        className={`flex items-center border-b border-zinc-200 bg-white px-3 ${collapsed ? "justify-center" : "justify-between"}`}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            height: CHIEU_CAO_THANH_TREN,
                            width: collapsed ? CHIEU_RONG_SIDEBAR_THU_GON : CHIEU_RONG_SIDEBAR,
                            zIndex: 10,
                        }}
                    >
                        {!collapsed && (
                            <Link to="/v2" className="flex items-center overflow-hidden">
                                <img className="h-[32px]" src={publicAsset("assets/images/logo-inverse.png")} />
                            </Link>
                        )}
                        <button
                            onClick={() => doiThuGon(!collapsed)}
                            title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
                            className="flex items-center justify-center w-8 h-8 shrink-0 rounded hover:bg-zinc-100 text-zinc-500"
                        >
                            {collapsed ? <FaAngleDoubleRight /> : <FaAngleDoubleLeft />}
                        </button>
                    </div>

                    <div
                        className={`sidebar-v2-scroll${dangCuonSidebar ? " dang-cuon" : ""}`}
                        style={{
                            marginTop: CHIEU_CAO_THANH_TREN,
                            height: `calc(100vh - ${CHIEU_CAO_THANH_TREN}px)`,
                            overflowY: "auto",
                        }}
                        onScroll={xuLyScrollSidebar}
                    >
                        {menuModule}
                    </div>
                </Sider>
            )}

            {/* Mobile/tablet dọc (< lg): sidebar thay bằng Drawer trượt từ
                trái, mở qua nút hamburger ở Header — Sider cố định chiếm quá
                nhiều chiều ngang trên màn hình nhỏ. */}
            {laManHinhDiDong && (
                <Drawer
                    placement="left"
                    open={moMenuDiDong}
                    onClose={() => setMoMenuDiDong(false)}
                    closable={false}
                    width={CHIEU_RONG_SIDEBAR}
                    styles={{ body: { padding: 0 } }}
                >
                    <div className="flex items-center justify-between border-b border-zinc-200 px-3" style={{ height: CHIEU_CAO_THANH_TREN }}>
                        <Link to="/v2" className="flex items-center overflow-hidden" onClick={() => setMoMenuDiDong(false)}>
                            <img className="h-[32px]" src={publicAsset("assets/images/logo-inverse.png")} />
                        </Link>
                    </div>
                    {menuModule}
                </Drawer>
            )}

            <Layout>
                {/* Sticky (không phải fixed): vẫn nằm trong luồng flex bình
                    thường của Layout này nên TỰ ĐỘNG đúng chiều rộng phần còn
                    lại bên cạnh Sider (không cần tính tay left/right theo
                    collapsed — tránh lệch/che khuất nội dung nếu 2 giá trị
                    không đồng bộ). "Dính" ở top khi cuộn Content, ngang hàng
                    với thanh trên cùng của sidebar. */}
                <Header
                    className={`!bg-white !px-3 sm:!px-5 flex items-center border-b ${laManHinhDiDong ? "justify-between" : "justify-end"}`}
                    style={{ position: "sticky", top: 0, height: CHIEU_CAO_THANH_TREN, zIndex: 9 }}
                >
                    {laManHinhDiDong && (
                        <button
                            onClick={() => setMoMenuDiDong(true)}
                            title="Mở menu"
                            className="flex items-center justify-center w-9 h-9 shrink-0 rounded hover:bg-zinc-100 text-zinc-600 text-lg"
                        >
                            <FaBars />
                        </button>
                    )}
                    <div className="flex justify-end items-center gap-2 sm:gap-4 overflow-hidden flex-1">
                        <button
                            onClick={() => navigator(-1)}
                            title="Quay lại trang trước"
                            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-zinc-100 text-zinc-600 shrink-0 mr-auto"
                        >
                            <FaArrowLeft />
                            <span className="hidden sm:inline font-medium">Quay lại</span>
                        </button>
                        <button
                            onClick={() => navigator("/")}
                            title="Chuyển sang trang khảo sát"
                            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-zinc-100 text-zinc-600 shrink-0"
                        >
                            <FaExchangeAlt />
                            <span className="hidden sm:inline font-medium">Về trang khảo sát</span>
                        </button>
                        <div className="hidden sm:flex items-center gap-2">
                            {authV2.nguoiDung?.danhSachVaiTro.map(vt => <Tag key={vt} color="blue">{vt}</Tag>)}
                        </div>
                        <Dropdown menu={{ items: userMenuItems, onClick: xuLyClickUserMenu }} trigger={["click"]}>
                            <div className="flex items-center gap-2 cursor-pointer select-none px-2 py-1 rounded-lg hover:bg-zinc-100 min-w-0">
                                <FaUserCircle className="text-xl text-[#004aad] shrink-0" />
                                <span className="font-semibold truncate max-w-[120px] sm:max-w-none">{authV2.nguoiDung?.hoTen}</span>
                                <FaChevronDown className="text-xs text-zinc-400 shrink-0" />
                            </div>
                        </Dropdown>
                    </div>
                </Header>
                <Content className="m-2 p-3 sm:m-4 sm:p-4 lg:m-6 lg:p-6 min-h-[500px] bg-white">
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
};

export default LayoutV2Component;
