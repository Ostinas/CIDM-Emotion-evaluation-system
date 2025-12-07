const API_URL = import.meta.env.VITE_API_URL;

export default function VideoStream({ videoId }) {
  return (
    <div className="stream-wrapper">
      <img
        src={`${API_URL}/api/stream-temp/${videoId}`}
        alt="Analyzed stream"
        className="stream-img"
      />
    </div>
  );
}
