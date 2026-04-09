import StatusBadge from './StatusBadge';

export default function AssignmentCard({ assignment, onOpen }) {
  return (
    <div className="card assignment-card" onClick={onOpen} role="button" tabIndex={0}>
      <div className="row-between">
        <h4>{assignment.title}</h4>
        {assignment.status ? <StatusBadge status={assignment.status} /> : null}
      </div>
      <div className="meta-label">Due {assignment.deadline}</div>
      {assignment.description ? <p>{assignment.description}</p> : null}
    </div>
  );
}
