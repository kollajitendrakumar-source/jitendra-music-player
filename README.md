# Localify - Minimal MERN Music Player

Localify is a modern, minimal, and fully functional personal music player web application built with the MERN stack. It runs locally on your computer with zero cloud dependency: all your audio files, metadata, playlists, favorites, and lyrics are stored locally and in a local MongoDB database.

---

## Features

- **Personal Music Library & Uploads**
  - Drag-and-drop or file picker for multiple audio tracks.
  - Supported formats: **MP3, WAV, FLAC, M4A, AAC, OGG**.
  - Automatic embedded metadata extraction via `music-metadata` (Title, Artist, Album, Album Artist, Genre, Year, Track #, Duration, Format).
  - Extracts and stores embedded album artwork locally.
  - SHA-256 file hash deduplication prevents uploading identical songs twice.
  - Manual metadata editing (Title, Artist, Album, Genre, Year, Track #).

- **High-Fidelity Audio Playback**
  - Centralized single-instance HTML5 Audio player.
  - HTTP Range Request streaming (`Accept-Ranges: bytes`, status `206 Partial Content`) for instant seeking and scrubbing.
  - Play, Pause, Next, Previous, Volume, and Mute controls.
  - Shuffle and Repeat modes (`none`, `all`, `one`).
  - Persistent bottom player bar across navigation.
  - Mini Player mode: minimize player to a compact floating widget while playback continues.

- **Synchronized Lyrics (.lrc & .txt)**
  - Import lyrics from `.lrc` or `.txt` files or paste directly.
  - Synchronized auto-scroll: active lyric line is highlighted and centered as playback advances.
  - Interactive scrubbing: click any lyric line to jump playback directly to that timestamp.
  - Edit or delete imported lyrics at any time.

- **Playlists & Favorites**
  - Create, rename, and delete custom playlists.
  - Dynamic playlist cover using the first song's album artwork.
  - Reorder songs inside playlists with move up/down controls.
  - Add or remove tracks to/from playlists easily.
  - Favorite tracks with persistent `isFavorite` flag stored in MongoDB.
  - Dedicated "Favorites" page with one-click "Play All" and "Shuffle".

- **Global Search & Sorting**
  - Instant debounced global search across songs, artists, albums, and playlists.
  - Case-insensitive regex search powered directly by MongoDB.
  - Sort library by Date Added, Title, Artist, Album, Duration, or Play Count (ascending/descending).
  - Filter library by Artist, Album, and Genre dropdowns.

- **User Authentication (Sign Up & Log In)**
  - Full JWT-based local authentication.
  - User registration (`POST /api/auth/signup`) and secure login (`POST /api/auth/login`).
  - Passwords securely hashed with `bcryptjs`.
  - Profile management modal to update name, email, or password.
  - User profile menu in top navigation bar and sidebar showing active user initials and name.
  - "Quick Demo Fill" button on login/signup forms for instant local testing.

- **Queue & History**
  - Dynamic play queue drawer: view up next, reorder tracks, play next, clear queue.
  - Tracks listening history and records song play counts.
  - Real-time library statistics (Total Songs, Unique Artists, Unique Albums, Listening Time).
  - State persistence: remembers volume, shuffle, repeat mode, last played track, and playback position.

- **Keyboard Shortcuts**
  - `Space`: Play / Pause
  - `Left Arrow`: Seek backward 5 seconds
  - `Right Arrow`: Seek forward 5 seconds
  - `Ctrl + Left Arrow`: Previous track
  - `Ctrl + Right Arrow`: Next track
  - `M`: Mute / Unmute

---

## Tech Stack

- **Frontend**:
  - React 18 with Vite
  - Tailwind CSS for sleek dark-themed styling
  - Lucide React for modern iconography
  - HTML5 Audio API centralized in `PlayerContext`
  - Axios for HTTP requests and upload progress tracking

- **Backend**:
  - Node.js & Express.js
  - MongoDB with Mongoose
  - Multer for audio file uploads
  - `music-metadata` for embedded audio tags & artwork extraction
  - Custom HTTP Range Request streaming controller

- **Storage**:
  - Audio files: `server/uploads/music/`
  - Extracted artwork: `server/uploads/artwork/`
  - Local database: MongoDB (`mongodb://127.0.0.1:27017/localify`)

---

## Project Structure

```text
Music/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Sidebar.jsx
│   │   │   ├── MusicPlayer.jsx
│   │   │   ├── SongList.jsx
│   │   │   ├── SongRow.jsx
│   │   │   ├── PlaylistCard.jsx
│   │   │   ├── LyricsPanel.jsx
│   │   │   ├── QueueDrawer.jsx
│   │   │   ├── UploadModal.jsx
│   │   │   ├── EditSongModal.jsx
│   │   │   ├── AddToPlaylistModal.jsx
│   │   │   └── ConfirmDialog.jsx
│   │   ├── pages/              # Application pages
│   │   │   ├── Home.jsx
│   │   │   ├── Library.jsx
│   │   │   ├── Favorites.jsx
│   │   │   ├── Playlists.jsx
│   │   │   ├── PlaylistDetails.jsx
│   │   │   └── SearchPage.jsx
│   │   ├── context/
│   │   │   └── PlayerContext.jsx  # Centralized audio player context
│   │   ├── services/
│   │   │   └── api.js          # REST API client
│   │   ├── utils/
│   │   │   └── formatters.js   # Time, duration, date & artwork helpers
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Express + Mongoose Backend
│   ├── config/
│   │   └── db.js               # MongoDB connection with local mongod manager
│   ├── controllers/
│   │   ├── songController.js
│   │   ├── playlistController.js
│   │   ├── favoriteController.js
│   │   ├── historyController.js
│   │   └── settingsController.js
│   ├── middleware/
│   │   └── upload.js           # Multer configuration for audio formats
│   ├── models/
│   │   ├── Song.js
│   │   ├── Playlist.js
│   │   ├── ListeningHistory.js
│   │   └── Settings.js
│   ├── routes/
│   │   ├── songRoutes.js
│   │   ├── playlistRoutes.js
│   │   ├── favoriteRoutes.js
│   │   ├── historyRoutes.js
│   │   └── settingsRoutes.js
│   ├── services/
│   │   ├── metadataService.js  # Audio tag & artwork extraction, SHA-256 hash
│   │   └── lyricsService.js    # Synchronized .lrc & plain text parser
│   ├── uploads/
│   │   ├── music/              # Stored audio files
│   │   └── artwork/            # Extracted artwork files
│   ├── data/db/                # Local MongoDB data directory
│   ├── app.js                  # Express server entry point
│   └── package.json
│
├── .env                        # Server configuration & MongoDB URI
├── .gitignore
├── README.md
└── package.json                # Root automation scripts
```

---

## Installation & Setup

### 1. Prerequisites
- **Node.js**: v18 or higher (tested on Node v24)
- **MongoDB**: Installed locally (the server automatically connects to port `27017` or launches local `mongod`).

### 2. Install Dependencies
Run the install command from the root directory:
```bash
npm run install:all
```
*(Or manually run `npm install` inside both `server` and `client` directories).*

### 3. Build Frontend for Production (Optional)
```bash
npm run build
```

---

## Running the Application

### Option 1: Full-Stack Production Mode (Single Command)
Run the application serving both backend APIs and the frontend on port `5000`:
```bash
npm start
```
Then open your browser at **[http://localhost:5000](http://localhost:5000)**.

### Option 2: Development Mode (Vite Hot-Reload)
In one terminal, start the Express backend:
```bash
npm run server
```

In a second terminal, start the Vite frontend development server:
```bash
npm run client
```
Then open your browser at **[http://localhost:3000](http://localhost:3000)** (Vite proxies API calls to port `5000`).

---

## REST API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register a new user account |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT token |
| `GET` | `/api/auth/me` | Get current authenticated user profile |
| `PUT` | `/api/auth/profile` | Update user name, email, or password |
| `POST` | `/api/songs/upload` | Upload audio files (`multipart/form-data`) |
| `GET` | `/api/songs` | List songs (supports `search`, `sort`, `order`, `artist`, `album`, `genre`) |
| `GET` | `/api/songs/:id` | Get song metadata |
| `GET` | `/api/songs/:id/stream` | Stream audio file with HTTP Range support |
| `PATCH` | `/api/songs/:id` | Edit song metadata |
| `DELETE` | `/api/songs/:id` | Delete song, file, and artwork |
| `GET` | `/api/songs/search?q=` | Search songs, artists, albums, playlists |
| `PUT` | `/api/songs/:id/lyrics` | Import / update synchronized or plain lyrics |
| `DELETE` | `/api/songs/:id/lyrics` | Delete lyrics |
| `POST` | `/api/playlists` | Create playlist |
| `GET` | `/api/playlists` | Get all playlists |
| `GET` | `/api/playlists/:id` | Get playlist with songs |
| `PATCH` | `/api/playlists/:id` | Edit playlist or reorder songs |
| `DELETE` | `/api/playlists/:id` | Delete playlist |
| `POST` | `/api/playlists/:id/songs` | Add song to playlist |
| `DELETE` | `/api/playlists/:id/songs/:songId` | Remove song from playlist |
| `GET` | `/api/favorites` | Get all favorite songs |
| `POST` | `/api/favorites/:songId` | Mark song as favorite |
| `DELETE` | `/api/favorites/:songId` | Remove song from favorites |
| `GET` | `/api/history` | Get recently played songs |
| `POST` | `/api/history` | Record playback event & increment play count |
| `GET` | `/api/stats` | Get library stats (totals & listening duration) |
| `GET` | `/api/settings` | Get user playback preferences |
| `PUT` | `/api/settings` | Update user playback preferences |

