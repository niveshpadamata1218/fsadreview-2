import { useEffect, useState } from 'react';
import { getTeacherOverview } from '../../api/teacher';
import { extractApiError } from '../../utils/errors';

export default function TeacherOverview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({ totalClasses: 0, totalStudents: 0 });

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const response = await getTeacherOverview();
        setData(response.data);
      } catch (err) {
        setError(extractApiError(err).message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) return <div className="panel">Loading overview...</div>;
  if (error) return <div className="alert-error">{error}</div>;

  return (
    <div className="stack-lg">
      <h2>Teacher Dashboard</h2>
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="meta-label">CLASSES</div>
          <div className="stat-value">{data.totalClasses}</div>
          <p className="small-muted">Active class spaces</p>
        </div>

        <div className="card stat-card">
          <div className="meta-label">STUDENTS</div>
          <div className="stat-value">{data.totalStudents}</div>
          <p className="small-muted">Total enrolled learners</p>
        </div>

        <div className="card stat-card">
          <div className="meta-label">NEXT STEP</div>
          <div className="stat-title">Invite reviewers</div>
          <p className="small-muted">Share class codes to start feedback cycles.</p>
        </div>
      </div>
    </div>
  );
}
