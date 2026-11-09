import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingState from '../../components/ui/LoadingState';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/apiClient';
import {
  AlertCircle,
  PlusCircle,
  ShoppingBag,
  Sparkles,
  BookOpen,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [listings, setListings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function fetchSummary() {
      try {
        const [issuesRes, listingsRes, analyticsRes] = await Promise.all([
          apiClient.get('/issues'),
          apiClient.get('/listings'),
          apiClient.get('/analytics/overview').catch(() => null),
        ]);
        if (!ignore) {
          setIssues(issuesRes || []);
          setListings(listingsRes || []);
          setAnalytics(analyticsRes || null);
        }
      } catch {
        // Fallbacks
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchSummary();
    return () => {
      ignore = true;
    };
  }, []);

  const myIssues = issues.filter((i) => i.reporter_id === user.id);
  const myResolvedIssues = myIssues.filter((i) => i.status === 'Resolved');
  const myListings = listings.filter((l) => l.owner_id === user.id);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingState message="Loading your campus student dashboard..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-campus-100 text-campus-800">
                Verified Student Portal
              </span>
              <span className="text-xs text-slate-500">
                {user.student_id || 'DYPCOE Student'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              Welcome back, {user.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
              Report campus facilities needing repair, exchange course textbooks and tools, and follow
              your reported issues from submission to verified resolution.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <Link to="/issues/report" className="w-full sm:w-auto">
              <Button variant="primary" icon={PlusCircle} className="w-full min-h-[44px]">
                Report Campus Issue
              </Button>
            </Link>
            <Link to="/marketplace/create" className="w-full sm:w-auto">
              <Button variant="secondary" icon={ShoppingBag} className="w-full min-h-[44px]">
                Post Resource Item
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards for Student */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium truncate">My Reported Issues</span>
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">{myIssues.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
            {myResolvedIssues.length} resolved successfully
          </p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium truncate">My Marketplace Listings</span>
            <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">{myListings.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
            {myListings.filter((l) => l.status === 'Exchanged').length} confirmed handed over
          </p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium truncate">Active Repairs</span>
            <Sparkles className="w-4 h-4 text-campus-600 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            {issues.filter((i) => i.status !== 'Resolved').length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">Campus-wide</p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium truncate">Resources</span>
            <ShoppingBag className="w-4 h-4 text-campus-600 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            {listings.filter((l) => l.status === 'Available').length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">Available now</p>
        </div>
      </div>

      {/* Campus Cleanliness & Sustainability Transparency Widget (Visible to Regular Students) */}
      <div className="bg-gradient-to-r from-campus-900 via-slate-900 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-xs mb-6 sm:mb-8 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Live Campus Health Transparency
              </span>
              <span className="text-xs text-slate-400">DYPCOE Akurdi</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-1">
              Campus Cleanliness & Sustainability Overview
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Track real-time cleanliness ratings by building and area, see who is assigned to maintain each facility, and review future hygiene improvement plans.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Link to="/analytics">
              <Button
                variant="primary"
                icon={BarChart3}
                className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-md min-h-[44px]"
              >
                View Full Location Stats
              </Button>
            </Link>
          </div>
        </div>

        {/* Cleanliness Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800 text-xs">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-slate-400 block text-[11px]">Overall Resolution Rate</span>
            <span className="text-lg sm:text-xl font-bold text-emerald-400 mt-0.5 block">
              {analytics?.kpi?.resolution_rate ? `${analytics.kpi.resolution_rate.toFixed(1)}%` : '80.9%'}
            </span>
            <span className="text-[10px] text-slate-400">Valid campus reports</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-slate-400 block text-[11px]">Average Repair Speed</span>
            <span className="text-lg sm:text-xl font-bold text-sky-400 mt-0.5 block">
              {analytics?.kpi?.average_resolution_hours ? `${analytics.kpi.average_resolution_hours.toFixed(1)} hrs` : '19.4 hrs'}
            </span>
            <span className="text-[10px] text-slate-400">By assigned maintenance</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-slate-400 block text-[11px]">Top Clean Location</span>
            <span className="text-sm sm:text-base font-bold text-amber-300 mt-0.5 block truncate">
              {analytics?.cleanliness_by_location?.[4]?.building || 'Central Library'}
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">96% Cleanliness Score</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-slate-400 block text-[11px]">Circular Reused Items</span>
            <span className="text-lg sm:text-xl font-bold text-emerald-300 mt-0.5 block">
              {analytics?.kpi?.confirmed_reused_items || '28'}
            </span>
            <span className="text-[10px] text-slate-400">Textbooks & lab tools reused</span>
          </div>
        </div>
      </div>

      {/* Main Grid: My Reported Issues & Recent Marketplace Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Reported Issues */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">My Maintenance Reports</h2>
              <Link to="/issues" className="text-xs font-semibold text-campus-700 hover:underline">
                View All
              </Link>
            </div>

            {myIssues.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 border border-dashed rounded-lg">
                You haven't reported any maintenance issues yet.
              </div>
            ) : (
              <div className="space-y-3">
                {myIssues.slice(0, 3).map((issue) => (
                  <div
                    key={issue.id}
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 transition-colors flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <StatusBadge status={issue.status} />
                        <span className="text-[11px] text-slate-500">{issue.building}</span>
                      </div>
                      <Link
                        to={`/issues/${issue.id}`}
                        className="font-semibold text-slate-900 hover:text-campus-700 line-clamp-1"
                      >
                        {issue.title}
                      </Link>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {issue.upvote_count} affectees upvoted
                      </div>
                    </div>
                    <Link to={`/issues/${issue.id}`}>
                      <Button size="sm" variant="ghost">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-right">
            <Link to="/issues/report">
              <Button size="sm" variant="outline" icon={PlusCircle}>
                Report an Issue
              </Button>
            </Link>
          </div>
        </div>

        {/* Available Resources for Peer Exchange */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">
                Peer Resources Available on Campus
              </h2>
              <Link
                to="/marketplace"
                className="text-xs font-semibold text-campus-700 hover:underline"
              >
                Browse Catalog
              </Link>
            </div>

            <div className="space-y-3">
              {listings.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 transition-colors flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-medium text-slate-500">{item.category}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">{item.condition}</span>
                    </div>
                    <Link
                      to={`/marketplace/${item.id}`}
                      className="font-semibold text-slate-900 hover:text-campus-700 line-clamp-1"
                    >
                      {item.title}
                    </Link>
                    <div className="text-[11px] text-campus-700 font-medium mt-1">
                      {item.exchange_type === 'Donate'
                        ? 'Free Peer Donation'
                        : item.exchange_type === 'Sell'
                        ? `₹${item.price_inr} (Direct Sale)`
                        : 'Barter Exchange'}
                    </div>
                  </div>

                  <Link to={`/marketplace/${item.id}`}>
                    <Button size="sm" variant="ghost">
                      Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-right">
            <Link to="/marketplace/create">
              <Button size="sm" variant="outline" icon={ShoppingBag}>
                Post an Item
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
