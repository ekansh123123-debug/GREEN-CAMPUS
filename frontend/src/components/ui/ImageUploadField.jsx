import React, { useState, useRef } from 'react';
import { Upload, X, Camera } from 'lucide-react';
import { MAX_FILE_SIZE_MB, ALLOWED_IMAGE_TYPES } from '../../lib/constants';

export default function ImageUploadField({
  label = 'Evidence Photo (Optional)',
  helperText = 'Accepted: JPEG, PNG, WebP up to 5 MB.',
  onFileSelect,
  previewUrl,
  onClear,
}) {
  const [error, setError] = useState(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = (e) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Invalid format. Please select a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File exceeds the maximum limit of ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    onFileSelect(file);
  };

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <p className="text-xs text-slate-500">{helperText}</p>

      {/* Mobile Direct Camera Trigger */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="sr-only"
        onChange={handleFileChange}
      />

      {previewUrl ? (
        <div className="relative inline-block mt-2">
          <img
            src={previewUrl}
            alt="Upload preview"
            className="w-48 h-36 object-cover rounded-xl border border-slate-200 shadow-sm"
          />
          <button
            type="button"
            onClick={onClear}
            className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-rose-600 active:scale-95 transition-transform"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-2 mt-2">
          {/* Mobile Camera Quick Tap */}
          <div className="sm:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 bg-campus-50 text-campus-800 border border-campus-200 rounded-lg text-xs font-semibold active:bg-campus-100 transition-colors"
            >
              <Camera className="w-4 h-4 text-campus-700 shrink-0" />
              <span>Take Photo (Camera)</span>
            </button>
          </div>

          {/* Standard accessible dropzone label containing the primary input */}
          <label className="flex flex-col items-center justify-center p-5 sm:p-6 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50/60 hover:bg-slate-50 active:bg-slate-100 transition-colors">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-2">
              <Upload className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="text-xs font-semibold text-slate-700">
              Click to upload or drag & drop photo
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">JPEG, PNG, WebP up to 5 MB</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
        </div>
      )}

      {error && (
        <p className="text-xs font-medium text-rose-600 mt-1 flex items-center gap-1" role="alert">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
}
