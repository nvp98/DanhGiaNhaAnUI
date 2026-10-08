import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import mucDanhGiaColors from '../configs/mucDanhGiaColors';
import { DiaDiemThongKe } from '../models/DashboardModel';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ChartDataLabels);

interface BarChartTheoDiaDiemComponentProps {
    theoDiaDiem: DiaDiemThongKe[];
}

const mucKeys: (keyof DiaDiemThongKe)[] = ['muc1', 'muc2', 'muc3', 'muc4', 'muc5'];

// Bar lớn so sánh các nhà ăn — mỗi nhà ăn 5 cột (ứng với 5 mức đánh giá),
// khớp layout báo cáo Power BI cũ. Cuộn ngang khi nhiều nhà ăn (xem wrapper
// overflow-x-auto ở DashboardPageV2.tsx).
const BarChartTheoDiaDiemComponent: React.FC<BarChartTheoDiaDiemComponentProps> = ({ theoDiaDiem }) => {
    const data = {
        labels: theoDiaDiem.map((x) => x.tenDiaDiem),
        datasets: mucDanhGiaColors.map((muc, idx) => ({
            label: muc.nhan,
            data: theoDiaDiem.map((dd) => dd[mucKeys[idx]]),
            backgroundColor: muc.mau,
            borderColor: muc.mau,
            borderWidth: 1,
        })),
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const },
            tooltip: {
                callbacks: {
                    label: (tooltipItem: any) => `${tooltipItem.dataset.label}: ${tooltipItem.raw}`,
                },
            },
            datalabels: {
                anchor: 'end' as const,
                align: 'top' as const,
                font: { size: 9 },
                formatter: (value: number) => (value > 0 ? value : ''),
            },
        },
        scales: {
            x: { stacked: false },
            y: { stacked: false },
        },
    };

    const minWidth = Math.max(theoDiaDiem.length * 140, 600);

    return (
        <div className="w-full h-full overflow-x-auto">
            <div style={{ minWidth: `${minWidth}px`, height: '100%', position: 'relative' }}>
                <Bar data={data} options={options} />
            </div>
        </div>
    );
};

export default BarChartTheoDiaDiemComponent;
