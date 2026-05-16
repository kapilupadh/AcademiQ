// client/src/services/assignmentService.js
import api from './api';

const assignmentService = {
  // Shared
  getMyAssignments: () => api.get('/assignments/my'),
  getAssignmentDetails: (id) => api.get(`/assignments/${id}`),
  getSubjectAssignments: (subjectId) => api.get(`/assignments/subject/${subjectId}`),

  // Teacher
  createAssignment: (data) => api.post('/assignments', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateAssignment: (id, data) => api.put(`/assignments/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteAssignment: (id) => api.delete(`/assignments/${id}`),
  getAssignmentSubmissions: (id) => api.get(`/assignments/${id}/submissions`),
  gradeSubmission: (submissionId, data) => api.put(`/assignments/submissions/${submissionId}/grade`, data),

  // Student
  // Note: data should be FormData if uploading images
  submitAssignment: (id, data) => api.post(`/assignments/${id}/submit`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export default assignmentService;
