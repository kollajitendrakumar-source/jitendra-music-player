import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  X,
  Upload,
  Edit2,
  Trash2,
  Check,
  Music2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { updateLyrics, deleteLyrics } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

export default function LyricsPanel() {
  const { isLyricsOpen, setIsLyricsOpen, currentSong, currentTime, seek, refreshSong, showNotification } =
    usePlayer();

  const fileInputRef = useRef(null);
  const activeLyricRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [lyricsInputText, setLyricsInputText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const lyrics = currentSong?.lyrics || { text: '', isSynced: false, syncedLyrics: [] };
  const hasLyrics = Boolean(lyrics.text && lyrics.text.trim());

  // Find active lyric line index for synced lyrics
  useEffect(() => {
    if (!lyrics.isSynced || !lyrics.syncedLyrics || lyrics.syncedLyrics.length === 0) {
      setActiveIndex(-1);
      return;
    }

    let currentIdx = -1;
    for (let i = 0; i < lyrics.syncedLyrics.length; i++) {
      if (currentTime >= lyrics.syncedLyrics[i].time) {
        currentIdx = i;
      } else {
        break;
      }
    }
    setActiveIndex(currentIdx);
  }, [currentTime, lyrics]);

  // Smooth scroll active lyric into center view
  useEffect(() => {
    if (activeLyricRef.current && scrollContainerRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  if (!isLyricsOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setLyricsInputText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveLyrics = async () => {
    if (!currentSong) return;
    setIsSaving(true);
    try {
      const updated = await updateLyrics(currentSong._id, {
        rawText: lyricsInputText,
      });
      refreshSong(updated);
      setIsImportModalOpen(false);
      showNotification('Lyrics updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to update lyrics:', err);
      showNotification('Failed to update lyrics', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLyrics = async () => {
    if (!currentSong) return;
    try {
      const updated = await deleteLyrics(currentSong._id);
      refreshSong(updated);
      setIsDeleteConfirmOpen(false);
      showNotification('Lyrics deleted', 'info');
    } catch (err) {
      console.error('Failed to delete lyrics:', err);
      showNotification('Failed to delete lyrics', 'error');
    }
  };

  const openImportModal = () => {
    setLyricsInputText(lyrics.text || '');
    setIsImportModalOpen(true);
  };

  return (
    <>
      <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[480px] bg-surface border-l border-border shadow-2xl flex flex-col animate-slideLeft">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-black/5 text-black">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-neutral-900 text-base">Lyrics</h2>
                {lyrics.isSynced && (
                  <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-black/5 text-black border border-black/15">
                    <Sparkles className="w-3 h-3" /> Synced
                  </span>
                )}
              </div>
              <p className="text-xs text-muted truncate">{currentSong?.title || 'No song selected'}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {currentSong && (
              <>
                <button
                  onClick={openImportModal}
                  className="p-2 text-muted hover:text-black hover:bg-surface-hover rounded-lg transition-colors text-xs flex items-center gap-1"
                  title={hasLyrics ? 'Edit Lyrics' : 'Import Lyrics'}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {hasLyrics && (
                  <button
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="p-2 text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors text-xs"
                    title="Remove Lyrics"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => setIsLyricsOpen(false)}
              className="p-2 text-muted hover:text-black hover:bg-surface-hover rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 flex flex-col justify-start"
        >
          {!currentSong ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted">
              <Music2 className="w-12 h-12 mb-3 stroke-[1.2]" />
              <p className="text-sm">Select and play a song to view lyrics.</p>
            </div>
          ) : !hasLyrics ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border rounded-2xl bg-slate-50/50">
              <div className="p-4 rounded-full bg-slate-100 text-black mb-3">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-neutral-900 mb-1">No Lyrics Available</h3>
              <p className="text-xs text-muted max-w-xs mb-5 leading-relaxed">
                Import synchronized (.lrc) or plain text (.txt) lyrics to follow along with this track.
              </p>
              <button
                onClick={openImportModal}
                className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl shadow-md shadow-black/15 transition-all flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Import Lyrics
              </button>
            </div>
          ) : lyrics.isSynced ? (
            /* Synchronized lyrics */
            <div className="space-y-6 py-12">
              {lyrics.syncedLyrics.map((line, idx) => {
                const isActive = idx === activeIndex;
                const isPast = idx < activeIndex;
                return (
                  <p
                    key={idx}
                    ref={isActive ? activeLyricRef : null}
                    onClick={() => seek(line.time)}
                    className={`cursor-pointer transition-all duration-300 font-medium text-left select-none ${
                      isActive
                        ? 'text-black text-2xl font-extrabold scale-[1.03] pl-2 border-l-2 border-black'
                        : isPast
                        ? 'text-neutral-500 text-lg hover:text-black'
                        : 'text-neutral-400 text-lg hover:text-black'
                    }`}
                  >
                    {line.text || '♪'}
                  </p>
                );
              })}
            </div>
          ) : (
            /* Plain unsynced lyrics */
            <div className="whitespace-pre-line text-neutral-800 text-base leading-relaxed tracking-wide select-text">
              {lyrics.text}
            </div>
          )}
        </div>
      </div>

      {/* Import / Edit Lyrics Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg p-6 bg-surface border border-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-black" />
                <h3 className="font-bold text-neutral-900 text-base">
                  {hasLyrics ? 'Edit Lyrics' : 'Import Lyrics'}
                </h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 text-muted hover:text-black rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 flex-1 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">
                  Supports plain text or synchronized .lrc format
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs font-semibold text-black hover:underline flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload .lrc / .txt
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".lrc,.txt,text/plain"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              <textarea
                value={lyricsInputText}
                onChange={(e) => setLyricsInputText(e.target.value)}
                placeholder="Paste lyrics or timestamps here... e.g.&#10;[00:12.50]First line of song&#10;[00:16.80]Second line of song"
                rows={12}
                className="w-full flex-1 p-3 bg-slate-50 border border-border rounded-xl text-neutral-900 text-xs font-mono focus:outline-none focus:border-black transition-colors resize-none"
              />
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-700 hover:text-black rounded-xl border border-border"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLyrics}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-black hover:bg-neutral-800 text-white transition-all flex items-center gap-1.5 shadow-md shadow-black/15"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Save Lyrics
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Remove Lyrics"
        message="Are you sure you want to remove lyrics for this song?"
        confirmText="Remove"
        onConfirm={handleDeleteLyrics}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </>
  );
}

