import React, { useState, useEffect } from 'react';
import {
  Music,
  Users,
  Disc,
  Clock,
  Play,
  Upload,
  ArrowRight,
  TrendingUp,
  Info,
} from 'lucide-react';
import { getStats, getHistory, getSongs, deleteSong } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { getArtworkUrl, formatTime, formatDuration } from '../utils/formatters';
import SongRow from '../components/SongRow';
import EditSongModal from '../components/EditSongModal';
import AddToPlaylistModal from '../components/AddToPlaylistModal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Home({ onNavigate }) {
  const { playSong, setIsUploadOpen, openSongDetails } = usePlayer();

  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [recentSongs, setRecentSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSongForEdit, setSelectedSongForEdit] = useState(null);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState(null);
  const [songToDelete, setSongToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSongDeleted = (deletedId) => {
    setRecentSongs((prev) => prev.filter((s) => s._id !== deletedId));
    setHistory((prev) => prev.filter((item) => (item.song?._id || item._id) !== deletedId));
    setStats((prev) => (prev ? { ...prev, totalSongs: Math.max(0, (prev.totalSongs || 1) - 1) } : prev));
  };

  const handleSongUpdated = (updated) => {
    setRecentSongs((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
    setHistory((prev) =>
      prev.map((item) => {
        if (item.song?._id === updated._id) return { ...item, song: updated };
        if (item._id === updated._id) return { ...item, ...updated };
        return item;
      })
    );
  };

  const confirmDeleteSong = async () => {
    if (!songToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSong(songToDelete._id);
      handleSongDeleted(songToDelete._id);
      setSongToDelete(null);
    } catch (err) {
      console.error('Failed to delete song:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Deduplicate recently played history so each unique song appears only once
  const uniqueHistory = React.useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const item of history) {
      const songId = item.song?._id;
      if (songId && !seen.has(songId)) {
        seen.add(songId);
        result.push(item);
      }
    }
    return result;
  }, [history]);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, historyData, songsData] = await Promise.all([
          getStats(),
          getHistory(),
          getSongs({ sort: 'dateAdded', order: 'desc' }),
        ]);
        setStats(statsData);
        setHistory(historyData);
        setRecentSongs(songsData.slice(0, 8));
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-white via-slate-50 to-white border border-border p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 z-10 max-w-xl">
          <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
            Welcome to Localify
          </h2>
          <p className="text-muted text-sm leading-relaxed">
            All your audio files and metadata are stored and processed locally. High-fidelity
            playback with automatic metadata extraction, synchronized lyrics, and zero cloud tracking.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-semibold text-xs shadow-md shadow-black/10 transition-all flex items-center gap-2 hover:scale-105"
          >
            <Upload className="w-4 h-4" />
            Upload Songs
          </button>
          <button
            onClick={() => onNavigate('library')}
            className="px-5 py-2.5 rounded-xl bg-surface hover:bg-surface-hover text-neutral-800 font-semibold text-xs border border-border transition-all flex items-center gap-2 shadow-xs"
          >
            View Library
            <ArrowRight className="w-4 h-4 text-muted" />
          </button>
        </div>

        {/* Ambient subtle glow decoration */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-slate-200/50 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Listening Statistics */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-surface border border-border flex items-center gap-4 shadow-xs">
            <div className="p-3 rounded-xl bg-slate-100 text-black">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl font-bold text-neutral-900">{stats.totalSongs || 0}</div>
              <div className="text-xs text-muted font-medium">Total Songs</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-border flex items-center gap-4 shadow-xs">
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-700">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl font-bold text-neutral-900">{stats.totalArtists || 0}</div>
              <div className="text-xs text-muted font-medium">Unique Artists</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-border flex items-center gap-4 shadow-xs">
            <div className="p-3 rounded-xl bg-violet-500/10 text-violet-700">
              <Disc className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl font-bold text-neutral-900">{stats.totalAlbums || 0}</div>
              <div className="text-xs text-muted font-medium">Unique Albums</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-border flex items-center gap-4 shadow-xs">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-700">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl font-bold text-neutral-900">
                {formatDuration(stats.totalListeningTime || stats.totalDuration || 0)}
              </div>
              <div className="text-xs text-muted font-medium">Listening Time</div>
            </div>
          </div>
        </div>
      )}

      {/* Recently Played */}
      {uniqueHistory.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-black" />
              <h3 className="text-lg font-bold text-neutral-900">Recently Played</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {uniqueHistory.slice(0, 6).map((item, idx) => {
              const song = item.song;
              if (!song) return null;
              return (
                <div
                  key={`${song._id}-${idx}`}
                  onClick={() => playSong(song, uniqueHistory.map((h) => h.song), idx)}
                  className="group p-3 rounded-2xl bg-surface hover:bg-slate-50 border border-border hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between shadow-xs"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-surface-active mb-2.5">
                    <img
                      src={getArtworkUrl(song.artworkPath)}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openSongDetails(song);
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-sm text-neutral-300 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md z-10"
                      title="Song Info & Credits"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    <button className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg shadow-black/25 translate-y-1 group-hover:translate-y-0">
                      <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                    </button>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-neutral-900 truncate group-hover:text-black">
                      {song.title}
                    </h4>
                    <p className="text-[11px] text-muted truncate mt-0.5">{song.artist}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recently Added Section */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-neutral-900">Recently Added</h3>
          {recentSongs.length > 0 && (
            <button
              onClick={() => onNavigate('library')}
              className="text-xs text-muted hover:text-black flex items-center gap-1 transition-colors font-medium"
            >
              See all ({stats?.totalSongs || recentSongs.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentSongs.length === 0 ? (
          <div className="py-12 border border-dashed border-border rounded-2xl text-center p-6 bg-slate-50/50">
            <Music className="w-10 h-10 text-muted mx-auto mb-2" />
            <p className="text-sm text-neutral-800 font-medium">Your library is empty</p>
            <p className="text-xs text-muted mt-1 mb-4">
              Click Add Music in the sidebar or upload button above to start your collection.
            </p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Audio Files
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-surface border border-border p-2 shadow-xs">
            <div className="divide-y divide-border">
              {recentSongs.map((song, idx) => (
                <SongRow
                  key={song._id}
                  song={song}
                  index={idx}
                  songs={recentSongs}
                  onEdit={(s) => setSelectedSongForEdit(s)}
                  onAddToPlaylist={(s) => setSelectedSongForPlaylist(s)}
                  onDelete={(s) => setSongToDelete(s)}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Edit Details Modal */}
      <EditSongModal
        isOpen={Boolean(selectedSongForEdit)}
        song={selectedSongForEdit}
        onClose={() => setSelectedSongForEdit(null)}
        onUpdated={handleSongUpdated}
      />

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        isOpen={Boolean(selectedSongForPlaylist)}
        song={selectedSongForPlaylist}
        onClose={() => setSelectedSongForPlaylist(null)}
      />

      {/* Delete Song Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(songToDelete)}
        title="Delete Song"
        message={`Are you sure you want to permanently delete "${songToDelete?.title}"? This will delete the audio and artwork files from your computer.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Permanently'}
        onConfirm={confirmDeleteSong}
        onCancel={() => setSongToDelete(null)}
      />
    </div>
  );
}

