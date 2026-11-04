/**
 * Parses raw lyric content (plain text or .lrc synchronized text)
 * @param {string} rawText 
 * @returns {{ text: string, isSynced: boolean, syncedLyrics: Array<{ time: number, text: string }> }}
 */
export function parseLyrics(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      text: '',
      isSynced: false,
      syncedLyrics: [],
    };
  }

  const lines = rawText.split(/\r?\n/);
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;
  const syncedLyrics = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line matches metadata headers like [ar:...], [ti:...], [length:...]
    if (/^\[(ti|ar|al|au|by|offset|length|re|ve):/i.test(trimmed)) {
      continue;
    }

    const matches = [...trimmed.matchAll(timeRegex)];
    if (matches.length > 0) {
      // Line contains one or more timestamps
      const lineText = trimmed.replace(timeRegex, '').trim();

      for (const match of matches) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const msStr = match[3] || '0';
        const msFraction = msStr.length === 2 ? parseInt(msStr, 10) / 100 : parseInt(msStr, 10) / 1000;
        const totalTime = parseFloat((minutes * 60 + seconds + msFraction).toFixed(2));

        syncedLyrics.push({
          time: totalTime,
          text: lineText,
        });
      }
    }
  }

  // Sort chronologically
  syncedLyrics.sort((a, b) => a.time - b.time);

  const isSynced = syncedLyrics.length > 0;

  return {
    text: rawText,
    isSynced,
    syncedLyrics,
  };
}

