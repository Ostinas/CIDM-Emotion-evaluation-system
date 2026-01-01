export default function ExportButton({ timeline }) {
  if (!timeline || timeline.length === 0) return null;

  const exportToCSV = () => {
    // Create CSV content
    const headers = ["Time (s)", "Attention (%)", "People Looking", "Total People"];
    const rows = timeline.map(item => [
      item.time_sec,
      (item.percent * 100).toFixed(2),
      item.people_looking,
      item.total_people,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(",")),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `attention-analysis-${Date.now()}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    // Calculate summary statistics
    const avgAttention = timeline.reduce((sum, item) => sum + item.percent, 0) / timeline.length;
    const peakAttention = Math.max(...timeline.map(item => item.percent));
    const avgPeople = timeline.reduce((sum, item) => sum + item.total_people, 0) / timeline.length;

    const data = {
      summary: {
        averageAttention: (avgAttention * 100).toFixed(2) + "%",
        peakAttention: (peakAttention * 100).toFixed(2) + "%",
        averagePeople: avgPeople.toFixed(1),
        totalFrames: timeline.length,
        exportDate: new Date().toISOString(),
      },
      timeline: timeline,
    };

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `attention-analysis-${Date.now()}.json`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="export-buttons">
      <button className="export-btn" onClick={exportToCSV} title="Export as CSV">
        Export CSV
      </button>
      <button className="export-btn" onClick={exportToJSON} title="Export as JSON">
        Export JSON
      </button>
    </div>
  );
}

