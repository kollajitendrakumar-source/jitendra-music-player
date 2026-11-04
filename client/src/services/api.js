import axios from 'axios';

const BACKEND_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Songs
export const getSongs = async (params = {}) => {
  const res = await api.get('/songs', { params });
  return res.data;
};

export const getSongById = async (id) => {
  const res = await api.get(`/songs/${id}`);
  return res.data;
};

export const uploadSongs = async (formData, onProgress) => {
  const res = await api.post('/songs/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });
  return res.data;
};

export const updateSong = async (id, data) => {
  const res = await api.patch(`/songs/${id}`, data);
  return res.data;
};

export const deleteSong = async (id) => {
  const res = await api.delete(`/songs/${id}`);
  return res.data;
};

export const searchAll = async (query) => {
  const res = await api.get('/songs/search', { params: { q: query } });
  return res.data;
};

export const getLanguages = async () => {
  const res = await api.get('/songs/languages');
  return res.data;
};

// Lyrics
export const updateLyrics = async (songId, data) => {
  const res = await api.put(`/songs/${songId}/lyrics`, data);
  return res.data;
};

export const deleteLyrics = async (songId) => {
  const res = await api.delete(`/songs/${songId}/lyrics`);
  return res.data;
};

// Playlists
export const getPlaylists = async () => {
  const res = await api.get('/playlists');
  return res.data;
};

export const getPlaylistById = async (id) => {
  const res = await api.get(`/playlists/${id}`);
  return res.data;
};

export const createPlaylist = async (data) => {
  const res = await api.post('/playlists', data);
  return res.data;
};

export const updatePlaylist = async (id, data) => {
  const res = await api.patch(`/playlists/${id}`, data);
  return res.data;
};

export const deletePlaylist = async (id) => {
  const res = await api.delete(`/playlists/${id}`);
  return res.data;
};

export const addSongToPlaylist = async (playlistId, songId) => {
  const res = await api.post(`/playlists/${playlistId}/songs`, { songId });
  return res.data;
};

export const removeSongFromPlaylist = async (playlistId, songId) => {
  const res = await api.delete(`/playlists/${playlistId}/songs/${songId}`);
  return res.data;
};

// Favorites
export const getFavorites = async () => {
  const res = await api.get('/favorites');
  return res.data;
};

export const addFavorite = async (songId) => {
  const res = await api.post(`/favorites/${songId}`);
  return res.data;
};

export const removeFavorite = async (songId) => {
  const res = await api.delete(`/favorites/${songId}`);
  return res.data;
};

// History & Stats
export const getHistory = async () => {
  const res = await api.get('/history');
  return res.data;
};

export const recordHistory = async (songId) => {
  const res = await api.post('/history', { songId });
  return res.data;
};

export const getStats = async () => {
  const res = await api.get('/stats');
  return res.data;
};

// Settings
export const getSettings = async () => {
  const res = await api.get('/settings');
  return res.data;
};

export const updateSettings = async (data) => {
  const res = await api.put('/settings', data);
  return res.data;
};

export default api;

