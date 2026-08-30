import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';
import { Line } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const labels = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30'];
export default function Chart() {
  const data = { labels, datasets: [{ data: [226.8, 227.3, 226.95, 227.62, 228.12, 227.78, 228.34, 228.02, 228.85, 228.41, 229.1, 229.45], borderColor: '#b94d81', borderWidth: 2.5, pointRadius: 0, tension: .38, fill: true, backgroundColor: (context) => { const chart = context.chart; const {ctx, chartArea} = chart; if (!chartArea) return 'rgba(185,77,129,.05)'; const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom); gradient.addColorStop(0, 'rgba(185,77,129,.22)'); gradient.addColorStop(1, 'rgba(185,77,129,0)'); return gradient; }}] };
  const options = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { displayColors: false, callbacks: { label: (c) => `$ ${c.parsed.y.toFixed(2)}` } } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: '#8f7084', maxTicksLimit: 6, font: { size: 11 } } }, y: { position: 'right', grid: { color: '#f4dfeb' }, border: { display: false }, ticks: { color: '#8f7084', callback: (v) => `$${v}`, font: { size: 11 } } } } };
  return <div className="chart-canvas"><Line data={data} options={options} /></div>;
}
