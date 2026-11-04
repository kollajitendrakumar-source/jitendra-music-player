import React, { useState, useEffect } from 'react';
import {
  Search,
  Music,
  Users,
  Disc,
  ListMusic,
  Play,
  Loader2,
  Globe,
  X,
  Sparkles,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { getArtworkUrl } from '../utils/formatters';
import { getSongs, deleteSong } from '../services/api';
import SongRow from '../components/SongRow';
import PlaylistCard from '../components/PlaylistCard';
import EditSongModal from '../components/EditSongModal';
import AddToPlaylistModal from '../components/AddToPlaylistModal';
import ConfirmDialog from '../components/ConfirmDialog';

const LANGUAGE_CARDS = [
  { name: 'Telugu', bg: 'from-amber-600 via-orange-600 to-rose-700', subtitle: 'Tollywood Hits & Melodies' },
  { name: 'Hindi', bg: 'from-rose-600 via-pink-600 to-indigo-800', subtitle: 'Bollywood & Hindi Pop' },
  { name: 'Tamil', bg: 'from-blue-600 via-indigo-600 to-violet-800', subtitle: 'Kollywood Beats & Classics' },
  { name: 'English', bg: 'from-emerald-600 via-teal-600 to-cyan-800', subtitle: 'Pop, Rock & Global Hits' },
  { name: 'Malayalam', bg: 'from-teal-600 via-emerald-700 to-emerald-950', subtitle: 'Mollywood Melodies' },
  { name: 'Kannada', bg: 'from-amber-600 via-yellow-600 to-orange-800', subtitle: 'Sandalwood Tracks' },
  { name: 'Punjabi', bg: 'from-fuchsia-600 via-purple-600 to-indigo-900', subtitle: 'Bhangra & Punjabi Beats' },
  { name: 'Spanish', bg: 'from-red-600 via-rose-600 to-amber-700', subtitle: 'Latino & Reggaeton' },
  { name: 'Korean', bg: 'from-pink-600 via-purple-600 to-rose-900', subtitle: 'K-Pop Trends' },
];

export default function SearchPage({
  searchQuery,
  searchResults,
  loading,
  selectedLanguage,
  onSelectLanguage,
  onSelectArtist,
  onSelectAlbum,
  onSelectPlaylist,
}) {
  const { playSong } = usePlayer();

  const [languageSongs, setLanguageSongs] = useState([]);
  const [langLoading, setLangLoading] = useState(false);
  const [selectedSongForEdit, setSelectedSongForEdit] = useState(null);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState(null);
  const [songToDelete, setSongToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSongDeleted = (deletedId) => {
    setLanguageSongs((prev) => prev.filter((s) => s._id !== deletedId));
  };

  const handleSongUpdated = (updated) => {
    setLanguageSongs((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
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

  // Fetch songs for selected language
  useEffect(() => {
    if (selectedLanguage) {
      setLangLoading(true);
      getSongs({ language: selectedLanguage })
        .then((data) => setLanguageSongs(data))
        .catch(() => setLanguageSongs([]))
        .finally(() => setLangLoading(false));
    } else {
      setLanguageSongs([]);
    }
  }, [selectedLanguage]);

  const { songs = [], artists = [], albums = [], playlists = [] } = searchResults || {};
  const hasSearchResults =
    songs.length > 0 || artists.length > 0 || albums.length > 0 || playlists.length > 0;

  if (loading || langLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-black mb-2" />
        <span className="text-xs">
          {langLoading ? `Loading ${selectedLanguage} songs...` : 'Searching library...'}
        </span>
      </div>
    );
  }

  // If a language category is selected and no custom search query
  if (selectedLanguage && !searchQuery?.trim()) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        {/* Language Category Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-white via-slate-50 to-white border border-border p-6 sm:p-8 flex items-center justify-between shadow-xs">
          <div className="space-y-1.5 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 text-black text-xs font-bold uppercase tracking-wider border border-black/15">
              <Globe className="w-3.5 h-3.5 text-black" />
              Language Category
            </div>
            <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
              {selectedLanguage} Music
            </h2>
            <p className="text-xs text-muted">
              {languageSongs.length} {languageSongs.length === 1 ? 'song' : 'songs'} in your library
            </p>
          </div>

          <button
            onClick={() => onSelectLanguage(null)}
            className="z-10 px-3.5 py-1.5 rounded-xl bg-surface hover:bg-surface-hover text-neutral-700 hover:text-black text-xs border border-border flex items-center gap-1.5 shadow-xs"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Filter</span>
          </button>
        </div>

        {/* Songs in this language */}
        <div className="rounded-2xl bg-surface border border-border p-2 shadow-xs">
          {languageSongs.length === 0 ? (
            <div className="py-16 text-center text-muted p-6">
              <Music className="w-10 h-10 text-muted mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-neutral-800">
                No {selectedLanguage} songs found yet
              </p>
              <p className="text-xs text-muted mt-1">
                Upload {selectedLanguage} tracks or edit existing song details to assign them to {selectedLanguage}.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {languageSongs.map((song, idx) => (
                <SongRow
                  key={song._id}
                  song={song}
                  index={idx}
                  songs={languageSongs}
                  onEdit={(s) => setSelectedSongForEdit(s)}
                  onAddToPlaylist={(s) => setSelectedSongForPlaylist(s)}
                  onDelete={(s) => setSongToDelete(s)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // If no search query: Show Language Categories Grid
  if (!searchQuery?.trim()) {
    return (
      <div className="space-y-8 animate-fadeIn pb-12">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Globe className="w-6 h-6 text-black" />
            Browse by Language
          </h2>
          <p className="text-xs text-muted mt-1">
            Explore your music collection categorized by regional and global languages.
          </p>
        </div>

        {/* Language Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {LANGUAGE_CARDS.map((cat) => (
            <div
              key={cat.name}
              onClick={() => onSelectLanguage(cat.name)}
              className={`group relative h-36 rounded-2xl p-4 bg-gradient-to-br ${cat.bg} cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden flex flex-col justify-between`}
            >
              <div>
                <h3 className="text-lg font-extrabold text-white tracking-tight drop-shadow-sm">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5 font-medium">
                  {cat.subtitle}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-black/30 text-white backdrop-blur-sm">
                  Category
                </span>
                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                  <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                </div>
              </div>

              {/* Decorative background glow */}
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If no search results found
  if (!hasSearchResults) {
    return (
      <div className="py-20 text-center p-6 border border-dashed border-border rounded-3xl bg-slate-50/50">
        <p className="text-sm font-semibold text-neutral-800">
          No matches found for "{searchQuery}"
        </p>
        <p className="text-xs text-muted mt-1">
          Try searching for another song title, artist, album, or language.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <div className="border-b border-border pb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
          Search results for <span className="text-black font-extrabold">"{searchQuery}"</span>
        </h2>
        {selectedLanguage && (
          <span className="text-xs bg-black/5 text-black px-2.5 py-1 rounded-full border border-black/15 flex items-center gap-1 font-bold">
            <Globe className="w-3 h-3 text-black" />
            {selectedLanguage}
          </span>
        )}
      </div>

      {/* Matching Songs */}
      {songs.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-black" />
            <h3 className="text-base font-bold text-neutral-900">Songs ({songs.length})</h3>
          </div>
          <div className="rounded-2xl bg-surface border border-border p-2 shadow-xs">
            <div className="divide-y divide-border">
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
          </div>
        </section>
      )}

      {/* Matching Artists */}
      {artists.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-black" />
            <h3 className="text-base font-bold text-neutral-900">Artists ({artists.length})</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {artists.map((artist, idx) => (
              <div
                key={idx}
                onClick={() => onSelectArtist(artist.name)}
                className="group p-3.5 rounded-2xl bg-surface hover:bg-slate-50 border border-border hover:border-slate-300 transition-all cursor-pointer flex flex-col items-center text-center shadow-xs"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-active mb-3 border border-border">
                  <img
                    src={getArtworkUrl(artist.artworkPath)}
                    alt={artist.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="font-semibold text-xs text-neutral-900 truncate w-full group-hover:text-black">
                  {artist.name}
                </div>
                <div className="text-[11px] text-muted mt-0.5">
                  {artist.songCount} {artist.songCount === 1 ? 'song' : 'songs'}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Matching Albums */}
      {albums.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Disc className="w-4 h-4 text-black" />
            <h3 className="text-base font-bold text-neutral-900">Albums ({albums.length})</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {albums.map((album, idx) => (
              <div
                key={idx}
                onClick={() => onSelectAlbum(album.name)}
                className="group p-3 rounded-2xl bg-surface hover:bg-slate-50 border border-border hover:border-slate-300 transition-all cursor-pointer flex flex-col shadow-xs"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-surface-active mb-2.5">
                  <img
                    src={getArtworkUrl(album.artworkPath)}
                    alt={album.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="font-semibold text-xs text-neutral-900 truncate group-hover:text-black">
                  {album.name}
                </div>
                <div className="text-[11px] text-muted truncate mt-0.5">{album.artist}</div>
                <div className="text-[10px] text-neutral-500 mt-0.5 font-mono">
                  {album.songCount} songs
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Matching Playlists */}
      {playlists.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-black" />
            <h3 className="text-base font-bold text-neutral-900">Playlists ({playlists.length})</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {playlists.map((pl) => (
              <PlaylistCard
                key={pl._id}
                playlist={pl}
                onClick={() => onSelectPlaylist(pl._id)}
              />
            ))}
          </div>
        </section>
      )}

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
