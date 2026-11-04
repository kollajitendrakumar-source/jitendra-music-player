import { Settings } from '../models/Settings.js';

// Get current user settings (creates initial default if missing)
export async function getSettings(req, res) {
  try {
    let settings = await Settings.findOne().populate('lastPlayedSong');
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to retrieve settings.' });
  }
}

// Update settings
export async function updateSettings(req, res) {
  try {
    const { volume, shuffle, repeatMode, lastPlayedSong, lastPlaybackPosition } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (volume !== undefined) settings.volume = volume;
    if (shuffle !== undefined) settings.shuffle = shuffle;
    if (repeatMode !== undefined) settings.repeatMode = repeatMode;
    if (lastPlayedSong !== undefined) settings.lastPlayedSong = lastPlayedSong || null;
    if (lastPlaybackPosition !== undefined) settings.lastPlaybackPosition = lastPlaybackPosition;

    await settings.save();
    const populated = await Settings.findById(settings._id).populate('lastPlayedSong');
    res.json(populated);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
}

