import api from './axiosInstance';

export const getTeacherOverview = () => api.get('/teacher/overview');
export const createClass = (payload) => api.post('/teacher/classes', payload);
export const getTeacherClasses = () => api.get('/teacher/classes');
export const getTeacherClassDetail = (classCode) => api.get(`/teacher/classes/${classCode}`);
export const deleteTeacherClass = (classCode) => api.delete(`/teacher/classes/${classCode}`);
export const createAssignment = (classCode, payload) => api.post(`/teacher/classes/${classCode}/assignments`, payload);
export const deleteAssignment = (classCode, assignmentId) =>
  api.delete(`/teacher/classes/${classCode}/assignments/${assignmentId}`);
export const getClassSubmissions = (classCode, filter = 'ALL') =>
  api.get(`/teacher/classes/${classCode}/submissions?filter=${filter}`);
export const gradeSubmission = (submissionId, payload) =>
  api.post(`/teacher/submissions/${submissionId}/grade`, payload);
export const getClassPeerReviews = (classCode) => api.get(`/teacher/classes/${classCode}/peer-reviews`);
export const getClassStudents = (classCode) => api.get(`/teacher/classes/${classCode}/students`);
export const removeStudent = (classCode, studentId) =>
  api.delete(`/teacher/classes/${classCode}/students/${studentId}`);
export const getStudentHistory = (classCode, studentId) =>
  api.get(`/teacher/classes/${classCode}/students/${studentId}/history`);
