import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as api from '../services/api';

const PlayerContext = createContext(null);
const BACKEND_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function PlayerProvider({ children }) {
  // Persistent HTML5 Audio instance
  const audioRef = useRef(null);

  const [currentSong, setCurrentSong] = useState(() => {
    try {
      const saved = localStorage.getItem('localify_current_song');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => {
    try {
      const saved = localStorage.getItem('localify_current_time');
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });
  const [duration, setDuration] = useState(() => currentSong?.duration || 0);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [favoriteSongIds, setFavoriteSongIds] = useState(new Set());
  const [repeatMode, setRepeatMode] = useState('none'); // 'none' | 'all' | 'one'
  const [isShuffle, setIsShuffle] = useState(false);
  
  // UI Panels state
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [detailsSong, setDetailsSong] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Quick Notification Toast
  const [notification, setNotification] = useState(null);
  const notificationTimeoutRef = useRef(null);

  const showNotification = (message, type = 'info') => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification({ message, type });
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Initialize Audio instance once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      localStorage.setItem('localify_current_time', audio.currentTime.toString());
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
      const savedTime = Number(localStorage.getItem('localify_current_time') || 0);
      if (savedTime > 0 && (!audio.duration || savedTime < audio.duration)) {
        try {
          audio.currentTime = savedTime;
          setCurrentTime(savedTime);
        } catch {
          // Ignore pre-seek failure if audio isn't fully ready
        }
      }
    };

    const handleEnded = () => {
      handleSongEnded();
    };

    const handleError = (e) => {
      console.warn('Audio playback error:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Initial audio setup from cached song
    if (currentSong && currentSong._id) {
      audio.src = `${BACKEND_URL}/api/songs/${currentSong._id}/stream`;
    }

    // Load initial settings & library queue
    api.getSettings().then((settings) => {
      if (settings) {
        if (typeof settings.volume === 'number') {
          audio.volume = settings.volume;
          setVolumeState(settings.volume);
        }
        if (settings.shuffle !== undefined) setIsShuffle(settings.shuffle);
        if (settings.repeatMode) setRepeatMode(settings.repeatMode);
        if (settings.lastPlayedSong) {
          setCurrentSong(settings.lastPlayedSong);
          if (settings.lastPlayedSong.duration) {
            setDuration(settings.lastPlayedSong.duration);
          }
          audio.src = `${BACKEND_URL}/api/songs/${settings.lastPlayedSong._id}/stream`;
        }
      }
      // Populate full queue from song library so Next / Prev / Shuffle always work
      return api.getSongs();
    }).then((songs) => {
      if (Array.isArray(songs) && songs.length > 0) {
        setQueue(songs);
        setFavoriteSongIds((prev) => {
          const next = new Set(prev);
          songs.forEach((s) => {
            if (s.isFavorite) next.add(s._id);
          });
          return next;
        });
        const activeSongId = currentSong?._id;
        if (activeSongId) {
          const idx = songs.findIndex((s) => s._id === activeSongId);
          setQueueIndex(idx !== -1 ? idx : 0);
        }
      }
      return api.getFavorites();
    }).then((favs) => {
      if (Array.isArray(favs) && favs.length > 0) {
        setFavoriteSongIds((prev) => {
          const next = new Set(prev);
          favs.forEach((f) => next.add(f._id));
          return next;
        });
      }
    }).catch((err) => {
      console.warn('Could not load settings or song list:', err);
    });

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, []);

  // Save current song to localStorage for instant persistence across reloads
  useEffect(() => {
    if (currentSong) {
      localStorage.setItem('localify_current_song', JSON.stringify(currentSong));
    }
  }, [currentSong]);

  // Save playback position periodically
  useEffect(() => {
    if (!currentSong) return;

    const timer = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        api.updateSettings({
          lastPlayedSong: currentSong._id,
          lastPlaybackPosition: audioRef.current.currentTime,
        }).catch(() => {});
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [currentSong]);

  // Handle song ended
  const handleSongEnded = () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
      return;
    }
    playNext(true);
  };

  // Play a song directly or with a queue
  const playSong = async (song, newQueue = null, index = null) => {
    if (!song) return;

    let targetQueue = queue;
    let targetIndex = queueIndex;

    if (newQueue && Array.isArray(newQueue)) {
      targetQueue = newQueue;
      setQueue(newQueue);
      targetIndex = index !== null ? index : newQueue.findIndex((s) => s._id === song._id);
      setQueueIndex(targetIndex !== -1 ? targetIndex : 0);
    } else if (!queue.some((s) => s._id === song._id)) {
      targetQueue = [...queue, song];
      setQueue(targetQueue);
      targetIndex = targetQueue.length - 1;
      setQueueIndex(targetIndex);
    } else if (index !== null) {
      targetIndex = index;
      setQueueIndex(index);
    } else {
      targetIndex = queue.findIndex((s) => s._id === song._id);
      setQueueIndex(targetIndex);
    }

    setCurrentSong(song);
    setCurrentTime(0);
    if (song.duration) {
      setDuration(song.duration);
    }

    if (audioRef.current) {
      const streamUrl = `${BACKEND_URL}/api/songs/${song._id}/stream`;
      audioRef.current.src = streamUrl;
      audioRef.current.currentTime = 0;
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn('Playback error:', err);
        setIsPlaying(false);
      }
    }

    // Record listening history & play count
    api.recordHistory(song._id).catch(() => {});

    // Save setting
    api.updateSettings({
      lastPlayedSong: song._id,
      lastPlaybackPosition: 0,
    }).catch(() => {});
  };

  // Toggle play/pause
  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    if (!currentSong) {
      if (queue.length > 0) {
        playSong(queue[0], queue, 0);
      }
      return;
    }

    const expectedSrc = `${BACKEND_URL}/api/songs/${currentSong._id}/stream`;
    if (!audioRef.current.src || !audioRef.current.src.includes(currentSong._id)) {
      audioRef.current.src = expectedSrc;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn('Playback error, reloading audio source:', err);
        try {
          audioRef.current.src = expectedSrc;
          audioRef.current.load();
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (retryErr) {
          console.error('Playback failed completely:', retryErr);
          setIsPlaying(false);
        }
      }
    }
  };

  // Play next song
  const playNext = (isAutoEnd = false) => {
    if (queue.length === 0) return;

    if (repeatMode === 'one' && !isAutoEnd) {
      // Manual click on next repeats or goes next? Manual next goes next
    }

    let nextIndex;
    if (isShuffle) {
      if (queue.length > 1) {
        do {
          nextIndex = Math.floor(Math.random() * queue.length);
        } while (nextIndex === queueIndex && queue.length > 1);
      } else {
        nextIndex = 0;
      }
    } else {
      nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          // Reached end of queue without repeat all
          setIsPlaying(false);
          return;
        }
      }
    }

    const nextSong = queue[nextIndex];
    if (nextSong) {
      setQueueIndex(nextIndex);
      playSong(nextSong, queue, nextIndex);
    }
  };

  // Play previous song
  const playPrevious = () => {
    if (!audioRef.current || queue.length === 0) return;

    // If more than 3 seconds in, restart current song
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    let prevIndex = queueIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }

    const prevSong = queue[prevIndex];
    if (prevSong) {
      setQueueIndex(prevIndex);
      playSong(prevSong, queue, prevIndex);
    }
  };

  // Seek
  const seek = (seconds) => {
    if (!audioRef.current) return;
    const clamped = Math.max(0, Math.min(seconds, duration || 0));
    audioRef.current.currentTime = clamped;
    setCurrentTime(clamped);
  };

  // Volume
  const setVolume = (val) => {
    const clamped = Math.max(0, Math.min(val, 1));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
    api.updateSettings({ volume: clamped }).catch(() => {});
  };

  // Mute / Unmute
  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Repeat Mode Cycle: none -> all -> one -> none
  const toggleRepeat = () => {
    const modes = ['none', 'all', 'one'];
    const nextIdx = (modes.indexOf(repeatMode) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    setRepeatMode(nextMode);
    api.updateSettings({ repeatMode: nextMode }).catch(() => {});
  };

  // Toggle Shuffle
  const toggleShuffle = () => {
    const nextVal = !isShuffle;
    setIsShuffle(nextVal);
    api.updateSettings({ shuffle: nextVal }).catch(() => {});
  };

  // Queue Operations
  const addToQueue = (song) => {
    if (!song) return;
    setQueue((prev) => [...prev, song]);
    showNotification(`"${song.title}" added to queue`);
  };

  const playNextInQueue = (song) => {
    if (!song) return;
    setQueue((prev) => {
      const copy = [...prev];
      copy.splice(queueIndex + 1, 0, song);
      return copy;
    });
    showNotification(`"${song.title}" will play next`);
  };

  const removeFromQueue = (index) => {
    setQueue((prev) => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
    if (index === queueIndex) {
      playNext();
    } else if (index < queueIndex) {
      setQueueIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const clearQueue = () => {
    if (currentSong) {
      setQueue([currentSong]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(-1);
    }
    showNotification('Queue cleared');
  };

  const reorderQueue = (newQueue) => {
    setQueue(newQueue);
    if (currentSong) {
      const newIdx = newQueue.findIndex((s) => s._id === currentSong._id);
      setQueueIndex(newIdx !== -1 ? newIdx : 0);
    }
  };

  // Song Details Modal Controls
  const openSongDetails = (song) => {
    setDetailsSong(song || currentSong);
    setIsDetailsOpen(true);
  };

  const closeSongDetails = () => {
    setIsDetailsOpen(false);
    setDetailsSong(null);
  };

  // Check favorite status helper
  const isFavoriteSong = (songId, initialFallback = false) => {
    if (!songId) return false;
    if (favoriteSongIds.has(songId)) return true;
    if (favoriteSongIds.size === 0 && initialFallback) return true;
    return false;
  };

  // Favorite toggle - no toast notification, immediate visual heart update
  const toggleFavorite = async (song) => {
    if (!song || !song._id) return;
    const isCurrentlyFav = favoriteSongIds.has(song._id) || Boolean(song.isFavorite);
    const nextFav = !isCurrentlyFav;

    // Immediate reactive update for all heart icons
    setFavoriteSongIds((prev) => {
      const next = new Set(prev);
      if (nextFav) {
        next.add(song._id);
      } else {
        next.delete(song._id);
      }
      return next;
    });

    // Optimistic update for song objects
    const updated = { ...song, isFavorite: nextFav };
    if (currentSong && currentSong._id === song._id) {
      setCurrentSong(updated);
    }
    if (detailsSong && detailsSong._id === song._id) {
      setDetailsSong(updated);
    }
    setQueue((prev) => prev.map((s) => (s._id === song._id ? updated : s)));

    try {
      if (nextFav) {
        await api.addFavorite(song._id);
      } else {
        await api.removeFavorite(song._id);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      // Revert if API failed
      setFavoriteSongIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyFav) next.add(song._id);
        else next.delete(song._id);
        return next;
      });
    }
  };

  // Update song details across active state
  const refreshSong = (updatedSong) => {
    if (!updatedSong) return;
    if (currentSong && currentSong._id === updatedSong._id) {
      setCurrentSong(updatedSong);
    }
    if (detailsSong && detailsSong._id === updatedSong._id) {
      setDetailsSong(updatedSong);
    }
    setQueue((prev) => prev.map((s) => (s._id === updatedSong._id ? updatedSong : s)));
  };

  // Keyboard Shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing inside input, textarea, or contentEditable
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowLeft' && e.ctrlKey) {
        e.preventDefault();
        playPrevious();
      } else if (e.code === 'ArrowRight' && e.ctrlKey) {
        e.preventDefault();
        playNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (audioRef.current) seek(audioRef.current.currentTime - 5);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (audioRef.current) seek(audioRef.current.currentTime + 5);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentSong, queue, queueIndex, repeatMode, isShuffle, volume, isMuted, duration]);

  const value = {
    audioRef,
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    queue,
    queueIndex,
    favoriteSongIds,
    isFavoriteSong,
    repeatMode,
    isShuffle,
    isMiniPlayer,
    isLyricsOpen,
    isQueueOpen,
    isUploadOpen,
    detailsSong,
    isDetailsOpen,
    notification,
    playSong,
    togglePlayPause,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    addToQueue,
    playNextInQueue,
    removeFromQueue,
    clearQueue,
    reorderQueue,
    toggleFavorite,
    refreshSong,
    openSongDetails,
    closeSongDetails,
    setIsMiniPlayer,
    setIsLyricsOpen,
    setIsQueueOpen,
    setIsUploadOpen,
    showNotification,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}

