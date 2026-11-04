import React, { useState, useEffect } from 'react';
import {
  Home,
  Compass,
  Heart,
  ListMusic,
  PlusCircle,
  Disc3,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { getPlaylists } from '../services/api';

export default function Sidebar({
  activeTab,
  setActiveTab,
  selectedPlaylistId,
  setSelectedPlaylistId,
}) {
  const { setIsUploadOpen } = usePlayer();
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    getPlaylists()
      .then((data) => setPlaylists(data))
      .catch(() => {});
  }, [activeTab]);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'library', label: 'Your Library', icon: Compass },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
  ];

  return (
    <aside className="w-64 h-full bg-surface border-r border-border flex flex-col select-none">
      {/* Top Section */}
      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center text-white shadow-md shadow-black/15">
            <Disc3 className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h1 className="font-bold text-neutral-900 text-lg tracking-tight">
              Localify
            </h1>
            <p className="text-[11px] text-muted">Personal Music Library</p>
          </div>
        </div>

        {/* Add Music Action */}
        <button
          onClick={() => setIsUploadOpen(true)}
          className="w-full py-2.5 px-4 bg-black hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl shadow-md shadow-black/10 transition-all flex items-center justify-center gap-2 group"
        >
          <PlusCircle className="w-4 h-4 transition-transform group-hover:scale-110" />
          <span>Add Music</span>
        </button>

        {/* Navigation */}
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
            Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSelectedPlaylistId(null);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-black text-white font-semibold shadow-sm'
                    : 'text-neutral-600 hover:text-black hover:bg-surface-hover'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Playlists Quick List */}
        <div className="pt-2">
          <div className="flex items-center justify-between px-3 text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
            <span>Playlists</span>
            <span className="text-neutral-500 font-mono">{playlists.length}</span>
          </div>

          <div className="space-y-0.5 max-h-56 overflow-y-auto pr-1">
            {playlists.length === 0 ? (
              <p className="px-3 text-xs text-neutral-400 italic">No playlists yet</p>
            ) : (
              playlists.map((pl) => {
                const isSelected = activeTab === 'playlist-details' && selectedPlaylistId === pl._id;
                return (
                  <button
                    key={pl._id}
                    onClick={() => {
                      setSelectedPlaylistId(pl._id);
                      setActiveTab('playlist-details');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs truncate transition-all text-left ${
                      isSelected
                        ? 'bg-surface-active text-black font-semibold'
                        : 'text-neutral-600 hover:text-black hover:bg-surface-hover'
                    }`}
                  >
                    <span className="truncate">{pl.name}</span>
                    <span className="text-[10px] text-neutral-400 ml-1">
                      {pl.songs?.length || 0}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

