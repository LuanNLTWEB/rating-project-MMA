import api from './api';

// Public endpoints
export const getPublicNews = async () => {
  const response = await api.get('/news');
  return response.data;
};

export const getNewsById = async (id: string) => {
  const response = await api.get(`/news/${id}`);
  return response.data;
};

// Staff endpoints
export const getNewsForStaff = async () => {
  const response = await api.get('/news/all');
  return response.data;
};

export const createNews = async (data: any) => {
  const response = await api.post('/news', data);
  return response.data;
};

export const updateNews = async (id: string, data: any) => {
  const response = await api.put(`/news/${id}`, data);
  return response.data;
};

export const deleteNews = async (id: string) => {
  const response = await api.delete(`/news/${id}`);
  return response.data;
};
