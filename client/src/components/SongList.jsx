import React, { useState } from 'react';
import { Clock, Music, Loader2 } from 'lucide-react';
import SongRow from './SongRow';
import EditSongModal from './EditSongModal';
import AddToPlaylistModal from './AddToPlaylistModal';
import ConfirmDialog from './ConfirmDialog';
import { deleteSong } from '../services/api';
import { usePlayer } from '../context/PlayerContext';

export default function SongList({
  songs = [],
  loading = false,
  emptyMessage = 'No songs found in your library.',
  onSongDeleted,
  onSongUpdated,
}) {
  const { showNotification } = usePlayer();

  const [selectedSongForEdit, setSelectedSongForEdit] = useState(null);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState(null);
  const [songToDelete, setSongToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteSong = async () => {
    if (!songToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSong(songToDelete._id);
      showNotification(`"${songToDelete.title}" deleted from library`, 'info');
      if (onSongDeleted) onSongDeleted(songToDelete._id);
      setSongToDelete(null);
    } catch (err) {
      console.error('Failed to delete song:', err);
      showNotification('Failed to delete song', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-black mb-2" />
        <span className="text-xs">Loading songs...</span>
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-2xl bg-slate-50/50">
        <div className="p-4 rounded-full bg-slate-100 text-muted mb-3">
          <Music className="w-8 h-8" />
        </div>
        <p className="text-sm font-medium text-neutral-800">{emptyMessage}</p>
        <p className="text-xs text-muted mt-1">Upload audio files to get started.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Table Header */}
      <div className="flex items-center px-4 py-2 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted">
        <div className="w-8">#</div>
        <div className="flex-1 pr-4">Title</div>
        <div className="hidden md:block w-1/4 pr-4">Album</div>
        <div className="hidden lg:block w-28 pr-4">Date Added</div>
        <div className="w-9 text-center"></div>
        <div className="w-14 text-right flex items-center justify-end">
          <Clock className="w-3.5 h-3.5" />
        </div>
        <div className="w-9"></div>
      </div>

      {/* Song Rows */}
      <div className="divide-y divide-border/60 mt-1">
        {songs.map((song, idx) => (
          <SongRow
            key={song._id}
            song={song}
            index={idx}
            songs={songs}
            onEdit={(s) => setSelectedSongForEdit(s)}
            onAddToPlaylist={(s) => setSelectedSongForPlaylist(s)}
            onDelete={(s) => setSongToDelete(s)}
          />
        ))}
      </div>

      {/* Edit Details Modal */}
      <EditSongModal
        isOpen={Boolean(selectedSongForEdit)}
        song={selectedSongForEdit}
        onClose={() => setSelectedSongForEdit(null)}
        onUpdated={(updated) => {
          if (onSongUpdated) onSongUpdated(updated);
          setSelectedSongForEdit(null);
        }}
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

