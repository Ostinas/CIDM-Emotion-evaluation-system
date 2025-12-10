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
        <p className="tooltip-value" style={{ color: "#4ade80" }}>
          Watching: {data.watching} people
        </p>
        <p className="tooltip-value" style={{ color: "#9ca3af" }}>
          Total: {data.total} people
        </p>
        <p className="tooltip-detail">
          Attention: {((data.watching / (data.total || 1)) * 100).toFixed(0)}%
        </p>
      </div>
    );
  }
  return null;
};

export default function PeopleChart({ timeline }) {
  if (!timeline || !timeline.length) {
    return <p className="muted">No timeline data.</p>;
  }

  const data = timeline.map(item => ({
    time: item.time_sec,
    watching: item.people_looking,
    total: item.total_people,
    notWatching: item.total_people - item.people_looking,
  }));

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorWatching" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorNotWatching" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f87171" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
          <XAxis 
            dataKey="time" 
            label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5 }}
            stroke="#9ca3af"
          />
          <YAxis 
            allowDecimals={false}
            label={{ value: 'Number of People', angle: -90, position: 'insideLeft' }}
            stroke="#9ca3af"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: "10px" }}
            iconType="line"
          />
          <Area
            type="monotone"
            dataKey="watching"
            name="People Watching"
            stroke="#4ade80"
            strokeWidth={3}
            fill="url(#colorWatching)"
            stackId="1"
          />
          <Area
            type="monotone"
            dataKey="notWatching"
            name="Not Watching"
            stroke="#f87171"
            strokeWidth={2}
            fill="url(#colorNotWatching)"
            stackId="1"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
