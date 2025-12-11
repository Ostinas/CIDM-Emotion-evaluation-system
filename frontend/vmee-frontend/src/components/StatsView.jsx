import TimelineChart from "./TimelineChart";
import PeopleChart from "./PeopleChart";
import VideoStream from "./VideoStream";
import SummaryCards from "./SummaryCards";
import InsightsPanel from "./InsightsPanel";
import ExportButton from "./ExportButton";
import EmotionChart from "./EmotionChart";

export default function StatsView({ timeline, videoId, originalFile, emotionsEnabled }) {
  return (
    <section className="panel">
      <div className="stats-header">
        <div>
          <h1 className="panel-title">Statistics & Results</h1>
          {timeline && (
            <p className="panel-subtitle">
              Analysis complete - {timeline.length} frames processed
            </p>
          )}
        </div>
        {timeline && <ExportButton timeline={timeline} />}
      </div>

      {!timeline && (
        <div className="empty-state">
          <h3>No Analysis Yet</h3>
          <p className="panel-subtitle">
            Upload and analyze a video on the "File upload" tab to see statistics here.
          </p>
        </div>
      )}

      {timeline && (
        <>
          <SummaryCards timeline={timeline} />
          
          <div className="stats-layout">
            <div className="stats-main">
              <div className="stats-main-graph">
                <h3>Attention Over Time</h3>
                <TimelineChart timeline={timeline} />
              </div>

              <div className="stats-main-graph">
                <h3>People Watching</h3>
                <PeopleChart timeline={timeline} />
              </div>

              {emotionsEnabled && (
                <div className="stats-main-graph emotion-section">
                  <h3>
                    <span className="emotion-icon">:)</span>
                    Emotional Engagement
                  </h3>
                  <EmotionChart timeline={timeline} />
                </div>
              )}

              <InsightsPanel timeline={timeline} emotionsEnabled={emotionsEnabled} />
            </div>

            <div className="stats-side">
              <div className="stats-card">
                <h4>Analyzed Video</h4>
                {videoId ? (
                  <VideoStream videoId={videoId} />
                ) : (
                  <p className="muted">No video preview available.</p>
                )}
              </div>

              <div className="stats-card">
                <h4>Source Video</h4>
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
        </>
      )}
    </section>
  );
}