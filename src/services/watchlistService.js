import api from './api';

// Fetch user's watchlist, optionally filtered by status
export const getWatchlist = async (status) => {
  const params = status ? { status } : {};
  const response = await api.get('/watchlist', { params });
  return response.data;
};

// Fetch watchlist movie IDs with their watch status
export const getWatchlistIds = async () => {
  const response = await api.get('/watchlist/ids');
  return response.data;
};

// Add a movie to watchlist with a given status
export const addToWatchlist = async (movieId, status = 'plan_to_watch') => {
  const response = await api.post(`/watchlist/${movieId}`, { status });
  return response.data;
};

// Update the watch status of a movie already in watchlist
export const updateWatchStatus = async (movieId, status) => {
  const response = await api.patch(`/watchlist/${movieId}`, { status });
  return response.data;
};

// Remove a movie from watchlist
export const removeFromWatchlist = async (movieId) => {
  const response = await api.delete(`/watchlist/${movieId}`);
  return response.data;
};

// Fetch another user's watchlist (public only)
export const getUserWatchlist = async (userId, status) => {
  const params = status ? { status } : {};
  const response = await api.get(`/watchlist/user/${userId}`, { params });
  return response.data;
};
