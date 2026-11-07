import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { MAX_FILE_SIZE_MB, ALLOWED_IMAGE_TYPES } from '../../lib/constants';

export default function ImageUploadField({
  label = 'Evidence Photo (Optional)',
  helperText = 'Accepted: JPEG, PNG, WebP up to 5 MB.',
  onFileSelect,
  previewUrl,
  onClear,
}) {
  const [error, setError] = useState(null);

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
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <p className="text-xs text-slate-500">{helperText}</p>

      {previewUrl ? (
        <div className="relative inline-block mt-2">
          <img
            src={previewUrl}
            alt="Upload preview"
            className="w-40 h-32 object-cover rounded-lg border border-slate-200 shadow-sm"
          />
          <button
            type="button"
            onClick={onClear}
            className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full shadow hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-rose-600"
            aria-label="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <label className="mt-2 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors">
          <Upload className="w-6 h-6 text-slate-400 mb-2" aria-hidden="true" />
          <span className="text-xs font-medium text-slate-600">
            Click to upload or drag & drop photo
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">JPEG, PNG, WebP (Max 5 MB)</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>
      )}

      {error && (
        <p className="text-xs font-medium text-rose-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
