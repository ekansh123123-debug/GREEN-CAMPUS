import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import FormField from '../../components/ui/FormField';
import AdminIssueAssignmentModal from './AdminIssueAssignmentModal';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  ThumbsUp,
  MapPin,
  Calendar,
  User,
  Wrench,
  Shield,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Building,
  MessageSquare,
} from 'lucide-react';

export default function IssueDetailPage() {
  const { id } = useParams();
  const { user, role } = useAuth();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Admin Modal
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Staff Update State
  const [staffStatus, setStaffStatus] = useState('In Progress');
  const [staffRemarks, setStaffRemarks] = useState('');
  const [updatingStaff, setUpdatingStaff] = useState(false);

  // Student Feedback State (Screen 6 / FR-07)
  const [feedbackSatisfaction, setFeedbackSatisfaction] = useState('Satisfied');
  const [feedbackComments, setFeedbackComments] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const fetchIssueDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get(`/issues/${id}`);
      setIssue(data);
      if (data?.status === 'In Progress') {
        setStaffStatus('Resolved');
      } else {
        setStaffStatus('In Progress');
      }
    } catch (err) {
      setError(err.message || 'Issue not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await apiClient.get(`/issues/${id}`);
        if (!ignore) {
          setIssue(data);
          if (data?.status === 'In Progress') {
            setStaffStatus('Resolved');
          } else {
            setStaffStatus('In Progress');
          }
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Issue not found');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [id]);

  const handleUpvoteToggle = async () => {
    if (!issue) return;
    if (issue.reporter_id === user.id) {
      alert('Students cannot upvote their own reported issue.');
      return;
    }

    try {
      if (issue.upvoted_by_me) {
        await apiClient.delete(`/issues/${issue.id}/upvote`);
        setIssue((prev) => ({
          ...prev,
          upvoted_by_me: false,
          upvote_count: Math.max(0, prev.upvote_count - 1),
        }));
      } else {
        await apiClient.post(`/issues/${issue.id}/upvote`);
        setIssue((prev) => ({
          ...prev,
          upvoted_by_me: true,
          upvote_count: prev.upvote_count + 1,
        }));
      }
    } catch (err) {
      alert(err.message || 'Upvote action failed');
    }
  };

  const handleStaffStatusUpdate = async (e) => {
    e.preventDefault();
    if (!staffRemarks.trim()) {
      alert('Please add a completion or progress remark.');
      return;
    }
    setUpdatingStaff(true);
    try {
      const updated = await apiClient.patch(`/issues/${issue.id}/status`, {
        status: staffStatus,
        remarks: staffRemarks.trim(),
      });
      setIssue(updated);
      setStaffRemarks('');
    } catch (err) {
      alert(err.message || 'Failed to update task status');
    } finally {
      setUpdatingStaff(false);
    }
  };

  const handleStudentFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackComments.trim()) {
      alert('Please add a brief note about the repair satisfaction.');
      return;
    }
    setSubmittingFeedback(true);
    try {
      const updated = await apiClient.post(`/issues/${issue.id}/feedback`, {
        satisfaction: feedbackSatisfaction,
        comments: feedbackComments.trim(),
      });
      setIssue(updated);
      setFeedbackComments('');
    } catch (err) {
      alert(err.message || 'Failed to submit satisfaction confirmation');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleAdminAssignSave = async (updatedData) => {
    try {
      const updated = await apiClient.patch(`/issues/${issue.id}/status`, updatedData);
      setIssue(updated);
    } catch (err) {
      alert(err.message || 'Failed to update priority');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <LoadingState message="Loading issue details..." />
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ErrorState
          title="Issue Not Found"
          message={error || 'Could not find the requested issue.'}
          retry={fetchIssueDetail}
        />
        <Link to="/issues">
          <Button variant="ghost" icon={ArrowLeft} className="mt-4">
            Back to Issues List
          </Button>
        </Link>
      </div>
    );
  }

  const isAssignedStaff = role === 'staff' && (issue.assigned_to_id === user.id || !issue.assigned_to_id);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      <Link to="/issues" className="inline-flex items-center gap-1.5 min-h-[36px] text-xs font-medium text-slate-500 hover:text-slate-800 mb-3">
        <ArrowLeft className="w-4 h-4" /> Back to all issues
      </Link>

      {/* Main Issue Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
              {issue.category}
            </span>
            <PriorityBadge priority={issue.priority} />
            <StatusBadge status={issue.status} />
          </div>

          <div className="flex items-center gap-2">
            {role === 'admin' && (
              <Button
                variant="outline"
                size="sm"
                icon={Shield}
                onClick={() => setShowAdminModal(true)}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Change Priority / Assign Staff
              </Button>
            )}

            {role === 'student' && (
              <Button
                variant={issue.upvoted_by_me ? 'primary' : 'secondary'}
                size="sm"
                icon={ThumbsUp}
                onClick={handleUpvoteToggle}
                disabled={issue.reporter_id === user.id}
                title={issue.reporter_id === user.id ? 'Cannot upvote own issue' : ''}
                className="w-full sm:w-auto min-h-[44px]"
              >
                {issue.upvoted_by_me ? 'Upvoted' : 'Upvote Issue'} ({issue.upvote_count})
              </Button>
            )}
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-4 tracking-tight">
          {issue.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            {issue.building}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            Floor: {issue.floor} • Room/Area: {issue.room_area}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Reported on {new Date(issue.created_at).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Reported by {issue.reporter_name}
          </span>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">Description</h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {issue.description}
          </p>
        </div>

        {/* Evidence Photo */}
        {issue.image_url && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Evidence Photo</h2>
            <div className="rounded-lg overflow-hidden border border-slate-200 max-w-md bg-slate-50">
              <img
                src={issue.image_url}
                alt={`Photo evidence for ${issue.title}`}
                className="w-full h-auto object-cover max-h-80"
              />
            </div>
          </div>
        )}

        {/* Assignment Box */}
        <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-slate-600" />
            Maintenance Assignment
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
            <div>
              <span className="text-slate-500">Department:</span>{' '}
              <strong>{issue.assigned_department || 'Unassigned (Awaiting Triage)'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Assigned Staff:</span>{' '}
              <strong>{issue.assigned_to_name || 'Not assigned yet'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Staff Action Form */}
      {isAssignedStaff && issue.status !== 'Resolved' && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-6 shadow-xs mb-6">
          <h3 className="text-base font-semibold text-amber-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-700" />
            Staff Maintenance Action
          </h3>
          <p className="text-xs text-amber-700 mt-1">
            As maintenance staff, you can update this work order to In Progress or Resolved and record inspection/completion remarks.
          </p>

          <form onSubmit={handleStaffStatusUpdate} className="mt-4 space-y-4">
            <FormField label="Target Status" id="staff-status" required>
              <select
                id="staff-status"
                value={staffStatus}
                onChange={(e) => setStaffStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
              >
                <option value="In Progress">In Progress (Work ongoing)</option>
                <option value="Resolved">Resolved (Repair completed & safe)</option>
              </select>
            </FormField>

            <FormField label="Staff Work Remarks" id="staff-remarks" required>
              <textarea
                id="staff-remarks"
                rows={3}
                value={staffRemarks}
                onChange={(e) => setStaffRemarks(e.target.value)}
                placeholder="Explain the repair work done, parts replaced, or ongoing inspection notes..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </FormField>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                loading={updatingStaff}
                icon={CheckCircle2}
                className="bg-amber-700 hover:bg-amber-800"
              >
                Submit Status Update
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Student Post-Resolution Confirmation & Feedback (Screen 6 / FR-07) */}
      {issue.status === 'Resolved' && (
        <div className="bg-emerald-50/70 rounded-xl border border-emerald-200 p-6 shadow-xs mb-6">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <h3 className="text-base font-semibold text-emerald-950 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Repair Resolution & Student Feedback
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              Work Completed
            </span>
          </div>

          {issue.feedback ? (
            <div className="mt-4 p-4 rounded-lg bg-white border border-emerald-200 text-xs">
              <div className="flex items-center justify-between font-semibold text-slate-900 mb-1">
                <span>Reporter Confirmation: {issue.feedback.satisfaction}</span>
                <span className="text-[11px] text-slate-400">
                  {new Date(issue.feedback.submitted_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-slate-700 italic">"{issue.feedback.comments}"</p>
            </div>
          ) : user?.id === issue.reporter_id ? (
            <form onSubmit={handleStudentFeedbackSubmit} className="mt-4 space-y-4">
              <p className="text-xs text-emerald-900">
                Maintenance has marked your reported issue as resolved. Please confirm whether the facility repair has been carried out to your satisfaction.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['Satisfied (Issue fully resolved)', 'Partially Resolved', 'Unsatisfied'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFeedbackSatisfaction(opt)}
                    className={`p-2.5 rounded-lg border text-xs text-left transition-all ${
                      feedbackSatisfaction === opt
                        ? 'border-emerald-600 bg-white ring-1 ring-emerald-600 font-semibold text-emerald-950'
                        : 'border-emerald-200 bg-emerald-50/50 text-emerald-800 hover:bg-white'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <FormField label="Resolution Remarks / Confirmation Note" id="feedback-comments" required>
                <textarea
                  id="feedback-comments"
                  rows={2}
                  value={feedbackComments}
                  onChange={(e) => setFeedbackComments(e.target.value)}
                  placeholder="E.g., Confirmed tap has stopped leaking and washroom is dry..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                />
              </FormField>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  loading={submittingFeedback}
                  icon={MessageSquare}
                  className="bg-emerald-700 hover:bg-emerald-800"
                >
                  Confirm Resolution Satisfaction
                </Button>
              </div>
            </form>
          ) : (
            <p className="mt-3 text-xs text-emerald-800">
              Awaiting reporting student ({issue.reporter_name}) satisfaction confirmation.
            </p>
          )}
        </div>
      )}

      {/* Audit History Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-500" />
          Status Audit History
        </h2>

        {issue.history && issue.history.length > 0 ? (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {issue.history.map((record, index) => (
              <div key={record.id || index} className="relative">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-campus-600 ring-4 ring-white" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={record.status} />
                    <span className="text-xs font-semibold text-slate-800">{record.actor}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(record.timestamp).toLocaleString()}
                  </span>
                </div>
                {record.remarks && (
                  <p className="mt-1 text-xs text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100">
                    {record.remarks}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No status transitions recorded yet.</p>
        )}
      </div>

      {/* Admin Assignment Modal */}
      <AdminIssueAssignmentModal
        isOpen={showAdminModal}
        issue={issue}
        onSave={handleAdminAssignSave}
        onClose={() => setShowAdminModal(false)}
      />
    </div>
  );
}
