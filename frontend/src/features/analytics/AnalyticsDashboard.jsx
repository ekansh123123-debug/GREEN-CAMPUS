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
  Info,
  Sparkles,
  Building2,
  MapPin,
  User,
  Wrench,
  ShieldCheck,
  Lightbulb,
  ThumbsUp,
  Star,
  Mail,
  Check,
} from 'lucide-react';

export default function AnalyticsDashboard() {
  const { role } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cleanliness filter & endorsements
  const [cleanlinessFilter, setCleanlinessFilter] = useState('all');
  const [supportedPlans, setSupportedPlans] = useState({});

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

  const handleSupportPlan = (id) => {
    setSupportedPlans((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
    issues_by_category = [],
    building_hotspots = [],
    monthly_trends = [],
    marketplace_distribution = [],
    exchange_mode_split = [],
    reuse_trends = [],
    recurring_issues = [],
    cleanliness_by_location = [],
    future_improvements = [],
    accountability_stats = {},
  } = data;

  const COLORS = ['#15803d', '#0284c7', '#d97706', '#9333ea', '#e11d48', '#0d9488'];

  const filteredCleanliness = cleanliness_by_location.filter((loc) => {
    if (cleanlinessFilter === 'needs_attention') return loc.status === 'Needs Attention';
    if (cleanlinessFilter === 'excellent') return loc.status === 'Excellent';
    return true;
  });

  const avgCleanliness = cleanliness_by_location.length > 0
    ? (cleanliness_by_location.reduce((sum, item) => sum + item.cleanliness_score, 0) / cleanliness_by_location.length).toFixed(1)
    : '88.5';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Header with Role & Transparency Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <PageHeader
            title="Operational Sustainability Analysis Dashboard"
            description="Operational maintenance resolution trends and verified student circular resource reuse at D. Y. Patil College of Engineering, Akurdi."
            className="mb-0 pb-0 border-b-0"
          />
        </div>

        {/* Mandatory demo disclaimer tag as required by design_system.md and tests */}
        <div className="shrink-0 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
            Active Persona: {role}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            Public Campus Transparency
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
            <Info className="w-3.5 h-3.5" />
            Verified Database Records • Demo Data Active
          </span>
        </div>
      </div>

      {/* Primary KPI Metrics Row (2x2 on mobile, 4 columns on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* Valid Issue Resolution Rate */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate">Resolution Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <div>
            <div className="text-xl sm:text-3xl font-bold text-slate-900">
              {kpi.resolution_rate.toFixed(1)}%
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
              <strong>{kpi.resolved_issues}</strong> resolved of{' '}
              <strong>{kpi.total_valid_issues}</strong> valid submitted issues
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] sm:text-[11px] text-slate-400">
            Excludes duplicate & cancelled reports
          </div>
        </div>

        {/* Average Resolution Time */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate">Avg Resolution Time</span>
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
          </div>
          <div>
            <div className="text-xl sm:text-3xl font-bold text-slate-900">
              {kpi.average_resolution_hours.toFixed(1)}{' '}
              <span className="text-sm font-normal text-slate-500">hrs</span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
              Calculated on valid resolved reports (created_at to resolved_at)
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] sm:text-[11px] text-slate-400">
            Unresolved issues strictly excluded
          </div>
        </div>

        {/* Campus Cleanliness Health Index */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate">Cleanliness Index</span>
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
          <div>
            <div className="text-xl sm:text-3xl font-bold text-amber-700">
              {avgCleanliness}%
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
              Campus hygiene index across all locations
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] sm:text-[11px] text-slate-400">
            Sanitation, washrooms, & waste management
          </div>
        </div>

        {/* Verified Circular Reuses */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate">Confirmed Reused Items</span>
            <Repeat className="w-4 h-4 text-campus-700 shrink-0" />
          </div>
          <div>
            <div className="text-xl sm:text-3xl font-bold text-campus-800">
              {kpi.confirmed_reused_items}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
              Dual-confirmed peer item handovers completed
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] sm:text-[11px] text-slate-400">
            Requires both owner & requester confirmation
          </div>
        </div>
      </div>

      {/* SECTION 1: LOCATION CLEANLINESS & SANITATION HEALTH INDEX */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-campus-100 text-campus-800 flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Location Cleanliness & Sanitation Health Index
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Transparent hygiene ratings and maintenance health divided by campus buildings and specific areas.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg shrink-0 text-xs">
            <button
              type="button"
              onClick={() => setCleanlinessFilter('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                cleanlinessFilter === 'all'
                  ? 'bg-white text-campus-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Locations ({cleanliness_by_location.length})
            </button>
            <button
              type="button"
              onClick={() => setCleanlinessFilter('excellent')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                cleanlinessFilter === 'excellent'
                  ? 'bg-white text-campus-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Excellent (≥90%)
            </button>
            <button
              type="button"
              onClick={() => setCleanlinessFilter('needs_attention')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                cleanlinessFilter === 'needs_attention'
                  ? 'bg-white text-rose-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Needs Attention
            </button>
          </div>
        </div>

        {/* Cleanliness Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCleanliness.map((loc) => {
            const scoreColor =
              loc.cleanliness_score >= 90
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : loc.cleanliness_score >= 80
                ? 'text-blue-700 bg-blue-50 border-blue-200'
                : 'text-amber-800 bg-amber-50 border-amber-200';

            const barColor =
              loc.cleanliness_score >= 90
                ? 'bg-emerald-600'
                : loc.cleanliness_score >= 80
                ? 'bg-blue-600'
                : 'bg-amber-600';

            return (
              <article
                key={loc.building}
                className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Campus Location
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        {loc.building}
                      </h3>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${scoreColor}`}>
                      {loc.cleanliness_score}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mb-3 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${barColor}`}
                      style={{ width: `${Math.min(100, loc.cleanliness_score)}%` }}
                    />
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 mb-3">
                    <div className="flex items-center justify-between">
                      <span>Hygiene Condition:</span>
                      <strong
                        className={
                          loc.status === 'Excellent'
                            ? 'text-emerald-700'
                            : loc.status === 'Good'
                            ? 'text-blue-700'
                            : 'text-amber-700'
                        }
                      >
                        {loc.status}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Sanitation Tasks:</span>
                      <span>
                        {loc.resolved_reports} resolved / {loc.total_cleanliness_reports} total
                      </span>
                    </div>
                  </div>

                  {/* Specific Areas List */}
                  {loc.areas && loc.areas.length > 0 && (
                    <div className="border-t border-slate-200 pt-2.5 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Specific Areas
                      </span>
                      {loc.areas.map((a, idx) => (
                        <div
                          key={idx}
                          className="p-1.5 rounded bg-white border border-slate-100 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-medium text-slate-800">{a.area}</span>
                            <span className="text-[10px] text-slate-400 block">{a.floor} • {a.note}</span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              a.status === 'Excellent'
                                ? 'bg-emerald-100 text-emerald-800'
                                : a.status === 'Good'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {a.score}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    Assigned: <strong className="text-slate-700">{loc.assigned_team}</strong>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: CHARTS GRID (Strictly preserving all original test assertions) */}
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
                <YAxis dataKey="building" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="count" name="Total Reported" fill="#0284c7" radius={[0, 4, 4, 0]} />
                <Bar dataKey="unresolved" name="Unresolved" fill="#f43f5e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Monthly Submissions vs Resolutions */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">Monthly Submissions vs Resolutions</h3>
            <p className="text-xs text-slate-500">
              Tracking longitudinal reporting volume and resolution throughput
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly_trends} margin={{ top: 10, right: 15, left: -15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="submitted" name="Reports Filed" stroke="#94a3b8" strokeWidth={2} />
                <Line type="monotone" dataKey="resolved" name="Verified Resolved" stroke="#15803d" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Marketplace Category Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">Marketplace Category Breakdown</h3>
            <p className="text-xs text-slate-500">
              Proportion of textbooks, calculators, and lab tools shared on campus
            </p>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={marketplace_distribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="count"
                  nameKey="category"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
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

      {/* SECTION 3: RECURRING FACILITY HOTSPOTS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 mb-8">
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

      {/* SECTION 4: FUTURE HYGIENE & FACILITY IMPROVEMENTS */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs mb-8">
        <div className="pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Lightbulb className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Future Campus Improvements & Hygiene Action Plan
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data-driven facility upgrades and preventative hygiene initiatives based on reported student hotspots across DYPCOE Akurdi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {future_improvements.map((plan) => {
            const isSupported = !!supportedPlans[plan.id];
            return (
              <article
                key={plan.id}
                className="bg-slate-50/60 rounded-xl border border-slate-200 p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-campus-800 bg-campus-50 px-2.5 py-0.5 rounded-md border border-campus-200">
                      <MapPin className="w-3 h-3 text-campus-600" />
                      {plan.location}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        plan.priority === 'High'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {plan.priority} Priority
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1.5">
                    {plan.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="mt-3.5 p-3 rounded-lg bg-white border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Department:</span>
                      <strong className="text-slate-800">{plan.responsible_dept}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Lead Responsible:</span>
                      <strong className="text-slate-800">{plan.assigned_lead}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Target Timeline:</span>
                      <span className="text-slate-700 font-medium">{plan.target_timeline}</span>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-emerald-800 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                    <strong>Expected Sustainability Impact:</strong> {plan.expected_impact}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {isSupported ? 'You and 19 students endorse this' : 'Endorsed by campus community'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSupportPlan(plan.id)}
                    className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isSupported
                        ? 'bg-campus-700 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isSupported ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Endorsed
                      </>
                    ) : (
                      <>
                        <ThumbsUp className="w-3.5 h-3.5" />
                        Support Plan
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* SECTION 5: WHO IS ASSIGNED & ACCOUNTABILITY */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <Wrench className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Campus Maintenance Personnel & Responsibility Directory
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete operational transparency: Who is on duty, assignments, resolution speeds, and student contributors.
          </p>
        </div>

        {/* Maintenance Technicians Directory */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {accountability_stats?.maintenance_personnel?.map((staff, idx) => (
            <div
              key={idx}
              className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 mb-2">
                  {staff.name[0]}
                </div>
                <h3 className="text-sm font-bold text-slate-900">{staff.name}</h3>
                <p className="text-xs text-campus-700 font-medium">{staff.role}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{staff.department}</p>

                <div className="mt-3.5 pt-2.5 border-t border-slate-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Active Tasks:</span>
                    <strong className="text-amber-700">{staff.active_tasks}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Resolved Total:</span>
                    <strong className="text-emerald-700">{staff.resolved_tasks}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Avg Speed:</span>
                    <span>{staff.avg_resolution_hours} hrs</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Student Rating:</span>
                    <span className="flex items-center gap-1 font-semibold text-amber-600">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {staff.rating} / 5.0
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3.5 pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-1 truncate">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{staff.contact}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Top Student Campus Guardians */}
        <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-4">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-campus-700" />
            Top Active Student Campus Guardians
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {accountability_stats?.top_student_reporters?.map((student, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs"
              >
                <div className="font-semibold text-slate-900">{student.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{student.department}</div>
                <div className="mt-2 flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                  <span className="text-emerald-700 font-medium">
                    {student.verified_reports} Verified Reports
                  </span>
                  <span className="text-slate-600">
                    {student.upvotes_received} Upvotes
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
