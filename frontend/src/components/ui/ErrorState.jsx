import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'Unable to load data',
  message = 'An unexpected error occurred while communicating with the server.',
  retry,
  className = '',
}) {
  return (
    <div
      className={`p-6 rounded-lg border border-rose-200 bg-rose-50 text-slate-800 my-4 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-rose-900">{title}</h3>
          <p className="mt-1 text-sm text-rose-700">{message}</p>
          {retry && (
            <div className="mt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={retry}
                icon={RefreshCw}
                className="bg-white hover:bg-rose-100 text-rose-800 border-rose-300"
              >
                Try again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
