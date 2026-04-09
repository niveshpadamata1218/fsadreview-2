import api from './axiosInstance';

export const getReviewClasses = () => api.get('/peer-reviews/classes');
export const getAssignmentSubmissionsForReview = (assignmentId) =>
  api.get(`/peer-reviews/assignments/${assignmentId}/submissions`);

export const submitPeerReview = (assignmentId, submissionId, payload) =>
  api.post(`/peer-reviews/assignments/${assignmentId}/submissions/${submissionId}`, payload);

export const updatePeerReview = (assignmentId, submissionId, payload) =>
  api.put(`/peer-reviews/assignments/${assignmentId}/submissions/${submissionId}`, payload);

export const getMyReviews = (assignmentId) => api.get(`/peer-reviews/my-reviews/${assignmentId}`);

export const peerReviewFileViewUrl = (assignmentId, submissionId) =>
  `http://localhost:8080/api/peer-reviews/assignments/${assignmentId}/submissions/${submissionId}/file`;

export const peerReviewFileDownloadUrl = (assignmentId, submissionId) =>
  `http://localhost:8080/api/peer-reviews/assignments/${assignmentId}/submissions/${submissionId}/download`;

export const fetchPeerReviewViewBlob = (assignmentId, submissionId) =>
  api.get(`/peer-reviews/assignments/${assignmentId}/submissions/${submissionId}/file`, {
    responseType: 'blob',
  });

export const fetchPeerReviewDownloadBlob = (assignmentId, submissionId) =>
  api.get(`/peer-reviews/assignments/${assignmentId}/submissions/${submissionId}/download`, {
    responseType: 'blob',
  });
