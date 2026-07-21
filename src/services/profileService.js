import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { BASE_URL } from './api';

export const getProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

export const getUserProfile = async (userId) => {
  const response = await api.get(`/profile/${userId}`);
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

export const uploadAvatar = async (formData) => {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch(`${BASE_URL}/profile/avatar`, {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Request failed with status ${response.status}`);
  }
  
  return response.json();
};
