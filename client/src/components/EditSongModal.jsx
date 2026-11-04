import React, { useState, useEffect } from 'react';
import { Edit3, X, Save, Loader2 } from 'lucide-react';
import { updateSong } from '../services/api';
import { usePlayer } from '../context/PlayerContext';

export default function EditSongModal({ isOpen, song, onClose, onUpdated }) {
  const { showNotification, refreshSong } = usePlayer();

  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    albumArtist: '',
    movieName: '',
    songType: 'Movie Soundtrack',
    genre: '',
    language: 'English',
    year: '',
    trackNumber: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (song) {
      setFormData({
        title: song.title || '',
        artist: song.artist || '',
        album: song.album || '',
        albumArtist: song.albumArtist || '',
        movieName: song.movieName || '',
        songType: song.songType || (song.movieName ? 'Movie Soundtrack' : 'Album Track'),
        genre: song.genre || '',
        language: song.language || 'English',
        year: song.year || '',
        trackNumber: song.trackNumber || '',
      });
    }
  }, [song]);

  if (!isOpen || !song) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showNotification('Song title cannot be empty', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateSong(song._id, {
        ...formData,
        year: formData.year ? Number(formData.year) : null,
        trackNumber: formData.trackNumber ? Number(formData.trackNumber) : null,
      });

      refreshSong(updated);
      showNotification('Song details updated!', 'success');
      if (onUpdated) onUpdated(updated);
      onClose();
    } catch (err) {
      console.error('Failed to update song details:', err);
      showNotification('Failed to update song details', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg p-6 bg-surface border border-border rounded-2xl shadow-2xl text-left">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-black/5 text-black">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Edit Song Details</h2>
              <p className="text-xs text-muted truncate max-w-xs">{song.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-black rounded-lg hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-neutral-900 text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Artist
              </label>
              <input
                type="text"
                name="artist"
                value={formData.artist}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-neutral-900 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Album
              </label>
              <input
                type="text"
                name="album"
                value={formData.album}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-neutral-900 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Category / Type
              </label>
              <select
                name="songType"
                value={formData.songType}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-neutral-900 text-sm focus:outline-none focus:border-black transition-colors cursor-pointer"
              >
                <option value="Movie Soundtrack">🎬 Movie Soundtrack</option>
                <option value="Private Song">🎵 Private Song / Single</option>
                <option value="Album Track">💿 Album Track</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Movie Name
              </label>
              <input
                type="text"
                name="movieName"
                value={formData.movieName}
                onChange={handleChange}
                placeholder={formData.songType === 'Movie Soundtrack' ? 'e.g. Badri (2000)' : 'Leave blank if private song'}
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-neutral-900 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Genre
              </label>
              <input
                type="text"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-neutral-900 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Language
              </label>
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-neutral-900 text-sm focus:outline-none focus:border-black transition-colors cursor-pointer"
              >
                <option value="Telugu">Telugu</option>
                <option value="Hindi">Hindi</option>
                <option value="Tamil">Tamil</option>
                <option value="English">English</option>
                <option value="Malayalam">Malayalam</option>
                <option value="Kannada">Kannada</option>
                <option value="Punjabi">Punjabi</option>
                <option value="Spanish">Spanish</option>
                <option value="Korean">Korean</option>
                <option value="Japanese">Japanese</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Year
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min="1900"
                max="2100"
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-neutral-900 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Track #
              </label>
              <input
                type="number"
                name="trackNumber"
                value={formData.trackNumber}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-neutral-900 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-black hover:bg-surface-hover rounded-xl transition-colors border border-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-black hover:bg-neutral-800 text-white transition-all flex items-center gap-2 shadow-md shadow-black/15"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

