import { useEffect, useMemo, useState } from 'react';
import {
  fetchSubmissionDownloadBlob,
  fetchSubmissionViewBlob,
} from '../api/submissions';

function isPdf(fileName) {
  return fileName?.toLowerCase().endsWith('.pdf');
}

export default function FileViewer({ submissionId, fileName, fileSizeKb }) {
  const [viewSrc, setViewSrc] = useState('');

  useEffect(() => {
    let mounted = true;
    let objectUrl = '';

    const run = async () => {
      if (!submissionId || !isPdf(fileName)) {
        setViewSrc('');
        return;
      }
      try {
        const response = await fetchSubmissionViewBlob(submissionId);
        objectUrl = URL.createObjectURL(response.data);
        if (mounted) {
          setViewSrc(objectUrl);
        }
      } catch {
        if (mounted) {
          setViewSrc('');
        }
      }
    };

    run();

    return () => {
      mounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [submissionId, fileName]);

  const safeName = useMemo(() => fileName || 'submission-file', [fileName]);

  if (!submissionId) {
    return <div className="empty-state">No file selected.</div>;
  }

  const handleDownload = async () => {
    try {
      const response = await fetchSubmissionDownloadBlob(submissionId);
      const objectUrl = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = safeName;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // No-op, the parent page will still remain usable.
    }
  };

  return (
    <div className="file-viewer-card">
      <div className="file-viewer-head">
        <div>
          <div className="meta-label">File</div>
          <div className="file-title">{fileName || 'Submission file'}</div>
          {fileSizeKb ? <div className="file-size">{fileSizeKb} KB</div> : null}
        </div>

        <button type="button" className="btn btn-secondary" onClick={handleDownload}>
          Download
        </button>
      </div>

      {isPdf(fileName) ? (
        <iframe title="Submission preview" src={viewSrc} className="file-frame" />
      ) : (
        <div className="empty-state">DOC/DOCX files are not previewable inline. Use Download to view.</div>
      )}
    </div>
  );
}
