import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  fetchSubmissionDownloadBlob,
  fetchSubmissionViewBlob,
  replaceSubmission,
  uploadSubmission,
  withdrawSubmission,
} from '../../api/submissions';
import { getStudentAssignmentDetail } from '../../api/student';
import { extractApiError } from '../../utils/errors';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export default function AssignmentDetail() {
  const { classCode, id } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [file, setFile] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getStudentAssignmentDetail(classCode, id);
      setData(response.data);
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [classCode, id]);

  const validateFile = (candidate) => {
    if (!candidate) {
      setError('Choose a file first');
      return false;
    }
    if (!ALLOWED_TYPES.includes(candidate.type)) {
      setError('Only PDF, DOC, DOCX files are allowed');
      return false;
    }
    if (candidate.size > 50 * 1024 * 1024) {
      setError('Maximum file size is 50MB');
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    if (!validateFile(file)) return;

    try {
      setSubmitting(true);
      setError('');
      await uploadSubmission(id, file);
      setFile(null);
      await loadData();
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplace = async () => {
    if (!validateFile(file)) return;

    try {
      setSubmitting(true);
      setError('');
      await replaceSubmission(id, file);
      setFile(null);
      await loadData();
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    const ok = window.confirm('Withdraw this submission?');
    if (!ok) return;

    try {
      setSubmitting(true);
      setError('');
      await withdrawSubmission(id);
      await loadData();
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = async (submissionId) => {
    try {
      const response = await fetchSubmissionViewBlob(submissionId);
      const objectUrl = URL.createObjectURL(response.data);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      setError(extractApiError(err).message);
    }
  };

  const handleDownload = async (submissionId, fileName) => {
    try {
      const response = await fetchSubmissionDownloadBlob(submissionId);
      const objectUrl = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = fileName || 'submission-file';
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(extractApiError(err).message);
    }
  };

  if (loading) return <div className="panel">Loading assignment...</div>;
  if (!data) return <div className="panel">Assignment not found.</div>;

  const submission = data.submission;

  return (
    <div className="stack-lg">
      <div className="card">
        <h2>{data.title}</h2>
        <p className="small-muted">Due {data.deadline}</p>
        <p>{data.description || 'No description provided.'}</p>
      </div>

      <div className="card">
        <div className="meta-label">YOUR SUBMISSION</div>

        {!submission ? (
          <div className="stack-sm">
            <p className="small-muted">Upload your submission</p>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button type="button" className="btn btn-primary" disabled={submitting} onClick={handleUpload}>
              {submitting ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        ) : (
          <div className="stack-sm">
            <div className="file-row">
              <span>{submission.fileName}</span>
              <span>{submission.fileSizeKb} KB</span>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleView(submission.submissionId)}
              >
                View
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleDownload(submission.submissionId, submission.fileName)}
              >
                Download
              </button>
            </div>

            <div className="grade-panel">
              <strong>Grade: {submission.grade || '-'}</strong>
              <p>{submission.feedback || 'No feedback yet.'}</p>
            </div>

            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />

            <div className="actions-row">
              <button type="button" className="btn btn-secondary" disabled={submitting} onClick={handleReplace}>
                {submitting ? 'Updating...' : 'Edit submission'}
              </button>
              <button
                type="button"
                className="btn btn-danger-outline"
                disabled={submitting}
                onClick={handleWithdraw}
              >
                Withdraw
              </button>
            </div>
          </div>
        )}

        {error ? <div className="alert-error">{error}</div> : null}
      </div>
    </div>
  );
}
