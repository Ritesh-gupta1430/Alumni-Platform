import axios from 'axios';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  timeout: 30000,
});

// ===== Request Interceptor =====
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ===== Response Interceptor =====
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/register')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data?.data?.accessToken;
        if (newToken) {
          localStorage.setItem('accessToken', newToken);
          api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login?expired=1';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ===== API Modules =====

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  logoutAll: () => api.post('/auth/logout-all'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
};

export const profileAPI = {
  getProfile: (userId) => api.get(`/profiles/${userId}`),
  updateProfile: (data) => api.patch('/profiles/me', data),
  uploadPhoto: (file) => {
    const fd = new FormData();
    fd.append('photo', file);
    return api.post('/profiles/me/photo', fd);
  },
  uploadResume: (file) => {
    const fd = new FormData();
    fd.append('resume', file);
    return api.post('/profiles/me/resume', fd);
  },
  getExperiences: () => api.get('/profiles/me/experiences'),
  addExperience: (data) => api.post('/profiles/me/experiences', data),
  updateExperience: (id, data) => api.put(`/profiles/me/experiences/${id}`, data),
  deleteExperience: (id) => api.delete(`/profiles/me/experiences/${id}`),
};

export const usersAPI = {
  search: (params) => api.get('/users/search', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  getBatchmates: (params) => api.get('/users/network/batchmates', { params }),
  getAlumniMap: () => api.get('/users/network/map'),
};

export const verificationAPI = {
  submit: (formData) => api.post('/verification/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getStatus: () => api.get('/verification/status'),
  adminList: (params) => api.get('/verification/admin/list', { params }),
  adminGetDetail: (id) => api.get(`/verification/admin/${id}`),
  adminApprove: (id, data) => api.patch(`/verification/admin/${id}/approve`, data),
  adminReject: (id, data) => api.patch(`/verification/admin/${id}/reject`, data),
  adminRequestCorrection: (id, data) => api.patch(`/verification/admin/${id}/request-correction`, data),
};

export const connectionsAPI = {
  sendRequest: (targetId, data) => api.post(`/connections/request/${targetId}`, data),
  accept: (id) => api.patch(`/connections/${id}/accept`),
  decline: (id) => api.patch(`/connections/${id}/decline`),
  remove: (id) => api.delete(`/connections/${id}`),
  getMine: (params) => api.get('/connections/mine', { params }),
  getPending: () => api.get('/connections/pending'),
  getStatus: (targetId) => api.get(`/connections/status/${targetId}`),
};

export const mentorshipAPI = {
  getMentors: (params) => api.get('/mentorship/mentors', { params }),
  sendRequest: (data) => api.post('/mentorship/request', data),
  getRequests: (params) => api.get('/mentorship/requests', { params }),
  accept: (id) => api.patch(`/mentorship/${id}/accept`),
  decline: (id, data) => api.patch(`/mentorship/${id}/decline`, data),
  getActive: () => api.get('/mentorship/active'),
  addSession: (mentorshipId, data) => api.post(`/mentorship/${mentorshipId}/session`, data),
};

export const jobsAPI = {
  list: (params) => api.get('/jobs', { params }),
  get: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  apply: (id, data) => api.post(`/jobs/${id}/apply`, data),
  updateStatus: (id, data) => api.patch(`/jobs/${id}/status`, data),
};

export const applicationsAPI = {
  getMine: (params) => api.get('/applications/mine', { params }),
  get: (id) => api.get(`/applications/${id}`),
  getForJob: (jobId, params) => api.get(`/applications/job/${jobId}`, { params }),
  updateStatus: (id, data) => api.patch(`/applications/${id}/status`, data),
  withdraw: (id) => api.delete(`/applications/${id}`),
};

export const donationsAPI = {
  getCampaigns: (params) => api.get('/donations/campaigns', { params }),
  getCampaign: (id) => api.get(`/donations/campaigns/${id}`),
  createCampaign: (data) => api.post('/donations/campaigns', data),
  approveCampaign: (id) => api.patch(`/donations/campaigns/${id}/approve`),
  setCampaignStatus: (id, data) => api.patch(`/donations/campaigns/${id}/status`, data),
  addUpdate: (id, data) => api.post(`/donations/campaigns/${id}/update`, data),
  contribute: (campaignId, data) => api.post(`/donations/campaigns/${campaignId}/contribute`, data),
  verifyPayment: (donationId, data) => api.post(`/donations/${donationId}/verify`, data),
  getMine: (params) => api.get('/donations/mine', { params }),
  getReceipt: (donationId) => api.get(`/donations/receipt/${donationId}`),
  getAnalytics: () => api.get('/donations/admin/analytics'),
};

export const notificationsAPI = {
  list: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (id, params) => api.get(`/messages/conversations/${id}/messages`, { params }),
  startConversation: (data) => api.post('/messages/conversations', data),
  sendMessage: (id, data) => api.post(`/messages/conversations/${id}/messages`, data),
};

export const communityAPI = {
  list: (params) => api.get('/communities', { params }),
  get: (id) => api.get(`/communities/${id}`),
  create: (data) => api.post('/communities', data),
  listEvents: (params) => api.get('/communities/events/list', { params }),
  createEvent: (data) => api.post('/communities/events', data),
  registerEvent: (id) => api.post(`/communities/events/${id}/register`),
  submitFeedback: (id, data) => api.post(`/communities/events/${id}/feedback`, data),
};

export const projectsAPI = {
  list: (params) => api.get('/projects', { params }),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

export const collabProjectsAPI = {
  list: (params) => api.get('/collab-projects', { params }),
  get: (id) => api.get(`/collab-projects/${id}`),
  create: (data) => api.post('/collab-projects', data),
  update: (id, data) => api.put(`/collab-projects/${id}`, data),
  apply: (id, data) => api.post(`/collab-projects/${id}/apply`, data),
  updateApplicantStatus: (projectId, applicantId, data) =>
    api.put(`/collab-projects/${projectId}/applicants/${applicantId}`, data),
  delete: (id) => api.delete(`/collab-projects/${id}`),
};

export const referralsAPI = {
  list: (params) => api.get('/referrals', { params }),
  get: (id) => api.get(`/referrals/${id}`),
  create: (data) => api.post('/referrals', data),
  update: (id, data) => api.put(`/referrals/${id}`, data),
  apply: (id, data) => api.post(`/referrals/${id}/apply`, data),
  updateApplicantStatus: (postId, applicantId, data) =>
    api.put(`/referrals/${postId}/applicants/${applicantId}`, data),
  delete: (id) => api.delete(`/referrals/${id}`),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, data) => api.patch(`/admin/users/${id}/status`, data),
  getAnalytics: () => api.get('/admin/analytics'),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getSkillTrends: () => api.get('/admin/skill-trends'),
};

export const aiAPI = {
  analyzeResume: (data) => api.post('/ai/resume/analyze', data),
  matchJob: (data) => api.post('/ai/resume/match-job', data),
  recommendMentors: () => api.get('/ai/recommendations/mentors'),
  careerRoadmap: (data) => api.post('/ai/career/roadmap', data),
  askAssistant: (data) => api.post('/ai/assistant', data),
};

export default api;
