import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <p className="tooltip-time">Time: {data.time}s</p>
        <p className="tooltip-value" style={{ color: "#38bdf8" }}>
          Attention: {(data.percent * 100).toFixed(1)}%
        </p>
        <p className="tooltip-detail">
          {data.looking} of {data.total} people watching
        </p>
      </div>
    );
  }
  return null;
};

export default function TimelineChart({ timeline }) {
  if (!timeline || !timeline.length) {
    return <p className="muted">No timeline data.</p>;
  }

  const data = timeline.map(item => ({
    time: item.time_sec,
    percent: item.percent,
    total: item.total_people,
    looking: item.people_looking,
  }));

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorAttention" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
          <XAxis 
            dataKey="time" 
            label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -10 }}
            stroke="#9ca3af"
          />
          <YAxis 
            domain={[0, 1]} 
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            label={{ value: 'Attention Rate', angle: -90, position: 'outsideLeft', dx: -25, }}
            stroke="#9ca3af"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: "10px" }}
            iconType="line"
          />
          <Area
            type="monotone"
            dataKey="percent"
            name="Attention Rate"
            stroke="#38bdf8"
            strokeWidth={3}
            fill="url(#colorAttention)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
