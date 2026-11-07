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
  Wrench,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export default function StaffTaskPortal() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const activeTasks = tasks.filter((t) => t.status !== 'Resolved' && t.status !== 'Cancelled');
  const completedTasks = tasks.filter((t) => t.status === 'Resolved');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Maintenance Staff Work Order Portal"
        description={`Active tasks assigned to ${user.name} (${user.department || 'Facility Support'}). Update ongoing status and record repair logs.`}
      />

      {/* KPI mini-bar for staff */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Pending & In Progress</div>
            <div className="text-2xl font-bold text-amber-700 mt-1">{activeTasks.length}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Completed Repairs</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{completedTasks.length}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">High / Critical Tasks</div>
            <div className="text-2xl font-bold text-rose-700 mt-1">
              {activeTasks.filter((t) => t.priority === 'High' || t.priority === 'Critical').length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading your assigned maintenance orders..." />
      ) : error ? (
        <ErrorState message={error} retry={fetchTasks} />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No assigned tasks"
          description="You currently have no pending maintenance orders assigned by administration."
        />
      ) : (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900 mb-2">Assigned Work Queue</h2>
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-xl border p-5 shadow-xs transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                task.priority === 'Critical'
                  ? 'border-rose-300 ring-1 ring-rose-100'
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
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                      Immediate Attention Required
                    </span>
                  )}
                </div>

                <Link to={`/issues/${task.id}`}>
                  <h3 className="text-base font-bold text-slate-900 hover:text-campus-700 transition-colors">
                    {task.title}
                  </h3>
                </Link>

                <p className="mt-1 text-xs text-slate-600 line-clamp-2">{task.description}</p>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {task.building} ({task.floor}, {task.room_area})
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Assigned: {new Date(task.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <Link to={`/issues/${task.id}`}>
                  <Button variant="primary" size="sm" icon={Wrench}>
                    Update Repair Work
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
