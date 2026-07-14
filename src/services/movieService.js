import api from './api';

// Fetch public visible movies with filters
export const getMovies = async (params) => {
  const response = await api.get('/movies', { params });
  return response.data;
};

// Fetch ALL movies for staff (includes hidden ones)
export const getMoviesForStaff = async () => {
  const response = await api.get('/movies/all');
  return response.data;
};

// Fetch a single movie by id
export const getMovie = async (id) => {
  const response = await api.get(`/movies/${id}`);
  return response.data;
};

// Create a new movie / anime
export const createMovie = async (data) => {
  const response = await api.post('/movies', data);
  return response.data;
};

// Update movie details
export const updateMovie = async (id, data) => {
  const response = await api.put(`/movies/${id}`, data);
  return response.data;
};

// Delete a movie
export const deleteMovie = async (id) => {
  const response = await api.delete(`/movies/${id}`);
  return response.data;
};

// Toggle visibility of a movie / anime
export const toggleMovieVisibility = async (id) => {
  const response = await api.patch(`/movies/${id}/visibility`);
  return response.data;
};

// Upload / set the poster image
export const uploadPoster = async (id, url) => {
  const response = await api.patch(`/movies/${id}/poster`, { url });
  return response.data;
};

// Upload / set the banner image
export const uploadBanner = async (id, url) => {
  const response = await api.patch(`/movies/${id}/banner`, { url });
  return response.data;
};

// Add a trailer link
export const addTrailer = async (id, trailer) => {
  const response = await api.post(`/movies/${id}/trailers`, trailer);
  return response.data;
};

// Edit a trailer link
export const updateTrailer = async (id, trailerId, trailer) => {
  const response = await api.put(`/movies/${id}/trailers/${trailerId}`, trailer);
  return response.data;
};

// Delete a trailer link
export const deleteTrailer = async (id, trailerId) => {
  const response = await api.delete(`/movies/${id}/trailers/${trailerId}`);
  return response.data;
};
