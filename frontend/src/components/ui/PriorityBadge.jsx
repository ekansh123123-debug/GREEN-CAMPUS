import React from 'react';

const PRIORITY_STYLES = {
  Low: 'bg-slate-100 text-slate-700 border-slate-200',
  Medium: 'bg-blue-50 text-blue-700 border-blue-200',
  High: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold',
  Critical: 'bg-rose-100 text-rose-900 border-rose-300 font-bold tracking-wide',
};

export default function PriorityBadge({ priority, className = '' }) {
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.Medium;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${style} ${className}`}
      title={`Official Priority: ${priority}`}
    >
      {priority === 'Critical' && (
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1 animate-pulse" aria-hidden="true" />
      )}
      {priority}
    </span>
  );
}
