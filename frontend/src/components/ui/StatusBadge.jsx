import React from 'react';

const STATUS_CONFIGS = {
  // Issue statuses
  'Submitted': {
    bg: 'bg-slate-100 text-slate-800 border-slate-200',
    dot: 'bg-slate-400',
  },
  'Assigned': {
    bg: 'bg-blue-50 text-blue-800 border-blue-200',
    dot: 'bg-blue-500',
  },
  'In Progress': {
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
  },
  'Resolved': {
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-600',
  },
  'Duplicate': {
    bg: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  },
  'Cancelled': {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  // Marketplace listing statuses
  'Available': {
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-600',
  },
  'Requested': {
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
  },
  'Exchanged': {
    bg: 'bg-blue-50 text-blue-800 border-blue-200',
    dot: 'bg-blue-600',
  },
  'Withdrawn': {
    bg: 'bg-slate-100 text-slate-500 border-slate-200',
    dot: 'bg-slate-400',
  },
};

export default function StatusBadge({ status, className = '' }) {
  const config = STATUS_CONFIGS[status] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      {status}
    </span>
  );
}
