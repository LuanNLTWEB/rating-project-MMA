import api from './api';

export const getMovieReviews = async (movieId) => {
  const response = await api.get(`/reviews/movie/${movieId}`);
  return response.data;
};

export const createReview = async (movieId, reviewData) => {
  const response = await api.post(`/reviews/movie/${movieId}`, reviewData);
  return response.data;
};

export const updateReview = async (reviewId, reviewData) => {
  const response = await api.put(`/reviews/${reviewId}`, reviewData);
  return response.data;
};

export const deleteReview = async (reviewId) => {
  const response = await api.delete(`/reviews/${reviewId}`);
  return response.data;
};

export const reactToReview = async (reviewId, type) => {
  const response = await api.post(`/reviews/${reviewId}/react`, { type });
  return response.data;
};

export const getAllReviews = async () => {
  const response = await api.get('/reviews/all');
  return response.data;
};

export const toggleHideReview = async (reviewId) => {
  const response = await api.patch(`/reviews/${reviewId}/hide`);
  return response.data;
};

export const togglePinReview = async (reviewId) => {
  const response = await api.patch(`/reviews/${reviewId}/pin`);
  return response.data;
};

export const toggleSpoilerReview = async (reviewId, containsSpoiler) => {
  const response = await api.patch(`/reviews/${reviewId}/spoiler`, { containsSpoiler });
  return response.data;
};
