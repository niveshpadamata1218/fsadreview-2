import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentClasses, leaveClass } from '../../api/student';
import ProgressBar from '../../components/ProgressBar';
import { extractApiError } from '../../utils/errors';

export default function StudentClasses() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [classes, setClasses] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getStudentClasses();
      setClasses(response.data || []);
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter(
      (item) => item.className?.toLowerCase().includes(q) || item.classCode?.toLowerCase().includes(q)
    );
  }, [classes, query]);

  const onLeave = async (classCode) => {
    const ok = window.confirm('Leave this class?');
    if (!ok) return;

    try {
      await leaveClass(classCode);
      await loadData();
    } catch (err) {
      setError(extractApiError(err).message);
    }
  };

  return (
    <div className="stack-lg">
      <div className="row-between">
        <div>
          <h2>Joined spaces</h2>
          <p className="small-muted">Track progress and collaborate with your classmates.</p>
        </div>
        <input
          className="search-input"
          placeholder="Search by class name or code"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error ? <div className="alert-error">{error}</div> : null}
      {loading ? <div className="panel">Loading classes...</div> : null}

      <div className="stack-sm">
        {filtered.map((item) => (
          <div key={item.classCode} className="card">
            <div className="row-between">
              <div>
                <div className="meta-label">{item.subject || 'GENERAL'}</div>
                <h3>{item.className}</h3>
                <p className="small-muted">Teacher: {item.teacherName}</p>
                <p className="small-muted">Class ID: {item.classCode}</p>
              </div>
              <div className="align-right">
                <p className="small-muted">Grade: {item.gradeLevel || '-'}</p>
                <p className="small-muted">{item.submittedCount}/{item.totalAssignments} submitted</p>
              </div>
            </div>

            <ProgressBar value={item.completionPercent || 0} />

            <div className="actions-row">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate(`/student/classes/${item.classCode}`)}
              >
                Open class
              </button>
              <button
                type="button"
                className="btn btn-danger-outline"
                onClick={() => onLeave(item.classCode)}
              >
                Leave
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
