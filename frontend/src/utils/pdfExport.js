function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function downloadSummaryPdf(job) {
  const { file, result } = job;

  if (!result) {
    return;
  }

  const reportNode = document.createElement("div");
  reportNode.style.width = "760px";
  reportNode.style.padding = "26px";
  reportNode.style.fontFamily = "Arial, Noto Sans Sinhala, sans-serif";
  reportNode.style.color = "#0f172a";
  reportNode.style.background = "#ffffff";
  reportNode.innerHTML = `
    <h1 style="margin:0 0 12px;font-size:24px;">Medical Document Summary Report</h1>
    <p style="margin:0 0 6px;font-size:13px;"><strong>Source File:</strong> ${escapeHtml(file.name)}</p>
    <p style="margin:0 0 6px;font-size:13px;"><strong>Topic:</strong> ${escapeHtml(result.topic)}</p>
    <p style="margin:0 0 18px;font-size:13px;"><strong>Quality Score:</strong> ${Math.round(result.confidence * 100)}%</p>
    <h2 style="margin:0 0 8px;font-size:18px;">English Summary</h2>
    <p style="margin:0 0 16px;line-height:1.5;font-size:13px;">${escapeHtml(result.englishSummary)}</p>
    <h2 style="margin:0 0 8px;font-size:18px;">Sinhala Summary</h2>
    <p style="margin:0 0 16px;line-height:1.6;font-size:13px;">${escapeHtml(result.sinhalaSummary)}</p>
    <h2 style="margin:0 0 8px;font-size:18px;">Key Findings</h2>
    <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.5;">
      ${result.keyFindings.map((finding) => `<li>${escapeHtml(finding)}</li>`).join("")}
    </ul>
  `;

  document.body.appendChild(reportNode);

  const safeName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
  import("jspdf")
    .then(({ jsPDF }) => {
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      doc.html(reportNode, {
        margin: [20, 20, 20, 20],
        autoPaging: "text",
        html2canvas: {
          scale: 0.5,
          useCORS: true,
        },
        callback: (pdf) => {
          pdf.save(`${safeName}_summary.pdf`);
          document.body.removeChild(reportNode);
        },
      });
    })
    .catch(() => {
      document.body.removeChild(reportNode);
    });
}
