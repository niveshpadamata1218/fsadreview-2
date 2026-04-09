import { useEffect, useState } from 'react';
import { getStudentOverview } from '../../api/student';
import { extractApiError } from '../../utils/errors';

export default function StudentOverview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({ totalClasses: 0, pendingReviews: 0, upcomingDeadline: null });

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const response = await getStudentOverview();
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
      <h2>Student Dashboard</h2>
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="meta-label">CLASSES</div>
          <div className="stat-value">{data.totalClasses}</div>
          <p className="small-muted">Spaces you have joined</p>
        </div>

        <div className="card stat-card">
          <div className="meta-label">NEXT REVIEW</div>
          <div className="stat-value">{data.pendingReviews}</div>
          <p className="small-muted">Your next peer review is waiting.</p>
        </div>

        <div className="card stat-card">
          <div className="meta-label">REMINDER</div>
          <div className="stat-title">Check class notes</div>
          <p className="small-muted">
            Next deadline: {data.upcomingDeadline || 'No upcoming deadlines'}
          </p>
        </div>
      </div>
    </div>
  );
}
