import api from './api';

// Fetch movies with filters
export const getMovies = async (params) => {
  const response = await api.get('/movies', { params });
  return response.data;
};
