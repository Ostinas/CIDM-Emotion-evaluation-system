import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

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
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis domain={[0, 1]} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="percent"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
