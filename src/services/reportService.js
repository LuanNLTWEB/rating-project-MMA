import api from './api';

export const reportReview = async (reviewId, reason, details = '') => {
  const response = await api.post(`/reports/review/${reviewId}`, { reason, details });
  return response.data;
};

export const getReports = async (status = '') => {
  const url = status ? `/reports?status=${status}` : '/reports';
  const response = await api.get(url);
  return response.data;
};

export const updateReportStatus = async (reportId, status) => {
  const response = await api.patch(`/reports/${reportId}/status`, { status });
  return response.data;
};
