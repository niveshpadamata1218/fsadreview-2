import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createAssignment,
  deleteAssignment,
  getClassPeerReviews,
  getClassStudents,
  getClassSubmissions,
  getTeacherClassDetail,
  gradeSubmission,
  removeStudent,
} from '../../api/teacher';
import { fetchSubmissionDownloadBlob, fetchSubmissionViewBlob } from '../../api/submissions';
import StatusBadge from '../../components/StatusBadge';
import StudentCard from '../../components/StudentCard';
import { extractApiError } from '../../utils/errors';

const tabs = ['Assignments', 'Submissions', 'Students', 'Peer grades'];

export default function TeacherClassDetail() {
  const { classCode } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('Assignments');
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [classData, setClassData] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [peerReviews, setPeerReviews] = useState([]);
  const [gradeDrafts, setGradeDrafts] = useState({});

  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    deadline: '',
  });

  const loadAll = async () => {
    try {
      setLoading(true);
      const [detail, submissionsRes, studentsRes, peerRes] = await Promise.all([
        getTeacherClassDetail(classCode),
        getClassSubmissions(classCode, filter),
        getClassStudents(classCode),
        getClassPeerReviews(classCode),
      ]);

      setClassData(detail.data);
      setSubmissions(submissionsRes.data || []);
      setStudents(studentsRes.data || []);
      setPeerReviews(peerRes.data || []);
      setError('');
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [classCode, filter]);

  const completionSummary = useMemo(() => {
    if (!students.length) return '0 students';
    const avg = students.reduce((sum, s) => sum + (s.completionPercent || 0), 0) / students.length;
    return `${students.length} students · ${avg.toFixed(0)}% avg completion`;
  }, [students]);

  const onCreateAssignment = async () => {
    if (!assignmentForm.title.trim() || !assignmentForm.deadline) {
      setError('Assignment title and deadline are required');
      return;
    }

    try {
      await createAssignment(classCode, assignmentForm);
      setAssignmentForm({ title: '', description: '', deadline: '' });
      await loadAll();
      setActiveTab('Assignments');
    } catch (err) {
      setError(extractApiError(err).message);
    }
  };

  const onDeleteAssignment = async (assignmentId) => {
    const ok = window.confirm('Delete assignment?');
    if (!ok) return;

    try {
      await deleteAssignment(classCode, assignmentId);
      await loadAll();
    } catch (err) {
      setError(extractApiError(err).message);
    }
  };

  const onSaveGrade = async (submissionId) => {
    const draft = gradeDrafts[submissionId] || { grade: '', feedback: '' };
    if (!draft.grade.trim()) {
      setError('Grade is required');
      return;
    }

    try {
      await gradeSubmission(submissionId, draft);
      await loadAll();
    } catch (err) {
      setError(extractApiError(err).message);
    }
  };

  const updateDraft = (submissionId, key, value) => {
    setGradeDrafts((prev) => ({
      ...prev,
      [submissionId]: {
        grade: prev[submissionId]?.grade ?? '',
        feedback: prev[submissionId]?.feedback ?? '',
        [key]: value,
      },
    }));
  };

  const onRemoveStudent = async (studentId) => {
    const ok = window.confirm('Remove this student from class?');
    if (!ok) return;

    try {
      await removeStudent(classCode, studentId);
      await loadAll();
    } catch (err) {
      setError(extractApiError(err).message);
    }
  };

  const openSubmissionFile = async (submissionId) => {
    try {
      const response = await fetchSubmissionViewBlob(submissionId);
      const objectUrl = URL.createObjectURL(response.data);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      setError(extractApiError(err).message);
    }
  };

  const downloadSubmissionFile = async (submissionId, fileName) => {
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

  if (loading) return <div className="panel">Loading class detail...</div>;
  if (error) return <div className="alert-error">{error}</div>;
  if (!classData) return <div className="panel">Class not found.</div>;

  return (
    <div className="stack-lg">
      <div className="card class-hero">
        <div>
          <div className="meta-label">CLASS</div>
          <h2>{classData.name}</h2>
          <p className="small-muted">{classData.subject || '-'}</p>
        </div>

        <div>
          <div className="meta-label">CLASS CODE</div>
          <h3>{classData.classCode}</h3>
          <p className="small-muted">Password: {classData.password}</p>
        </div>

        <div>
          <div className="meta-label">STUDENTS</div>
          <h3>{classData.studentCount}</h3>
          <p className="small-muted">{completionSummary}</p>
        </div>
      </div>

      <div className="tab-row">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`tab-btn ${activeTab === tab ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Assignments' ? (
        <div className="stack-md">
          <div className="card form-card">
            <h3>Create Assignment</h3>
            <label>Title</label>
            <input
              value={assignmentForm.title}
              onChange={(e) => setAssignmentForm((p) => ({ ...p, title: e.target.value }))}
            />

            <label>Description</label>
            <textarea
              value={assignmentForm.description}
              onChange={(e) => setAssignmentForm((p) => ({ ...p, description: e.target.value }))}
            />

            <label>Deadline</label>
            <input
              type="date"
              value={assignmentForm.deadline}
              onChange={(e) => setAssignmentForm((p) => ({ ...p, deadline: e.target.value }))}
            />

            <button type="button" className="btn btn-primary" onClick={onCreateAssignment}>
              Publish assignment
            </button>
          </div>

          <div className="stack-sm">
            {(classData.assignments || []).map((assignment) => (
              <div className="card" key={assignment.id || assignment.assignmentId}>
                <div className="row-between">
                  <div>
                    <h4>{assignment.title}</h4>
                    <div className="small-muted">Submissions: {assignment.submissionCount || 0}</div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger-outline"
                    onClick={() => onDeleteAssignment(assignment.id || assignment.assignmentId)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {!classData.assignments?.length ? <div className="small-muted">No assignments yet.</div> : null}
          </div>
        </div>
      ) : null}

      {activeTab === 'Submissions' ? (
        <div className="stack-md">
          <div className="filter-row">
            {['ALL', 'PEER_REVIEWED', 'NOT_REVIEWED'].map((item) => (
              <button
                key={item}
                type="button"
                className={`btn ${filter === item ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(item)}
              >
                {item.replace('_', ' ')}
              </button>
            ))}
          </div>

          {submissions.map((group) => (
            <div className="card" key={group.assignmentId}>
              <div className="row-between">
                <div>
                  <h3>{group.assignmentTitle}</h3>
                  <p className="small-muted">
                    Due {group.deadline} · Showing {group.showing} of {group.total} submissions
                  </p>
                </div>
              </div>

              <div className="stack-sm">
                {(group.submissions || []).map((submission) => {
                  const draft = gradeDrafts[submission.submissionId] || {
                    grade: submission.grade || '',
                    feedback: submission.feedback || '',
                  };

                  return (
                    <div key={submission.submissionId} className="submission-box">
                      <div className="row-between">
                        <div>
                          <h4>{submission.studentName}</h4>
                          <div className="small-muted">{submission.submittedAt}</div>
                        </div>
                        <StatusBadge status={submission.status} />
                      </div>

                      <div className="file-row">
                        <span>{submission.fileName}</span>
                        <span>{submission.fileSizeKb} KB</span>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => openSubmissionFile(submission.submissionId)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() =>
                            downloadSubmissionFile(submission.submissionId, submission.fileName)
                          }
                        >
                          Download
                        </button>
                      </div>

                      <div className="meta-label">GRADE & FEEDBACK</div>
                      <input
                        placeholder="Grade"
                        value={draft.grade}
                        onChange={(e) => updateDraft(submission.submissionId, 'grade', e.target.value)}
                      />
                      <textarea
                        placeholder="Feedback"
                        value={draft.feedback}
                        onChange={(e) => updateDraft(submission.submissionId, 'feedback', e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => onSaveGrade(submission.submissionId)}
                      >
                        Save grade
                      </button>
                    </div>
                  );
                })}
                {!group.submissions?.length ? <div className="small-muted">No submissions in this filter.</div> : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === 'Students' ? (
        <div className="stack-sm">
          {students.map((student) => (
            <div key={student.studentId}>
              <StudentCard
                student={student}
                onOpen={() => navigate(`/teacher/classes/${classCode}/students/${student.studentId}`)}
              />
              <div className="actions-row">
                <button
                  type="button"
                  className="btn btn-danger-outline"
                  onClick={() => onRemoveStudent(student.studentId)}
                >
                  Remove student
                </button>
              </div>
            </div>
          ))}
          {!students.length ? <div className="small-muted">No students enrolled.</div> : null}
        </div>
      ) : null}

      {activeTab === 'Peer grades' ? (
        <div className="stack-md">
          {peerReviews.map((group) => (
            <div className="card" key={group.assignmentId}>
              <h3>{group.assignmentTitle}</h3>
              <div className="stack-sm">
                {(group.peerReviews || []).map((review, idx) => (
                  <div key={`${review.submissionId}-${idx}`} className="peer-item">
                    <div className="row-between">
                      <strong>{review.reviewerName}</strong>
                      <span className="small-muted">{review.reviewedAt}</span>
                    </div>
                    <div className="small-muted">Submission #{review.submissionId} - {review.submittee}</div>
                    <div className="status-badge status-graded">{review.grade}</div>
                    <p>{review.feedback}</p>
                  </div>
                ))}
                {!group.peerReviews?.length ? (
                  <div className="small-muted">No peer reviews yet for this assignment.</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
