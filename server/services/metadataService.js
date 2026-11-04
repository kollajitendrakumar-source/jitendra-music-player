import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { parseFile, selectCover } from 'music-metadata';
import { fileURLToPath } from 'url';
import { parseLyrics } from './lyricsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artworkDir = path.resolve(__dirname, '../uploads/artwork');

if (!fs.existsSync(artworkDir)) {
  fs.mkdirSync(artworkDir, { recursive: true });
}

export function detectLanguage(textToScan, id3Language = null) {
  if (id3Language && typeof id3Language === 'string' && id3Language.trim()) {
    const raw = id3Language.trim().toLowerCase();
    if (raw.includes('tel') || raw.includes('te')) return 'Telugu';
    if (raw.includes('hin') || raw.includes('hi')) return 'Hindi';
    if (raw.includes('tam') || raw.includes('ta')) return 'Tamil';
    if (raw.includes('mal') || raw.includes('ml')) return 'Malayalam';
    if (raw.includes('kan') || raw.includes('kn')) return 'Kannada';
    if (raw.includes('pan') || raw.includes('pa')) return 'Punjabi';
    if (raw.includes('spa') || raw.includes('es')) return 'Spanish';
    if (raw.includes('kor') || raw.includes('ko')) return 'Korean';
    if (raw.includes('jpn') || raw.includes('ja')) return 'Japanese';
    if (raw.includes('eng') || raw.includes('en')) return 'English';
  }

  const s = (textToScan || '').toLowerCase();
  
  if (
    /\b(telugu|isongs|badri|ramana gogula|suneetha|spb|balu|chiranjeevi|pawan kalyan|mahesh|ntr|prabhas|allu arjun|dsp|devi sri|thaman|geetha madhuri|sid sriram|anurag kulkarni|mangli|tollywood)\b/i.test(s) ||
    /telugu/i.test(s)
  ) {
    return 'Telugu';
  }
  if (
    /\b(hindi|bollywood|arijit|shreya ghoshal|lata|kishore|rafi|sonu nigam|badshah|neha kakkar|pritam|armaan malik|atif aslam|alka yagnik|udit narayan)\b/i.test(s) ||
    /hindi/i.test(s)
  ) {
    return 'Hindi';
  }
  if (
    /\b(tamil|kollywood|ilayaraja|anirudh|ar rahman|harris jayaraj|yuvan|dhanush|vijay|ajith)\b/i.test(s) ||
    /tamil/i.test(s)
  ) {
    return 'Tamil';
  }
  if (
    /\b(malayalam|mollywood|yesudas|chithra|mg sreekumar|sujatha|sushin shyam)\b/i.test(s) ||
    /malayalam/i.test(s)
  ) {
    return 'Malayalam';
  }
  if (
    /\b(kannada|sandalwood|sanjith hegde|vijay prakash|raghu dixit)\b/i.test(s) ||
    /kannada/i.test(s)
  ) {
    return 'Kannada';
  }
  if (
    /\b(punjabi|diljit|sidhu moose|ap dhillon|karan aujla|shubh|amrit maan)\b/i.test(s) ||
    /punjabi/i.test(s)
  ) {
    return 'Punjabi';
  }
  if (/\b(spanish|latino|reggaeton|bad bunny|rosalia|j balvin|daddy yankee|ozuna)\b/i.test(s)) {
    return 'Spanish';
  }
  if (/\b(korean|k-pop|kpop|bts|blackpink|twice|stray kids|exo|newjeans)\b/i.test(s)) {
    return 'Korean';
  }
  if (/\b(japanese|j-pop|jpop|anime|l'arc|yoasobi|radwimps)\b/i.test(s)) {
    return 'Japanese';
  }
  return 'English';
}

export function computeFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => reject(err));
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

export async function extractMetadata(filePath, originalFilename) {
  let metadata = null;
  try {
    metadata = await parseFile(filePath, { duration: true });
  } catch (err) {
    console.warn(`[Metadata] Could not parse metadata for ${originalFilename}:`, err.message);
  }

  const common = metadata?.common || {};
  const format = metadata?.format || {};

  const cleanFilename = path.parse(originalFilename).name;
  const ext = path.extname(originalFilename).replace('.', '').toLowerCase();

  const title = (common.title && common.title.trim()) || cleanFilename;
  const artist = (common.artist && common.artist.trim()) || 'Unknown Artist';
  const album = (common.album && common.album.trim()) || 'Unknown Album';
  const albumArtist = (common.albumartist && common.albumartist.trim()) || '';
  
  let genre = 'Unknown';
  if (Array.isArray(common.genre) && common.genre.length > 0) {
    genre = common.genre[0];
  } else if (typeof common.genre === 'string' && common.genre.trim()) {
    genre = common.genre.trim();
  }

  const year = common.year || null;
  const trackNumber = common.track?.no || null;
  const duration = format.duration ? Math.round(format.duration) : 0;
  const audioFormat = format.container || ext || 'mp3';

  // Extract artwork
  let artworkPath = null;
  let coverData = null;
  let coverFileName = null;
  let coverFormat = null;
  const cover = selectCover(common.picture);
  if (cover && cover.data && cover.data.length > 0) {
    try {
      const imgHash = crypto.createHash('md5').update(cover.data).digest('hex');
      let imgExt = 'jpg';
      coverFormat = 'image/jpeg';
      if (cover.format) {
        if (cover.format.includes('png')) {
          imgExt = 'png';
          coverFormat = 'image/png';
        } else if (cover.format.includes('webp')) {
          imgExt = 'webp';
          coverFormat = 'image/webp';
        }
      }

      coverFileName = `art-${imgHash}.${imgExt}`;
      coverData = cover.data;
      artworkPath = `/uploads/artwork/${coverFileName}`;
    } catch (artErr) {
      console.warn(`[Metadata] Could not process artwork for ${originalFilename}:`, artErr.message);
    }
  }

  // Check embedded lyrics
  let lyrics = { text: '', isSynced: false, syncedLyrics: [] };
  if (common.lyrics && Array.isArray(common.lyrics) && common.lyrics.length > 0) {
    const rawLyrics = common.lyrics[0].text || common.lyrics[0];
    if (typeof rawLyrics === 'string') {
      lyrics = parseLyrics(rawLyrics);
    }
  }

  const language = detectLanguage(
    `${title} ${artist} ${album} ${originalFilename} ${genre}`,
    common.language
  );

  let fileSize = 0;
  try {
    fileSize = fs.statSync(filePath).size;
  } catch (_) {}

  const bitrate = format.bitrate ? Math.round(format.bitrate / 1000) : null;
  const sampleRate = format.sampleRate || null;

  // Detect Movie Name & Song Type
  const cleanMovieName = album && album !== 'Unknown Album'
    ? album.replace(/\s*-\s*\(\d{4}\).*/i, '').trim()
    : '';

  const isRegionalFilm = ['Telugu', 'Hindi', 'Tamil', 'Malayalam', 'Kannada'].includes(language);
  const isPrivate = /private|single|indie|cover/i.test(`${title} ${genre} ${album}`);
  
  const songType = isPrivate
    ? 'Private Song'
    : isRegionalFilm || cleanMovieName
    ? 'Movie Soundtrack'
    : 'Album Track';

  return {
    title,
    artist,
    album,
    albumArtist,
    movieName: cleanMovieName || '',
    songType,
    genre,
    language,
    year,
    trackNumber,
    duration,
    format: audioFormat,
    bitrate,
    sampleRate,
    fileSize,
    artworkPath,
    coverData,
    coverFileName,
    coverFormat,
    lyrics,
  };
}

