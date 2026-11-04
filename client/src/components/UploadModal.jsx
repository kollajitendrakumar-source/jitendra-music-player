import React, { useState, useRef } from 'react';
import { UploadCloud, X, Music, CheckCircle2, AlertCircle, FileAudio, Loader2 } from 'lucide-react';
import { uploadSongs } from '../services/api';
import { usePlayer } from '../context/PlayerContext';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const { showNotification } = usePlayer();
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);

  if (!isOpen) return null;

  const acceptedExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg'];

  const validateFiles = (fileList) => {
    const valid = [];
    for (const file of fileList) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (acceptedExtensions.includes(ext) || file.type.startsWith('audio/')) {
        valid.push(file);
      }
    }
    return valid;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const valid = validateFiles(e.dataTransfer.files);
      if (valid.length > 0) {
        setFiles((prev) => [...prev, ...valid]);
        setUploadResult(null);
      } else {
        showNotification('Please drop valid audio files (MP3, WAV, FLAC, M4A, AAC, OGG)', 'error');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      const valid = validateFiles(e.target.files);
      setFiles((prev) => [...prev, ...valid]);
      setUploadResult(null);
    }
  };

  const removeSelectedFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    for (const file of files) {
      formData.append('audio', file);
    }

    try {
      const result = await uploadSongs(formData, (pct) => {
        setProgress(pct);
      });

      setUploadResult(result);
      setFiles([]);

      const uploadedCount = result.uploaded?.length || 0;
      const dupCount = result.duplicates?.length || 0;

      if (uploadedCount > 0) {
        showNotification(`Successfully added ${uploadedCount} song${uploadedCount > 1 ? 's' : ''} to library!`, 'success');
        if (onUploadSuccess) onUploadSuccess(result.uploaded);
      }

      if (dupCount > 0 && uploadedCount === 0) {
        showNotification(`${dupCount} song(s) were already in your library.`, 'info');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      showNotification(err.response?.data?.error || 'Failed to upload audio files.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setUploadResult(null);
    setProgress(0);
    setIsUploading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl p-6 bg-surface border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-black/5 text-black">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Upload Music</h2>
              <p className="text-xs text-muted">Supports MP3, WAV, FLAC, M4A, AAC, OGG</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-1.5 text-muted hover:text-black rounded-lg hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dropzone */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragging
                ? 'border-black bg-black/5 scale-[0.99]'
                : 'border-border hover:border-neutral-400 hover:bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".mp3,.wav,.flac,.m4a,.aac,.ogg,audio/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <div className="p-4 rounded-full bg-slate-100 border border-border text-neutral-700 mb-3">
              <FileAudio className="w-8 h-8 text-black" />
            </div>
            <p className="text-sm font-medium text-neutral-900 text-center">
              Drag & drop audio files here, or <span className="text-black font-bold underline">browse</span>
            </p>
            <p className="text-xs text-muted mt-1">
              Metadata & embedded artwork are extracted automatically.
            </p>
          </div>

          {/* Selected Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted font-medium px-1">
                <span>Selected Songs ({files.length})</span>
                <button
                  type="button"
                  onClick={() => setFiles([])}
                  disabled={isUploading}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Clear all
                </button>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {files.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-border text-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Music className="w-4 h-4 text-black flex-shrink-0" />
                      <span className="truncate text-neutral-900 text-xs font-medium">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-xs text-muted">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                      {!isUploading && (
                        <button
                          onClick={() => removeSelectedFile(idx)}
                          className="text-muted hover:text-red-600 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="p-4 rounded-xl bg-slate-50 border border-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-800 flex items-center gap-2 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                  Uploading and extracting audio metadata...
                </span>
                <span className="font-bold text-black">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Result Summary */}
          {uploadResult && (
            <div className="space-y-3 pt-2">
              {uploadResult.uploaded?.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-border text-xs text-neutral-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    Uploaded {uploadResult.uploaded.length} song(s) successfully!
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-neutral-700 max-h-24 overflow-y-auto">
                    {uploadResult.uploaded.map((s) => (
                      <li key={s._id} className="truncate">
                        {s.title} — {s.artist}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {uploadResult.duplicates?.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    {uploadResult.duplicates.length} duplicate file(s) skipped:
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-800 max-h-24 overflow-y-auto">
                    {uploadResult.duplicates.map((d, i) => (
                      <li key={i} className="truncate">
                        {d.filename} (already in library)
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {uploadResult.errors?.length > 0 && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-red-900">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    Failed to process {uploadResult.errors.length} file(s):
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-red-800">
                    {uploadResult.errors.map((e, i) => (
                      <li key={i} className="truncate">
                        {e.filename}: {e.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-black hover:bg-surface-hover rounded-xl transition-colors border border-border"
          >
            {uploadResult ? 'Done' : 'Cancel'}
          </button>
          {files.length > 0 && !uploadResult && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-black hover:bg-neutral-800 text-white transition-all flex items-center gap-2 shadow-md shadow-black/15"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Upload {files.length} {files.length === 1 ? 'Song' : 'Songs'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

