import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5006/api`;

export const STATIC_URL = `http://${window.location.hostname}:5006`;

// ── Axios instance — MUST be defined before all exports ──
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ── USOM Threat Intelligence ──
export const getUsomRssFeed = async () => {
  const response = await api.get('/usom/rss');
  return response.data;
};

// ── Help Requests ──
export const getHelpRequests    = ()         => api.get('/HelpRequests').then(r => r.data);
export const getHelpStats       = (s, e)     => api.get(`/HelpRequests/stats?start=${s}&end=${e}`).then(r => r.data);
export const submitHelpRequest  = (data)     => {
  if (data instanceof FormData) {
    return api.post('/HelpRequests', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  }
  return api.post('/HelpRequests', data).then(r => r.data);
};
export const updateHelpRequest  = (id, data) => api.put(`/HelpRequests/${id}`, data).then(r => r.data);
export const deleteHelpRequest  = (id)       => api.delete(`/HelpRequests/${id}`).then(r => r.data);

// ── Backups ──
export const getBackups      = ()     => api.get('/backup/list').then(r => r.data);
export const createSnapshot  = (data) => api.post('/backup/snapshot', data).then(r => r.data);
export const restoreSnapshot = (id)   => api.post(`/backup/restore/${id}`).then(r => r.data);
export const deleteBackup    = (id)   => api.delete(`/backup/${id}`);

// ── Terminals ──
export const getTerminals     = ()     => api.get('/terminals').then(r => r.data);
export const createTerminal   = (data) => api.post('/terminals', data).then(r => r.data);
export const updateTerminal   = (id, data) => api.put(`/terminals/${id}`, data).then(r => r.data);
export const deleteTerminal   = (id)   => api.delete(`/terminals/${id}`);
export const forceWmiRefresh  = (id)   => api.post(`/terminals/${id}/wmi-refresh`).then(r => r.data);

// ── Auth & Users ──
export const loginUser        = (data) => api.post('/auth/login', data).then(r => r.data);
export const registerUser     = (data) => api.post('/auth/register', data).then(r => r.data);
export const getUsers         = ()     => api.get('/users').then(r => r.data);
export const getUser          = (id)   => api.get(`/users/${id}`).then(r => r.data);
export const createUser       = (data) => api.post('/users', data).then(r => r.data);
export const updateUser       = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser       = (id)   => api.delete(`/users/${id}`);

// ── Access Matrix ──
export const getAccessColumns = () => api.get('/accessmatrix/columns').then(r => r.data);
export const getAccessGrants = () => api.get('/accessmatrix/grants').then(r => r.data);
export const updateAccessGrant = (personnelId, columnId, accessLevel) => 
  api.post('/accessmatrix/grants', { personnelId, accessColumnId: columnId, accessLevel }).then(r => r.data);

// ── Onboardings (İş Başları) ──
export const getOnboardings = () => api.get('/onboardings').then(r => r.data);
export const createOnboarding = (data) => api.post('/onboardings', data).then(r => r.data);
export const updateOnboarding = (id, data) => api.put(`/onboardings/${id}`, data).then(r => r.data);
export const deleteOnboarding = (id) => api.delete(`/onboardings/${id}`).then(r => r.data);

// Chat & Users
export const getChatUsers = () => api.get('/chat/users').then(r => r.data);
export const toggleUserStatus = (id) => api.put(`/chat/users/${id}/toggle-active`).then(r => r.data);

// Chat & Channels
export const getChannels = (userId) => api.get(`/chat/channels${userId ? `?userId=${userId}` : ''}`).then(r => r.data);
export const createChannel = (payload) => api.post('/chat/channels', payload).then(r => r.data);
export const getChannelMembers = (channelId) => api.get(`/chat/channels/${channelId}/members`).then(r => r.data);
export const addChannelMember = (data) => api.post('/chat/channels/members', data).then(r => r.data);
export const removeChannelMember = (channelId, userId) => api.delete(`/chat/channels/members?channelId=${channelId}&userId=${userId}`).then(r => r.data);
export const updateChatUser = (id, data) => api.put(`/chat/users/${id}`, data).then(r => r.data);
export const deleteChatUser = (id) => api.delete(`/chat/users/${id}`).then(r => r.data);

export const uploadMedia = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/chat/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
};

// ── Personnel ──
export const getPersonnel     = ()     => api.get('/personnel').then(r => r.data);
export const createPersonnel  = (data) => api.post('/personnel', data).then(r => r.data);
export const updatePersonnel  = (id, data) => api.put(`/personnel/${id}`, data).then(r => r.data);
export const deletePersonnel  = (id)   => api.delete(`/personnel/${id}`);
export const syncPersonnel    = ()     => api.post('/personnel/sync').then(r => r.data);

