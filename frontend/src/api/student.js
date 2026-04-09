import api from './axiosInstance';

export const getStudentOverview = () => api.get('/student/overview');
export const joinClass = (payload) => api.post('/student/classes/join', payload);
export const leaveClass = (classCode) => api.delete(`/student/classes/${classCode}/leave`);
export const getStudentClasses = () => api.get('/student/classes');
export const getStudentClassDetail = (classCode) => api.get(`/student/classes/${classCode}`);
export const getStudentClassStudents = (classCode) => api.get(`/student/classes/${classCode}/students`);
export const getStudentAssignmentDetail = (classCode, assignmentId) =>
  api.get(`/student/classes/${classCode}/assignments/${assignmentId}`);
