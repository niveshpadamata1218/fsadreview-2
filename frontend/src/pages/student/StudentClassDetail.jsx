import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStudentClassDetail, getStudentClassStudents } from '../../api/student';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { extractApiError } from '../../utils/errors';

const tabs = ['Assignments', 'Peer Reviews', 'Students'];

export default function StudentClassDetail() {
  const { classCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('Assignments');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const [detail, studentsRes] = await Promise.all([
          getStudentClassDetail(classCode),
          getStudentClassStudents(classCode),
        ]);
        setClassData(detail.data);
        setStudents(studentsRes.data || []);
      } catch (err) {
        setError(extractApiError(err).message);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [classCode]);

  const quickInfo = useMemo(() => {
    if (!classData?.assignments?.length) {
      return { assignmentCount: 0, submitted: 0, classSize: students.length };
    }

    const assignmentCount = classData.assignments.length;
    const submitted = classData.assignments.filter((item) => item.status !== 'NOT_SUBMITTED').length;

    return {
      assignmentCount,
      submitted,
      classSize: students.length,
    };
  }, [classData, students]);

  if (loading) return <div className="panel">Loading class detail...</div>;
  if (error) return <div className="alert-error">{error}</div>;
  if (!classData) return <div className="panel">Class not found.</div>;

  return (
    <div className="stack-lg">
      <div className="split-top">
        <div className="card class-hero stretch">
          <div>
            <div className="meta-label">CLASS</div>
            <h2>{classData.className}</h2>
            <p className="small-muted">{classData.subject || '-'}</p>
          </div>
          <div>
            <div className="meta-label">TEACHER</div>
            <h3>{classData.teacherName}</h3>
            <p className="small-muted">Grade {classData.gradeLevel || '-'}</p>
          </div>
        </div>

        <div className="card quick-card">
          <div className="meta-label">PEER REVIEWS</div>
          <div className="stat-value">{quickInfo.submitted}</div>
          <p className="small-muted">Reviews shared</p>
          <div className="tiny-note">Help your peers improve. Review at least 2 submissions per assignment.</div>
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
        <div className="stack-sm">
          {(classData.assignments || []).map((assignment) => (
            <div className="card" key={assignment.id}>
              <div className="row-between">
                <div>
                  <h3>{assignment.title}</h3>
                  <p className="small-muted">Due {assignment.deadline}</p>
                </div>
                <StatusBadge status={assignment.status} />
              </div>
              <p>{assignment.description || 'No description provided.'}</p>
              <div className="actions-row">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate(`/student/classes/${classCode}/assignments/${assignment.id}`)}
                >
                  Open assignment
                </button>
              </div>
            </div>
          ))}
          {!classData.assignments?.length ? <div className="small-muted">No assignments yet.</div> : null}
        </div>
      ) : null}

      {activeTab === 'Peer Reviews' ? (
        <div className="stack-sm">
          {(classData.assignments || []).map((assignment) => (
            <div className="card" key={assignment.id}>
              <div className="row-between">
                <div>
                  <h4>{assignment.title}</h4>
                  <p className="small-muted">{assignment.submissionCount || 0} submissions</p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate(`/student/peer-reviews?classCode=${classCode}&assignmentId=${assignment.id}`)}
                >
                  View submissions
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === 'Students' ? (
        <div className="split-top">
          <div className="stack-sm stretch">
            {students.map((student) => (
              <div key={student.studentId} className="card row-between">
                <div>
                  <h4>{student.name}</h4>
                  <p className="small-muted">ID: {student.studentId}</p>
                </div>
                {student.studentId === user?.userId || student.you ? (
                  <span className="status-badge status-graded">You</span>
                ) : null}
              </div>
            ))}
          </div>

          <div className="card quick-card">
            <div className="meta-label">QUICK INFO</div>
            <p>Assignment(s): <strong>{quickInfo.assignmentCount}</strong></p>
            <p>Submitted: <strong>{quickInfo.submitted}</strong></p>
            <p>Class size: <strong>{quickInfo.classSize}</strong></p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
