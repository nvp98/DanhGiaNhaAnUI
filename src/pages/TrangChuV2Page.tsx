import { Card } from "antd";
import React, { useEffect } from "react";
import {
    FaBuilding,
    FaChartBar,
    FaClipboardCheck,
    FaFire,
    FaHandshake,
    FaLayerGroup,
    FaListUl,
    FaSignature,
    FaTable,
    FaUserTag,
    FaUsersCog,
    FaUtensils,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import LayoutV2Component from "../components/LayoutV2Component";
import { RootType } from "../store/types";

interface MucMenu {
    title: string;
    description: string;
    to: string;
    icon: React.ReactNode;
}

interface NhomMenu {
    tieuDe: string;
    items: MucMenu[];
}

// Nhóm màn hình theo nghiệp vụ để dễ tìm: (1) 4 loại phiếu là nghiệp vụ
// chính hàng ngày, (2) tiêu chí/nhóm tiêu chí + luồng ký là cấu hình đứng
// sau checklist của các phiếu, (3) phần còn lại là danh mục dùng chung/quản
// trị hệ thống.
const NHOM_MENU: NhomMenu[] = [
    {
        tieuDe: "Phiếu đánh giá",
        items: [
            { title: "Phiếu 1 — Kiểm tra VSATTP", description: "Lập & quản lý phiếu kiểm tra VSATTP tại bếp ăn", to: "/phieu1", icon: <FaClipboardCheck /> },
            { title: "Phiếu 2 — Đánh giá suất ăn", description: "Lập & quản lý phiếu đánh giá chất lượng dịch vụ suất ăn", to: "/phieu2", icon: <FaUtensils /> },
            { title: "Phiếu 3 — Báo cáo tháng", description: "Lập & quản lý báo cáo chất lượng dịch vụ theo tháng", to: "/phieu3", icon: <FaChartBar /> },
            { title: "Phiếu 4 — Tổng hợp & phân bổ", description: "Bảng tổng hợp đánh giá & phân bổ suất ăn", to: "/phieu4", icon: <FaTable /> },
        ],
    },
    {
        tieuDe: "Tiêu chí & cấu hình đánh giá",
        items: [
            { title: "Nhóm tiêu chí", description: "Quản lý nhóm/mục nội dung checklist", to: "/nhom-tieu-chi", icon: <FaLayerGroup /> },
            { title: "Tiêu chí đánh giá", description: "Quản lý tiêu chí (checklist) trong từng nhóm", to: "/tieu-chi", icon: <FaListUl /> },
            { title: "Luồng ký", description: "Cấu hình luồng trình ký theo từng loại phiếu", to: "/mau-luong-ky", icon: <FaSignature /> },
        ],
    },
    {
        tieuDe: "Danh mục & hệ thống",
        items: [
            { title: "Bếp ăn", description: "Danh mục bếp ăn, gắn nhà thầu vận hành", to: "/v2/bep-an", icon: <FaFire /> },
            { title: "Nhà thầu", description: "Danh mục nhà thầu cung cấp dịch vụ suất ăn", to: "/v2/nha-thau", icon: <FaHandshake /> },
            { title: "Vai trò", description: "Danh mục vai trò người dùng trong hệ thống", to: "/v2/vai-tro", icon: <FaUserTag /> },
            { title: "Phòng ban", description: "Danh mục phòng ban (P.ĐN, P.ATMT...)", to: "/v2/phong-ban", icon: <FaBuilding /> },
            { title: "Quản lý tài khoản", description: "Duyệt / khóa / gán vai trò cho người dùng", to: "/v2/quan-ly-tai-khoan", icon: <FaUsersCog /> },
        ],
    },
];

const TrangChuV2Page: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const navigator = useNavigate();

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        }
    }, [authV2.isAuthenticated]);

    if (!authV2.isAuthenticated) {
        return null;
    }

    return <LayoutV2Component>
        <h2 className="font-bold text-xl text-zinc-700 mb-6">
            Xin chào, {authV2.nguoiDung?.hoTen}
        </h2>

        <div className="flex flex-col gap-8">
            {NHOM_MENU.map(nhom => (
                <div key={nhom.tieuDe}>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="inline-block w-1 h-5 bg-[#004aad] rounded-full" />
                        <h3 className="font-semibold text-sm text-zinc-500 uppercase tracking-wide">
                            {nhom.tieuDe}
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {nhom.items.map(muc => (
                            <Card
                                key={muc.to}
                                hoverable
                                bordered
                                className="cursor-pointer transition-shadow hover:shadow-md"
                                onClick={() => navigator(muc.to)}
                            >
                                <div className="flex gap-3 items-start">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#004aad]/10 text-[#004aad] text-lg shrink-0">
                                        {muc.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-medium text-zinc-700">{muc.title}</div>
                                        <div className="text-sm text-zinc-400 mt-0.5">{muc.description}</div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </LayoutV2Component>;
};

export default TrangChuV2Page;
