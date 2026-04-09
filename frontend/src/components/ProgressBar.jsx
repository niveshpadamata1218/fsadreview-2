export default function ProgressBar({ value = 0 }) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className="progress-wrap">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${clamped}%` }} />
      </div>
      <span className="progress-text">{clamped.toFixed(0)}%</span>
    </div>
  );
}
