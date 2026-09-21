import { Card } from "antd";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import LayoutV2Component from "../components/LayoutV2Component";
import { layNhomMenuHienThi } from "../config/menuV2";
import { useLayHoSoQuery } from "../services/profileApiV2";
import { RootType } from "../store/types";

const TrangChuV2Page: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const navigator = useNavigate();

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        }
    }, [authV2.isAuthenticated]);

    // Phải gọi trước early-return bên dưới: nếu isAuthenticated chuyển
    // true -> false trong lúc component đang mounted (vd logout), số hook
    // gọi mỗi lần render phải giữ nguyên, nếu không React báo lỗi "Rendered
    // fewer hooks than expected".
    // Quyền theo Phiếu có hiệu lực NGAY -> đọc live qua API riêng thay vì
    // nhét vào JWT (xem profileApiV2.ts / LayoutV2Component.tsx).
    const { data: hoSo } = useLayHoSoQuery(undefined, { skip: !authV2.isAuthenticated });

    if (!authV2.isAuthenticated) {
        return null;
    }

    const nhomMenu = layNhomMenuHienThi(authV2.nguoiDung, hoSo?.danhSachLoaiPhieuDuocXem);

    return <LayoutV2Component>
        <h2 className="font-bold text-xl text-zinc-700 mb-6">
            Xin chào, {authV2.nguoiDung?.hoTen}
        </h2>

        <div className="flex flex-col gap-8">
            {nhomMenu.map(nhom => (
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
