import { useState, useEffect, useRef } from "react";
import ProgressBar from "./ProgressBar";

const API_URL = import.meta.env.VITE_API_URL;

export default function UploadView({ onAnalysisComplete, onFileSelected }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [processingStage, setProcessingStage] = useState("");
  const [videoMetadata, setVideoMetadata] = useState(null);
  const [success, setSuccess] = useState(false);
  const [analyzeEmotions, setAnalyzeEmotions] = useState(false);

  useEffect(() => {
    if (file) {
      extractVideoMetadata(file);
    } else {
      setVideoMetadata(null);
    }
  }, [file]);

  function extractVideoMetadata(videoFile) {
    const video = document.createElement("video");
    video.preload = "metadata";
    
    video.onloadedmetadata = () => {
      setVideoMetadata({
        duration: Math.round(video.duration),
        size: (videoFile.size / (1024 * 1024)).toFixed(2),
      });
      URL.revokeObjectURL(video.src);
    };
    
    video.src = URL.createObjectURL(videoFile);
  }

  function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function handleFileChange(f) {
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      setError("Please select a video file.");
      return;
    }
    setError("");
    setSuccess(false);
    setFile(f);
    onFileSelected?.(f);
  }

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Stage 1: Analyzing video
      setProcessingStage(analyzeEmotions 
        ? "Analyzing video content & emotions..." 
        : "Analyzing video content...");
      
      const form1 = new FormData();
      form1.append("file", file);

      // Add analyze_emotions as query parameter
      const analyzeUrl = `${API_URL}/api/analyze-video?analyze_emotions=${analyzeEmotions}`;
      const resTimeline = await fetch(analyzeUrl, {
        method: "POST",
        body: form1,
      });
      
      if (!resTimeline.ok) throw new Error("Analysis failed.");
      const dataTimeline = await resTimeline.json();

      // Stage 2: Uploading for preview
      setProcessingStage("Preparing video preview...");
      
      const form2 = new FormData();
      form2.append("file", file);

      const resUpload = await fetch(`${API_URL}/api/upload-temp`, {
        method: "POST",
        body: form2,
      });
      
      if (!resUpload.ok) throw new Error("Video upload for preview failed.");
      const dataUpload = await resUpload.json();

      setProcessingStage("Analysis complete!");
      setSuccess(true);
      
      setTimeout(() => {
        onAnalysisComplete({
          timeline: dataTimeline.timeline,
          videoId: dataUpload.id,
          emotionsEnabled: dataTimeline.emotions_enabled || false,
          warnings: dataTimeline.warnings || [],
        });
      }, 500);
    } catch (e) {
      setError(e.message || "Something went wrong.");
      setProcessingStage("");
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProcessingStage("");
      }, 500);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFileChange(f);
  }

  return (
    <section className="panel">
      <h1 className="panel-title">Upload a video</h1>
      <p className="panel-subtitle">
        Drag & drop a video or choose from your device. We will analyze
        attention and generate statistics.
      </p>

      <div
        className={`dropzone ${dragOver ? "dropzone-active" : ""} ${file ? "dropzone-has-file" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={onDrop}
      >
        <div className="dropzone-content">
          {file ? (
            <>
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                {videoMetadata && (
                  <div className="file-meta">
                    <span className="meta-item">
                      Duration: {formatDuration(videoMetadata.duration)}
                    </span>
                    <span className="meta-item">
                      Size: {videoMetadata.size} MB
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <span className="dropzone-text">Drop video here or click to browse</span>
              <span className="dropzone-hint">Supports MP4, AVI, MOV, and more</span>
            </>
          )}
        </div>
        <input
          type="file"
          accept="video/*"
          className="dropzone-input"
          onChange={(e) => handleFileChange(e.target.files[0])}
        />
      </div>

      {file && (
        <div className="preview-block">
          <h3>Original preview</h3>
          <video
            src={URL.createObjectURL(file)}
            controls
            className="preview-video"
          />
        </div>
      )}

      {loading && (
        <div className="progress-container">
          <ProgressBar
            isLoading={true}
            percent={40}
          />
          <div className="progress-info">
            <span className="progress-stage">{processingStage}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="success-box">
          Analysis completed successfully! Switching to Statistics view...
        </div>
      )}

      {error && <div className="error-box">{error}</div>}

      <div className="analyze-options">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={analyzeEmotions}
            onChange={(e) => setAnalyzeEmotions(e.target.checked)}
            disabled={loading}
          />
          <span className="checkbox-custom"></span>
          <span className="checkbox-text">
            Analyze emotions
            <span className="checkbox-hint">Detect viewer emotional states (slower)</span>
          </span>
        </label>
      </div>

      <button
        className="primary-btn"
        disabled={!file || loading}
        onClick={handleAnalyze}
      >
        {loading ? "Analyzing..." : "Upload & Analyze"}
      </button>
    </section>
  );
}
