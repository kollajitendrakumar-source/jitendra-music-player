import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractMetadata, computeFileHash } from '../services/metadataService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_URI = 'mongodb://127.0.0.1:27017/localify';
const ATLAS_URI = 'mongodb+srv://kollajitendrakumar_db_user:emos1ruffUYPsOJT@muiscplayer.fkghmj5.mongodb.net/localify?retryWrites=true&w=majority';

const musicDir = path.resolve(__dirname, '../uploads/music');
const artworkDir = path.resolve(__dirname, '../uploads/artwork');

async function uploadFileStream(bucket, filePath, filename, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, options);
    const readStream = fs.createReadStream(filePath);
    readStream
      .pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => resolve(uploadStream.id));
  });
}

async function migrate() {
  console.log('=== Starting Migration to MongoDB Atlas ===');

  // 1. Connect to Atlas
  console.log('[Atlas] Connecting to MongoDB Atlas...');
  const atlasConn = await mongoose.createConnection(ATLAS_URI, {
    serverSelectionTimeoutMS: 15000,
  }).asPromise();
  console.log('[Atlas] Connected successfully to host:', atlasConn.host);

  const atlasAudioBucket = new mongoose.mongo.GridFSBucket(atlasConn.db, { bucketName: 'audio' });
  const atlasArtworkBucket = new mongoose.mongo.GridFSBucket(atlasConn.db, { bucketName: 'artwork' });

  // 2. Connect to Local MongoDB
  console.log('[Local] Connecting to local MongoDB...');
  let localConn = null;
  let localSongs = [];
  let localPlaylists = [];
  let localHistory = [];
  let localSettings = [];

  try {
    localConn = await mongoose.createConnection(LOCAL_URI, {
      serverSelectionTimeoutMS: 5000,
    }).asPromise();
    console.log('[Local] Connected successfully to local database.');

    localSongs = await localConn.db.collection('songs').find().toArray();
    localPlaylists = await localConn.db.collection('playlists').find().toArray();
    localHistory = await localConn.db.collection('listeninghistories').find().toArray();
    localSettings = await localConn.db.collection('settings').find().toArray();

    console.log(`[Local] Found: ${localSongs.length} songs, ${localPlaylists.length} playlists, ${localHistory.length} history, ${localSettings.length} settings.`);
  } catch (err) {
    console.warn('[Local] Could not connect to local MongoDB:', err.message, '- will migrate directly from files on disk.');
  }

  // 3. Upload Artwork to Atlas artwork bucket
  console.log('\n[Artwork] Uploading artwork files to Atlas GridFS...');
  const artworkFileMap = new Map(); // filename -> ObjectId
  if (fs.existsSync(artworkDir)) {
    const artFiles = fs.readdirSync(artworkDir).filter(f => !f.startsWith('.'));
    for (const artFile of artFiles) {
      const artPath = path.join(artworkDir, artFile);
      const ext = path.extname(artFile).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
      };
      const contentType = mimeTypes[ext] || 'image/jpeg';

      // Check if already in bucket
      const existing = await atlasArtworkBucket.find({ filename: artFile }).limit(1).toArray();
      let artId = null;
      if (existing.length > 0) {
        artId = existing[0]._id;
        console.log(`[Artwork] Already in Atlas: ${artFile} (${artId})`);
      } else {
        artId = await uploadFileStream(atlasArtworkBucket, artPath, artFile, { contentType });
        console.log(`[Artwork] Uploaded: ${artFile} -> id: ${artId}`);
      }
      artworkFileMap.set(artFile, artId);
    }
  }

  // 4. Migrate Audio Files and Songs
  console.log('\n[Audio] Uploading audio files to Atlas GridFS & creating song records...');
  const audioFiles = fs.readdirSync(musicDir).filter(f => !f.startsWith('.'));
  console.log(`[Audio] Found ${audioFiles.length} audio file(s) in local directory.`);

  const atlasSongsCollection = atlasConn.db.collection('songs');

  for (const audioFile of audioFiles) {
    const audioPath = path.join(musicDir, audioFile);
    const fileHash = await computeFileHash(audioPath);
    const ext = path.extname(audioFile).toLowerCase();
    const mimeTypes = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.flac': 'audio/flac',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.ogg': 'audio/ogg',
    };
    const contentType = mimeTypes[ext] || 'audio/mpeg';

    // 4a. Check if audio file already uploaded to Atlas GridFS
    const existingGridFile = await atlasAudioBucket.find({ filename: audioFile }).limit(1).toArray();
    let audioFileId = null;
    if (existingGridFile.length > 0) {
      audioFileId = existingGridFile[0]._id;
      console.log(`[Audio] Already in Atlas GridFS: ${audioFile} (${audioFileId})`);
    } else {
      console.log(`[Audio] Uploading ${audioFile} to Atlas GridFS...`);
      audioFileId = await uploadFileStream(atlasAudioBucket, audioPath, audioFile, {
        contentType,
        metadata: { filename: audioFile },
      });
      console.log(`[Audio] Uploaded ${audioFile} -> audioFileId: ${audioFileId}`);
    }

    // 4b. Match with local song document if existed
    const matchingLocalSong = localSongs.find(
      s => s.filePath === audioFile || s.fileHash === fileHash
    );

    let meta = null;
    try {
      meta = await extractMetadata(audioPath, audioFile);
    } catch (err) {
      console.warn(`[Metadata] Failed parsing ${audioFile}:`, err.message);
    }

    // Determine artworkFileId and artworkPath
    let artworkFileId = null;
    let artworkPath = matchingLocalSong?.artworkPath || meta?.artworkPath || null;
    if (artworkPath) {
      const artBaseName = path.basename(artworkPath);
      if (artworkFileMap.has(artBaseName)) {
        artworkFileId = artworkFileMap.get(artBaseName);
      }
    }

    const { coverData, coverFileName, coverFormat, ...cleanMeta } = meta || {};

    const songDoc = {
      title: matchingLocalSong?.title || cleanMeta?.title || path.parse(audioFile).name,
      artist: matchingLocalSong?.artist || cleanMeta?.artist || 'Unknown Artist',
      album: matchingLocalSong?.album || cleanMeta?.album || 'Unknown Album',
      albumArtist: matchingLocalSong?.albumArtist || cleanMeta?.albumArtist || '',
      movieName: matchingLocalSong?.movieName || cleanMeta?.movieName || '',
      songType: matchingLocalSong?.songType || cleanMeta?.songType || 'Movie Soundtrack',
      genre: matchingLocalSong?.genre || cleanMeta?.genre || 'Unknown',
      language: matchingLocalSong?.language || cleanMeta?.language || 'English',
      year: matchingLocalSong?.year ?? cleanMeta?.year ?? null,
      trackNumber: matchingLocalSong?.trackNumber ?? cleanMeta?.trackNumber ?? null,
      duration: matchingLocalSong?.duration ?? cleanMeta?.duration ?? 0,
      format: matchingLocalSong?.format || cleanMeta?.format || ext.replace('.', ''),
      bitrate: matchingLocalSong?.bitrate ?? cleanMeta?.bitrate ?? null,
      sampleRate: matchingLocalSong?.sampleRate ?? cleanMeta?.sampleRate ?? null,
      fileSize: matchingLocalSong?.fileSize || cleanMeta?.fileSize || fs.statSync(audioPath).size,
      filePath: audioFile,
      audioFileId,
      artworkFileId,
      artworkPath: artworkPath || (artworkFileId ? `/uploads/artwork/${path.basename(artworkPath || '')}` : null),
      fileHash,
      uploadedBy: matchingLocalSong?.uploadedBy || {
        userId: null,
        name: 'Local User',
        email: '',
      },
      lyrics: matchingLocalSong?.lyrics || cleanMeta?.lyrics || { text: '', isSynced: false, syncedLyrics: [] },
      dateAdded: matchingLocalSong?.dateAdded || new Date(),
      playCount: matchingLocalSong?.playCount || 0,
      lastPlayedAt: matchingLocalSong?.lastPlayedAt || null,
      isFavorite: matchingLocalSong?.isFavorite !== undefined ? matchingLocalSong.isFavorite : false,
      updatedAt: new Date(),
      createdAt: matchingLocalSong?.createdAt || new Date(),
    };

    if (matchingLocalSong?._id) {
      songDoc._id = matchingLocalSong._id;
    }

    await atlasSongsCollection.updateOne(
      { fileHash },
      { $set: songDoc },
      { upsert: true }
    );
    console.log(`[Song] Saved song in Atlas: "${songDoc.title}" (isFavorite: ${songDoc.isFavorite})`);
  }

  // 5. Migrate other collections (playlists, listening history, settings)
  if (localPlaylists.length > 0) {
    console.log(`\n[Playlists] Migrating ${localPlaylists.length} playlist(s)...`);
    const atlasPlaylistsCollection = atlasConn.db.collection('playlists');
    for (const p of localPlaylists) {
      await atlasPlaylistsCollection.updateOne({ _id: p._id }, { $set: p }, { upsert: true });
    }
  }

  if (localHistory.length > 0) {
    console.log(`\n[History] Migrating ${localHistory.length} history record(s)...`);
    const atlasHistoryCollection = atlasConn.db.collection('listeninghistories');
    for (const h of localHistory) {
      await atlasHistoryCollection.updateOne({ _id: h._id }, { $set: h }, { upsert: true });
    }
  }

  if (localSettings.length > 0) {
    console.log(`\n[Settings] Migrating settings...`);
    const atlasSettingsCollection = atlasConn.db.collection('settings');
    for (const s of localSettings) {
      await atlasSettingsCollection.updateOne({ _id: s._id }, { $set: s }, { upsert: true });
    }
  }

  // 6. Ensure indexes on Atlas
  console.log('\n[Indexes] Creating text and field indexes on Atlas...');
  try {
    await atlasSongsCollection.createIndex({
      title: 'text',
      artist: 'text',
      album: 'text',
      genre: 'text',
      language: 'text',
    }, { language_override: 'none' });
    await atlasSongsCollection.createIndex({ fileHash: 1 }, { unique: true });
    await atlasSongsCollection.createIndex({ isFavorite: 1 });
    await atlasSongsCollection.createIndex({ dateAdded: -1 });
  } catch (idxErr) {
    console.warn('[Indexes] Index creation info:', idxErr.message);
  }

  // 7. Verify Atlas Counts
  const finalSongsCount = await atlasSongsCollection.countDocuments();
  const finalAudioCount = await atlasConn.db.collection('audio.files').countDocuments();
  const finalArtworkCount = await atlasConn.db.collection('artwork.files').countDocuments();
  console.log(`\n=== Verification ===`);
  console.log(`Atlas songs count: ${finalSongsCount}`);
  console.log(`Atlas audio GridFS count: ${finalAudioCount}`);
  console.log(`Atlas artwork GridFS count: ${finalArtworkCount}`);

  if (finalSongsCount !== audioFiles.length || finalAudioCount !== audioFiles.length) {
    throw new Error(`Count mismatch! Songs: ${finalSongsCount}, Audio GridFS: ${finalAudioCount}, expected: ${audioFiles.length}`);
  }

  // 8. Delete local song files as requested
  console.log('\n[Cleanup] Deleting local audio files in uploads/music...');
  for (const audioFile of audioFiles) {
    const p = path.join(musicDir, audioFile);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`Deleted local audio: ${audioFile}`);
    }
  }

  console.log('\n[Cleanup] Deleting local artwork files in uploads/artwork...');
  const artFiles = fs.readdirSync(artworkDir).filter(f => !f.startsWith('.'));
  for (const artFile of artFiles) {
    const p = path.join(artworkDir, artFile);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`Deleted local artwork: ${artFile}`);
    }
  }

  console.log('\n=== MIGRATION COMPLETED SUCCESSFULLY ===');

  if (localConn) await localConn.close();
  await atlasConn.close();
  process.exit(0);
}

migrate().catch(err => {
  console.error('\n!!! MIGRATION FAILED !!!', err);
  process.exit(1);
});

