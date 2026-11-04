import React, { useState } from 'react';
import { Play, ListMusic, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { getArtworkUrl, formatDuration } from '../utils/formatters';

export default function PlaylistCard({
  playlist,
  onClick,
  onEdit,
  onDelete,
}) {
  const { playSong } = usePlayer();
  const [menuOpen, setMenuOpen] = useState(false);

  const songs = playlist.songs || [];
  const firstSong = songs[0];
  const artwork = firstSong ? getArtworkUrl(firstSong.artworkPath) : null;
  const totalDuration = songs.reduce((acc, s) => acc + (s.duration || 0), 0);

  const handlePlayAll = (e) => {
    e.stopPropagation();
    if (songs.length > 0) {
      playSong(songs[0], songs, 0);
    }
  };

  return (
    <div
      onClick={onClick}
      className="group relative p-3.5 rounded-2xl bg-surface hover:bg-slate-50 border border-border hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md"
    >
      {/* Artwork container */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-surface-active mb-3 border border-border">
        {artwork ? (
          <img
            src={artwork}
            alt={playlist.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-muted">
            <ListMusic className="w-12 h-12 stroke-[1.2] text-black/60 mb-1" />
            <span className="text-[11px] text-neutral-500 font-medium">Empty Playlist</span>
          </div>
        )}

        {/* Hover Play Button */}
        {songs.length > 0 && (
          <button
            onClick={handlePlayAll}
            className="absolute bottom-2.5 right-2.5 w-11 h-11 rounded-full bg-black hover:bg-neutral-800 text-white flex items-center justify-center shadow-lg shadow-black/30 transition-all opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
            title="Play Playlist"
          >
            <Play className="w-5 h-5 fill-white text-white ml-0.5" />
          </button>
        )}
      </div>

      {/* Details */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-neutral-900 text-sm truncate group-hover:text-black transition-colors">
            {playlist.name}
          </h3>
          <p className="text-xs text-muted truncate mt-0.5">
            {playlist.description || `${songs.length} song${songs.length === 1 ? '' : 's'}`}
          </p>
          <div className="text-[11px] text-neutral-500 mt-1 font-mono">
            {songs.length} songs • {formatDuration(totalDuration)}
          </div>
        </div>

        {/* Options */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 text-muted hover:text-black rounded-lg hover:bg-surface-hover opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-6 z-20 w-36 bg-surface border border-border rounded-xl shadow-xl py-1 text-xs text-neutral-800 animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              {onEdit && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(playlist);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-surface-hover hover:text-black transition-colors text-left"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(playlist);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

