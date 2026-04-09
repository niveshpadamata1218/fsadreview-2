import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  fetchPeerReviewDownloadBlob,
  fetchPeerReviewViewBlob,
  getAssignmentSubmissionsForReview,
  getMyReviews,
  submitPeerReview,
  updatePeerReview,
} from '../../api/peerReviews';
import { extractApiError } from '../../utils/errors';

function isPdf(fileName) {
  return fileName?.toLowerCase().endsWith('.pdf');
}

export default function PeerSubmissionReview() {
  const { assignmentId, submissionId } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [submission, setSubmission] = useState(null);
  const [review, setReview] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [values, setValues] = useState({ grade: '', feedback: '' });
  const [viewSrc, setViewSrc] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);

        const [submissionsRes, myReviewsRes] = await Promise.all([
          getAssignmentSubmissionsForReview(assignmentId),
          getMyReviews(assignmentId),
        ]);

        const matchedSubmission = (submissionsRes.data || []).find(
          (item) => String(item.submissionId) === String(submissionId)
        );

        const matchedReview = (myReviewsRes.data || []).find(
          (item) => String(item.submissionId) === String(submissionId)
        );

        setSubmission(matchedSubmission || null);
        setReview(matchedReview || null);
        setValues({
          grade: matchedReview?.grade || '',
          feedback: matchedReview?.feedback || '',
        });
      } catch (err) {
        setError(extractApiError(err).message);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [assignmentId, submissionId]);

  useEffect(() => {
    let mounted = true;
    let objectUrl = '';

    const run = async () => {
      if (!submission || !isPdf(submission.fileName)) {
        setViewSrc('');
        return;
      }

      try {
        const response = await fetchPeerReviewViewBlob(assignmentId, submissionId);
        objectUrl = URL.createObjectURL(response.data);
        if (mounted) {
          setViewSrc(objectUrl);
        }
      } catch (err) {
        if (mounted) {
          setError(extractApiError(err).message);
        }
      }
    };

    run();

    return () => {
      mounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [assignmentId, submission, submissionId]);

  const readOnly = useMemo(() => review && !editMode, [review, editMode]);

  const handleSubmit = async () => {
    if (!values.grade.trim() || !values.feedback.trim()) {
      setError('Grade and feedback are required');
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (review) {
        await updatePeerReview(assignmentId, submissionId, values);
      } else {
        await submitPeerReview(assignmentId, submissionId, values);
      }

      const refreshed = await getMyReviews(assignmentId);
      const updated = (refreshed.data || []).find(
        (item) => String(item.submissionId) === String(submissionId)
      );
      setReview(updated || null);
      setEditMode(false);
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="panel">Loading review page...</div>;
  if (!submission) return <div className="panel">Submission not found for review.</div>;

  const handleDownload = async () => {
    try {
      const response = await fetchPeerReviewDownloadBlob(assignmentId, submissionId);
      const objectUrl = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = submission.fileName || 'peer-submission';
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(extractApiError(err).message);
    }
  };

  return (
    <div className="split-top mobile-stack">
      <div className="card stretch">
        <div className="row-between">
          <div>
            <div className="meta-label">SUBMISSION</div>
            <h3>{submission.fileName}</h3>
            <p className="small-muted">By {submission.studentName}</p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={handleDownload}>
            Download
          </button>
        </div>

        {isPdf(submission.fileName) ? (
          <iframe title="Peer submission" src={viewSrc} className="file-frame" />
        ) : (
          <div className="empty-state">DOC/DOCX files are not previewable inline. Please download to view.</div>
        )}
      </div>

      <div className="card stretch">
        <div className="row-between">
          <h3>Peer review</h3>
          {readOnly ? (
            <button type="button" className="btn btn-secondary" onClick={() => setEditMode(true)}>
              Edit review
            </button>
          ) : null}
        </div>

        <label>Grade</label>
        <input
          value={values.grade}
          onChange={(e) => setValues((p) => ({ ...p, grade: e.target.value }))}
          disabled={readOnly}
        />

        <label>Feedback</label>
        <textarea
          value={values.feedback}
          onChange={(e) => setValues((p) => ({ ...p, feedback: e.target.value }))}
          disabled={readOnly}
        />

        {error ? <div className="alert-error">{error}</div> : null}

        {!readOnly ? (
          <button type="button" className="btn btn-primary" disabled={saving} onClick={handleSubmit}>
            {saving ? 'Saving...' : review ? 'Update Review' : 'Submit Review'}
          </button>
        ) : null}
      </div>
    </div>
  );
}
