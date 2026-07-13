import api from './api';

export const getUsers = async () => {
  const res = await api.get('/users');
  return res.data;
};

export const getUser = async (id: string) => {
  const res = await api.get(`/users/${id}`);
  return res.data;
};

export const updateUserRole = async (id: string, role: string) => {
  const res = await api.patch(`/users/${id}/role`, { role });
  return res.data;
};

export const updateUserStatus = async (id: string, status: string) => {
  const res = await api.patch(`/users/${id}/status`, { status });
  return res.data;
};

export const deleteUser = async (id: string) => {
  const res = await api.delete(`/users/${id}`);
  return res.data;
};

export const createStaffAccount = async (data: {
  name: string;
  email: string;
  password: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
}) => {
  const res = await api.post('/users/staff', data);
  return res.data;
};

export const getAuditLogs = async () => {
  const res = await api.get('/audit');
  return res.data;
};
