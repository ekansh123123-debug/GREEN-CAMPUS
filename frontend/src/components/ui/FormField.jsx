import React from 'react';

export default function FormField({
  label,
  id,
  error,
  helperText,
  required = false,
  children,
  className = '',
}) {
  const errorId = error && id ? `${id}-error` : undefined;
  const helperId = helperText && id ? `${id}-helper` : undefined;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-rose-600 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {helperText && !error && (
        <p id={helperId} className="text-xs text-slate-500">
          {helperText}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-rose-600 flex items-center gap-1" role="alert">
          <span aria-hidden="true">⚠️</span> {error}
        </p>
      )}
    </div>
  );
}
