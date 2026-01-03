import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import EmotionLines from "./EmotionLines";

// All 8 emotions from HSEmotion model
const EMOTION_LABELS = ['anger', 'contempt', 'disgust', 'fear', 'happiness', 'neutral', 'sadness', 'surprise'];

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

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <p className="tooltip-time">Time: {data.time}s</p>
        <p className="tooltip-value" style={{ color: "#a78bfa" }}>
          Engagement: {(data.engagement_score * 100).toFixed(0)}%
        </p>
        <div className="tooltip-emotions">
          <p style={{ color: "#4ade80" }}>Engaged: {data.engaged}</p>
          <p style={{ color: "#f87171" }}>Bored: {data.bored}</p>
        </div>
        {data.dominant && (
          <p className="tooltip-detail">Dominant: {data.dominant}</p>
        )}
      </div>
    );
  }
  return null;
};

const MoodTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <p className="tooltip-time">Time: {data.time}s</p>
        <p style={{ color: "#4ade80" }}>
          Valence: {(data.valence * 100).toFixed(0)}% 
          {data.valence > 0.1 ? " (Positive)" : data.valence < -0.1 ? " (Negative)" : " (Neutral)"}
        </p>
        <p style={{ color: "#f97316" }}>
          Energy: {(data.energy * 100).toFixed(0)}% 
          {data.energy > 0.5 ? " (High)" : " (Low)"}
        </p>
      </div>
    );
  }
  return null;
};

const EmotionTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="emotion-tooltip">
        <p className="emotion-tooltip-label">{data.name}: {data.value}%</p>
      </div>
    );
  }
  return null;
};

