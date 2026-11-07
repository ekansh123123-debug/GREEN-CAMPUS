import React from 'react';

export default function LoadingState({ message = 'Loading campus records...', className = '' }) {
  return (
    <div
      className={`py-12 flex flex-col items-center justify-center space-y-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="w-8 h-8 border-3 border-campus-200 border-t-campus-700 rounded-full animate-spin" />
      <p className="text-sm text-slate-600 font-medium">{message}</p>
    </div>
  );
}
