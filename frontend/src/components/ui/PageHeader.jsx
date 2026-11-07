import React from 'react';

export default function PageHeader({
  title,
  description,
  action,
  breadcrumbs,
  className = '',
}) {
  return (
    <div className={`mb-6 pb-4 border-b border-slate-200 ${className}`}>
      {breadcrumbs && (
        <nav className="mb-2 text-xs text-slate-500" aria-label="Breadcrumbs">
          {breadcrumbs}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
