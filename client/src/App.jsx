import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Upload,
  Keyboard,
  X,
  Menu,
  CheckCircle,
  AlertCircle,
  Info,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import Sidebar from './components/Sidebar';
import MusicPlayer from './components/MusicPlayer';
import LyricsPanel from './components/LyricsPanel';
import QueueDrawer from './components/QueueDrawer';
import UploadModal from './components/UploadModal';
import SongDetailsModal from './components/SongDetailsModal';
import EditSongModal from './components/EditSongModal';

import Home from './pages/Home';
import Library from './pages/Library';
import Favorites from './pages/Favorites';
import Playlists from './pages/Playlists';
import PlaylistDetails from './pages/PlaylistDetails';
import SearchPage from './pages/SearchPage';
import { searchAll } from './services/api';

function MainApp() {
  const {
    isUploadOpen,
    setIsUploadOpen,
    notification,
    detailsSong,
    isDetailsOpen,
    closeSongDetails,
  } = usePlayer();

  const [activeTab, setActiveTab] = useState('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [keyboardModalOpen, setKeyboardModalOpen] = useState(false);
  const [songToEdit, setSongToEdit] = useState(null);

  // Language categories toggle state
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  // Global search state
  const [globalSearchInput, setGlobalSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (!globalSearchInput.trim()) {
      if (activeTab === 'search') {
        setActiveTab('home');
      }
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    if (activeTab !== 'search') {
      setActiveTab('search');
    }

    setIsSearching(true);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchAll(globalSearchInput.trim());
        setSearchResults(results);
      } catch (err) {
        console.error('Search query failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [globalSearchInput]);

  const handleSelectArtist = (artistName) => {
    setGlobalSearchInput('');
    setActiveTab('library');
  };

  const handleSelectAlbum = (albumName) => {
    setGlobalSearchInput('');
    setActiveTab('library');
  };

  const handleSelectPlaylist = (playlistId) => {
    setSelectedPlaylistId(playlistId);
    setActiveTab('playlist-details');
    setGlobalSearchInput('');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-neutral-100 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface border border-border shadow-2xl text-xs font-medium animate-slideDown">
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : (
            <Info className="w-4 h-4 text-accent" />
          )}
          <span className="text-neutral-200">{notification.message}</span>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className="hidden md:block h-full flex-shrink-0">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedPlaylistId={selectedPlaylistId}
            setSelectedPlaylistId={setSelectedPlaylistId}
          />
        </div>

        {/* Mobile Sidebar Backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/70 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-64 h-full bg-surface"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar
                activeTab={activeTab}
                setActiveTab={(tab) => {
                  setActiveTab(tab);
                  setMobileMenuOpen(false);
                }}
                selectedPlaylistId={selectedPlaylistId}
                setSelectedPlaylistId={(id) => {
                  setSelectedPlaylistId(id);
                  setMobileMenuOpen(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Content Viewport */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
          {/* Header Navigation Bar */}
          <header className="h-16 border-b border-border/80 px-6 flex items-center justify-between gap-4 bg-background/95 backdrop-blur-md z-20">
            <div className="flex items-center gap-3 flex-1 max-w-xl">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 text-muted hover:text-black rounded-lg hover:bg-surface-hover"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Global Search Bar with Language Toggle */}
              <div className="flex items-center gap-2 w-full">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="What do you want to play? (Search songs, artists, albums, playlists)"
                    value={globalSearchInput}
                    onChange={(e) => setGlobalSearchInput(e.target.value)}
                    onFocus={() => {
                      if (!globalSearchInput && activeTab !== 'search') {
                        setActiveTab('search');
                      }
                    }}
                    className="w-full pl-9 pr-8 py-2 bg-surface border border-border rounded-xl text-neutral-900 text-xs placeholder-muted focus:outline-none focus:border-black transition-colors shadow-sm"
                  />
                  {globalSearchInput && (
                    <button
                      onClick={() => setGlobalSearchInput('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-black p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Language Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border flex-shrink-0 select-none ${
                    selectedLanguage
                      ? 'bg-black text-white border-black shadow-sm'
                      : isLanguageOpen
                      ? 'bg-surface-active text-black border-border'
                      : 'bg-surface hover:bg-surface-hover text-neutral-700 hover:text-black border-border shadow-xs'
                  }`}
                  title="Toggle Language Categories"
                >
                  <Globe className={`w-3.5 h-3.5 ${selectedLanguage ? 'text-white' : 'text-neutral-500'}`} />
                  <span>{selectedLanguage || 'Languages'}</span>
                  {selectedLanguage ? (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLanguage(null);
                      }}
                      className="p-0.5 hover:bg-white/20 rounded-full ml-0.5"
                      title="Clear language filter"
                    >
                      <X className="w-3 h-3 text-white" />
                    </span>
                  ) : (
                    <ChevronDown
                      className={`w-3 h-3 text-muted transition-transform duration-200 ${
                        isLanguageOpen ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>
              </div>
            </div>

            {/* Right Header Controls */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                onClick={() => setKeyboardModalOpen(true)}
                className="p-2 text-muted hover:text-black hover:bg-surface-hover rounded-xl border border-border transition-colors shadow-xs"
                title="Keyboard Shortcuts"
              >
                <Keyboard className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white font-semibold text-xs shadow-md shadow-black/10 transition-all flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Music</span>
              </button>
            </div>
          </header>

          {/* Expandable Language Categories Bar */}
          {isLanguageOpen && (
            <div className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-100/90 border-b border-border overflow-x-auto animate-slideDown z-10 flex-shrink-0">
              <span className="text-[11px] font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5 mr-2 flex-shrink-0">
                <Globe className="w-3.5 h-3.5 text-black" /> Categories:
              </span>
              {['All', 'Telugu', 'Hindi', 'Tamil', 'English', 'Malayalam', 'Kannada', 'Punjabi', 'Spanish', 'Korean'].map((lang) => {
                const isAll = lang === 'All';
                const isSelected = isAll ? !selectedLanguage : selectedLanguage?.toLowerCase() === lang.toLowerCase();
                return (
                  <button
                    key={lang}
                    onClick={() => {
                      const nextLang = isAll ? null : lang;
                      setSelectedLanguage(nextLang);
                      if (activeTab !== 'search' && activeTab !== 'library') {
                        setActiveTab('search');
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 border ${
                      isSelected
                        ? 'bg-black text-white font-semibold border-black shadow-sm'
                        : 'bg-surface hover:bg-surface-hover text-neutral-700 hover:text-black border-border shadow-xs'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          )}

          {/* Page Content Container */}
          <main className="flex-1 overflow-y-auto px-6 py-6">
            {activeTab === 'home' && (
              <Home onNavigate={(tab) => setActiveTab(tab)} />
            )}

            {activeTab === 'library' && (
              <Library initialLanguage={selectedLanguage || ''} />
            )}

            {activeTab === 'favorites' && <Favorites />}

            {activeTab === 'playlists' && (
              <Playlists onSelectPlaylist={handleSelectPlaylist} />
            )}

            {activeTab === 'playlist-details' && selectedPlaylistId && (
              <PlaylistDetails
                playlistId={selectedPlaylistId}
                onBack={() => setActiveTab('playlists')}
                onDeleted={() => {
                  setSelectedPlaylistId(null);
                  setActiveTab('playlists');
                }}
              />
            )}

            {activeTab === 'search' && (
              <SearchPage
                searchQuery={globalSearchInput}
                searchResults={searchResults}
                loading={isSearching}
                selectedLanguage={selectedLanguage}
                onSelectLanguage={setSelectedLanguage}
                onSelectArtist={handleSelectArtist}
                onSelectAlbum={handleSelectAlbum}
                onSelectPlaylist={handleSelectPlaylist}
              />
            )}
          </main>
        </div>

        {/* Slide-over Drawers */}
        <LyricsPanel />
        <QueueDrawer />
      </div>

      {/* Persistent Bottom Audio Player */}
      <MusicPlayer />

      {/* Upload Music Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {}}
      />

      {/* Song Information & Credits Modal */}
      <SongDetailsModal
        isOpen={isDetailsOpen}
        song={detailsSong}
        onClose={closeSongDetails}
        onEditSong={(song) => setSongToEdit(song)}
      />

      {/* Global Edit Song Details Modal */}
      <EditSongModal
        isOpen={Boolean(songToEdit)}
        song={songToEdit}
        onClose={() => setSongToEdit(null)}
      />

      {/* Keyboard Shortcuts Modal */}
      {keyboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm p-6 bg-surface border border-border rounded-2xl shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-black" />
                <h3 className="font-bold text-neutral-900 text-sm">Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={() => setKeyboardModalOpen(false)}
                className="p-1 text-muted hover:text-black rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border">
                <span className="text-neutral-700 font-medium">Play / Pause</span>
                <kbd className="px-2 py-1 bg-surface-hover border border-border rounded text-[11px] font-mono text-black font-bold">
                  Space
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border">
                <span className="text-neutral-700 font-medium">Seek Backward 5s</span>
                <kbd className="px-2 py-1 bg-surface-hover border border-border rounded text-[11px] font-mono text-neutral-800">
                  Left Arrow
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border">
                <span className="text-neutral-700 font-medium">Seek Forward 5s</span>
                <kbd className="px-2 py-1 bg-surface-hover border border-border rounded text-[11px] font-mono text-neutral-800">
                  Right Arrow
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border">
                <span className="text-neutral-700 font-medium">Previous Song</span>
                <kbd className="px-2 py-1 bg-surface-hover border border-border rounded text-[11px] font-mono text-neutral-800">
                  Ctrl + Left
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border">
                <span className="text-neutral-700 font-medium">Next Song</span>
                <kbd className="px-2 py-1 bg-surface-hover border border-border rounded text-[11px] font-mono text-neutral-800">
                  Ctrl + Right
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border">
                <span className="text-neutral-700 font-medium">Mute / Unmute</span>
                <kbd className="px-2 py-1 bg-surface-hover border border-border rounded text-[11px] font-mono text-neutral-800">
                  M
                </kbd>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border flex justify-end">
              <button
                onClick={() => setKeyboardModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <MainApp />
    </PlayerProvider>
  );
}
