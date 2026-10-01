import React from "react";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Chart as MixedChart } from "react-chartjs-2";
import { useTranslation } from "../../i18n";

ChartJS.register(
  BarController,
  BarElement,
  CategoryScale,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
);

export default function Chart({ bars = [], orders = [], isLoading = false, isError = false }) {
  const { language, t } = useTranslation();
  const currency = new Intl.NumberFormat(language, {
    style: "currency",
    currency: "USD",
  });
  const number = new Intl.NumberFormat(language, { notation: "compact" });
  const labels = bars.map((bar) =>
    new Intl.DateTimeFormat(language, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(bar.t)),
  );
  const maxVolume = Math.max(1, ...bars.map((bar) => Number(bar.v || 0)));

  const datasets = [
    {
      type: "bar",
      kind: "volume",
      label: t("tradedVolume"),
      data: bars.map((bar) => Number(bar.v || 0)),
      yAxisID: "volume",
      backgroundColor: bars.map((bar) =>
        Number(bar.c) >= Number(bar.o)
          ? "rgba(39,132,101,.22)"
          : "rgba(198,71,105,.2)",
      ),
      borderWidth: 0,
      barPercentage: 0.9,
      categoryPercentage: 0.92,
      order: 2,
    },
    {
      type: "line",
      kind: "price",
      label: t("stockPrice"),
      data: bars.map((bar) => Number(bar.c)),
      borderColor: "#b94d81",
      borderWidth: 2.5,
      pointRadius: 0,
      pointHitRadius: 8,
      tension: 0.24,
      fill: true,
      backgroundColor: (context) => {
        const { ctx, chartArea } = context.chart;
        if (!chartArea) return "rgba(185,77,129,.05)";
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, "rgba(185,77,129,.18)");
        gradient.addColorStop(1, "rgba(185,77,129,0)");
        return gradient;
      },
      order: 1,
    },
    ...orders.map((order) => {
      const orderSide = order.side === "buy" ? "buyOrder" : "sellOrder";
      return {
        type: "line",
        kind: "order",
        label: t("orderChartLabel", {
          side: t(orderSide),
          quantity: number.format(order.quantity),
          price: currency.format(order.limitPrice),
        }),
        data: bars.map(() => order.limitPrice),
        borderColor: order.side === "buy" ? "#278465" : "#c64769",
        backgroundColor: order.side === "buy" ? "#278465" : "#c64769",
        borderDash: [6, 5],
        borderWidth: 1.5,
        pointRadius: (context) => context.dataIndex === bars.length - 1 ? 4 : 0,
        pointHoverRadius: 6,
        pointStyle: "triangle",
        pointRotation: order.side === "buy" ? 0 : 180,
        fill: false,
        tension: 0,
        order: 0,
      };
    }),
  ];

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          color: "#8f7084",
          usePointStyle: true,
          boxWidth: 7,
          boxHeight: 7,
          padding: 14,
          filter: (item, chart) => chart.datasets[item.datasetIndex]?.kind !== "volume",
          font: { size: 10 },
        },
      },
      tooltip: {
        displayColors: true,
        callbacks: {
          label: (point) => point.dataset.kind === "volume"
            ? `${t("tradedVolume")}: ${number.format(point.parsed.y)} ${t("shares")}`
            : `${point.dataset.label}: ${currency.format(point.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#8f7084", maxTicksLimit: 7, font: { size: 10 } },
      },
      y: {
        position: "right",
        grid: { color: "#f4dfeb" },
        border: { display: false },
        ticks: {
          color: "#8f7084",
          callback: (value) => currency.format(value),
          font: { size: 10 },
        },
      },
      volume: {
        type: "linear",
        position: "left",
        display: false,
        min: 0,
        max: maxVolume * 5,
        grid: { display: false },
      },
    },
  };

  if (!bars.length) {
    return (
      <div className="chart-empty" role="status">
        {isLoading ? t("marketDataLoading") : isError ? t("marketDataFailed") : t("noChartData")}
      </div>
    );
  }

  return (
    <div className="chart-canvas" role="img" aria-label={t("chartDescription")}>
      <MixedChart type="bar" data={{ labels, datasets }} options={options} />
    </div>
  );
}