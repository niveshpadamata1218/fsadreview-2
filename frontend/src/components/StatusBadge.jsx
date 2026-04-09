export default function StatusBadge({ status }) {
  const normalized = (status || '').toUpperCase();

  if (normalized === 'GRADED') {
    return <span className="status-badge status-graded">Graded</span>;
  }
  if (normalized === 'PENDING') {
    return <span className="status-badge status-pending">Pending</span>;
  }
  if (normalized === 'OVERDUE') {
    return <span className="status-badge status-overdue">Overdue</span>;
  }
  return <span className="status-badge">{normalized || 'Unknown'}</span>;
}
