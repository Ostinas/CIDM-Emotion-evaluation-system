import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function PeopleChart({ timeline }) {
  if (!timeline || !timeline.length) {
    return <p className="muted">No timeline data.</p>;
  }

  const data = timeline.map(item => ({
    time: item.time_sec,
    watching: item.people_looking,
  }));

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="watching"
            stroke="#4ade80"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
