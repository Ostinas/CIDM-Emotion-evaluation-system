import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const EMOTION_LABELS = [
  "anger",
  "contempt",
  "disgust",
  "fear",
  "happiness",
  "neutral",
  "sadness",
  "surprise",
];

const EMOTION_COLORS = {
  happiness: "#4ade80",
  surprise: "#38bdf8",
  neutral: "#fbbf24",
  sadness: "#a78bfa",
  anger: "#f87171",
  disgust: "#84cc16",
  fear: "#f97316",
  contempt: "#ec4899",
};

export default function EmotionLines({ timeline }) {
  if (!timeline || !timeline.length) {
    return (
      <div className="emotion-lines">
        <h4>Emotion Trends</h4>
        <p className="muted">No emotion data available.</p>
      </div>
    );
  }

  // Build chart data: ensure each entry has a value per emotion (0-100)
  const data = useMemo(() => {
    return timeline.map((item) => {
      const entry = { time: item.time_sec };
      EMOTION_LABELS.forEach((e) => {
        const raw = item.emotions?.emotion_percentages?.[e] ?? 0;
        entry[e] = Math.min(Math.max((raw || 0) * 100, 0), 100);
      });
      return entry;
    });
  }, [timeline]);

  // default: show all emotions
  const [selected, setSelected] = useState(() => {
    const map = {};
    EMOTION_LABELS.forEach((e) => (map[e] = true));
    return map;
  });

  const toggle = (emotion) =>
    setSelected((s) => ({ ...s, [emotion]: !s[emotion] }));

  const allSelected = EMOTION_LABELS.every((e) => selected[e]);
  const toggleAll = () => {
    const next = {};
    EMOTION_LABELS.forEach((e) => (next[e] = !allSelected));
    setSelected(next);
  };

  const visibleEmotions = EMOTION_LABELS.filter((e) => selected[e]);

  return (
    <div className="emotion-line-chart">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <h4 style={{ margin: 0 }}>Emotions over time</h4>
        <button className="emotion-select-btn" onClick={toggleAll}>
          {allSelected ? "Deselect all" : "Select all"}
        </button>
      </div>
      <div className="emotion-lines-controls" style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
        
        {EMOTION_LABELS.map((e) => (
          <label key={e} style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input type="checkbox" checked={!!selected[e]} onChange={() => toggle(e)} />
            <span style={{ width: 10, height: 10, background: EMOTION_COLORS[e], display: "inline-block", borderRadius: 100 }}></span>
            <span style={{ textTransform: "capitalize", color: "#cbd5e1", fontSize: 12 }}>{e}</span>
          </label>
        ))}
      </div>

      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" />
            <XAxis dataKey="time" stroke="#9ca3af" tickFormatter={(v) => `${v}s`} />
            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} stroke="#9ca3af" />
            <Tooltip
                formatter={(value, name) => [`${Number(value).toFixed(0)}%`, name]}
                labelFormatter={(label) => `Time: ${label}s`}
                contentStyle={{ backgroundColor: 'rgba(17,24,39,0.95)', borderRadius: 8, padding: '10px 12px' }}
                labelStyle={{ color: '#94a3b8', fontSize: 16 }} />
            {visibleEmotions.map((e) => (
              <Line
                key={e}
                type="monotone"
                dataKey={e}
                name={e.charAt(0).toUpperCase() + e.slice(1)}
                stroke={EMOTION_COLORS[e]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
