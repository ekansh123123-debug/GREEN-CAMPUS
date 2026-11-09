import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  CAMPUS_FLOORS,
  CAMPUS_AREAS,
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
  User,
  Wrench,
  CheckCircle2,
  Building2,
  LayoutGrid,
  FolderTree,
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
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'grouped_location'

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

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesSearch =
        issue.title.toLowerCase().includes(search.toLowerCase()) ||
        issue.description.toLowerCase().includes(search.toLowerCase()) ||
        (issue.room_area && issue.room_area.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = !selectedCategory || issue.category === selectedCategory;
      const matchesBuilding = !selectedBuilding || issue.building === selectedBuilding;
      const matchesFloor = !selectedFloor || (issue.floor && issue.floor.toLowerCase().includes(selectedFloor.toLowerCase()));
      const matchesArea = !selectedArea || (issue.room_area && issue.room_area.toLowerCase().includes(selectedArea.toLowerCase()));
      const matchesStatus = !selectedStatus || issue.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesBuilding && matchesFloor && matchesArea && matchesStatus;
    });
  }, [issues, search, selectedCategory, selectedBuilding, selectedFloor, selectedArea, selectedStatus]);

  // Group issues by campus location & building
  const locationGroups = useMemo(() => {
    const groups = {};
    filteredIssues.forEach((issue) => {
      const bKey = issue.building || 'General Campus';
      if (!groups[bKey]) {
        groups[bKey] = {
          building: bKey,
          issues: [],
          unresolvedCount: 0,
          resolvedCount: 0,
        };
      }
      groups[bKey].issues.push(issue);
      if (issue.status === 'Resolved') {
        groups[bKey].resolvedCount += 1;
      } else {
        groups[bKey].unresolvedCount += 1;
      }
    });
    return Object.values(groups);
  }, [filteredIssues]);

  const renderIssueCard = (issue) => (
    <article
      key={issue.id}
      className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
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

        {/* Location & WHO Metadata */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate font-medium">
              {issue.building} ({issue.floor}, {issue.room_area})
            </span>
          </div>

          {/* WHO: Reporter info */}
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              Reported by: <strong className="font-medium text-slate-700">{issue.reporter_name || 'Campus Student'}</strong>
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Calendar className="w-3 h-3" />
              {new Date(issue.created_at).toLocaleDateString()}
            </span>
          </div>

          {/* WHO: Assignee / Responsible Technician */}
          <div className="flex items-center gap-1.5 text-[11px] bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
            <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-slate-500">Assigned:</span>
            {issue.assigned_to_name ? (
              <span className="text-slate-800 font-semibold truncate">
                {issue.assigned_to_name} • {issue.assigned_department}
              </span>
            ) : (
              <span className="text-slate-400 italic">Unassigned (Awaiting Triage)</span>
            )}
          </div>

          {/* WHO: Resolution confirmation if resolved */}
          {issue.status === 'Resolved' && (
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Resolved by {issue.assigned_to_name || 'Maintenance Staff'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Upvote & Actions */}
      <div className="px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
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
          className={`min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors active:scale-95 ${
            issue.upvoted_by_me
              ? 'bg-campus-600 text-white shadow-xs'
              : issue.reporter_id === user.id
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <ThumbsUp className={`w-4 h-4 ${issue.upvoted_by_me ? 'fill-current' : ''}`} />
          <span>{issue.upvote_count}</span>
          <span className="inline">Upvotes</span>
        </button>

        <div className="flex items-center gap-2">
          {role === 'admin' && (
            <Button
              size="sm"
              variant="outline"
              icon={Shield}
              onClick={() => setAssignIssue(issue)}
              className="min-h-[44px]"
            >
              Triage
            </Button>
          )}
          <Link to={`/issues/${issue.id}`}>
            <Button size="sm" variant="ghost" icon={Eye} className="min-h-[44px]">
              Details
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      <PageHeader
        title={role === 'admin' ? 'Issue Triage & Staff Assignment' : 'Campus Maintenance & Cleanliness Issues'}
        description="Track reported facility repairs divided by campus buildings and areas. Students upvote issues to highlight high-traffic hotspots."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {role === 'student' && (
              <Link to="/issues/report" className="hidden sm:inline-block">
                <Button variant="primary" icon={PlusCircle}>
                  Report Campus Issue
                </Button>
              </Link>
            )}
            <Link to="/analytics">
              <Button variant="outline" icon={Building2}>
                View Cleanliness Stats
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filter Toolbar with Location & Area Dividers */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs mb-6 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search issues by keywords, room code, or area..."
              className="w-full pl-10 pr-4 min-h-[44px] py-2 border border-slate-300 rounded-lg text-base sm:text-sm focus:border-campus-600 focus:ring-1 focus:ring-campus-600"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="min-h-[40px] px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white text-slate-700 focus:border-campus-600"
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
              className="min-h-[40px] px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white text-slate-700 focus:border-campus-600"
            >
              <option value="">All Buildings</option>
              {CAMPUS_BUILDINGS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="min-h-[40px] px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white text-slate-700 focus:border-campus-600"
            >
              <option value="">All Floors</option>
              {CAMPUS_FLOORS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>

            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="min-h-[40px] px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white text-slate-700 focus:border-campus-600"
            >
              <option value="">All Areas</option>
              {CAMPUS_AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="min-h-[40px] px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white text-slate-700 focus:border-campus-600"
            >
              <option value="">All Statuses</option>
              {Object.values(ISSUE_STATUSES).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {(search || selectedCategory || selectedBuilding || selectedFloor || selectedArea || selectedStatus) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('');
                  setSelectedBuilding('');
                  setSelectedFloor('');
                  setSelectedArea('');
                  setSelectedStatus('');
                }}
                className="text-xs text-rose-600 hover:underline px-2 py-1 col-span-2 sm:col-span-1 text-center font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* View Mode Switcher: All Issues vs Divide by Location/Area */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2 text-xs">
          <div className="text-slate-500">
            Showing <strong className="text-slate-800">{filteredIssues.length}</strong> reports across{' '}
            <strong className="text-slate-800">{locationGroups.length}</strong> campus locations
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-campus-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              All Issues
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grouped_location')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'grouped_location'
                  ? 'bg-white text-campus-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              Divide by Location & Area
            </button>
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
          description="Try relaxing your search terms or location filters."
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
      ) : viewMode === 'grouped_location' ? (
        /* Grouped by Location & Area */
        <div className="space-y-8">
          {locationGroups.map((group) => (
            <section
              key={group.building}
              className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-campus-100 text-campus-800 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      {group.building}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {group.issues.length} total reports • {group.unresolvedCount} active • {group.resolvedCount} resolved
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      group.unresolvedCount === 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : group.unresolvedCount > 2
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {group.unresolvedCount === 0
                      ? 'All Clear / Clean'
                      : `${group.unresolvedCount} Active Tasks`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {group.issues.map(renderIssueCard)}
              </div>
            </section>
          ))}
        </div>
      ) : (
        /* Standard Flat Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIssues.map(renderIssueCard)}
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
