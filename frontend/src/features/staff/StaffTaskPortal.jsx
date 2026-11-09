import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  Eye,
  User,
} from 'lucide-react';

export default function StaffTaskPortal() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTab, setFilterTab] = useState('active'); // 'active' | 'resolved' | 'all'
  const [updatingId, setUpdatingId] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/issues');
      const myWork = (data || []).filter(
        (i) => i.assigned_to_id === user.id || !i.assigned_to_id
      );
      setTasks(myWork);
    } catch (err) {
      setError(err.message || 'Failed to fetch assigned tasks');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await apiClient.get('/issues');
        if (!ignore) {
          const myWork = (data || []).filter(
            (i) => i.assigned_to_id === user.id || !i.assigned_to_id
          );
          setTasks(myWork);
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to fetch assigned tasks');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [user.id]);

  const handleQuickStatusUpdate = async (taskId, newStatus) => {
    setUpdatingId(taskId);
    let remarks = undefined;
    if (newStatus === 'Resolved') {
      const input = window.prompt('Enter repair completion remarks for student and administration:', 'Replacement valve installed and tested. Zero leaks observed.');
      if (input === null) {
        setUpdatingId(null);
        return;
      }
      remarks = input.trim() || 'Work order completed by maintenance technician.';
    }

    try {
      const updated = await apiClient.patch(`/issues/${taskId}/status`, {
        status: newStatus,
        remarks,
      });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      alert(err.message || 'Failed to update work order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const activeTasks = tasks.filter((t) => t.status !== 'Resolved' && t.status !== 'Cancelled');
  const completedTasks = tasks.filter((t) => t.status === 'Resolved');

  const displayedTasks =
    filterTab === 'active'
      ? activeTasks
      : filterTab === 'resolved'
      ? completedTasks
      : tasks;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      <PageHeader
        title="Maintenance Staff Work Order Portal"
        description={`Active tasks assigned to ${user.name} (${user.department || 'Facility Support'}). Update ongoing status and record repair logs.`}
      />

      {/* KPI summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Pending & In Progress</div>
            <div className="text-xl sm:text-2xl font-bold text-amber-700 mt-0.5">{activeTasks.length}</div>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Completed Repairs</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-0.5">{completedTasks.length}</div>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Critical Tasks</div>
            <div className="text-xl sm:text-2xl font-bold text-rose-700 mt-0.5">
              {activeTasks.filter((t) => t.priority === 'High' || t.priority === 'Critical').length}
            </div>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs for Field Technicians */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilterTab('active')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
            filterTab === 'active'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Active Tasks ({activeTasks.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('resolved')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
            filterTab === 'resolved'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Resolved ({completedTasks.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('all')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
            filterTab === 'all'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>All Tasks ({tasks.length})</span>
        </button>
      </div>

      {loading ? (
        <LoadingState message="Loading your assigned maintenance orders..." />
      ) : error ? (
        <ErrorState message={error} retry={fetchTasks} />
      ) : displayedTasks.length === 0 ? (
        <EmptyState
          title={filterTab === 'resolved' ? 'No resolved tasks yet' : 'No active work orders'}
          description={
            filterTab === 'resolved'
              ? 'Completed maintenance orders will appear here for audit history.'
              : 'You have cleared all active work orders assigned to you.'
          }
        />
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 tracking-wide uppercase mb-2">
            Assigned Work Queue ({displayedTasks.length})
          </h2>
          {displayedTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-xl border p-4 sm:p-5 shadow-xs transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                task.priority === 'Critical'
                  ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {task.category}
                  </span>
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                  {task.priority === 'Critical' && (
                    <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> High Safety Priority
                    </span>
                  )}
                </div>

                <Link to={`/issues/${task.id}`}>
                  <h3 className="text-base font-bold text-slate-900 hover:text-campus-700 transition-colors">
                    {task.title}
                  </h3>
                </Link>

                <p className="mt-1 text-xs sm:text-sm text-slate-600 line-clamp-2">{task.description}</p>

                {/* Location & Reporter details for field technicians */}
                <div className="mt-3 flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                    <MapPin className="w-3.5 h-3.5 text-campus-700 shrink-0" />
                    <span>{task.building} • {task.floor} • {task.room_area}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Reporter: {task.reporter_name}
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Logged: {new Date(task.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Direct Field Action Buttons (One-Tap Workflow) */}
              <div className="pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                {task.status !== 'In Progress' && task.status !== 'Resolved' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={PlayCircle}
                    loading={updatingId === task.id}
                    onClick={() => handleQuickStatusUpdate(task.id, 'In Progress')}
                    className="min-h-[44px] bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Start Work
                  </Button>
                )}

                {task.status === 'In Progress' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle2}
                    loading={updatingId === task.id}
                    onClick={() => handleQuickStatusUpdate(task.id, 'Resolved')}
                    className="min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Mark Resolved
                  </Button>
                )}

                <Link to={`/issues/${task.id}`} className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" icon={Eye} className="w-full min-h-[44px]">
                    Work Order Details
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
