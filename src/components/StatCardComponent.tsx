import React from 'react';

interface StatCardComponentProps {
    title: string;
    value: string;
    background?: string;
    valueColor?: string;
}

// Thẻ số liệu lớn (KPI) dùng cho DashboardPageV2 — "Tổng lượt đánh giá",
// "Tổng cơm thực tế", "Tổng tỷ lệ đánh giá".
const StatCardComponent: React.FC<StatCardComponentProps> = ({ title, value, background = '#f4f4f5', valueColor = '#18181b' }) => {
    return (
        <div
            className="rounded-xl shadow border flex flex-col items-center justify-center text-center p-2 h-full"
            style={{ background }}
        >
            <div className="text-xl font-extrabold leading-tight" style={{ color: valueColor }}>{value}</div>
            <div className="text-xs text-zinc-600 mt-0.5">{title}</div>
        </div>
    );
};

export default StatCardComponent;
