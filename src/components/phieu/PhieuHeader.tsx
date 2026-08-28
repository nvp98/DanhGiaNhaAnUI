import React from "react";

export interface PhieuHeaderInfoItem {
    label: string;
    value: React.ReactNode;
}

export interface PhieuHeaderProps {
    title: string;
    subtitle?: React.ReactNode;
    infoItems?: PhieuHeaderInfoItem[];
    className?: string;
}

export const PhieuHeader: React.FC<PhieuHeaderProps> = ({
    title,
    subtitle,
    infoItems = [],
    className = "",
}) => {
    return (
        <div className={`phieu-header ${className}`}>
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
