import api from './api';

// Fetch public visible genres
export const getGenres = async () => {
  const response = await api.get('/genres');
  return response.data;
};

// Fetch all genres for staff (including hidden ones)
export const getAllGenres = async () => {
  const response = await api.get('/genres/all');
  return response.data;
};

// Create a new genre
export const createGenre = async (name, description) => {
  const response = await api.post('/genres', { name, description });
  return response.data;
};

// Update genre details
export const updateGenre = async (id, name, description) => {
  const response = await api.put(`/genres/${id}`, { name, description });
  return response.data;
};

// Delete genre
export const deleteGenre = async (id) => {
  const response = await api.delete(`/genres/${id}`);
  return response.data;
};

// Toggle visibility status of a genre
export const toggleGenreVisibility = async (id) => {
  const response = await api.patch(`/genres/${id}/visibility`);
  return response.data;
};