// ── Stock ──
export const getStock         = ()     => api.get('/stock').then(r => r.data);
export const getStockSummary  = ()     => api.get('/stock/summary').then(r => r.data);
export const createStock      = (data) => api.post('/stock', data).then(r => r.data);
export const updateStock      = (id, data) => api.put(`/stock/${id}`, data).then(r => r.data);
export const deleteStock      = (id)   => api.delete(`/stock/${id}`);

// ── Inventory ──
export const getInventory     = ()     => api.get('/inventory').then(r => r.data);
export const createInventory  = (data) => api.post('/inventory', data).then(r => r.data);
export const updateInventory  = (id, data) => api.put(`/inventory/${id}`, data).then(r => r.data);
export const deleteInventory  = (id)   => api.delete(`/inventory/${id}`);

// ── SSL ──
export const getSslItems      = ()     => api.get('/ssl').then(r => r.data);
export const createSslItem    = (data) => api.post('/ssl', data).then(r => r.data);
export const updateSslItem    = (id, data) => api.put(`/ssl/${id}`, data).then(r => r.data);
export const deleteSslItem    = (id)   => api.delete(`/ssl/${id}`);

// ── Licenses ──
export const getLicenses      = ()     => api.get('/licenses').then(r => r.data);
export const createLicense    = (data) => api.post('/licenses', data).then(r => r.data);
export const updateLicense    = (id, data) => api.put(`/licenses/${id}`, data).then(r => r.data);
export const deleteLicense    = (id)   => api.delete(`/licenses/${id}`);

// ── Settings ──
export const getSettings      = ()     => api.get('/settings').then(r => r.data);
export const updateSettings   = (data) => api.put('/settings', data).then(r => r.data);

// ── NIST Compliance ──
export const getNistRequirements = () => api.get('/nist').then(r => r.data);
export const updateNistRequirement = (id, data) => api.put(`/nist/${id}`, data).then(r => r.data);
export const seedNistRequirements = () => api.post('/nist/seed').then(r => r.data);

export const uploadNistDocument = (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/nist/${id}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data);
};

export const downloadNistDocument = (id) => `${API_BASE}/nist/${id}/download`;

// ── ISO 27001 Compliance ──
export const getIsoRequirements = () => api.get('/iso').then(r => r.data);
export const updateIsoRequirement = (id, data) => api.put(`/iso/${id}`, data).then(r => r.data);
export const seedIsoRequirements = () => api.post('/iso/seed').then(r => r.data);

export const uploadIsoDocument = (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/iso/${id}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data);
};

export const downloadIsoDocument = (id) => `${API_BASE}/iso/${id}/download`;

// ── Tesis Güvenliği Compliance ──
export const getFacilityRequirements = () => api.get('/facility').then(r => r.data);
export const updateFacilityRequirement = (id, data) => api.put(`/facility/${id}`, data).then(r => r.data);
export const seedFacilityRequirements = () => api.post('/facility/seed').then(r => r.data);

export const uploadFacilityDocument = (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/facility/upload/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data);
};

export const downloadFacilityDocument = (id) => `${API_BASE}/facility/download/${id}`;

// ── ISO 9001 (BT) Compliance ──
export const getIso9001Requirements = () => api.get('/iso9001').then(r => r.data);
export const updateIso9001Requirement = (id, data) => api.put(`/iso9001requirements/${id}`, data);
export const deleteIso9001Requirement = (id) => api.delete(`/iso9001requirements/${id}`);
export const seedIso9001Requirements = () => api.post('/iso9001/seed').then(r => r.data);

// ── Compliance Generic Documents ──
export const getComplianceDocuments = (standard) => api.get(`/compliance/docs/${standard}`).then(r => r.data);
export const uploadComplianceDocument = (standard, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/compliance/docs/${standard}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data);
};
export const deleteComplianceDocument = (id) => api.delete(`/compliance/docs/${id}`);
export const previewComplianceDocument = (id) => `${API_BASE}/compliance/docs/${id}/download`;

// ── Şirket Rehberi (Directory) ──
export const getDirectoryEntries   = () => api.get('/directory').then(r => r.data);
export const createDirectoryEntry  = (data) => api.post('/directory', data).then(r => r.data);
export const updateDirectoryEntry  = (id, data) => api.put(`/directory/${id}`, data);
export const deleteDirectoryEntry  = (id) => api.delete(`/directory/${id}`);
export const uploadImage           = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data);
};

export const exportDirectoryCsv = () => {
  window.open(`${STATIC_URL}/api/directory/export`, '_blank');
};

