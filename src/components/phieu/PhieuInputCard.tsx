import React from "react";
import { FaEdit } from "react-icons/fa";

export interface PhieuInputCardProps {
    title?: string;
    children: React.ReactNode;
}

// Khối "Thông tin nhập liệu" dùng chung cho form 4 loại phiếu (KHÔNG in ra —
// chỉ hiển thị khi thao tác trên màn hình, tờ phiếu A4 bên dưới giữ nguyên
// giao diện in ấn cũ). Thay Card mặc định bằng nền xám nhạt bo góc cho đỡ
// "chay" so với nền trắng của khung layout.
export const PhieuInputCard: React.FC<PhieuInputCardProps> = ({
    title = "Thông tin nhập liệu",
    children,
}) => {
    return (
        <div className="no-print mb-5">
            <div className="bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-4">
                <div className="flex items-center gap-2 mb-4 text-zinc-500 font-medium text-sm uppercase tracking-wide">
                    <FaEdit />
                    {title}
                </div>
                {children}
            </div>
        </div>
    );
};

export default PhieuInputCard;
