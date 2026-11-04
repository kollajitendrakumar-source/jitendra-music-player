import React, { useState, useEffect } from 'react';
import { Heart, Play, Shuffle, Music, Sparkles } from 'lucide-react';
import { getFavorites } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { formatDuration } from '../utils/formatters';
import SongList from '../components/SongList';

export default function Favorites() {
  const { playSong } = usePlayer();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const data = await getFavorites();
      setFavorites(data);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const totalDuration = favorites.reduce((acc, s) => acc + (s.duration || 0), 0);

  const handlePlayAll = () => {
    if (favorites.length > 0) {
      playSong(favorites[0], favorites, 0);
    }
  };

  const handleShuffleAll = () => {
    if (favorites.length > 0) {
      const randomIdx = Math.floor(Math.random() * favorites.length);
      playSong(favorites[randomIdx], favorites, randomIdx);
    }
  };

  const handleSongDeleted = (deletedId) => {
    setFavorites((prev) => prev.filter((s) => s._id !== deletedId));
  };

  const handleSongUpdated = (updated) => {
    if (!updated.isFavorite) {
      setFavorites((prev) => prev.filter((s) => s._id !== updated._id));
    } else {
      setFavorites((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-100 via-white to-white border border-border p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-5 z-10">
          <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center text-white shadow-md shadow-black/15 flex-shrink-0">
            <Heart className="w-10 h-10 fill-white stroke-white" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-black" />
              Playlist
            </div>
            <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
              Favorite Songs
            </h2>
            <p className="text-xs text-muted">
              {favorites.length} {favorites.length === 1 ? 'song' : 'songs'} •{' '}
              {formatDuration(totalDuration)}
            </p>
          </div>
        </div>

        {favorites.length > 0 && (
          <div className="flex items-center gap-3 z-10">
            <button
              onClick={handlePlayAll}
              className="px-5 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-md shadow-black/15 hover:scale-105"
            >
              <Play className="w-4 h-4 fill-white text-white" /> Play All
            </button>
            <button
              onClick={handleShuffleAll}
              className="px-5 py-2.5 rounded-xl bg-surface hover:bg-surface-hover text-neutral-800 font-semibold text-xs border border-border transition-all flex items-center gap-2 shadow-xs"
            >
              <Shuffle className="w-4 h-4" /> Shuffle
            </button>
          </div>
        )}

        <div className="absolute -left-12 -top-12 w-48 h-48 bg-slate-200/50 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Favorites List */}
      <div className="rounded-2xl bg-surface border border-border p-2 shadow-xs">
        <SongList
          songs={favorites}
          loading={loading}
          emptyMessage="You haven't added any favorite songs yet. Click the heart icon on any song to save it here!"
          onSongDeleted={handleSongDeleted}
          onSongUpdated={handleSongUpdated}
        />
      </div>
    </div>
  );
}

