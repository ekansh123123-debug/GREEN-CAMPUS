import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { PlusCircle, Eye, Calendar, MapPin, ThumbsUp } from 'lucide-react';

export default function MyIssuesPage() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function fetchMyIssues() {
      try {
        const all = await apiClient.get('/issues');
        if (!ignore) {
          setIssues((all || []).filter((i) => i.reporter_id === user?.id));
        }
      } catch {
        if (!ignore) setIssues([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchMyIssues();
    return () => {
      ignore = true;
    };
  }, [user?.id]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="My Reported Campus Issues"
        description="Track the real-time repair progress, priority, and maintenance logs for issues you reported."
        action={
          <Link to="/issues/report">
            <Button variant="primary" icon={PlusCircle}>
              Report Another Issue
            </Button>
          </Link>
        }
      />

      {loading ? (
        <LoadingState message="Loading your issues..." />
      ) : issues.length === 0 ? (
        <EmptyState
          title="You haven't reported any issues yet"
          description="Spot a broken tap, sparking switchboard, or damaged furniture? Help keep our campus safe and clean."
          action={
            <Link to="/issues/report">
              <Button variant="primary" icon={PlusCircle}>
                Report Issue
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {issue.category}
                  </span>
                  <PriorityBadge priority={issue.priority} />
                  <StatusBadge status={issue.status} />
                </div>
                <h3 className="text-base font-semibold text-slate-900">{issue.title}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {issue.building} ({issue.floor}, {issue.room_area})
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(issue.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                    {issue.upvote_count} student upvotes
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <Link to={`/issues/${issue.id}`}>
                  <Button variant="secondary" size="sm" icon={Eye}>
                    View Progress
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
