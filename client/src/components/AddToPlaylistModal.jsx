import React, { useState, useEffect } from 'react';
import { ListPlus, X, Plus, Check, Loader2 } from 'lucide-react';
import { getPlaylists, addSongToPlaylist, createPlaylist } from '../services/api';
import { usePlayer } from '../context/PlayerContext';

export default function AddToPlaylistModal({ isOpen, song, onClose }) {
  const { showNotification } = usePlayer();

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [addedPlaylists, setAddedPlaylists] = useState(new Set());

  useEffect(() => {
    if (isOpen && song) {
      setLoading(true);
      getPlaylists()
        .then((data) => {
          setPlaylists(data);
          const alreadyIn = new Set();
          for (const pl of data) {
            if (pl.songs?.some((s) => (s._id || s) === song._id)) {
              alreadyIn.add(pl._id);
            }
          }
          setAddedPlaylists(alreadyIn);
        })
        .catch((err) => {
          console.error('Failed to fetch playlists:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, song]);

  if (!isOpen || !song) return null;

  const handleAddToPlaylist = async (playlistId, playlistName) => {
    try {
      await addSongToPlaylist(playlistId, song._id);
      setAddedPlaylists((prev) => new Set([...prev, playlistId]));
      showNotification(`Added "${song.title}" to ${playlistName}`, 'success');
    } catch (err) {
      console.error('Error adding to playlist:', err);
      showNotification('Failed to add song to playlist', 'error');
    }
  };

  const handleCreateAndAdd = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    setIsCreating(true);
    try {
      const pl = await createPlaylist({
        name: newPlaylistName.trim(),
        songs: [song._id],
      });
      setPlaylists((prev) => [pl, ...prev]);
      setAddedPlaylists((prev) => new Set([...prev, pl._id]));
      setNewPlaylistName('');
      showNotification(`Created playlist "${pl.name}" and added song!`, 'success');
    } catch (err) {
      console.error('Failed to create playlist:', err);
      showNotification('Failed to create playlist', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md p-6 bg-surface border border-border rounded-2xl shadow-2xl text-left">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-black/5 text-black">
              <ListPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Add to Playlist</h2>
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

        {/* Create playlist quick form */}
        <form onSubmit={handleCreateAndAdd} className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="New playlist name..."
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            className="flex-1 px-3.5 py-2 bg-slate-50 border border-border rounded-xl text-neutral-900 text-sm focus:outline-none focus:border-black transition-colors"
          />
          <button
            type="submit"
            disabled={!newPlaylistName.trim() || isCreating}
            className="px-3.5 py-2 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-black/15"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create
          </button>
        </form>

        {/* Playlists list */}
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            Your Playlists
          </p>

          {loading ? (
            <div className="py-8 flex justify-center text-muted">
              <Loader2 className="w-6 h-6 animate-spin text-black" />
            </div>
          ) : playlists.length === 0 ? (
            <div className="py-6 text-center text-muted text-sm border border-dashed border-border rounded-xl bg-slate-50/50">
              No playlists found. Create one above!
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {playlists.map((pl) => {
                const isAdded = addedPlaylists.has(pl._id);
                return (
                  <button
                    key={pl._id}
                    onClick={() => !isAdded && handleAddToPlaylist(pl._id, pl.name)}
                    disabled={isAdded}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm text-left transition-all ${
                      isAdded
                        ? 'bg-slate-100 border-border text-neutral-800 opacity-90'
                        : 'bg-surface hover:bg-slate-50 border-border text-neutral-900 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="font-semibold truncate">{pl.name}</div>
                      <div className="text-xs text-muted">
                        {pl.songs?.length || 0} song{pl.songs?.length === 1 ? '' : 's'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isAdded ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-neutral-900 bg-black/5 px-2 py-1 rounded-md border border-black/10">
                          <Check className="w-3.5 h-3.5" /> Added
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-black hover:underline">
                          + Add
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-black hover:bg-neutral-800 rounded-xl transition-all shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

