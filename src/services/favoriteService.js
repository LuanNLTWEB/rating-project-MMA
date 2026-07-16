import api from './api';

// Fetch user's favorite movies
export const getFavorites = async () => {
  const response = await api.get('/favorites');
  return response.data;
};

// Fetch only favorite movie IDs for quick status check
export const getFavoriteIds = async () => {
  const response = await api.get('/favorites/ids');
  return response.data;
};

// Add a movie to favorites
export const addFavorite = async (movieId) => {
  const response = await api.post(`/favorites/${movieId}`);
  return response.data;
};

// Remove a movie from favorites
export const removeFavorite = async (movieId) => {
  const response = await api.delete(`/favorites/${movieId}`);
  return response.data;
};
