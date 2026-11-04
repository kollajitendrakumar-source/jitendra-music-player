import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Heart,
  MoreVertical,
  ListPlus,
  PlaySquare,
  Edit3,
  FileText,
  Trash2,
  Info,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { getArtworkUrl, formatTime, formatDate } from '../utils/formatters';

export default function SongRow({
  song,
  index,
  songs = [],
  onEdit,
  onAddToPlaylist,
  onDelete,
}) {
  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlayPause,
    addToQueue,
    playNextInQueue,
    toggleFavorite,
    isFavoriteSong,
    setIsLyricsOpen,
    openSongDetails,
  } = usePlayer();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isCurrent = currentSong?._id === song._id;
  const isFav = isFavoriteSong ? isFavoriteSong(song._id, song.isFavorite) : Boolean(song.isFavorite);

  // Close menu when clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleRowClick = () => {
    if (isCurrent) {
      togglePlayPause();
    } else {
      playSong(song, songs, index);
    }
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleFavorite(song);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  };

  const handleAction = (action, e) => {
    e.stopPropagation();
    setMenuOpen(false);

    switch (action) {
      case 'playNext':
        playNextInQueue(song);
        break;
      case 'addToQueue':
        addToQueue(song);
        break;
      case 'addToPlaylist':
        if (onAddToPlaylist) onAddToPlaylist(song);
        break;
      case 'toggleFav':
        toggleFavorite(song);
        break;
      case 'edit':
        if (onEdit) onEdit(song);
        break;
      case 'lyrics':
        if (!isCurrent) {
          playSong(song, songs, index);
        }
        setIsLyricsOpen(true);
        break;
      case 'details':
        openSongDetails(song);
        break;
      case 'delete':
        if (onDelete) onDelete(song);
        break;
      default:
        break;
    }
  };

  return (
    <div
      onDoubleClick={handleRowClick}
      className={`group relative flex items-center px-4 py-2.5 rounded-xl border text-sm transition-all select-none ${
        isCurrent
          ? 'bg-slate-100/90 border-black/20 text-neutral-900 shadow-xs'
          : 'bg-transparent hover:bg-slate-100/70 border-transparent text-neutral-700'
      }`}
    >
      {/* Index / Play Button */}
      <div className="w-8 flex items-center justify-start flex-shrink-0">
        <button
          onClick={handleRowClick}
          className="relative w-7 h-7 flex items-center justify-center text-muted group-hover:text-black"
        >
          {isCurrent && isPlaying ? (
            <div className="flex items-end gap-0.5 h-3.5 group-hover:hidden">
              <span className="w-1 bg-black animate-pulse h-full rounded-full" />
              <span className="w-1 bg-black animate-pulse delay-75 h-2 rounded-full" />
              <span className="w-1 bg-black animate-pulse delay-150 h-3.5 rounded-full" />
            </div>
          ) : (
            <span
              className={`text-xs font-mono group-hover:hidden ${
                isCurrent ? 'text-black font-bold' : 'text-neutral-400'
              }`}
            >
              {index + 1}
            </span>
          )}

          <div className="hidden group-hover:flex items-center justify-center">
            {isCurrent && isPlaying ? (
              <Pause className="w-4 h-4 text-black fill-black" />
            ) : (
              <Play className="w-4 h-4 text-black fill-black ml-0.5" />
            )}
          </div>
        </button>
      </div>

      {/* Song Title & Artwork */}
      <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
        <div
          onClick={(e) => {
            e.stopPropagation();
            openSongDetails(song);
          }}
          className="relative w-10 h-10 rounded-lg overflow-hidden bg-surface-active flex-shrink-0 border border-border cursor-pointer group/art hover:border-black transition-all shadow-2xs"
          title="Click to view song info & credits"
        >
          <img
            src={getArtworkUrl(song.artworkPath)}
            alt={song.title}
            className="w-full h-full object-cover transition-transform group-hover/art:scale-110"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/art:opacity-100 flex items-center justify-center transition-opacity">
            <Info className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={`font-semibold truncate text-sm ${
              isCurrent ? 'text-black font-bold' : 'text-neutral-900'
            }`}
          >
            {song.title}
          </div>
          <div className="text-xs text-muted truncate mt-0.5">{song.artist}</div>
        </div>
      </div>

      {/* Album */}
      <div className="hidden md:block w-1/4 text-xs text-muted truncate pr-4">
        {song.album || 'Unknown Album'}
      </div>

      {/* Date Added */}
      <div className="hidden lg:block w-28 text-xs text-neutral-400 truncate pr-4">
        {formatDate(song.dateAdded)}
      </div>

      {/* Favorite Button */}
      <div className="w-9 flex items-center justify-center flex-shrink-0">
        <button
          onClick={handleFavoriteClick}
          className={`p-1.5 rounded-lg transition-colors ${
            isFav
              ? 'text-black'
              : 'text-neutral-300 hover:text-black opacity-0 group-hover:opacity-100'
          }`}
          title={isFav ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Heart
            className={`w-4 h-4 transition-transform active:scale-125 ${isFav ? 'fill-black text-black' : ''}`}
          />
        </button>
      </div>

      {/* Duration */}
      <div className="w-14 text-xs font-mono text-muted text-right flex-shrink-0">
        {formatTime(song.duration)}
      </div>

      {/* Three-Dot Actions Menu */}
      <div className="relative w-9 flex items-center justify-end flex-shrink-0" ref={menuRef}>
        <button
          onClick={handleMenuClick}
          className="p-1.5 text-neutral-400 hover:text-black hover:bg-surface-active rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="More options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-8 z-50 w-48 bg-surface border border-border rounded-xl shadow-xl py-1 text-xs text-neutral-800 animate-fadeIn backdrop-blur-md">
            <button
              onClick={(e) => handleAction('playNext', e)}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-hover hover:text-black transition-colors text-left"
            >
              <PlaySquare className="w-3.5 h-3.5 text-black" />
              Play Next
            </button>
            <button
              onClick={(e) => handleAction('addToQueue', e)}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-hover hover:text-black transition-colors text-left"
            >
              <ListPlus className="w-3.5 h-3.5 text-neutral-500" />
              Add to Queue
            </button>
            <button
              onClick={(e) => handleAction('addToPlaylist', e)}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-hover hover:text-black transition-colors text-left"
            >
              <ListPlus className="w-3.5 h-3.5 text-neutral-500" />
              Add to Playlist...
            </button>
            <button
              onClick={(e) => handleAction('toggleFav', e)}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-hover hover:text-black transition-colors text-left"
            >
              <Heart
                className={`w-3.5 h-3.5 ${isFav ? 'fill-black text-black' : 'text-neutral-500'}`}
              />
              {isFav ? 'Remove Favorite' : 'Add to Favorites'}
            </button>
            <button
              onClick={(e) => handleAction('lyrics', e)}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-hover hover:text-black transition-colors text-left"
            >
              <FileText className="w-3.5 h-3.5 text-neutral-500" />
              View Lyrics
            </button>
            <button
              onClick={(e) => handleAction('details', e)}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-hover hover:text-black transition-colors text-left"
            >
              <Info className="w-3.5 h-3.5 text-black" />
              Song Info & Credits
            </button>
            <button
              onClick={(e) => handleAction('edit', e)}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-hover hover:text-black transition-colors text-left"
            >
              <Edit3 className="w-3.5 h-3.5 text-neutral-500" />
              Edit Details
            </button>
            <div className="h-px bg-border my-1" />
            <button
              onClick={(e) => handleAction('delete', e)}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors text-left"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Song
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

