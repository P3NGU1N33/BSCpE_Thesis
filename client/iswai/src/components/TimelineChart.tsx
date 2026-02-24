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

export default function TimelineChart({ data, series, height = 400 }: Props) {
  return (
    <div style={{
        width: "100%",
        height,
        backgroundColor: "#ffffff", // ✅ White background
        padding: "10px",
        borderRadius: "8px",
      }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 15, right: 25, left: 20, bottom: 40 }}
        >
          <CartesianGrid stroke="#e0e0e0" strokeDasharray="3 3" />

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
            tick={{ fill: "#000000", fontSize: 12 }}  //black ticks
            stroke="#000000"                           //black axis line
            interval="preserveStartEnd" // shows all labels (if too many, see note below)
          />

          {/* Y Axis */}
          <YAxis
            tick={{ fill: "#000000", fontSize: 12 }}  //black ticks
            width={60}
            label={{
              value: series.yLabel,
              angle: -90,
              position: "insideLeft",
              fill: "#000000",                        //black label
              style: { textAnchor: "middle" },
            }}
          />

          <Tooltip
            labelFormatter={formatTooltipLabel}
            formatter={(value: unknown, name: string) => [
              Number(value).toFixed(2),
              name,
            ]}
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #ccc",
            }}
          />

          <Legend verticalAlign="bottom"
                  align="center"
                    wrapperStyle={{
                        paddingTop: 20,   // push legend downward
            }}/>
        
          {/* Actual Data Line */}
          <Line
            type="monotone"
            dataKey={series.actualKey}
            name={series.actualLabel}
            stroke="#008B8B" // Dark cyan color for actual data
            strokeWidth={2}
            dot={false}
          />    
          {/* Predicted Data Line */}
          <Line
            type="monotone"
            dataKey={series.predKey}
            name={series.predLabel}
            stroke="#1E40AF" // Dark blue color for predicted data
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}