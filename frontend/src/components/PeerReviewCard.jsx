export default function PeerReviewCard({ review }) {
  return (
    <div className="card peer-review-card">
      <div className="row-between">
        <h4>{review.reviewerName || 'Reviewer'}</h4>
        <span className="status-badge status-graded">{review.grade}</span>
      </div>
      <div className="small-muted">Submission #{review.submissionId} - {review.submittee}</div>
      <p>{review.feedback}</p>
    </div>
  );
}
