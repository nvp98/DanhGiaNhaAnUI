import React from "react";

export interface SignatureColumn {
    title: string;
    subTitle?: string;
    note?: string;
    customContent?: React.ReactNode;
}

export interface PhieuSignaturesProps {
    columns: SignatureColumn[];
    className?: string;
}

export const PhieuSignatures: React.FC<PhieuSignaturesProps> = ({
    columns,
    className = "",
}) => {
    const gridColsClass = columns.length >= 3 ? "cols-3" : "cols-2";

    return (
        <div className={`phieu-chu-ky ${gridColsClass} ${className}`}>
            {columns.map((col, index) => (
                <div key={index} className="chu-ky-block">
                    <div className="chu-ky-title">{col.title}</div>
                    {col.note && <div className="chu-ky-note">{col.note}</div>}

                    {col.customContent ? (
                        col.customContent
                    ) : (
                        <div className="chu-ky-space">
                            <span>{col.subTitle || "(Ký, ghi rõ họ tên)"}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default PhieuSignatures;
