import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Play,
  Shuffle,
  Music,
  Upload,
  X,
} from 'lucide-react';
import { getSongs } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { formatDuration } from '../utils/formatters';
import SongList from '../components/SongList';

export default function Library({ initialLanguage = '' }) {
  const { playSong, setIsUploadOpen } = usePlayer();

  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('dateAdded');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedArtist, setSelectedArtist] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);

  useEffect(() => {
    if (initialLanguage) setSelectedLanguage(initialLanguage);
  }, [initialLanguage]);

  const fetchLibrarySongs = async () => {
    setLoading(true);
    try {
      const data = await getSongs({
        sort: sortBy,
        order: sortOrder,
        artist: selectedArtist || undefined,
        album: selectedAlbum || undefined,
        genre: selectedGenre || undefined,
        language: selectedLanguage || undefined,
      });
      setSongs(data);
    } catch (err) {
      console.error('Failed to load library songs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrarySongs();
  }, [sortBy, sortOrder, selectedArtist, selectedAlbum, selectedGenre, selectedLanguage]);

  // Client-side search query filtering
  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return songs;
    const q = searchQuery.toLowerCase().trim();
    return songs.filter(
      (s) =>
        s.title?.toLowerCase().includes(q) ||
        s.artist?.toLowerCase().includes(q) ||
        s.album?.toLowerCase().includes(q) ||
        s.genre?.toLowerCase().includes(q) ||
        s.language?.toLowerCase().includes(q)
    );
  }, [songs, searchQuery]);

  // Unique filter lists
  const artists = useMemo(() => {
    const list = new Set();
    songs.forEach((s) => s.artist && list.add(s.artist));
    return Array.from(list).sort();
  }, [songs]);

  const albums = useMemo(() => {
    const list = new Set();
    songs.forEach((s) => s.album && list.add(s.album));
    return Array.from(list).sort();
  }, [songs]);

  const genres = useMemo(() => {
    const list = new Set();
    songs.forEach((s) => s.genre && s.genre !== 'Unknown' && list.add(s.genre));
    return Array.from(list).sort();
  }, [songs]);

  const languages = useMemo(() => {
    const list = new Set();
    songs.forEach((s) => s.language && list.add(s.language));
    return Array.from(list).sort();
  }, [songs]);

  const totalDuration = useMemo(() => {
    return filteredSongs.reduce((acc, s) => acc + (s.duration || 0), 0);
  }, [filteredSongs]);

  const handlePlayAll = () => {
    if (filteredSongs.length > 0) {
      playSong(filteredSongs[0], filteredSongs, 0);
    }
  };

  const handleShuffleAll = () => {
    if (filteredSongs.length > 0) {
      const randomIdx = Math.floor(Math.random() * filteredSongs.length);
      playSong(filteredSongs[randomIdx], filteredSongs, randomIdx);
    }
  };

  const handleSongDeleted = (deletedId) => {
    setSongs((prev) => prev.filter((s) => s._id !== deletedId));
  };

  const handleSongUpdated = (updated) => {
    setSongs((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
  };

  const hasActiveFilters = Boolean(
    selectedArtist || selectedAlbum || selectedGenre || selectedLanguage || searchQuery
  );

  const clearFilters = () => {
    setSelectedArtist('');
    setSelectedAlbum('');
    setSelectedGenre('');
    setSelectedLanguage('');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Your Library</h2>
          <p className="text-xs text-muted mt-0.5">
            {filteredSongs.length} {filteredSongs.length === 1 ? 'song' : 'songs'} •{' '}
            {formatDuration(totalDuration)}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {filteredSongs.length > 0 && (
            <>
              <button
                onClick={handlePlayAll}
                className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-md shadow-black/15"
              >
                <Play className="w-3.5 h-3.5 fill-white text-white" /> Play All
              </button>
              <button
                onClick={handleShuffleAll}
                className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-hover text-neutral-800 font-medium text-xs border border-border transition-all flex items-center gap-2 shadow-xs"
              >
                <Shuffle className="w-3.5 h-3.5" /> Shuffle
              </button>
            </>
          )}

          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2 rounded-xl bg-surface border border-border text-neutral-800 hover:text-black hover:bg-surface-hover font-medium text-xs transition-all flex items-center gap-2 shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" /> Add Music
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-border space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, artist, album, genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-border rounded-xl text-neutral-900 text-xs placeholder-muted focus:outline-none focus:border-black transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-black"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-border rounded-xl text-neutral-800 text-xs focus:outline-none focus:border-black transition-colors cursor-pointer"
              >
                <option value="dateAdded">Date Added</option>
                <option value="title">Title</option>
                <option value="artist">Artist</option>
                <option value="album">Album</option>
                <option value="duration">Duration</option>
                <option value="playCount">Play Count</option>
              </select>
            </div>

            <button
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 rounded-xl bg-slate-50 border border-border text-muted hover:text-black transition-colors"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border text-xs">
          <div className="flex items-center gap-1.5 text-muted mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Artist Filter */}
          <select
            value={selectedArtist}
            onChange={(e) => setSelectedArtist(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-border rounded-lg text-neutral-800 text-xs focus:outline-none focus:border-black cursor-pointer"
          >
            <option value="">All Artists</option>
            {artists.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          {/* Album Filter */}
          <select
            value={selectedAlbum}
            onChange={(e) => setSelectedAlbum(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-border rounded-lg text-neutral-800 text-xs focus:outline-none focus:border-black cursor-pointer"
          >
            <option value="">All Albums</option>
            {albums.map((al) => (
              <option key={al} value={al}>
                {al}
              </option>
            ))}
          </select>

          {/* Language Filter */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-border rounded-lg text-neutral-800 text-xs focus:outline-none focus:border-black cursor-pointer"
          >
            <option value="">All Languages</option>
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          {/* Genre Filter */}
          {genres.length > 0 && (
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-border rounded-lg text-neutral-800 text-xs focus:outline-none focus:border-black cursor-pointer"
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-2.5 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-auto font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Song List */}
      <div className="rounded-2xl bg-surface border border-border p-2 shadow-xs">
        <SongList
          songs={filteredSongs}
          loading={loading}
          emptyMessage={
            hasActiveFilters
              ? 'No songs match your search or filters.'
              : 'Your music library is empty. Upload your first songs!'
          }
          onSongDeleted={handleSongDeleted}
          onSongUpdated={handleSongUpdated}
        />
      </div>
    </div>
  );
}

