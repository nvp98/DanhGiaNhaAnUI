import { Button } from "antd";
import React from "react";
import { FaPlus } from "react-icons/fa";

export interface PhieuListHeaderProps {
    icon: React.ReactNode;
    title: string;
    actionLabel?: string;
    onAction?: () => void;
}

// Header dùng chung cho các trang danh sách phiếu: icon tròn + tiêu đề bên
// trái, nút hành động chính bên phải — thay cho tiêu đề chữ chay trước đây.
export const PhieuListHeader: React.FC<PhieuListHeaderProps> = ({
    icon,
    title,
    actionLabel,
    onAction,
}) => {
    return (
        <div className="flex justify-between items-center gap-3 mb-5">
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#004aad]/10 text-[#004aad] text-lg shrink-0">
                    {icon}
                </div>
                <h2 className="font-bold text-lg text-zinc-700 m-0">{title}</h2>
            </div>

            {actionLabel && onAction && (
                <Button type="primary" icon={<FaPlus />} onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

export default PhieuListHeader;
