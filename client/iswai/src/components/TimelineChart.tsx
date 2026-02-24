import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type SeriesKey = {
  actualKey: string;
  predKey: string;
  actualLabel: string;
  predLabel: string;
  yLabel: string;
};

type Props = {
  data: Record<string, unknown>[];
  series: SeriesKey;
  height?: number;
};

function formatDateLabel(value: number): string {
  // value is ms timestamp
  const d = new Date(value);
  // full readable format (you can change)
  return d.toLocaleString(); // shows full date + time
}

function formatTooltipLabel(value: number): string {
  const d = new Date(value);
  return d.toLocaleString();
}

export default function TimelineChart({ data, series, height = 380 }: Props) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 15, right: 25, left: 10, bottom: 70 }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          {/* X Axis */}
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={formatDateLabel}
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
            interval={0} // shows all labels (if too many, see note below)
          />

          {/* Y Axis */}
          <YAxis
            tick={{ fontSize: 12 }}
            width={60}
            label={{
              value: series.yLabel,
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle" },
            }}
          />

          <Tooltip
            labelFormatter={formatTooltipLabel}
            formatter={(value: unknown, name: string) => [Number(value).toFixed(2), name]}
          />

          <Legend />

          <Line
            type="monotone"
            dataKey={series.actualKey}
            name={series.actualLabel}
            strokeWidth={2}
            dot={false}
          />

          <Line
            type="monotone"
            dataKey={series.predKey}
            name={series.predLabel}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}