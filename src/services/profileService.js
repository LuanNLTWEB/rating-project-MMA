import api from './api';

export const getProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put('/profile', data);
  return response.data;
};

export const getActivityLog = async (page = 1, limit = 20) => {
  const response = await api.get(`/profile/activity?page=${page}&limit=${limit}`);
  return response.data;
};
