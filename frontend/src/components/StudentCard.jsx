import ProgressBar from './ProgressBar';

export default function StudentCard({ student, onOpen }) {
  return (
    <div className="card student-card">
      <div className="row-between">
        <div>
          <h4 className="link-like" onClick={onOpen}>
            {student.name}
          </h4>
          <p className="small-muted">ID: {student.userId}</p>
        </div>
        <div className="small-muted">{student.submittedCount}/{student.totalAssignments}</div>
      </div>
      <ProgressBar value={student.completionPercent || 0} />
    </div>
  );
}
