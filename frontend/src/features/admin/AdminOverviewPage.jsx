import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import AdminIssueAssignmentModal from '../issues/AdminIssueAssignmentModal';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  UserCheck,
  AlertCircle,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Shield,
  Eye,
  Building,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminOverviewPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'triage' | 'marketplace'

  // Data states
  const [pendingUsers, setPendingUsers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Admin Triage Modal
  const [selectedIssue, setSelectedIssue] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, issuesRes, listingsRes] = await Promise.all([
        apiClient.get('/users/pending'),
        apiClient.get('/issues'),
        apiClient.get('/listings'),
      ]);
      setPendingUsers(usersRes || []);
      setIssues(issuesRes || []);
      setListings(listingsRes || []);
    } catch (err) {
      setError(err.message || 'Failed to load administrator records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      try {
        const [usersRes, issuesRes, listingsRes] = await Promise.all([
          apiClient.get('/users/pending'),
          apiClient.get('/issues'),
          apiClient.get('/listings'),
        ]);
        if (!ignore) {
          setPendingUsers(usersRes || []);
          setIssues(issuesRes || []);
          setListings(listingsRes || []);
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load administrator records');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchData();
    return () => {
      ignore = true;
    };
  }, []);

  const handleVerifyUser = async (userId) => {
    try {
      await apiClient.patch(`/users/${userId}/verify`);
      setPendingUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_verified: true } : u))
      );
    } catch (err) {
      alert(err.message || 'User verification failed');
    }
  };

  const handleModerateListing = async (listingId) => {
    const reason = window.prompt('Administrative reason for moderating this listing:');
    if (!reason) return;
    try {
      await apiClient.patch(`/listings/${listingId}`, {
        status: 'Withdrawn',
        moderation_remarks: reason,
      });
      setListings((prev) =>
        prev.map((l) => (l.id === listingId ? { ...l, status: 'Withdrawn' } : l))
      );
    } catch (err) {
      alert(err.message || 'Failed to moderate listing');
    }
  };

  const handleTriageSave = async (updatedData) => {
    if (!selectedIssue) return;
    try {
      const updated = await apiClient.patch(`/issues/${selectedIssue.id}/status`, updatedData);
      setIssues((prev) => prev.map((i) => (i.id === selectedIssue.id ? updated : i)));
    } catch (err) {
      alert(err.message || 'Assignment update failed');
    }
  };

  if (role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Administrator Access Required</h2>
        <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
          User verification, priority triage, and marketplace moderation require campus administrator credentials.
          Switch to the Administrator persona to view this screen.
        </p>
      </div>
    );
  }

  const unassignedIssues = issues.filter(
    (i) => i.status === 'Submitted' || !i.assigned_department
  );
  const unverifiedUsers = pendingUsers.filter((u) => !u.is_verified);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Administrator Control Center"
        description="Review incoming institutional user registrations, triage reported campus maintenance issues, and moderate resource marketplace transactions."
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'users'
              ? 'border-campus-600 text-campus-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          User Verification
          {unverifiedUsers.length > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-900 font-bold">
              {unverifiedUsers.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('triage')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'triage'
              ? 'border-campus-600 text-campus-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          Issue Triage Queue
          {unassignedIssues.length > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-rose-100 text-rose-900 font-bold">
              {unassignedIssues.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('marketplace')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'marketplace'
              ? 'border-campus-600 text-campus-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Marketplace Moderation
        </button>
      </div>

      {loading ? (
        <LoadingState message="Loading administrative records..." />
      ) : error ? (
        <ErrorState message={error} retry={loadData} />
      ) : (
        <div>
          {/* Tab 1: User Verification Queue */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-slate-900">
                  Institutional Account Verification Queue
                </h2>
                <p className="text-xs text-slate-500">
                  Verify students and staff requesting platform access with official @dypcoeakurdi.ac.in credentials.
                </p>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No pending user verifications. All campus accounts are up to date.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Name & Role</th>
                        <th className="py-3 px-4">Institutional Email</th>
                        <th className="py-3 px-4">Student / Staff ID</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {pendingUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4">
                            <strong className="text-slate-900 block">{u.name}</strong>
                            <span className="text-[11px] text-slate-500 capitalize">{u.role}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-800">{u.email}</td>
                          <td className="py-3 px-4 font-medium text-slate-800">{u.student_id}</td>
                          <td className="py-3 px-4">{u.department}</td>
                          <td className="py-3 px-4">
                            {u.is_verified ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-semibold text-[11px]">
                                <Clock className="w-3.5 h-3.5" /> Awaiting Review
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {!u.is_verified && (
                              <Button
                                size="sm"
                                variant="primary"
                                icon={CheckCircle2}
                                onClick={() => handleVerifyUser(u.id)}
                              >
                                Approve Account
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Issue Triage Queue */}
          {activeTab === 'triage' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Awaiting Triage & Assignment ({unassignedIssues.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Set administrative priority (Low/Medium/High/Critical) and assign responsible department & staff.
                  </p>
                </div>
                <Link to="/issues">
                  <Button variant="ghost" size="sm" icon={Eye}>
                    All Campus Issues ({issues.length})
                  </Button>
                </Link>
              </div>

              {unassignedIssues.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  All submitted campus issues have been assigned to departments!
                </div>
              ) : (
                <div className="space-y-3">
                  {unassignedIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold text-[11px]">
                            {issue.category}
                          </span>
                          <StatusBadge status={issue.status} />
                          <PriorityBadge priority={issue.priority} />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900">{issue.title}</h3>
                        <p className="text-slate-600 line-clamp-2 mt-0.5">{issue.description}</p>
                        <div className="flex items-center gap-3 text-slate-400 mt-2 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3" /> {issue.building} ({issue.floor})
                          </span>
                          <span>•</span>
                          <span>{issue.upvote_count} affected student upvotes</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          icon={Shield}
                          onClick={() => setSelectedIssue(issue)}
                        >
                          Triage & Assign
                        </Button>
                        <Link to={`/issues/${issue.id}`}>
                          <Button size="sm" variant="ghost">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Marketplace Moderation */}
          {activeTab === 'marketplace' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Marketplace Resource Moderation
                  </h2>
                  <p className="text-xs text-slate-500">
                    Audit academic peer listings for safety, appropriateness, and compliance with campus policy.
                  </p>
                </div>
                <Link to="/marketplace">
                  <Button variant="ghost" size="sm" icon={Eye}>
                    Student Catalog View
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {listings.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-700">{item.category}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600">{item.condition}</span>
                        <StatusBadge status={item.status} />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Listed by {item.owner_name} ({item.owner_email}) • Mode: {item.exchange_type}
                      </p>
                      {item.moderation_remarks && (
                        <p className="text-rose-600 text-[11px] mt-1 italic">
                          Moderation note: {item.moderation_remarks}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.status !== 'Withdrawn' && item.status !== 'Exchanged' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs"
                          onClick={() => handleModerateListing(item.id)}
                        >
                          Moderate / Remove
                        </Button>
                      )}
                      <Link to={`/marketplace/${item.id}`}>
                        <Button size="sm" variant="ghost">
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Assignment Modal */}
      <AdminIssueAssignmentModal
        isOpen={!!selectedIssue}
        issue={selectedIssue}
        onSave={handleTriageSave}
        onClose={() => setSelectedIssue(null)}
      />
    </div>
  );
}
