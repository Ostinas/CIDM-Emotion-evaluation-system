import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function UploadView({ onAnalysisComplete, onFileSelected }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(f) {
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      setError("Please select a video file.");
      return;
    }
    setError("");
    setFile(f);
    onFileSelected?.(f);
  }

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      const form1 = new FormData();
      form1.append("file", file);

      const resTimeline = await fetch(`${API_URL}/api/analyze-video`, {
        method: "POST",
        body: form1,
      });
      if (!resTimeline.ok) throw new Error("Analysis failed.");
      const dataTimeline = await resTimeline.json();

      const form2 = new FormData();
      form2.append("file", file);

      const resUpload = await fetch(`${API_URL}/api/upload-temp`, {
        method: "POST",
        body: form2,
      });
      if (!resUpload.ok) throw new Error("Video upload for preview failed.");
      const dataUpload = await resUpload.json();

      onAnalysisComplete({
        timeline: dataTimeline.timeline,
        videoId: dataUpload.id,
      });
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
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
        className={`dropzone ${dragOver ? "dropzone-active" : ""}`}
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
        {file ? (
          <span>{file.name}</span>
        ) : (
          <span>Drop video here or click to browse</span>
        )}
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

      {error && <div className="error-box">{error}</div>}

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
