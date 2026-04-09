import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getStudentHistory } from '../../api/teacher';
import { extractApiError } from '../../utils/errors';

export default function StudentHistory() {
  const { classCode, studentId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const response = await getStudentHistory(classCode, studentId);
        setData(response.data);
      } catch (err) {
        setError(extractApiError(err).message);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [classCode, studentId]);

  if (loading) return <div className="panel">Loading student history...</div>;
  if (error) return <div className="alert-error">{error}</div>;
  if (!data) return <div className="panel">No history available.</div>;

  return (
    <div className="stack-lg">
      <div className="card class-hero">
        <div>
          <div className="meta-label">STUDENT</div>
          <h2>{data.name}</h2>
          <p className="small-muted">{data.userId}</p>
        </div>
      </div>

      <div className="stack-sm">
        {(data.assignments || []).map((item) => (
          <div className="card" key={item.assignmentId}>
            <div className="row-between">
              <h4>{item.title}</h4>
              <div className="small-muted">Due {item.deadline}</div>
            </div>
            <div className="small-muted">Submitted: {item.submitted ? 'Yes' : 'No'}</div>
            <div className="small-muted">Grade: {item.grade || '-'}</div>
            <p>{item.feedback || 'No feedback yet.'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
