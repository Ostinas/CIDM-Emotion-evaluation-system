import { useState } from "react";
import Sidebar from "./components/Sidebar";
import UploadView from "./components/UploadView";
import StatsView from "./components/StatsView";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("upload");
  const [timeline, setTimeline] = useState(null);
  const [videoId, setVideoId] = useState(null);   
  const [originalFile, setOriginalFile] = useState(null);

  return (
    <div className="app-root">
      <Sidebar activeTab={activeTab} onChangeTab={setActiveTab} />

      <main className="app-main">
        {activeTab === "upload" && (
          <UploadView
            onAnalysisComplete={(data) => {
              setTimeline(data.timeline);
              setVideoId(data.videoId);
            }}
            onFileSelected={setOriginalFile}
          />
        )}

        {activeTab === "stats" && (
          <StatsView
            timeline={timeline}
            videoId={videoId}
            originalFile={originalFile}
          />
        )}
      </main>
    </div>
  );
}

export default App;