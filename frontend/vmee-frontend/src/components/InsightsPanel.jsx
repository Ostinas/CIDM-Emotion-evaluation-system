export default function InsightsPanel({ timeline }) {
  if (!timeline || timeline.length === 0) return null;

  // Calculate insights
  const totalFrames = timeline.length;
  const avgAttention = timeline.reduce((sum, item) => sum + item.percent, 0) / totalFrames;
  
  // Find best and worst moments
  const bestMoment = timeline.reduce((best, item) => 
    item.percent > best.percent ? item : best
  );
  const worstMoment = timeline.reduce((worst, item) => 
    item.percent < worst.percent ? item : worst
  );

  // Calculate trend (simple linear regression slope)
  const firstHalf = timeline.slice(0, Math.floor(totalFrames / 2));
  const secondHalf = timeline.slice(Math.floor(totalFrames / 2));
  const avgFirstHalf = firstHalf.reduce((sum, item) => sum + item.percent, 0) / firstHalf.length;
  const avgSecondHalf = secondHalf.reduce((sum, item) => sum + item.percent, 0) / secondHalf.length;
  const trend = avgSecondHalf - avgFirstHalf;

  // Engagement level
  let engagementLevel = "Low";
  let engagementColor = "#f87171";
  if (avgAttention > 0.7) {
    engagementLevel = "High";
    engagementColor = "#4ade80";
  } else if (avgAttention > 0.4) {
    engagementLevel = "Medium";
    engagementColor = "#fbbf24";
  }

  // Consistency check
  const variance = timeline.reduce((sum, item) => 
    sum + Math.pow(item.percent - avgAttention, 2), 0
  ) / totalFrames;
  const stdDev = Math.sqrt(variance);
  const isConsistent = stdDev < 0.2;

  const insights = [
    {
      title: "Overall Engagement",
      value: engagementLevel,
      description: `Average attention rate of ${(avgAttention * 100).toFixed(1)}%`,
    },
    {
      title: "Attention Trend",
      value: trend > 0.05 ? "Increasing" : trend < -0.05 ? "Decreasing" : "Stable",
      description: trend > 0.05 
        ? "Engagement improved over time" 
        : trend < -0.05 
        ? "Engagement declined over time"
        : "Consistent attention throughout",
    },
    {
      title: "Peak Moment",
      value: `${(bestMoment.percent * 100).toFixed(0)}%`,
      description: `At ${bestMoment.time_sec}s - ${bestMoment.people_looking}/${bestMoment.total_people} watching`,
    },
    {
      title: "Consistency",
      value: isConsistent ? "High" : "Variable",
      description: isConsistent 
        ? "Steady attention throughout video"
        : "Attention fluctuated significantly",
    },
  ];

  return (
    <div className="insights-panel">
      <h3 className="insights-title">Key Insights</h3>
      <div className="insights-grid">
        {insights.map((insight, idx) => (
          <div key={idx} className="insight-card">
            <div className="insight-content">
              <div className="insight-label">{insight.title}</div>
              <div className="insight-value">
                {insight.value}
              </div>
              <div className="insight-desc">{insight.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

