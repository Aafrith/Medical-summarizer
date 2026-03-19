import { acceptedFileTypes } from "../utils/fileUtils";

function preventDefaults(event) {
  event.preventDefault();
  event.stopPropagation();
}

export default function UploadZone({
  onAddFiles,
  disabled,
  selectedCount,
  running,
  onClearAll,
  onClearCompleted,
}) {
  const onInputChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onAddFiles(files);
    }

    event.target.value = "";
  };

  const onDrop = (event) => {
    preventDefaults(event);
    const files = Array.from(event.dataTransfer.files || []);
    if (files.length > 0) {
      onAddFiles(files);
    }
  };

  return (
    <section className="panel section upload-panel">
      <div className="panel-header-row">
        <div>
          <p className="kicker">Document Intake</p>
          <h2>Upload Clinical Documents</h2>
          <p className="subtle-text">
            Add one or many files. Each document is prepared as a separate English and Sinhala summary.
          </p>
        </div>
        <div className="button-row">
          <button type="button" className="ghost-btn" onClick={onClearCompleted} disabled={running}>
            Remove Ready Items
          </button>
          <button type="button" className="ghost-btn danger" onClick={onClearAll} disabled={running}>
            Remove All
          </button>
        </div>
      </div>

      <label
        className={`upload-zone ${disabled ? "disabled" : ""}`}
        onDragEnter={preventDefaults}
        onDragOver={preventDefaults}
        onDrop={onDrop}
      >
        <input
          className="visually-hidden"
          type="file"
          multiple
          accept={acceptedFileTypes}
          disabled={disabled}
          onChange={onInputChange}
        />
        <span className="upload-title">Drag and drop files here, or click to upload</span>
        <span className="upload-meta">Accepted files: PDF, TXT, DOC, DOCX | Maximum size: 25 MB each</span>
        <span className="upload-count">{selectedCount} document(s) currently selected</span>
      </label>
    </section>
  );
}
