import { downloadSummaryPdf } from "../utils/pdfExport";

export default function PdfDownloadButton({ job }) {
  const hasResult = Boolean(job?.result);

  return (
    <button
      type="button"
      className="tiny-btn accent"
      onClick={() => downloadSummaryPdf(job)}
      disabled={!hasResult}
    >
      Download PDF
    </button>
  );
}