function EmotionBreakdown({ timeline }) {
  // Calculate overall emotion distribution from all frames
  const emotionTotals = {};
  EMOTION_LABELS.forEach(label => { emotionTotals[label] = 0; });
  
  let totalFrames = 0;

  timeline.forEach(item => {
    if (item.emotions?.emotion_percentages) {
      Object.entries(item.emotions.emotion_percentages).forEach(([emotion, pct]) => {
        if (emotionTotals.hasOwnProperty(emotion)) {
          emotionTotals[emotion] += pct;
        }
      });
      totalFrames++;
    }
  });

  if (totalFrames === 0) {
    return (
      <div className="emotion-breakdown">
        <h4>Emotion Distribution</h4>
        <p className="muted">No emotion data available</p>
      </div>
    );
  }

  const pieData = Object.entries(emotionTotals)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Math.round((value / totalFrames) * 100),
      color: EMOTION_COLORS[name] || "#94a3b8",
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  if (pieData.length === 0) {
    return (
      <div className="emotion-breakdown">
        <h4>Emotion Distribution</h4>
        <p className="muted">No emotions detected</p>
      </div>
    );
  }

  return (
    <div className="emotion-breakdown">
      <h4>Emotion Distribution</h4>
      <div className="emotion-pie-container">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={50}
              label={({ name, value }) => value > 5 ? `${name}: ${value}%` : ''}
              labelLine={false}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<EmotionTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="emotion-legend">
        {pieData.map((item, idx) => (
          <div key={idx} className="legend-item">
            <span className="legend-dot" style={{ background: item.color }}></span>
            <span>{item.name}: {item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MoodChart({ timeline }) {
  const data = timeline
    .filter(item => item.emotions && item.emotions.total_analyzed > 0)
    .map(item => ({
      time: item.time_sec,
      valence: item.emotions.mood_valence ?? 0,
      energy: item.emotions.mood_energy ?? 0,
    }));

  if (data.length === 0) {
    return (
      <div className="mood-chart">
        <h4>Mood Over Time</h4>
        <p className="muted">No mood data available</p>
      </div>
    );
  }

  return (
    <div className="mood-chart">
      <h4>Mood Over Time</h4>
      <p className="chart-subtitle">
        <span style={{ color: "#4ade80" }}>Valence</span> (positive/negative) & 
        <span style={{ color: "#f97316" }}> Energy</span> (activity level)
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
          <XAxis 
            dataKey="time" 
            stroke="#9ca3af"
            tickFormatter={(v) => `${v}s`}
          />
          <YAxis 
            domain={[-1, 1]} 
            ticks={[-1, -0.5, 0, 0.5, 1]}
            tickFormatter={(v) => v === 0 ? "0" : v > 0 ? `+${v}` : `${v}`}
            stroke="#9ca3af"
          />
          <Tooltip content={<MoodTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="valence"
            name="Valence"
            stroke="#4ade80"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="energy"
            name="Energy"
            stroke="#f97316"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmotionStats({ timeline }) {
  const framesWithEmotions = timeline.filter(item => item.emotions?.total_analyzed > 0);
  
  if (framesWithEmotions.length === 0) {
    return null;
  }

  // Calculate averages
  const avgEngagement = framesWithEmotions.reduce((s, i) => s + (i.emotions.engagement_score || 0), 0) / framesWithEmotions.length;
  const avgValence = framesWithEmotions.reduce((s, i) => s + (i.emotions.mood_valence || 0), 0) / framesWithEmotions.length;
  const avgEnergy = framesWithEmotions.reduce((s, i) => s + (i.emotions.mood_energy || 0), 0) / framesWithEmotions.length;
  const avgConfidence = framesWithEmotions.reduce((s, i) => s + (i.emotions.avg_confidence || 0), 0) / framesWithEmotions.length;

  // Find peak positive and negative moments
  let peakPositive = framesWithEmotions[0];
  let peakNegative = framesWithEmotions[0];
  
  framesWithEmotions.forEach(item => {
    if ((item.emotions?.mood_valence || 0) > (peakPositive.emotions?.mood_valence || -2)) {
      peakPositive = item;
    }
    if ((item.emotions?.mood_valence || 0) < (peakNegative.emotions?.mood_valence || 2)) {
      peakNegative = item;
    }
  });

  const stats = [
    {
      label: "Avg Engagement",
      value: `${(avgEngagement * 100).toFixed(0)}%`,
      color: avgEngagement > 0.6 ? "#4ade80" : avgEngagement > 0.4 ? "#fbbf24" : "#f87171",
    },
    {
      label: "Overall Mood",
      value: avgValence > 0.2 ? "Positive" : avgValence < -0.2 ? "Negative" : "Neutral",
      color: avgValence > 0.2 ? "#4ade80" : avgValence < -0.2 ? "#f87171" : "#fbbf24",
    },
    {
      label: "Energy Level",
      value: avgEnergy > 0.6 ? "High" : avgEnergy > 0.4 ? "Medium" : "Low",
      color: avgEnergy > 0.6 ? "#f97316" : avgEnergy > 0.4 ? "#fbbf24" : "#a78bfa",
    },
    {
      label: "Confidence",
      value: `${(avgConfidence * 100).toFixed(0)}%`,
      color: "#38bdf8",
    },
  ];

  return (
    <div className="emotion-stats">
      <div className="emotion-stats-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className="emotion-stat-card">
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>
      <div className="emotion-moments">
        <div className="moment-card positive">
          <span className="moment-label">Most Positive</span>
          <span className="moment-time">at {peakPositive?.time_sec || 0}s</span>
        </div>
        <div className="moment-card negative">
          <span className="moment-label">Least Positive</span>
          <span className="moment-time">at {peakNegative?.time_sec || 0}s</span>
        </div>
      </div>
    </div>
  );
}

export default function EmotionChart({ timeline }) {
  if (!timeline || !timeline.length) {
    return <p className="muted">No emotion data available.</p>;
  }

  // Check if any frame has emotion data
  const hasEmotionData = timeline.some(item => item.emotions && item.emotions.total_analyzed > 0);
  
  if (!hasEmotionData) {
    return (
      <div className="emotion-disabled-notice">
        <p className="muted">Emotion analysis was not enabled for this video.</p>
        <p className="muted-hint">Enable "Analyze emotions" checkbox when uploading to see emotion data.</p>
      </div>
    );
  }

  const data = timeline
    .filter(item => item.emotions)
    .map(item => {
      const emotions = item.emotions || {};
      const dominantEmotions = emotions.dominant_emotions || {};
      const dominantEmotion = Object.entries(dominantEmotions)
        .sort((a, b) => b[1] - a[1])[0];

      return {
        time: item.time_sec,
        engagement_score: emotions.engagement_score || 0,
        engaged: emotions.engaged_count || 0,
        bored: emotions.bored_count || 0,
        total: emotions.total_analyzed || 0,
        valence: emotions.mood_valence || 0,
        energy: emotions.mood_energy || 0,
        dominant: dominantEmotion ? dominantEmotion[0] : null,
      };
    });

  return (
    <div className="emotion-charts-container">
      {/* Main Engagement Chart */}
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis 
              dataKey="time" 
              stroke="#9ca3af"
              tickFormatter={(v) => `${v}s`}
            />
            <YAxis 
              domain={[0, 1]} 
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              stroke="#9ca3af"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="engagement_score"
              name="Engagement Rate"
              stroke="#a78bfa"
              strokeWidth={3}
              fill="url(#colorEngagement)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Summary */}
      <EmotionStats timeline={timeline} />

      {/* Additional Charts Row */}
      <div className="emotion-charts-row">
        <MoodChart timeline={timeline} />
        <EmotionBreakdown timeline={timeline} />
      </div>
      
      <div className="full-width-chart">
        <EmotionLines timeline={timeline} />
      </div>
    </div>
  );
}
