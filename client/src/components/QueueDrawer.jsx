import React from 'react';
import { ListMusic, X, Trash2, Play, Volume2, MoveUp, MoveDown } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { getArtworkUrl, formatTime } from '../utils/formatters';

export default function QueueDrawer() {
  const {
    isQueueOpen,
    setIsQueueOpen,
    queue,
    queueIndex,
    currentSong,
    isPlaying,
    playSong,
    removeFromQueue,
    clearQueue,
    reorderQueue,
  } = usePlayer();

  if (!isQueueOpen) return null;

  const handleMove = (index, direction) => {
    const newQueue = [...queue];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= newQueue.length) return;

    const [moved] = newQueue.splice(index, 1);
    newQueue.splice(targetIdx, 0, moved);
    reorderQueue(newQueue);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-surface border-l border-border shadow-2xl flex flex-col animate-slideLeft">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ListMusic className="w-5 h-5 text-black" />
          <h2 className="font-bold text-neutral-900 text-base">Play Queue</h2>
          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-neutral-800 border border-border font-semibold">
            {queue.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              className="p-1.5 text-xs text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 font-medium"
              title="Clear queue"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
          <button
            onClick={() => setIsQueueOpen(false)}
            className="p-1.5 text-muted hover:text-black hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Currently Playing */}
        {currentSong && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
              Now Playing
            </h3>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-border shadow-xs">
              <img
                src={getArtworkUrl(currentSong.artworkPath)}
                alt={currentSong.title}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-neutral-900 truncate flex items-center gap-1.5">
                  {currentSong.title}
                  {isPlaying && (
                    <span className="flex items-center gap-0.5 ml-1">
                      <span className="w-1 h-3 bg-black animate-pulse rounded-full" />
                      <span className="w-1 h-4 bg-black animate-pulse delay-75 rounded-full" />
                      <span className="w-1 h-2 bg-black animate-pulse delay-150 rounded-full" />
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted truncate">{currentSong.artist}</div>
              </div>
              <div className="text-xs text-neutral-500 font-mono">
                {formatTime(currentSong.duration)}
              </div>
            </div>
          </div>
        )}

        {/* Up Next List */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
            Next Up
          </h3>

          {queue.length === 0 ? (
            <div className="text-center py-10 text-muted text-sm border border-dashed border-border rounded-xl">
              Queue is empty. Add songs from your library!
            </div>
          ) : (
            <div className="space-y-1.5">
              {queue.map((song, idx) => {
                const isCurrent = idx === queueIndex;
                return (
                  <div
                    key={`${song._id}-${idx}`}
                    className={`group flex items-center justify-between p-2 rounded-xl border text-sm transition-all ${
                      isCurrent
                        ? 'bg-slate-100 border-black/20 text-neutral-900 shadow-2xs'
                        : 'bg-surface hover:bg-slate-50 border-border text-neutral-800'
                    }`}
                  >
                    <div
                      className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                      onClick={() => playSong(song, queue, idx)}
                    >
                      <div className="relative w-9 h-9 flex-shrink-0 rounded-md overflow-hidden bg-slate-100">
                        <img
                          src={getArtworkUrl(song.artworkPath)}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-xs font-semibold truncate ${
                            isCurrent ? 'text-black font-bold' : 'text-neutral-900'
                          }`}
                        >
                          {song.title}
                        </div>
                        <div className="text-[11px] text-muted truncate">{song.artist}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-2 opacity-80 group-hover:opacity-100">
                      <span className="text-[11px] text-muted font-mono mr-1">
                        {formatTime(song.duration)}
                      </span>

                      {/* Reorder buttons */}
                      <button
                        onClick={() => handleMove(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 text-muted hover:text-black disabled:opacity-20 hover:bg-slate-200 rounded"
                        title="Move Up"
                      >
                        <MoveUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMove(idx, 1)}
                        disabled={idx === queue.length - 1}
                        className="p-1 text-muted hover:text-black disabled:opacity-20 hover:bg-slate-200 rounded"
                        title="Move Down"
                      >
                        <MoveDown className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => removeFromQueue(idx)}
                        className="p-1 text-muted hover:text-red-600 hover:bg-red-50 rounded ml-0.5"
                        title="Remove from queue"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

