import React, { useState, useEffect } from 'react';
import {
  Play,
  Shuffle,
  Trash2,
  ArrowLeft,
  ListMusic,
  MoveUp,
  MoveDown,
  X,
  Plus,
  Loader2,
  Clock,
} from 'lucide-react';
import {
  getPlaylistById,
  updatePlaylist,
  removeSongFromPlaylist,
  deletePlaylist,
  getSongs,
  addSongToPlaylist,
} from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { getArtworkUrl, formatTime, formatDuration } from '../utils/formatters';
import ConfirmDialog from '../components/ConfirmDialog';

export default function PlaylistDetails({ playlistId, onBack, onDeleted }) {
  const { playSong, showNotification } = usePlayer();

  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Add songs picker modal
  const [isAddPickerOpen, setIsAddPickerOpen] = useState(false);
  const [allSongs, setAllSongs] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const data = await getPlaylistById(playlistId);
      setPlaylist(data);
    } catch (err) {
      console.error('Failed to load playlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (playlistId) {
      fetchDetails();
    }
  }, [playlistId]);

  const songs = playlist?.songs || [];
  const firstSong = songs[0];
  const artwork = firstSong ? getArtworkUrl(firstSong.artworkPath) : null;
  const totalDuration = songs.reduce((acc, s) => acc + (s.duration || 0), 0);

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs, 0);
    }
  };

  const handleShuffleAll = () => {
    if (songs.length > 0) {
      const randomIdx = Math.floor(Math.random() * songs.length);
      playSong(songs[randomIdx], songs, randomIdx);
    }
  };

  const handleMoveSong = async (index, direction) => {
    const newSongs = [...songs];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= newSongs.length) return;

    const [moved] = newSongs.splice(index, 1);
    newSongs.splice(targetIdx, 0, moved);

    setPlaylist((prev) => ({ ...prev, songs: newSongs }));

    try {
      await updatePlaylist(playlist._id, {
        songs: newSongs.map((s) => s._id),
      });
    } catch (err) {
      console.error('Failed to reorder playlist songs:', err);
      showNotification('Failed to update song order', 'error');
    }
  };

  const handleRemoveSong = async (songId, songTitle) => {
    try {
      const updated = await removeSongFromPlaylist(playlist._id, songId);
      setPlaylist(updated);
      showNotification(`Removed "${songTitle}" from playlist`, 'info');
    } catch (err) {
      console.error('Failed to remove song:', err);
      showNotification('Failed to remove song', 'error');
    }
  };

  const handleDeletePlaylist = async () => {
    try {
      await deletePlaylist(playlist._id);
      showNotification(`Deleted playlist "${playlist.name}"`, 'info');
      if (onDeleted) onDeleted(playlist._id);
      if (onBack) onBack();
    } catch (err) {
      console.error('Failed to delete playlist:', err);
      showNotification('Failed to delete playlist', 'error');
    }
  };

  const openSongPicker = async () => {
    setIsAddPickerOpen(true);
    setPickerLoading(true);
    try {
      const librarySongs = await getSongs();
      setAllSongs(librarySongs);
    } catch (err) {
      console.error('Failed to load songs for picker:', err);
    } finally {
      setPickerLoading(false);
    }
  };

  const handleAddSongFromPicker = async (song) => {
    try {
      const updated = await addSongToPlaylist(playlist._id, song._id);
      setPlaylist(updated);
      showNotification(`Added "${song.title}" to playlist`, 'success');
    } catch (err) {
      console.error('Failed to add song:', err);
      showNotification('Failed to add song', 'error');
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-black mb-2" />
        <span className="text-xs">Loading playlist...</span>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-sm text-muted">Playlist not found.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-surface border border-border rounded-xl text-xs text-neutral-900"
        >
          Return to Playlists
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-black hover:bg-surface-hover px-3 py-1.5 rounded-xl border border-border transition-colors shadow-2xs"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Playlists
      </button>

      {/* Playlist Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-white via-slate-50 to-white border border-border p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-5 z-10">
          <div className="w-28 h-28 rounded-2xl overflow-hidden bg-surface-active border border-border shadow-md flex-shrink-0">
            {artwork ? (
              <img src={artwork} alt={playlist.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-muted">
                <ListMusic className="w-12 h-12 text-black/60" />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-black bg-black/5 px-2 py-0.5 rounded-md border border-black/15">
              Playlist
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              {playlist.name}
            </h2>
            {playlist.description && (
              <p className="text-xs text-muted max-w-lg">{playlist.description}</p>
            )}
            <div className="text-xs text-neutral-500 font-mono">
              {songs.length} {songs.length === 1 ? 'song' : 'songs'} • {formatDuration(totalDuration)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 z-10">
          {songs.length > 0 && (
            <>
              <button
                onClick={handlePlayAll}
                className="px-5 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-md shadow-black/15 hover:scale-105"
              >
                <Play className="w-4 h-4 fill-white text-white" /> Play
              </button>
              <button
                onClick={handleShuffleAll}
                className="px-4 py-2.5 rounded-xl bg-surface hover:bg-surface-hover text-neutral-800 font-semibold text-xs border border-border transition-all flex items-center gap-2 shadow-xs"
              >
                <Shuffle className="w-3.5 h-3.5" /> Shuffle
              </button>
            </>
          )}

          <button
            onClick={openSongPicker}
            className="px-4 py-2.5 rounded-xl bg-surface border border-border text-neutral-800 hover:text-black hover:bg-surface-hover font-semibold text-xs transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Songs
          </button>

          <button
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="p-2.5 rounded-xl bg-surface hover:bg-red-50 border border-border text-neutral-500 hover:text-red-600 transition-colors shadow-xs"
            title="Delete Playlist"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="absolute -left-12 -top-12 w-48 h-48 bg-slate-200/50 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Playlist Songs Table */}
      <div className="rounded-2xl bg-surface border border-border p-2 shadow-xs">
        {songs.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="p-4 rounded-full bg-slate-100 text-muted w-14 h-14 mx-auto flex items-center justify-center">
              <ListMusic className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-neutral-800">This playlist is empty</p>
            <p className="text-xs text-muted max-w-xs mx-auto">
              Add songs from your library to start listening.
            </p>
            <button
              onClick={openSongPicker}
              className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Songs Now
            </button>
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div className="flex items-center px-4 py-2 border-b border-border/80 text-xs font-semibold uppercase tracking-wider text-muted">
              <div className="w-8">#</div>
              <div className="flex-1 pr-4">Title</div>
              <div className="hidden md:block w-1/4 pr-4">Album</div>
              <div className="w-14 text-right flex items-center justify-end">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="w-24 text-right pr-2">Reorder</div>
              <div className="w-9"></div>
            </div>

            {/* Rows with up/down and remove */}
            <div className="divide-y divide-border/20 mt-1">
              {songs.map((song, idx) => (
                <div
                  key={`${song._id}-${idx}`}
                  onDoubleClick={() => playSong(song, songs, idx)}
                  className="group flex items-center px-4 py-2.5 rounded-xl border border-transparent hover:bg-surface-hover/70 text-sm transition-all"
                >
                  {/* Index / Play */}
                  <div className="w-8 flex items-center justify-start flex-shrink-0">
                    <button
                      onClick={() => playSong(song, songs, idx)}
                      className="w-7 h-7 flex items-center justify-center text-muted group-hover:text-black"
                    >
                      <span className="text-xs font-mono group-hover:hidden text-neutral-500">
                        {idx + 1}
                      </span>
                      <Play className="hidden group-hover:block w-4 h-4 text-black fill-black ml-0.5" />
                    </button>
                  </div>

                  {/* Artwork & Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                    <img
                      src={getArtworkUrl(song.artworkPath)}
                      alt={song.title}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-border"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-neutral-900 truncate">
                        {song.title}
                      </div>
                      <div className="text-xs text-muted truncate mt-0.5">{song.artist}</div>
                    </div>
                  </div>

                  {/* Album */}
                  <div className="hidden md:block w-1/4 text-xs text-muted truncate pr-4">
                    {song.album || 'Unknown Album'}
                  </div>

                  {/* Duration */}
                  <div className="w-14 text-xs font-mono text-muted text-right flex-shrink-0">
                    {formatTime(song.duration)}
                  </div>

                  {/* Move Up/Down Reorder */}
                  <div className="w-24 flex items-center justify-end gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleMoveSong(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 text-muted hover:text-black disabled:opacity-20 hover:bg-slate-100 rounded transition-colors"
                      title="Move up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveSong(idx, 1)}
                      disabled={idx === songs.length - 1}
                      className="p-1 text-muted hover:text-black disabled:opacity-20 hover:bg-slate-100 rounded transition-colors"
                      title="Move down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <div className="w-9 flex items-center justify-end flex-shrink-0">
                    <button
                      onClick={() => handleRemoveSong(song._id, song.title)}
                      className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove from playlist"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Songs Picker Modal */}
      {isAddPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg p-6 bg-surface border border-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-neutral-900 text-base">Add Songs to Playlist</h3>
              <button
                onClick={() => setIsAddPickerOpen(false)}
                className="p-1 text-muted hover:text-black rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-1.5 pr-1">
              {pickerLoading ? (
                <div className="py-12 flex justify-center text-muted">
                  <Loader2 className="w-6 h-6 animate-spin text-black" />
                </div>
              ) : allSongs.length === 0 ? (
                <p className="text-center py-8 text-xs text-muted">No songs found in library.</p>
              ) : (
                allSongs.map((song) => {
                  const isAlreadyIn = songs.some((s) => s._id === song._id);
                  return (
                    <div
                      key={song._id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-border text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={getArtworkUrl(song.artworkPath)}
                          alt={song.title}
                          className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-neutral-900 truncate">
                            {song.title}
                          </div>
                          <div className="text-muted truncate">{song.artist}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddSongFromPicker(song)}
                        disabled={isAlreadyIn}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
                          isAlreadyIn
                            ? 'text-neutral-400 bg-slate-100 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-neutral-800'
                        }`}
                      >
                        {isAlreadyIn ? 'Added' : '+ Add'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-border flex justify-end">
              <button
                onClick={() => setIsAddPickerOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-black hover:bg-neutral-800 text-white shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Delete Playlist"
        message={`Are you sure you want to delete "${playlist.name}"? All songs will remain safely in your library.`}
        confirmText="Delete Playlist"
        onConfirm={handleDeletePlaylist}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </div>
  );
}

