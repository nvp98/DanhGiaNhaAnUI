import React from "react";
import { FaFilter } from "react-icons/fa";

export interface PhieuFilterBarProps {
    children: React.ReactNode;
}

// Thanh bộ lọc dùng chung cho các trang danh sách phiếu/danh mục — bọc các
// Select lọc trong 1 nền xám nhạt bo góc thay vì để trôi nổi trên nền trắng.
export const PhieuFilterBar: React.FC<PhieuFilterBarProps> = ({ children }) => {
    return (
        <div className="flex items-center gap-3 flex-wrap bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 mb-4">
            <FaFilter className="text-zinc-400 shrink-0" />
            {children}
        </div>
    );
};

export default PhieuFilterBar;