export const importDirectoryCsv = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/directory/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data);
};

// ── OTA Updater ──
export const getUpdateHistory = () => api.get('/updater/history').then(r => r.data);
export const checkForUpdates  = () => api.get('/updater/check').then(r => r.data);
export const installUpdate    = (data) => api.post('/updater/install', data).then(r => r.data);

// ── Feedback & Complaints ──
// ── Feedback & Complaints ──
export const getFeedbacks      = () => api.get('/feedback').then(r => r.data);
export const submitFeedback    = (data) => api.post('/feedback', data).then(r => r.data);
export const markFeedbackAsRead = (id) => api.put(`/feedback/${id}/read`).then(r => r.data);
export const deleteFeedback     = (id) => api.delete(`/feedback/${id}`);

export const uploadIso9001Document = (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/iso9001/upload/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data);
};

export const downloadIso9001Document = (id) => `${API_BASE}/iso9001/download/${id}`;

// ── Logs ──
export const getLogs          = ()     => api.get('/logs').then(r => r.data);

// ── User Activity ──
export const getUserActivityTargets = () => api.get('/useractivity/targets').then(r => r.data);
export const addUserActivityTarget = (data) => api.post('/useractivity/targets', data).then(r => r.data);
export const deleteUserActivityTarget = async (id) => (await api.delete(`/useractivity/targets/${id}`)).data;

export const getUserReport = async (pcName, startDate, endDate) => {
  const params = new URLSearchParams({ pcName, startDate, endDate });
  return (await api.get(`/useractivity/report?${params.toString()}`)).data;
};
export const forcePollUserActivity = (pcName) => api.post(`/useractivity/force-poll/${pcName}`).then(r => r.data);
export const getUserActivitySummary = async (pcName) => {
  const res = await api.get(`/useractivity/summary/${pcName}`);
  return res.data;
};

export const getGlobalMonitoringDashboard = async (pcName = 'ALL') => {
  const res = await api.get(`/useractivity/global-dashboard?pcName=${pcName}`);
  return res.data;
};
export const getUserWebSummary = (pcName, days = 7) => api.get(`/useractivity/web-summary/${pcName}?days=${days}`).then(r => r.data);
export const getLatestUserActivity = (pcName) => api.get(`/useractivity/latest/${pcName}`).then(r => r.data);
export const getUserDetailedStats = (pcName) => api.get(`/useractivity/detailed-stats/${pcName}`).then(r => r.data);

export const getSystemLogs = async () => {
  const res = await api.get('/settings/logs');
  return res.data;
};

export const restartSystem = async () => {
  const res = await api.post('/settings/restart');
  return res.data;
};

export const getSystemHealth = async () => {
  const res = await api.get('/settings/health');
  return res.data;
};

export const startWorker = async () => {
  const res = await api.post('/settings/start-worker');
  return res.data;
};

export const testPersonnelConnection = async (settings) => {
  const res = await api.post('/settings/test-personnel-connection', settings);
  return res.data;
};

// ── Surveys (Internal) ──
export const getAdminSurveys = () => api.get('/internalsurveys').then(r => r.data);
export const getActiveSurveys = () => api.get('/internalsurveys/active').then(r => r.data);
export const getSurveyFull   = (id) => api.get(`/internalsurveys/${id}`).then(r => r.data);
export const createSurvey   = (data) => api.post('/internalsurveys', data).then(r => r.data);
export const updateSurvey   = (id, data) => api.put(`/internalsurveys/${id}`, data).then(r => r.data);
export const deleteSurvey   = (id) => api.delete(`/internalsurveys/${id}`);

export const getSurveyQuestions = (id) => api.get(`/internalsurveys/${id}/questions`).then(r => r.data);
export const addSurveyQuestion  = (id, data) => api.post(`/internalsurveys/${id}/questions`, data).then(r => r.data);
export const updateSurveyQuestion = (qid, data) => api.put(`/internalsurveys/questions/${qid}`, data).then(r => r.data);
export const deleteSurveyQuestion = (qid) => api.delete(`/internalsurveys/questions/${qid}`);

export const submitSurvey = (id, data) => api.post(`/internalsurveys/${id}/submit`, data).then(r => r.data);
export const getSurveyResults = (id) => api.get(`/internalsurveys/${id}/results`).then(r => r.data);
export const getFileAlerts    = ()   => api.get('/file-alerts').then(r => r.data);
export const deleteFileAlert  = (id) => api.delete(`/file-alerts/${id}`).then(r => r.data);
export const forceScanFiles   = (id) => api.post(`/terminals/${id}/scan-files`).then(r => r.data);

export default api;
