import { Tag } from "antd";
import React from "react";
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
    extraButtons,
    children,
}) => {
    return (
        <div className="phieu-toolbar no-print pb-4 mb-5 border-b border-zinc-100">
            <div className="phieu-toolbar-title">
                {typeof title === "string" ? (
                    <h2 className="font-bold text-xl text-zinc-700 m-0">{title}</h2>
                ) : (
                    title
                )}
            </div>

            <div className="phieu-toolbar-actions">
                {trangThai && (
                    <Tag color={mauTrangThaiPhieu(trangThai)} className="!px-3 !py-1 !text-sm">
                        {tenTrangThaiPhieu(trangThai)}
                    </Tag>
                )}

                {/* {onPrint && (
                    <Button icon={<FaPrint />} onClick={onPrint}>
                        In phiếu
                    </Button>
                )} */}

                {extraButtons}
                {children}
            </div>
        </div>
    );
};

export default PhieuToolbar;
