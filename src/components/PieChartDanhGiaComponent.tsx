import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels, { Context as DataLabelContext } from 'chartjs-plugin-datalabels';
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
                // Neo nhãn ra sát viền ngoài lát cắt (anchor "end") rồi kéo
                // ngược vào trong 1 chút (align "start") thay vì mặc định ở
                // tâm lát cắt — các lát mỏng nằm sát nhau sẽ có bán kính neo
                // lớn hơn (gần viền ngoài thay vì giữa bán kính), nên nhãn
                // giãn cách xa nhau hơn, tránh đè chữ lên nhau.
                anchor: 'end' as const,
                align: 'start' as const,
                // 5 mức đánh giá luôn cố định thứ tự (sắp theo diemDanhGia
                // 1->5, xem sapXep) nên 2 lát sát nhau luôn ở 2 index liền
                // kề — xen kẽ offset theo chẵn/lẻ index để 2 lát mỏng cạnh
                // nhau (VD mức 1 - mức 2, thường rất nhỏ) rơi vào 2 bán kính
                // khác nhau, không bị chồng nhãn dù góc giữa chúng rất hẹp.
                offset: (ctx: DataLabelContext) => (ctx.dataIndex % 2 === 0 ? 2 : 16),
                clamp: true,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: 4,
                padding: { top: 2, bottom: 2, left: 4, right: 4 },
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
