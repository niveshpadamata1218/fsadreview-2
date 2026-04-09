import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getAssignmentSubmissionsForReview,
  getReviewClasses,
} from '../../api/peerReviews';
import { getStudentClassDetail } from '../../api/student';
import { extractApiError } from '../../utils/errors';

export default function PeerReviews() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const defaultClassCode = searchParams.get('classCode') || '';
  const defaultAssignmentId = searchParams.get('assignmentId') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [classes, setClasses] = useState([]);
  const [selectedClassCode, setSelectedClassCode] = useState(defaultClassCode);
  const [selectedAssignments, setSelectedAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(defaultAssignmentId);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const response = await getReviewClasses();
        setClasses(response.data || []);
      } catch (err) {
        setError(extractApiError(err).message);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  useEffect(() => {
    if (!selectedClassCode) return;

    const run = async () => {
      try {
        setLoading(true);
        const response = await getStudentClassDetail(selectedClassCode);
        setSelectedAssignments(response.data?.assignments || []);
      } catch (err) {
        setError(extractApiError(err).message);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [selectedClassCode]);

  useEffect(() => {
    if (!selectedAssignmentId) {
      setSubmissions([]);
      return;
    }

    const run = async () => {
      try {
        setLoading(true);
        const response = await getAssignmentSubmissionsForReview(selectedAssignmentId);
        setSubmissions(response.data || []);
      } catch (err) {
        setError(extractApiError(err).message);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [selectedAssignmentId]);

  return (
    <div className="stack-lg">
      <h2>Review Submissions</h2>
      <p className="small-muted">Choose a class and assignment to start reviewing peer work.</p>

      {error ? <div className="alert-error">{error}</div> : null}
      {loading ? <div className="panel">Loading...</div> : null}

      <div className="stack-sm">
        {classes.map((item) => (
          <div key={item.classCode} className="card row-between">
            <div>
              <div className="meta-label">{item.subject || 'GENERAL'}</div>
              <h4>{item.className}</h4>
              <p className="small-muted">
                {item.assignmentCount} assignments · {item.submissionCount} submissions
              </p>
            </div>
            <div className="actions-row">
              <span className="status-badge status-pending">{item.needReview} need review</span>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSelectedClassCode(item.classCode);
                  setSelectedAssignmentId('');
                  setSubmissions([]);
                }}
              >
                Open
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedClassCode ? (
        <div className="card stack-sm">
          <h3>Assignments in {selectedClassCode}</h3>
          {(selectedAssignments || []).map((assignment) => (
            <div key={assignment.id} className="row-between">
              <div>
                <strong>{assignment.title}</strong>
                <p className="small-muted">{assignment.submissionCount || 0} submissions</p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedAssignmentId(String(assignment.id))}
              >
                View submissions
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {selectedAssignmentId ? (
        <div className="card stack-sm">
          <h3>Peer submissions</h3>
          {(submissions || []).map((item) => (
            <div key={item.submissionId} className="row-between">
              <div>
                <strong>{item.studentName}</strong>
                <p className="small-muted">{item.fileName}</p>
              </div>
              <div className="actions-row">
                {item.alreadyReviewed ? <span className="status-badge status-graded">Reviewed</span> : null}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    navigate(`/student/peer-reviews/${selectedAssignmentId}/${item.submissionId}`)
                  }
                >
                  Review
                </button>
              </div>
            </div>
          ))}
          {!submissions.length ? <div className="small-muted">No peer submissions available.</div> : null}
        </div>
      ) : null}
    </div>
  );
}
