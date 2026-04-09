import api from './axiosInstance';

export const uploadSubmission = (assignmentId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/submissions/${assignmentId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const replaceSubmission = (assignmentId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.put(`/submissions/${assignmentId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const withdrawSubmission = (assignmentId) => api.delete(`/submissions/${assignmentId}`);

export const submissionViewUrl = (submissionId) =>
  `http://localhost:8080/api/submissions/file/${submissionId}`;

export const submissionDownloadUrl = (submissionId) =>
  `http://localhost:8080/api/submissions/download/${submissionId}`;

export const fetchSubmissionViewBlob = (submissionId) =>
  api.get(`/submissions/file/${submissionId}`, { responseType: 'blob' });

export const fetchSubmissionDownloadBlob = (submissionId) =>
  api.get(`/submissions/download/${submissionId}`, { responseType: 'blob' });
