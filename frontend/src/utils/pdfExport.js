import html2pdf from "html2pdf.js";

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function downloadSummaryPdf(job) {
  const { file, result } = job;

  if (!result) return;

  const reportNode = document.createElement("div");
  reportNode.style.width = "760px";
  reportNode.style.padding = "26px";
  reportNode.style.fontFamily = '"Noto Sans Sinhala", Arial, sans-serif';
  reportNode.style.color = "#0f172a";
  reportNode.style.background = "#ffffff";
  reportNode.style.whiteSpace = "normal";

  reportNode.innerHTML = `
    <h1 style="margin:0 0 12px;font-size:24px;">Medical Document Summary Report</h1>
    <p style="margin:0 0 6px;font-size:13px;"><strong>Source File:</strong> ${escapeHtml(file.name)}</p>
    <p style="margin:0 0 6px;font-size:13px;"><strong>Topic:</strong> ${escapeHtml(result.topic)}</p>
    <p style="margin:0 0 18px;font-size:13px;"><strong>Generated:</strong> ${new Date().toLocaleString()}</p>

    <h2 style="margin:0 0 8px;font-size:18px;">English Summary</h2>
    <p style="margin:0 0 16px;line-height:1.6;font-size:13px;white-space:pre-wrap;">
      ${escapeHtml(result.englishSummary)}
    </p>

    <h2 style="margin:0 0 8px;font-size:18px;">Sinhala Summary</h2>
    <p style="margin:0 0 16px;line-height:1.8;font-size:13px;font-family:'Noto Sans Sinhala', Arial, sans-serif;white-space:pre-wrap;">
      ${escapeHtml(result.sinhalaSummary)}
    </p>

    <h2 style="margin:0 0 8px;font-size:18px;">Key Findings</h2>
    <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.6;">
      ${(result.keyFindings || [])
        .map((finding) => `<li>${escapeHtml(finding)}</li>`)
        .join("")}
    </ul>

    ${Array.isArray(result.imageDetails) && result.imageDetails.length > 0 ? `
      <h2 style="margin:16px 0 8px;font-size:18px;">Visual Content Analysis (Gemini) - English</h2>
      ${(result.imageDetails || [])
        .map(
          (detail, idx) => `
            <h3 style="margin:10px 0 4px;font-size:14px;">Image ${idx + 1}</h3>
            <p style="margin:0 0 8px;line-height:1.6;font-size:13px;white-space:pre-wrap;">${escapeHtml(detail)}</p>
          `
        )
        .join("")}
    ` : ""}

    ${Array.isArray(result.sinhalaImageDetails) && result.sinhalaImageDetails.length > 0 ? `
      <h2 style="margin:16px 0 8px;font-size:18px;">Visual Content Analysis (Gemini) - Sinhala</h2>
      ${(result.sinhalaImageDetails || [])
        .map(
          (detail, idx) => `
            <h3 style="margin:10px 0 4px;font-size:14px;">Image ${idx + 1}</h3>
            <p style="margin:0 0 8px;line-height:1.8;font-size:13px;font-family:'Noto Sans Sinhala', Arial, sans-serif;white-space:pre-wrap;">${escapeHtml(detail)}</p>
          `
        )
        .join("")}
    ` : ""}

    ${Array.isArray(result.tableDetails) && result.tableDetails.length > 0 ? `
      <h2 style="margin:16px 0 8px;font-size:18px;">Tabular Content Analysis (Gemini) - English</h2>
      ${(result.tableDetails || [])
        .map(
          (detail, idx) => `
            <h3 style="margin:10px 0 4px;font-size:14px;">Table ${idx + 1}</h3>
            <p style="margin:0 0 8px;line-height:1.6;font-size:13px;white-space:pre-wrap;">${escapeHtml(detail)}</p>
          `
        )
        .join("")}
    ` : ""}

    ${Array.isArray(result.sinhalaTableDetails) && result.sinhalaTableDetails.length > 0 ? `
      <h2 style="margin:16px 0 8px;font-size:18px;">Tabular Content Analysis (Gemini) - Sinhala</h2>
      ${(result.sinhalaTableDetails || [])
        .map(
          (detail, idx) => `
            <h3 style="margin:10px 0 4px;font-size:14px;">Table ${idx + 1}</h3>
            <p style="margin:0 0 8px;line-height:1.8;font-size:13px;font-family:'Noto Sans Sinhala', Arial, sans-serif;white-space:pre-wrap;">${escapeHtml(detail)}</p>
          `
        )
        .join("")}
    ` : ""}
  `;

  document.body.appendChild(reportNode);

  const safeName = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_");

  html2pdf()
    .set({
      margin: 10,
      filename: `${safeName}_summary.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
      pagebreak: { mode: ["css", "legacy"] },
    })
    .from(reportNode)
    .save()
    .then(() => {
      document.body.removeChild(reportNode);
    })
    .catch((error) => {
      document.body.removeChild(reportNode);
      console.error("PDF generation failed:", error);
    });
}