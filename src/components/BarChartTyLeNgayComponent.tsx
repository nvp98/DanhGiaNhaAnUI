import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { TyLeTheoNgay } from '../models/DashboardModel';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ChartDataLabels);

interface BarChartTyLeNgayComponentProps {
    theoNgay: TyLeTheoNgay[];
}

// Bar nhỏ "Tỷ lệ % theo ngày" — mặc định hiện 5 ngày gần nhất trong khoảng
// filter đang chọn, khớp layout báo cáo Power BI cũ.
const BarChartTyLeNgayComponent: React.FC<BarChartTyLeNgayComponentProps> = ({ theoNgay }) => {
    const namNgayCuoi = theoNgay.slice(-5);

    const data = {
        labels: namNgayCuoi.map((x) => new Date(x.ngay).toLocaleDateString('vi-VN')),
        datasets: [
            {
                label: 'Tỷ lệ đánh giá',
                data: namNgayCuoi.map((x) => x.tyLePercent),
                backgroundColor: '#3b82f6',
                borderColor: '#3b82f6',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (tooltipItem: any) => `${tooltipItem.raw}%`,
                },
            },
            datalabels: {
                anchor: 'end' as const,
                align: 'top' as const,
                formatter: (value: number) => `${value}%`,
            },
        },
        scales: {
            y: { display: false },
        },
    };

    return (
        <div className="w-full h-full" style={{ position: 'relative' }}>
            <Bar data={data} options={options} />
        </div>
    );
};

export default BarChartTyLeNgayComponent;
