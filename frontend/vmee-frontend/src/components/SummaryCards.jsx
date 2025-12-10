import { useEffect, useState } from "react";

export default function SummaryCards({ timeline }) {
  const [animatedStats, setAnimatedStats] = useState({
    avgAttention: 0,
    peakAttention: 0,
    avgPeople: 0,
    maxPeople: 0,
  });

  useEffect(() => {
    if (!timeline || timeline.length === 0) return;

    // Calculate actual stats
    const avgAttention = (
      timeline.reduce((sum, item) => sum + item.percent, 0) / timeline.length
    );
    const peakAttention = Math.max(...timeline.map((item) => item.percent));
    const avgPeople = (
      timeline.reduce((sum, item) => sum + item.total_people, 0) / timeline.length
    );
    const maxPeople = Math.max(...timeline.map((item) => item.total_people));

    // Animate numbers
    const duration = 1000; // 1 second
    const steps = 50;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setAnimatedStats({
        avgAttention: avgAttention * progress,
        peakAttention: peakAttention * progress,
        avgPeople: avgPeople * progress,
        maxPeople: maxPeople * progress,
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setAnimatedStats({
          avgAttention,
          peakAttention,
          avgPeople,
          maxPeople,
        });
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [timeline]);

  if (!timeline || timeline.length === 0) return null;

  const cards = [
    {
      title: "Average Attention",
      value: `${(animatedStats.avgAttention * 100).toFixed(1)}%`,
      color: "#38bdf8",
      description: "Overall attention rate",
    },
    {
      title: "Peak Attention",
      value: `${(animatedStats.peakAttention * 100).toFixed(1)}%`,
      color: "#4ade80",
      description: "Highest attention moment",
    },
    {
      title: "Avg People Detected",
      value: animatedStats.avgPeople.toFixed(1),
      color: "#a78bfa",
      description: "Average across timeline",
    },
    {
      title: "Max People",
      value: Math.round(animatedStats.maxPeople),
      color: "#fb923c",
      description: "Peak simultaneous viewers",
    },
  ];

  return (
    <div className="summary-cards">
      {cards.map((card, idx) => (
        <div key={idx} className="summary-card">
          <div className="summary-card-content">
            <div className="summary-card-title">{card.title}</div>
            <div className="summary-card-value">{card.value}</div>
            <div className="summary-card-desc">{card.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

