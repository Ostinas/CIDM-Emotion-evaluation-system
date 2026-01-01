import { useState } from "react";
import Sidebar from "./components/Sidebar";
import UploadView from "./components/UploadView";
import StatsView from "./components/StatsView";
import Toast from "./components/Toast";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("upload");
  const [timeline, setTimeline] = useState(null);
  const [videoId, setVideoId] = useState(null);   
  const [originalFile, setOriginalFile] = useState(null);
  const [toast, setToast] = useState(null);
  const [emotionsEnabled, setEmotionsEnabled] = useState(false);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const handleAnalysisComplete = (data) => {
    setTimeline(data.timeline);
    setVideoId(data.videoId);
    setEmotionsEnabled(data.emotionsEnabled || false);
    showToast("Analysis completed successfully!", "success");
    setTimeout(() => {
      setActiveTab("stats");
    }, 1000);
  };

  return (
    <div className="app-root">
      <Sidebar activeTab={activeTab} onChangeTab={setActiveTab} />

      <main className="app-main">
        {activeTab === "upload" && (
          <UploadView
            onAnalysisComplete={handleAnalysisComplete}
            onFileSelected={setOriginalFile}
          />
        )}

        {activeTab === "stats" && (
          <StatsView
            timeline={timeline}
            videoId={videoId}
            originalFile={originalFile}
            emotionsEnabled={emotionsEnabled}
          />
        )}
      </main>

      {toast && (
        <div className="toast-container">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
}

export default App;