import React, { useEffect } from "react";
import LayoutV2Component from "../components/LayoutV2Component";
import { useSelector } from "react-redux";
import { RootType } from "../store/types";
import { useNavigate } from "react-router-dom";

// Module "Dashboard" (báo cáo Power BI) — chuyển từ DashboardPage.tsx (hệ v1
// cũ) sang quản lý trong TrangChuV2Page, dùng chung authV2.
const DashboardPageV2: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const navigator = useNavigate();

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        } else if (!authV2.nguoiDung?.laAdmin) {
            navigator("/v2");
        }
    }, []);

    if (!authV2.isAuthenticated || !authV2.nguoiDung?.laAdmin) {
        return null;
    }

    return <LayoutV2Component>
        <div className="w-full h-full">
            <div className="w-full h-[80vh] bg-white rounded-xl shadow border overflow-hidden">
                <iframe
                    title="Báo cáo Power BI"
                    src="https://app.powerbi.com/view?r=eyJrIjoiNmExZDU4M2QtZDY5ZS00NjYwLWE1YzEtYmMxYzVkNGUyZjlhIiwidCI6ImIxNThlOWE1LTA2OTEtNGU0Zi1iYmExLTQxN2I5OWVjZDBhMCIsImMiOjEwfQ%3D%3D&pageName=95c4a75b6629632de60c"
                    className="w-full h-full border-0"
                    allowFullScreen
                ></iframe>
            </div>
        </div>
    </LayoutV2Component>;
};

export default DashboardPageV2;
