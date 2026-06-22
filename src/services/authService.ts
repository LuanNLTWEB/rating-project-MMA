import api from './api';

export const loginUser = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  gender: string,
  dateOfBirth: string,
  phone: string
) => {
  const response = await api.post('/auth/register', {
    name,
    email,
    password,
    gender,
    dateOfBirth,
    phone,
  });
  return response.data;
};
