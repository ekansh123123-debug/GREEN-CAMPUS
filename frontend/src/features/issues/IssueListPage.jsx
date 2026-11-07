import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import AdminIssueAssignmentModal from './AdminIssueAssignmentModal';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  ISSUE_CATEGORIES,
  CAMPUS_BUILDINGS,
  ISSUE_STATUSES,
} from '../../lib/constants';
import {
  PlusCircle,
  ThumbsUp,
  Search,
  MapPin,
  Calendar,
  Shield,
  Eye,
} from 'lucide-react';

export default function IssueListPage() {
  const { user, role } = useAuth();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Admin Modal
  const [assignIssue, setAssignIssue] = useState(null);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/issues');
      setIssues(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load issues list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await apiClient.get('/issues');
        if (!ignore) setIssues(data || []);
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load issues list');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [role]);

  const handleUpvoteToggle = async (issueId, e) => {
    e.preventDefault();
    e.stopPropagation();

    const target = issues.find((i) => i.id === issueId);
    if (!target) return;

    if (target.reporter_id === user.id) {
      alert('You cannot upvote your own reported issue.');
      return;
    }

    try {
      if (target.upvoted_by_me) {
        await apiClient.delete(`/issues/${issueId}/upvote`);
        setIssues((prev) =>
          prev.map((i) =>
            i.id === issueId
              ? { ...i, upvoted_by_me: false, upvote_count: Math.max(0, i.upvote_count - 1) }
              : i
          )
        );
      } else {
        await apiClient.post(`/issues/${issueId}/upvote`);
        setIssues((prev) =>
          prev.map((i) =>
            i.id === issueId
              ? { ...i, upvoted_by_me: true, upvote_count: i.upvote_count + 1 }
              : i
          )
        );
      }
    } catch (err) {
      alert(err.message || 'Upvote action failed');
    }
  };

  const handleAdminAssignSave = async (updatedData) => {
    if (!assignIssue) return;
    try {
      const updated = await apiClient.patch(`/issues/${assignIssue.id}/status`, updatedData);
      setIssues((prev) => prev.map((i) => (i.id === assignIssue.id ? updated : i)));
    } catch (err) {
      alert(err.message || 'Assignment failed');
    }
  };

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(search.toLowerCase()) ||
      issue.description.toLowerCase().includes(search.toLowerCase()) ||
      issue.room_area.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || issue.category === selectedCategory;
    const matchesBuilding = !selectedBuilding || issue.building === selectedBuilding;
    const matchesStatus = !selectedStatus || issue.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesBuilding && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title={role === 'admin' ? 'Issue Triage & Staff Assignment' : 'Campus Maintenance Issues'}
        description="Track reported facility repairs across D. Y. Patil College of Engineering campus. Students upvote issues to highlight affected areas."
        action={
          role === 'student' ? (
            <Link to="/issues/report">
              <Button variant="primary" icon={PlusCircle}>
                Report Campus Issue
              </Button>
            </Link>
          ) : null
        }
      />

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search issues by keywords, room code, or area..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:border-campus-600 focus:ring-1 focus:ring-campus-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-xs sm:text-sm bg-white text-slate-700 focus:border-campus-600"
            >
              <option value="">All Categories</option>
              {ISSUE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-xs sm:text-sm bg-white text-slate-700 focus:border-campus-600"
            >
              <option value="">All Buildings</option>
              {CAMPUS_BUILDINGS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-xs sm:text-sm bg-white text-slate-700 focus:border-campus-600"
            >
              <option value="">All Statuses</option>
              {Object.values(ISSUE_STATUSES).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {(search || selectedCategory || selectedBuilding || selectedStatus) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('');
                  setSelectedBuilding('');
                  setSelectedStatus('');
                }}
                className="text-xs text-rose-600 hover:underline px-2 py-1"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState message="Fetching campus issue records..." />
      ) : error ? (
        <ErrorState message={error} retry={fetchIssues} />
      ) : filteredIssues.length === 0 ? (
        <EmptyState
          title="No campus issues found"
          description="Try relaxing your search terms or filters."
          action={
            role === 'student' ? (
              <Link to="/issues/report">
                <Button variant="secondary" icon={PlusCircle}>
                  Report New Issue
                </Button>
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIssues.map((issue) => (
            <article
              key={issue.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {issue.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <PriorityBadge priority={issue.priority} />
                    <StatusBadge status={issue.status} />
                  </div>
                </div>

                <Link to={`/issues/${issue.id}`} className="group block">
                  <h3 className="text-base font-semibold text-slate-900 group-hover:text-campus-700 transition-colors line-clamp-2">
                    {issue.title}
                  </h3>
                </Link>

                <p className="mt-1.5 text-xs text-slate-600 line-clamp-2">
                  {issue.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {issue.building} ({issue.floor}, {issue.room_area})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(issue.created_at).toLocaleDateString()}
                    </span>
                    {issue.assigned_department && (
                      <span className="text-slate-600 font-medium truncate max-w-[140px]">
                        {issue.assigned_department}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer: Upvote & Actions */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => handleUpvoteToggle(issue.id, e)}
                  disabled={issue.reporter_id === user.id}
                  title={
                    issue.reporter_id === user.id
                      ? 'You cannot upvote your own report'
                      : issue.upvoted_by_me
                      ? 'Click to remove your upvote'
                      : 'Click to upvote this issue'
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    issue.upvoted_by_me
                      ? 'bg-campus-600 text-white shadow-xs'
                      : issue.reporter_id === user.id
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${issue.upvoted_by_me ? 'fill-current' : ''}`} />
                  <span>{issue.upvote_count}</span>
                  <span className="hidden sm:inline">Upvotes</span>
                </button>

                <div className="flex items-center gap-2">
                  {role === 'admin' && (
                    <Button
                      size="sm"
                      variant="outline"
                      icon={Shield}
                      onClick={() => setAssignIssue(issue)}
                    >
                      Triage
                    </Button>
                  )}
                  <Link to={`/issues/${issue.id}`}>
                    <Button size="sm" variant="ghost" icon={Eye}>
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Admin Assignment Modal */}
      <AdminIssueAssignmentModal
        isOpen={!!assignIssue}
        issue={assignIssue}
        onSave={handleAdminAssignSave}
        onClose={() => setAssignIssue(null)}
      />
    </div>
  );
}
