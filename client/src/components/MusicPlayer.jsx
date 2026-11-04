import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Heart,
  ListMusic,
  FileText,
  Maximize2,
  Minimize2,
  Info,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { getArtworkUrl, formatTime } from '../utils/formatters';

export default function MusicPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
    isMiniPlayer,
    isLyricsOpen,
    isQueueOpen,
    togglePlayPause,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    toggleFavorite,
    isFavoriteSong,
    setIsMiniPlayer,
    setIsLyricsOpen,
    setIsQueueOpen,
    openSongDetails,
  } = usePlayer();

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekVal, setSeekVal] = useState(0);

  const displayTime = isSeeking ? seekVal : currentTime;
  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;
  const isCurrentSongFav = currentSong ? (isFavoriteSong ? isFavoriteSong(currentSong._id, currentSong.isFavorite) : Boolean(currentSong.isFavorite)) : false;

  const handleSeekChange = (e) => {
    setSeekVal(Number(e.target.value));
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
    setSeekVal(currentTime);
  };

  const handleSeekEnd = (e) => {
    setIsSeeking(false);
    seek(Number(e.target.value));
  };

  // Mini Player Floating View
  if (isMiniPlayer) {
    return (
      <div className="fixed bottom-5 right-5 z-50 p-3 bg-surface/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl flex items-center gap-3 w-80 animate-slideUp">
        <div
          onClick={() => currentSong && openSongDetails(currentSong)}
          className="relative w-12 h-12 rounded-xl overflow-hidden bg-surface-active flex-shrink-0 border border-border cursor-pointer group hover:border-black transition-all"
          title="Click to view song info & credits"
        >
          <img
            src={getArtworkUrl(currentSong?.artworkPath)}
            alt={currentSong?.title || 'Player'}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Info className="w-4 h-4 text-white" />
          </div>
        </div>

        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => currentSong && openSongDetails(currentSong)}
          title="Click to view song info & credits"
        >
          <div className="text-xs font-semibold text-neutral-900 truncate hover:underline hover:text-black transition-colors">
            {currentSong ? currentSong.title : 'No track'}
          </div>
          <div className="text-[11px] text-muted truncate">
            {currentSong ? currentSong.artist : 'Select a song'}
          </div>

          {/* Mini progress */}
          <div className="w-full h-1 bg-surface-active rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-black transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={togglePlayPause}
            className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-neutral-800 transition-colors shadow-md shadow-black/20"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>
          <button
            onClick={() => setIsMiniPlayer(false)}
            className="p-1.5 text-muted hover:text-black rounded-lg transition-colors"
            title="Expand Player"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Full Bottom Bar
  return (
    <footer className="h-24 bg-surface border-t border-border px-6 flex items-center justify-between z-30 select-none shadow-sm">
      {/* Left: Song Info */}
      <div className="w-1/4 flex items-center gap-3.5 min-w-0">
        <div
          onClick={() => currentSong && openSongDetails(currentSong)}
          className="relative w-14 h-14 rounded-xl overflow-hidden bg-surface-active flex-shrink-0 border border-border shadow-xs cursor-pointer group hover:border-black transition-all"
          title="Click to view song info & credits"
        >
          <img
            src={getArtworkUrl(currentSong?.artworkPath)}
            alt={currentSong?.title || 'Localify'}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Info className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div
            onClick={() => currentSong && openSongDetails(currentSong)}
            className="text-sm font-semibold text-neutral-900 truncate hover:underline hover:text-black cursor-pointer transition-colors"
            title="Click to view song info & credits"
          >
            {currentSong ? currentSong.title : 'Ready to play'}
          </div>
          <div className="text-xs text-muted truncate mt-0.5">
            {currentSong ? currentSong.artist : 'Upload music to start'}
          </div>
        </div>

        {currentSong && (
          <button
            onClick={() => toggleFavorite(currentSong)}
            className={`p-2 rounded-xl hover:bg-surface-hover transition-colors flex-shrink-0 ${
              isCurrentSongFav ? 'text-black' : 'text-neutral-400 hover:text-black'
            }`}
            title={isCurrentSongFav ? 'Remove Favorite' : 'Save to Favorites'}
          >
            <Heart
              className={`w-4 h-4 transition-transform active:scale-125 ${isCurrentSongFav ? 'fill-black text-black' : ''}`}
            />
          </button>
        )}
      </div>

      {/* Middle: Controls & Progress */}
      <div className="w-2/4 max-w-2xl flex flex-col items-center gap-2">
        {/* Buttons Row */}
        <div className="flex items-center gap-5">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            className={`p-1.5 rounded-lg transition-colors ${
              isShuffle ? 'text-black font-bold' : 'text-neutral-400 hover:text-black'
            }`}
            title={isShuffle ? 'Shuffle enabled' : 'Enable shuffle'}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {/* Previous */}
          <button
            onClick={playPrevious}
            className="p-1.5 text-neutral-700 hover:text-black transition-colors"
            title="Previous song (Ctrl + Left)"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            className="w-10 h-10 rounded-full bg-black hover:bg-neutral-800 text-white flex items-center justify-center transition-all shadow-md shadow-black/20 hover:scale-105"
            title="Play / Pause (Space)"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white text-white" />
            ) : (
              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={() => playNext()}
            className="p-1.5 text-neutral-700 hover:text-black transition-colors"
            title="Next song (Ctrl + Right)"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          {/* Repeat */}
          <button
            onClick={toggleRepeat}
            className={`relative p-1.5 rounded-lg transition-colors ${
              repeatMode !== 'none' ? 'text-black font-bold' : 'text-neutral-400 hover:text-black'
            }`}
            title={`Repeat mode: ${repeatMode}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-4 h-4 text-black" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
            {repeatMode === 'all' && (
              <span className="absolute bottom-0 right-1 w-1 h-1 rounded-full bg-black" />
            )}
          </button>
        </div>

        {/* Progress Bar & Timestamps */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[11px] font-mono text-muted w-10 text-right">
            {formatTime(displayTime)}
          </span>

          <div className="relative flex-1 range-group flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={displayTime}
              onMouseDown={handleSeekStart}
              onTouchStart={handleSeekStart}
              onChange={handleSeekChange}
              onMouseUp={handleSeekEnd}
              onTouchEnd={handleSeekEnd}
              className="w-full h-1.5 relative z-10"
              style={{
                background: `linear-gradient(to right, #000000 ${progressPercent}%, #e2e8f0 ${progressPercent}%)`,
              }}
            />
          </div>

          <span className="text-[11px] font-mono text-muted w-10 text-left">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right: Side Actions & Volume */}
      <div className="w-1/4 flex items-center justify-end gap-3.5">
        {/* Lyrics */}
        <button
          onClick={() => setIsLyricsOpen(!isLyricsOpen)}
          className={`p-2 rounded-xl transition-all ${
            isLyricsOpen
              ? 'bg-black text-white border border-black shadow-xs'
              : 'text-neutral-500 hover:text-black hover:bg-surface-hover'
          }`}
          title="Toggle Lyrics"
        >
          <FileText className="w-4 h-4" />
        </button>

        {/* Queue */}
        <button
          onClick={() => setIsQueueOpen(!isQueueOpen)}
          className={`p-2 rounded-xl transition-all ${
            isQueueOpen
              ? 'bg-black text-white border border-black shadow-xs'
              : 'text-neutral-500 hover:text-black hover:bg-surface-hover'
          }`}
          title="Toggle Queue"
        >
          <ListMusic className="w-4 h-4" />
        </button>

        {/* Mini Player */}
        <button
          onClick={() => setIsMiniPlayer(true)}
          className="p-2 rounded-xl text-neutral-500 hover:text-black hover:bg-surface-hover transition-colors"
          title="Mini Player"
        >
          <Minimize2 className="w-4 h-4" />
        </button>

        {/* Volume */}
        <div className="flex items-center gap-2 range-group">
          <button
            onClick={toggleMute}
            className="p-1.5 text-neutral-500 hover:text-black transition-colors"
            title="Mute / Unmute (M)"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-500" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-20 h-1.5"
            style={{
              background: `linear-gradient(to right, #000000 ${(isMuted ? 0 : volume) * 100}%, #e2e8f0 ${(isMuted ? 0 : volume) * 100}%)`,
            }}
          />
        </div>
      </div>
    </footer>
  );
}

