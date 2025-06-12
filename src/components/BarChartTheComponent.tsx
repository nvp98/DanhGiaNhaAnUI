// BarChartTheComponent.tsx

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarChartTheComponentProps {
  HDData: number[];
  TREData: number[];
  THData: number[];
  xLabels: string[];
}

const BarChartTheComponent: React.FC<BarChartTheComponentProps> = ({ HDData, TREData, THData, xLabels }) => {
  // Prepare data and options for the chart
  const data = {
    labels: xLabels,
    datasets: [

      {
        label: 'Đang Hoạt Động',
        data: HDData,
        backgroundColor: '#4ade80',
        borderColor: '#4ade80',
        borderWidth: 1,
      },
      {
        label: 'Thẻ Trễ Hạn',
        data: TREData,
        backgroundColor: '#de634a',
        borderColor: '#de634a',
        borderWidth: 1,
      },
      {
        label: 'Đã Thu Hồi',
        data: THData,
        backgroundColor: '#bdbdbd',
        borderColor: '#bdbdbd',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem: any) {
            return `${tooltipItem.dataset.label}: ${tooltipItem.raw}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: false, // Change to false for clustered bars
      },
      y: {
        stacked: false, // Change to false for clustered bars
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '58vh', marginTop: "40px" }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default BarChartTheComponent;
