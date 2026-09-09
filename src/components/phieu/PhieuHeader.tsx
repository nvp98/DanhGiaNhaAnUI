import React from "react";

import logoPdf from "../../assets/images/LogoPDF.png";
import phieuHeaderInfo from "../../config/phieuHeaderInfo.json";

export type MaPhieu = "PHIEU1" | "PHIEU2" | "PHIEU3" | "PHIEU4";

export interface PhieuHeaderInfoItem {
    label: string;
    value: React.ReactNode;
}

export interface PhieuHeaderProps {
    // Khóa tra cứu thông tin biểu mẫu (số biểu mẫu, ngày hiệu lực, lần sửa đổi)
    // trong src/config/phieuHeaderInfo.json — quản lý chung cho cả 4 phiếu.
    maPhieu: MaPhieu;
    soHieu?: React.ReactNode;
    title: string;
    subtitle?: React.ReactNode;
    infoItems?: PhieuHeaderInfoItem[];
    className?: string;
}

export const PhieuHeader: React.FC<PhieuHeaderProps> = ({
    maPhieu,
    soHieu,
    title,
    subtitle,
    infoItems = [],
    className = "",
}) => {
    const thongTinBieuMau = (phieuHeaderInfo as Record<MaPhieu, {
        soBieuMau: string;
        ngayHieuLuc: string;
        lanSuaDoi: string;
    }>)[maPhieu];

    return (
        <div className={`phieu-header ${className}`}>
            <div className="phieu-header-meta">
                <div className="phieu-header-meta-left">
                    <img className="phieu-header-logo" src={logoPdf} alt="Logo" />
                    <div className="phieu-header-so">Số: {soHieu || "........................"}</div>
                </div>
                <div className="phieu-header-meta-right">
                    <div>{thongTinBieuMau?.soBieuMau}</div>
                    <div className="info-date">
                        <div>Ngày hiệu lực: {thongTinBieuMau?.ngayHieuLuc}</div>
                        <div>Lần sửa đổi: {thongTinBieuMau?.lanSuaDoi}</div>
                    </div>
                </div>
            </div>

            <div className="phieu-title">{title}</div>

            {subtitle && <div className="phieu-subtitle">{subtitle}</div>}

            {infoItems.length > 0 && (
                <div className="phieu-header-info">
                    {infoItems.map((item, index) => (
                        <div key={index}>
                            <span className="label">{item.label}</span>
                            <span className="underline-text">{item.value}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PhieuHeader;
