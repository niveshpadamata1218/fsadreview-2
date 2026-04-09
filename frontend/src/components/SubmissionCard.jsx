import StatusBadge from './StatusBadge';

export default function SubmissionCard({ submission, rightSlot }) {
  return (
    <div className="card submission-card">
      <div className="row-between">
        <div>
          <h4>{submission.studentName}</h4>
          <p className="small-muted">{submission.fileName}</p>
        </div>
        <StatusBadge status={submission.status} />
      </div>
      {rightSlot}
    </div>
  );
}
