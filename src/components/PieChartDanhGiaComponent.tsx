import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import mucDanhGiaColors from '../configs/mucDanhGiaColors';
import { MucDanhGiaThongKe } from '../models/DashboardModel';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface PieChartDanhGiaComponentProps {
    theoMucDanhGia: MucDanhGiaThongKe[];
}

// Pie "Tất cả lịch sử đánh giá" — 5 mức đánh giá + % mỗi mức, khớp layout
// báo cáo Power BI cũ.
const PieChartDanhGiaComponent: React.FC<PieChartDanhGiaComponentProps> = ({ theoMucDanhGia }) => {
    const sapXep = [...theoMucDanhGia].sort((a, b) => a.diemDanhGia - b.diemDanhGia);

    const data = {
        labels: sapXep.map((x) => mucDanhGiaColors.find((m) => m.diemDanhGia === x.diemDanhGia)?.nhan ?? `Mức ${x.diemDanhGia}`),
        datasets: [
            {
                data: sapXep.map((x) => x.soLuong),
                backgroundColor: sapXep.map((x) => mucDanhGiaColors.find((m) => m.diemDanhGia === x.diemDanhGia)?.mau ?? '#a1a1aa'),
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
            },
            tooltip: {
                callbacks: {
                    label: (tooltipItem: any) => {
                        const muc = sapXep[tooltipItem.dataIndex];
                        return `${tooltipItem.label}: ${muc.soLuong} (${muc.tyLePercent}%)`;
                    },
                },
            },
            datalabels: {
                color: '#fff',
                font: { weight: 'bold' as const },
                formatter: (_value: number, ctx: any) => {
                    const muc = sapXep[ctx.dataIndex];
                    return muc.tyLePercent > 0 ? `${muc.tyLePercent}%` : '';
                },
            },
        },
    };

    return (
        <div className="w-full h-full" style={{ position: 'relative' }}>
            <Pie data={data} options={options} />
        </div>
    );
};

export default PieChartDanhGiaComponent;
