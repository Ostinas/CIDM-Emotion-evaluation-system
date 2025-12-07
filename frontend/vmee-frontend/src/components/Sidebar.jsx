export default function Sidebar({ activeTab, onChangeTab }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">VMEE</div>

      <nav className="sidebar-nav">
        <button
          className={`sidebar-btn ${activeTab === "upload" ? "active" : ""}`}
          onClick={() => onChangeTab("upload")}
        >
          File upload
        </button>
        <button
          className={`sidebar-btn ${activeTab === "stats" ? "active" : ""}`}
          onClick={() => onChangeTab("stats")}
        >
          Statistics
        </button>
      </nav>
    </aside>
  );
}
