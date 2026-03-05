import "./AppLineChart.css";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import type { LabelProps } from "recharts";

interface AppLineChartProps {
  data: { name: string; value: number }[];
  className?: string;
  label?: string;
  CustomXAxisLabel?: React.FC<LabelProps>;
}

function AppLineChart({ data, className, label, CustomXAxisLabel }: AppLineChartProps) {
  const renderCustomizedLabel = (props: { x?: number; y?: number; offset?: number; value?: string | number }) => {
    const { x = 0, y = 0, offset = 0, value } = props;
    const radius = 20;
    return (
      <g>
        <text
          x={x + offset / 2}
          y={y - radius}
          fill="#000000"
          textAnchor="middle"
          dominantBaseline="middle"
          className="chart-bar-label-text"
        >
          {value}
        </text>
      </g>
    );
  };

  return (
    <div className={`AppLineChart ${className}`}>
      {label && <label className="app-line-chart-label">{label}</label>}
      <div
        className={`app-line-chart ${
          data.length === 0 ? "app-line-chart-empty" : ""
        }`}
      >
        {data.length === 0 ? (
          <p>לא נמצאו נתונים</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%" debounce={300}>
            <LineChart

              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={CustomXAxisLabel ? <CustomXAxisLabel /> : undefined}
                height={40}
                padding={{ right: 30, left: 30 }}
              />
              <YAxis
                domain={[
                  (dataMin: number) => Math.round(dataMin * 0.9),
                  (dataMax: number) => Math.round(dataMax * 1.1),
                ]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-main)"
                label={renderCustomizedLabel}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default AppLineChart;
