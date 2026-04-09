import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteTeacherClass, getTeacherClasses } from '../../api/teacher';
import { extractApiError } from '../../utils/errors';

export default function TeacherClasses() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState([]);
  const [query, setQuery] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getTeacherClasses();
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
      (item) => item.name?.toLowerCase().includes(q) || item.classCode?.toLowerCase().includes(q)
    );
  }, [classes, query]);

  const handleDelete = async (classCode) => {
    const ok = window.confirm('Delete this class and all related records?');
    if (!ok) return;

    try {
      await deleteTeacherClass(classCode);
      await loadData();
    } catch (err) {
      setError(extractApiError(err).message);
    }
  };

  return (
    <div className="stack-lg">
      <div className="row-between">
        <div>
          <h2>Your classes</h2>
          <p className="small-muted">Manage, review, and organize your class spaces.</p>
        </div>

        <input
          className="search-input"
          placeholder="Search by name or code"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error ? <div className="alert-error">{error}</div> : null}
      {loading ? <div className="panel">Loading classes...</div> : null}

      <div className="stack-md">
        {filtered.map((item) => (
          <div className="card" key={item.classCode}>
            <div className="row-between">
              <div>
                <div className="meta-label">{item.subject || 'GENERAL'}</div>
                <h3>{item.name}</h3>
                <p className="small-muted">Grade {item.gradeLevel || '-'}</p>
              </div>
              <div className="align-right">
                <div className="small-muted">Class ID: {item.classCode}</div>
                <div className="small-muted">Password: {item.password}</div>
                <div className="small-muted">Students: {item.studentCount}</div>
              </div>
            </div>

            <div className="divider" />

            <div className="meta-label">ASSIGNMENTS ({item.assignmentCount || 0})</div>
            <div className="chips-row">
              {(item.assignments || []).map((assignment) => (
                <div className="chip" key={assignment.assignmentId}>
                  {assignment.title} ({assignment.submissionCount})
                </div>
              ))}
              {!item.assignments?.length ? <div className="small-muted">No assignments yet.</div> : null}
            </div>

            <div className="actions-row">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate(`/teacher/classes/${item.classCode}`)}
              >
                Open class
              </button>
              <button
                type="button"
                className="btn btn-danger-outline"
                onClick={() => handleDelete(item.classCode)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
