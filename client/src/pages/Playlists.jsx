import React, { useState, useEffect } from 'react';
import { Plus, ListMusic, Loader2, X, Check } from 'lucide-react';
import { getPlaylists, createPlaylist, updatePlaylist, deletePlaylist } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import PlaylistCard from '../components/PlaylistCard';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Playlists({ onSelectPlaylist }) {
  const { showNotification } = usePlayer();

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Delete Confirm
  const [deletingPlaylist, setDeletingPlaylist] = useState(null);

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const data = await getPlaylists();
      setPlaylists(data);
    } catch (err) {
      console.error('Failed to load playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createName.trim()) return;

    setIsSubmitting(true);
    try {
      const pl = await createPlaylist({
        name: createName.trim(),
        description: createDescription.trim(),
      });
      setPlaylists((prev) => [pl, ...prev]);
      setIsCreateModalOpen(false);
      setCreateName('');
      setCreateDescription('');
      showNotification(`Created playlist "${pl.name}"`, 'success');
    } catch (err) {
      console.error('Failed to create playlist:', err);
      showNotification('Failed to create playlist', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (playlist) => {
    setEditingPlaylist(playlist);
    setEditName(playlist.name);
    setEditDescription(playlist.description || '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingPlaylist || !editName.trim()) return;

    setIsSubmitting(true);
    try {
      const updated = await updatePlaylist(editingPlaylist._id, {
        name: editName.trim(),
        description: editDescription.trim(),
      });
      setPlaylists((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      setEditingPlaylist(null);
      showNotification('Playlist updated!', 'success');
    } catch (err) {
      console.error('Failed to update playlist:', err);
      showNotification('Failed to update playlist', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPlaylist) return;
    try {
      await deletePlaylist(deletingPlaylist._id);
      setPlaylists((prev) => prev.filter((p) => p._id !== deletingPlaylist._id));
      showNotification(`Deleted playlist "${deletingPlaylist.name}"`, 'info');
      setDeletingPlaylist(null);
    } catch (err) {
      console.error('Failed to delete playlist:', err);
      showNotification('Failed to delete playlist', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Playlists</h2>
          <p className="text-xs text-muted mt-0.5">
            Organize your music into personalized collections
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white font-semibold text-xs shadow-md shadow-black/15 transition-all flex items-center gap-2 hover:scale-105"
        >
          <Plus className="w-4 h-4" /> Create Playlist
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-black mb-2" />
          <span className="text-xs">Loading playlists...</span>
        </div>
      ) : playlists.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-3xl bg-slate-50/50">
          <div className="p-4 rounded-full bg-slate-100 text-black mb-3">
            <ListMusic className="w-10 h-10" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 mb-1">No playlists yet</h3>
          <p className="text-xs text-muted max-w-sm mb-5">
            Create custom playlists to group your favorite tracks for any mood or occasion.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-semibold text-xs shadow-md shadow-black/15 transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Your First Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {playlists.map((pl) => (
            <PlaylistCard
              key={pl._id}
              playlist={pl}
              onClick={() => onSelectPlaylist(pl._id)}
              onEdit={handleEdit}
              onDelete={(p) => setDeletingPlaylist(p)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md p-6 bg-surface border border-border rounded-2xl shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-neutral-900 text-base">New Playlist</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-muted hover:text-black rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Playlist Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Late Night Vibes"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-border rounded-xl text-neutral-900 text-sm focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Give your playlist a mood description..."
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-border rounded-xl text-neutral-900 text-xs focus:outline-none focus:border-black resize-none"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 hover:text-black rounded-xl border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!createName.trim() || isSubmitting}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-black hover:bg-neutral-800 disabled:opacity-50 text-white flex items-center gap-1.5 shadow-md shadow-black/15"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md p-6 bg-surface border border-border rounded-2xl shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-neutral-900 text-base">Edit Playlist</h3>
              <button
                onClick={() => setEditingPlaylist(null)}
                className="p-1 text-muted hover:text-black rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Playlist Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-border rounded-xl text-neutral-900 text-sm focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-border rounded-xl text-neutral-900 text-xs focus:outline-none focus:border-black resize-none"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingPlaylist(null)}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 hover:text-black rounded-xl border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editName.trim() || isSubmitting}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-black hover:bg-neutral-800 disabled:opacity-50 text-white flex items-center gap-1.5 shadow-md shadow-black/15"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={Boolean(deletingPlaylist)}
        title="Delete Playlist"
        message={`Are you sure you want to delete "${deletingPlaylist?.name}"? The songs in this playlist will remain safe in your library.`}
        confirmText="Delete Playlist"
        onConfirm={handleDelete}
        onCancel={() => setDeletingPlaylist(null)}
      />
    </div>
  );
}

