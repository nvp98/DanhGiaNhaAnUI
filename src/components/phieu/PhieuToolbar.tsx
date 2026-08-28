import { Button, Tag } from "antd";
import React from "react";
import { FaPrint } from "react-icons/fa";
import { mauTrangThaiPhieu, tenTrangThaiPhieu } from "./constants";

export interface PhieuToolbarProps {
    title: React.ReactNode;
    trangThai?: string;
    onPrint?: () => void;
    extraButtons?: React.ReactNode;
    children?: React.ReactNode;
}

export const PhieuToolbar: React.FC<PhieuToolbarProps> = ({
    title,
    trangThai,
    onPrint,
    extraButtons,
    children,
}) => {
    return (
        <div className="phieu-toolbar no-print pb-4 mb-5 border-b border-zinc-100">
            <div>
                {typeof title === "string" ? (
                    <h2 className="font-bold text-xl text-zinc-700 m-0">{title}</h2>
                ) : (
                    title
                )}
            </div>

            <div className="flex items-center gap-2">
                {trangThai && (
                    <Tag color={mauTrangThaiPhieu(trangThai)} className="!px-3 !py-1 !text-sm">
                        {tenTrangThaiPhieu(trangThai)}
                    </Tag>
                )}

                {onPrint && (
                    <Button icon={<FaPrint />} onClick={onPrint}>
                        In phiếu
                    </Button>
                )}

                {extraButtons}
                {children}
            </div>
        </div>
    );
};

export default PhieuToolbar;
