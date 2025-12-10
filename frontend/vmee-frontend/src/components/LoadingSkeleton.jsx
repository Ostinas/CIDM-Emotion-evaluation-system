export default function LoadingSkeleton() {
  return (
    <div className="loading-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-box skeleton-title"></div>
        <div className="skeleton-box skeleton-subtitle"></div>
      </div>
      
      <div className="skeleton-cards">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-box skeleton-card-content"></div>
          </div>
        ))}
      </div>

      <div className="skeleton-charts">
        <div className="skeleton-box skeleton-chart"></div>
        <div className="skeleton-box skeleton-chart"></div>
      </div>
    </div>
  );
}

