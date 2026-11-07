import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import { PRIORITIES, DEPARTMENTS, ISSUE_STATUSES } from '../../lib/constants';
import { DEMO_USERS } from '../../data/mockData';

export default function AdminIssueAssignmentModal({
  isOpen,
  issue,
  onSave,
  onClose,
}) {
  const [priority, setPriority] = useState(issue?.priority || PRIORITIES.MEDIUM);
  const [department, setDepartment] = useState(issue?.assigned_department || DEPARTMENTS[0]);
  const [status, setStatus] = useState(issue?.status || ISSUE_STATUSES.ASSIGNED);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !issue) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        priority,
        assigned_department: department,
        assigned_to_name: DEMO_USERS.staff.name,
        assigned_to_id: DEMO_USERS.staff.id,
        status: status === ISSUE_STATUSES.SUBMITTED ? ISSUE_STATUSES.ASSIGNED : status,
        remarks: remarks || `Admin updated priority to ${priority} and assigned to ${department}.`,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-assign-title"
    >
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900">
            <ShieldAlert className="w-5 h-5 text-blue-700" />
            <h2 id="admin-assign-title" className="text-base font-semibold">
              Admin Triage & Priority Assignment
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 bg-slate-50 p-3 rounded-md text-xs text-slate-700">
          <p className="font-semibold text-slate-900">{issue.title}</p>
          <p className="text-slate-500 mt-0.5">
            Location: {issue.building} ({issue.floor}, {issue.room_area})
          </p>
          <p className="text-slate-500">
            Affected Student Upvotes: <strong>{issue.upvote_count}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <FormField label="Official Priority" id="assign-priority" required>
            <select
              id="assign-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-campus-600 focus:ring-1 focus:ring-campus-600 bg-white"
            >
              {Object.values(PRIORITIES).map((p) => (
                <option key={p} value={p}>
                  {p} {p === 'Critical' ? '(Immediate Hazard)' : ''}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Responsible Department" id="assign-dept" required>
            <select
              id="assign-dept"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-campus-600 focus:ring-1 focus:ring-campus-600 bg-white"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Assign Staff Member" id="assign-staff">
            <input
              id="assign-staff"
              type="text"
              readOnly
              value={`${DEMO_USERS.staff.name} (${DEMO_USERS.staff.student_id})`}
              className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-md text-sm text-slate-600 cursor-not-allowed"
            />
          </FormField>

          <FormField label="Issue Classification / Status" id="assign-status">
            <select
              id="assign-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-campus-600 focus:ring-1 focus:ring-campus-600 bg-white"
            >
              <option value={ISSUE_STATUSES.ASSIGNED}>Assigned (Ready for Staff)</option>
              <option value={ISSUE_STATUSES.IN_PROGRESS}>In Progress</option>
              <option value={ISSUE_STATUSES.RESOLVED}>Resolved</option>
              <option value={ISSUE_STATUSES.DUPLICATE}>Duplicate (Exclude from metrics)</option>
              <option value={ISSUE_STATUSES.CANCELLED}>Cancelled (Invalid)</option>
            </select>
          </FormField>

          <FormField label="Administrative Remarks" id="assign-remarks">
            <textarea
              id="assign-remarks"
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="E.g., Assigned to plumbing staff. High priority due to water loss."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-campus-600 focus:ring-1 focus:ring-campus-600"
            />
          </FormField>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              icon={CheckCircle2}
            >
              Save & Assign
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
