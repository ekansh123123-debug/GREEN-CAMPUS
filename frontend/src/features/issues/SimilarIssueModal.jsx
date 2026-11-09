import React from 'react';
import { AlertCircle, ThumbsUp, ArrowRight, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';

export default function SimilarIssueModal({
  isOpen,
  similarIssues = [],
  onUpvoteExisting,
  onProceedAnyway,
  onClose,
}) {
  if (!isOpen || similarIssues.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="similar-title"
    >
      <div className="bg-white rounded-t-2xl sm:rounded-xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
            <h2 id="similar-title" className="text-base font-semibold text-slate-900">
              Similar Open Issues Detected
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-3 text-xs sm:text-sm text-slate-600">
          We found {similarIssues.length} active issue{similarIssues.length > 1 ? 's' : ''} in the
          same category and campus location. To avoid duplicate reports, you can upvote an
          existing report to increase its affected student count, or proceed if your issue is different.
        </p>

        <div className="mt-4 space-y-3 overflow-y-auto flex-1 pr-1">
          {similarIssues.map((issue) => (
            <div
              key={issue.id}
              className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-campus-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <StatusBadge status={issue.status} />
                  <PriorityBadge priority={issue.priority} />
                  <span className="text-[11px] text-slate-500 font-medium">
                    {issue.building} • {issue.floor}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-900">{issue.title}</h4>
                <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{issue.description}</p>
                <div className="text-[11px] text-slate-500 mt-1">
                  Reported by {issue.reporter_name} • <strong>{issue.upvote_count}</strong> students affected
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                icon={ThumbsUp}
                onClick={() => onUpvoteExisting(issue.id)}
                className="w-full sm:w-auto shrink-0 min-h-[40px] border-campus-600 text-campus-700 hover:bg-campus-50"
              >
                Upvote Existing (+1)
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          <span className="text-[11px] text-slate-500 text-center sm:text-left">
            Is your issue completely different from the ones above?
          </span>
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="min-h-[40px]">
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={ArrowRight}
              onClick={onProceedAnyway}
              className="min-h-[40px]"
            >
              Submit My Report Anyway
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
