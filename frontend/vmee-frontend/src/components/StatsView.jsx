import TimelineChart from "./TimelineChart";
import PeopleChart from "./PeopleChart";
import VideoStream from "./VideoStream";

export default function StatsView({ timeline, videoId, originalFile }) {
  return (
    <section className="panel">
      <h1 className="panel-title">Statistics & Results</h1>

      {!timeline && (
        <p className="panel-subtitle">
          Run an analysis first on the "File upload" tab.
        </p>
      )}

      {timeline && (
        <div className="stats-layout">
          <div className="stats-main">
            <div className="stats-main-graph">
              <h3>Attention percentage over time</h3>
              <TimelineChart timeline={timeline} />
            </div>

            <div className="stats-main-graph">
              <h3>People watching over time</h3>
              <PeopleChart timeline={timeline} />
            </div>
          </div>

          <div className="stats-side">
            <div className="stats-card">
              <h4>Preview analyzed video</h4>
              {videoId ? (
                <VideoStream videoId={videoId} />
              ) : (
                <p className="muted">No video preview available.</p>
              )}
            </div>

            <div className="stats-card">
              <h4>Source video</h4>
              {originalFile ? (
                <video
                  src={URL.createObjectURL(originalFile)}
                  controls
                  className="preview-video small"
                />
              ) : (
                <p className="muted">No source video selected yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}