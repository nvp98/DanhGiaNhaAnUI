// BarChartComponent.tsx

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarChartComponentProps {
  dData: number[];
  kData: number[];
  xLabels: string[];
}

const BarChartComponent: React.FC<BarChartComponentProps> = ({ dData, kData, xLabels }) => {
  // Prepare data and options for the chart
  const data = {
    labels: xLabels,
    datasets: [
      {
        label: 'Đạt',
        data: dData,
        backgroundColor: '#87f69d',
        borderColor: '#4ce949',
        borderWidth: 1,
      },
      {
        label: 'Không Đạt',
        data: kData,
        backgroundColor: '#fca1a1',
        borderColor: '#fb3c3c',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    
    maintainAspectRatio: false, // Important for responsiveness
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
        stacked: true,
        
      },
      y: {
        stacked: true,
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '55vh', marginTop: "40px"}}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default BarChartComponent;
