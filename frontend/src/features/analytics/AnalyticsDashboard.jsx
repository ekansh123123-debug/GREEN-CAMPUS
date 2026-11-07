import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  CheckCircle2,
  Clock,
  Repeat,
  AlertCircle,
  TrendingUp,
  Info,
} from 'lucide-react';

export default function AnalyticsDashboard() {
  const { role } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/analytics/overview');
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load sustainability analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await apiClient.get('/analytics/overview');
        if (!ignore) setData(res);
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load sustainability analytics');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  if (role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Administrator Access Required</h2>
        <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
          Operational sustainability analytics are restricted to campus administrators. Use the top
          persona switcher to switch to the Administrator role to review this dashboard.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingState message="Aggregating campus operational sustainability records..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorState message={error || 'Unable to display analytics'} retry={fetchAnalytics} />
      </div>
    );
  }

  const {
    kpi,
    issues_by_category,
    building_hotspots,
    monthly_trends,
    marketplace_distribution,
    exchange_mode_split,
    reuse_trends,
    recurring_issues,
  } = data;

  const COLORS = ['#15803d', '#0284c7', '#d97706', '#9333ea', '#e11d48', '#0d9488'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <PageHeader
            title="Operational Sustainability Analysis Dashboard"
            description="Operational maintenance resolution trends and verified student circular resource reuse at D. Y. Patil College of Engineering, Akurdi."
            className="mb-0 pb-0 border-b-0"
          />
        </div>

        {/* Mandatory demo disclaimer tag as required by design_system.md */}
        <div className="shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
            <Info className="w-3.5 h-3.5" />
            Verified Database Records • Demo Data Active
          </span>
        </div>
      </div>

      {/* Primary KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Valid Issue Resolution Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Resolution Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {kpi.resolution_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-slate-500 mt-1">
              <strong>{kpi.resolved_issues}</strong> resolved of{' '}
              <strong>{kpi.total_valid_issues}</strong> valid submitted issues
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            Excludes duplicate & cancelled reports
          </div>
        </div>

        {/* Average Resolution Time */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Resolution Time</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {kpi.average_resolution_hours.toFixed(1)}{' '}
              <span className="text-sm font-normal text-slate-500">hrs</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Calculated on valid resolved reports (created_at to resolved_at)
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            Unresolved issues strictly excluded
          </div>
        </div>

        {/* Verified Circular Reuses */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Confirmed Reused Items</span>
            <Repeat className="w-4 h-4 text-campus-700" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-campus-800">
              {kpi.confirmed_reused_items}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Dual-confirmed peer item handovers completed
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            Requires both owner & requester confirmation
          </div>
        </div>

        {/* Active Marketplace Slices */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Marketplace Pipeline</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {kpi.active_available_listings + kpi.pending_requested_listings}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              <strong>{kpi.active_available_listings}</strong> Available •{' '}
              <strong>{kpi.pending_requested_listings}</strong> Handover in progress
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            Raw state counts reported alongside rates
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Chart 1: Issues by Category */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">Campus Issues by Category</h3>
            <p className="text-xs text-slate-500">
              Breakdown of total submitted vs resolved issues per domain
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={issues_by_category} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="count" name="Submitted Issues" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved Issues" fill="#15803d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Building Hotspots */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">Campus Building Hotspots</h3>
            <p className="text-xs text-slate-500">
              Facility maintenance load distribution across DYPCOE premises
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={building_hotspots} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="building" tick={{ fontSize: 10 }} width={130} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="count" name="Total Issues" fill="#0284c7" radius={[0, 4, 4, 0]} />
                <Bar dataKey="unresolved" name="Active / Pending" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Monthly Issue Trend */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">Monthly Submissions vs Resolutions</h3>
            <p className="text-xs text-slate-500">Monthly operational maintenance velocity</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly_trends} margin={{ top: 10, right: 20, left: -15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="submitted"
                  name="Submissions"
                  stroke="#64748b"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  name="Resolutions"
                  stroke="#15803d"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Marketplace Exchange Categories */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">Marketplace Category Breakdown</h3>
            <p className="text-xs text-slate-500">Distribution of shared academic resources</p>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={marketplace_distribution}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={45}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {marketplace_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Confirmed Circular Reuse Trend Line */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">Confirmed Resource Reuse Trends</h3>
            <p className="text-xs text-slate-500">
              Dual-confirmed student item handovers over time (cumulative verified reuse)
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reuse_trends} margin={{ top: 10, right: 20, left: -15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="confirmed_reuses"
                  name="Verified Reuses"
                  stroke="#15803d"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: '#15803d' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 6: Exchange Arrangement Split */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">Exchange Arrangement Breakdown</h3>
            <p className="text-xs text-slate-500">
              Distribution across Free Donation, Direct Sale, and Barter Exchange
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={exchange_mode_split} margin={{ top: 10, right: 20, left: -15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mode" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="count" name="Total Listings" radius={[4, 4, 0, 0]}>
                  {exchange_mode_split.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recurring Issues Hotspot Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Recurring Facility Hotspots & Repeat Repairs
            </h3>
            <p className="text-xs text-slate-500">
              Pinpoints locations with multiple unresolved or frequent maintenance incidents.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Campus Location</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Repeat Count</th>
                <th className="py-3 px-4 text-center">Avg Repair Time</th>
                <th className="py-3 px-4 text-right">Current State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recurring_issues.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-medium text-slate-900">{row.location}</td>
                  <td className="py-3 px-4">{row.category}</td>
                  <td className="py-3 px-4 text-center font-bold text-amber-800">
                    {row.occurrences} incidents
                  </td>
                  <td className="py-3 px-4 text-center">{row.avg_hours} hrs</td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-900">
                      {row.current_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
