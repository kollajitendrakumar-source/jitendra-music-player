import React from 'react';
import {
  Film,
  Music,
  User,
  Calendar,
  Clock,
  HardDrive,
  FileAudio,
  Play,
  Pause,
  Heart,
  ListPlus,
  FileText,
  Edit3,
  X,
  Disc3,
  Sparkles,
  Info,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { getArtworkUrl, formatTime, formatDate } from '../utils/formatters';

export default function SongDetailsModal({ isOpen, song, onClose, onEditSong }) {
  const {
    currentSong,
    isPlaying,
    togglePlayPause,
    playSong,
    toggleFavorite,
    isFavoriteSong,
    setIsLyricsOpen,
  } = usePlayer();

  if (!isOpen || !song) return null;

  const isCurrent = currentSong?._id === song._id;
  const isSongFav = isFavoriteSong ? isFavoriteSong(song._id, song.isFavorite) : Boolean(song.isFavorite);

  const handlePlay = () => {
    if (isCurrent) {
      togglePlayPause();
    } else {
      playSong(song);
    }
  };

  const handleOpenLyrics = () => {
    if (!isCurrent) {
      playSong(song);
    }
    setIsLyricsOpen(true);
    onClose();
  };

  const isMovieSong = song.songType === 'Movie Soundtrack' || Boolean(song.movieName);
  const isPrivateSong = song.songType === 'Private Song';

  const formatFileSize = (bytes) => {
    if (!bytes || bytes <= 0) return null;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp text-left">
        {/* Header with Close */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-black" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              Song Information & Credits
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-black rounded-xl hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Top Banner: Artwork + Title + Key Metadata */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Artwork */}
            <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-2xl overflow-hidden bg-surface-active shadow-md flex-shrink-0 border border-border group">
              <img
                src={getArtworkUrl(song.artworkPath)}
                alt={song.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <button
                onClick={handlePlay}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center shadow-xl shadow-black/30">
                  {isCurrent && isPlaying ? (
                    <Pause className="w-6 h-6 fill-white text-white" />
                  ) : (
                    <Play className="w-6 h-6 fill-white text-white ml-1" />
                  )}
                </div>
              </button>
            </div>

            {/* Song Primary Details */}
            <div className="flex-1 min-w-0 space-y-3 text-center sm:text-left">
              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {isMovieSong ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-800 border border-amber-500/30">
                    <Film className="w-3 h-3 text-amber-700" /> Movie Soundtrack
                  </span>
                ) : isPrivateSong ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-800 border border-purple-500/30">
                    <Disc3 className="w-3 h-3 text-purple-700" /> Private Song / Indie
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-800 border border-sky-500/30">
                    <Music className="w-3 h-3 text-sky-700" /> Album Track
                  </span>
                )}

                {song.language && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-black/5 text-black border border-black/15">
                    {song.language}
                  </span>
                )}

                {song.genre && song.genre !== 'Unknown' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-neutral-800 border border-border">
                    {song.genre}
                  </span>
                )}
              </div>

              {/* Title & Artists */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                  {song.title}
                </h2>
                <p className="text-base text-neutral-700 font-medium mt-1">
                  {song.artist || 'Unknown Artist'}
                </p>
                {song.albumArtist && song.albumArtist !== song.artist && (
                  <p className="text-xs text-muted mt-0.5">
                    Composer / Director: <span className="text-neutral-900 font-semibold">{song.albumArtist}</span>
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-2">
                <button
                  onClick={handlePlay}
                  className="px-5 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-semibold text-xs shadow-md shadow-black/15 transition-all flex items-center gap-2 hover:scale-105"
                >
                  {isCurrent && isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-white text-white" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white text-white ml-0.5" /> Play Now
                    </>
                  )}
                </button>

                <button
                  onClick={() => toggleFavorite(song)}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isSongFav
                      ? 'bg-black text-white border-black'
                      : 'bg-surface hover:bg-surface-hover border-border text-neutral-600 hover:text-black'
                  }`}
                  title={isSongFav ? 'Remove Favorite' : 'Add to Favorites'}
                >
                  <Heart className={`w-4 h-4 transition-transform active:scale-125 ${isSongFav ? 'fill-white text-white' : ''}`} />
                </button>

                <button
                  onClick={handleOpenLyrics}
                  className="px-3.5 py-2.5 rounded-xl bg-surface hover:bg-surface-hover border border-border text-neutral-700 hover:text-black text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-black" /> Lyrics
                </button>

                {onEditSong && (
                  <button
                    onClick={() => {
                      onClose();
                      onEditSong(song);
                    }}
                    className="p-2.5 rounded-xl bg-surface hover:bg-surface-hover border border-border text-neutral-600 hover:text-black transition-all shadow-xs"
                    title="Edit Details"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Information Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {/* Movie or Album Origin */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-border space-y-1 text-left">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                {isMovieSong ? (
                  <>
                    <Film className="w-4 h-4 text-amber-700" />
                    <span>Movie Name</span>
                  </>
                ) : (
                  <>
                    <Music className="w-4 h-4 text-sky-700" />
                    <span>Album / Category</span>
                  </>
                )}
              </div>
              <div className="text-sm font-bold text-neutral-900 pt-1">
                {isMovieSong
                  ? song.movieName || song.album || 'Film Soundtrack'
                  : isPrivateSong
                  ? 'Private Song (Independent Single)'
                  : song.album || 'Single / Independent'}
              </div>
              <div className="text-xs text-neutral-600">
                {isMovieSong
                  ? `From the motion picture soundtrack: ${song.album || song.movieName || ''}`
                  : `Non-film private release`}
              </div>
            </div>

            {/* Uploaded By Details */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-border space-y-1 text-left">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <User className="w-4 h-4 text-black" />
                <span>Uploaded By</span>
              </div>
              <div className="text-sm font-bold text-neutral-900 pt-1">
                {song.uploadedBy?.name || 'Local User'}
              </div>
              <div className="text-xs text-neutral-600 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>Uploaded on {formatDate(song.dateAdded || song.createdAt)}</span>
              </div>
            </div>

            {/* Audio Specifications */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-border space-y-1 text-left">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <FileAudio className="w-4 h-4 text-black" />
                <span>Audio Specifications</span>
              </div>
              <div className="text-sm font-bold text-neutral-900 pt-1 font-mono">
                {song.format?.toUpperCase() || 'MP3'}
                {song.bitrate ? ` • ${song.bitrate} kbps` : ''}
                {song.sampleRate ? ` • ${(song.sampleRate / 1000).toFixed(1)} kHz` : ''}
              </div>
              <div className="text-xs text-neutral-600">
                Duration: {formatTime(song.duration)}
                {formatFileSize(song.fileSize) ? ` • Size: ${formatFileSize(song.fileSize)}` : ''}
              </div>
            </div>

            {/* Playback Stats */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-border space-y-1 text-left">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <Clock className="w-4 h-4 text-violet-700" />
                <span>Playback History</span>
              </div>
              <div className="text-sm font-bold text-neutral-900 pt-1">
                {song.playCount || 0} {song.playCount === 1 ? 'play' : 'plays'}
              </div>
              <div className="text-xs text-neutral-600">
                {song.lastPlayedAt
                  ? `Last played ${formatDate(song.lastPlayedAt)}`
                  : 'Not played yet'}
              </div>
            </div>
          </div>

          {/* Local File Storage Info */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-border flex items-center gap-3 text-xs text-neutral-600">
            <HardDrive className="w-4 h-4 text-muted flex-shrink-0" />
            <div className="min-w-0 flex-1 truncate">
              <span className="text-neutral-900 font-semibold">Local File: </span>
              <span className="font-mono text-[11px] text-neutral-700">{song.filePath}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

