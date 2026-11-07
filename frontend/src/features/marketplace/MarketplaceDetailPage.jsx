import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  Gift,
  Repeat,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  XCircle,
  ShieldAlert,
} from 'lucide-react';

export default function MarketplaceDetailPage() {
  const { id } = useParams();
  const { user, role } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Request form state
  const [requestMessage, setRequestMessage] = useState('');
  const [requesting, setRequesting] = useState(false);

  // Handover confirmation dialog
  const [confirmDialogData, setConfirmDialogData] = useState(null);
  const [confirmingTx, setConfirmingTx] = useState(false);

  const fetchListingDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get(`/listings/${id}`);
      setItem(data);
    } catch (err) {
      setError(err.message || 'Listing not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await apiClient.get(`/listings/${id}`);
        if (!ignore) setItem(data);
      } catch (err) {
        if (!ignore) setError(err.message || 'Listing not found');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [id]);

  const isOwner = item?.owner_id === user?.id;

  const handleSendRequest = async (e) => {
    e.preventDefault();
    setRequesting(true);
    try {
      await apiClient.post(`/listings/${item.id}/requests`, {
        message: requestMessage.trim() || 'I am interested in receiving this item.',
      });
      setRequestMessage('');
      fetchListingDetail();
    } catch (err) {
      alert(err.message || 'Could not send request');
    } finally {
      setRequesting(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await apiClient.patch(`/requests/${requestId}`, { action: 'accept' });
      fetchListingDetail();
    } catch (err) {
      alert(err.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await apiClient.patch(`/requests/${requestId}`, { action: 'reject' });
      fetchListingDetail();
    } catch (err) {
      alert(err.message || 'Failed to reject request');
    }
  };

  // TC-12: Cancel accepted request when handover cannot occur
  const handleCancelAcceptedRequest = async (requestId) => {
    if (!window.confirm('Cancel this agreed handover? The listing will return to Available for other students.')) {
      return;
    }
    try {
      await apiClient.patch(`/requests/${requestId}`, { action: 'cancel' });
      fetchListingDetail();
    } catch (err) {
      alert(err.message || 'Failed to cancel handover');
    }
  };

  // Owner withdrawal
  const handleWithdrawListing = async () => {
    if (!window.confirm('Are you sure you want to withdraw this listing from the campus marketplace?')) {
      return;
    }
    try {
      await apiClient.patch(`/listings/${item.id}`, { status: 'Withdrawn' });
      fetchListingDetail();
    } catch (err) {
      alert(err.message || 'Failed to withdraw listing');
    }
  };

  // Administrator moderation
  const handleModerateListing = async () => {
    const reason = window.prompt('Administrative reason for moderating/withdrawing this listing:');
    if (!reason) return;
    try {
      await apiClient.patch(`/listings/${item.id}`, {
        status: 'Withdrawn',
        moderation_remarks: reason,
      });
      fetchListingDetail();
    } catch (err) {
      alert(err.message || 'Failed to moderate listing');
    }
  };

  const handleConfirmHandover = async () => {
    if (!confirmDialogData) return;
    setConfirmingTx(true);
    try {
      await apiClient.post(`/transactions/${confirmDialogData.transactionId}/confirm`);
      setConfirmDialogData(null);
      fetchListingDetail();
    } catch (err) {
      alert(err.message || 'Handover confirmation failed');
    } finally {
      setConfirmingTx(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <LoadingState message="Loading resource details..." />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ErrorState
          title="Listing Not Found"
          message={error || 'Could not find the requested marketplace item.'}
          retry={fetchListingDetail}
        />
        <Link to="/marketplace">
          <Button variant="ghost" icon={ArrowLeft} className="mt-4">
            Back to Marketplace
          </Button>
        </Link>
      </div>
    );
  }

  // Active accepted transaction (if any)
  const acceptedRequest = item.requests?.find(
    (r) => r.status === 'Accepted' || r.status === 'Completed'
  );
  const transaction = acceptedRequest?.transaction;

  const isRequester = acceptedRequest?.requester_id === user?.id;
  const myPendingRequest = item.requests?.find((r) => r.requester_id === user?.id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link
        to="/marketplace"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Marketplace Catalog
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Photo Column */}
          <div className="rounded-lg overflow-hidden bg-slate-100 border border-slate-200 aspect-4/3 flex items-center justify-center">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400">
                <BookOpen className="w-16 h-16 mb-2" />
                <span className="text-xs">No Photo Uploaded</span>
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {item.category}
                </span>
                <div className="flex items-center gap-2">
                  {isOwner && item.status === 'Available' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs py-1 px-2.5"
                      onClick={handleWithdrawListing}
                    >
                      Withdraw Listing
                    </Button>
                  )}
                  {role === 'admin' && item.status !== 'Withdrawn' && (
                    <Button
                      size="sm"
                      variant="outline"
                      icon={ShieldAlert}
                      className="text-slate-700 hover:bg-slate-100 text-xs py-1 px-2.5"
                      onClick={handleModerateListing}
                    >
                      Moderate
                    </Button>
                  )}
                  <StatusBadge status={item.status} />
                </div>
              </div>

              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{item.title}</h1>

              {/* Mode & Price / Barter */}
              <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                  Exchange Arrangement
                </div>
                {item.exchange_type === 'Donate' && (
                  <div className="text-base font-bold text-emerald-700 flex items-center gap-1.5 mt-1">
                    <Gift className="w-4 h-4" /> Free Peer Donation
                  </div>
                )}
                {item.exchange_type === 'Sell' && (
                  <div className="text-base font-bold text-sky-800 flex items-center gap-1 mt-1">
                    ₹{item.price_inr} (Direct Student Sale)
                  </div>
                )}
                {item.exchange_type === 'Exchange' && (
                  <div className="mt-1">
                    <div className="text-sm font-bold text-amber-800 flex items-center gap-1.5">
                      <Repeat className="w-4 h-4" /> Barter Swap
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Desired item: <strong>{item.desired_exchange_item}</strong>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block">Condition:</span>
                  <strong className="text-slate-800">{item.condition}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Listed Date:</span>
                  <strong className="text-slate-800">
                    {new Date(item.created_at).toLocaleDateString()}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Listing Owner:</span>
                  <strong className="text-slate-800">{item.owner_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">College ID / Email:</span>
                  <strong className="text-slate-800 truncate block">{item.owner_email}</strong>
                </div>
              </div>
            </div>

            {/* Request Button for non-owner students when Available */}
            {!isOwner && role === 'student' && item.status === 'Available' && !myPendingRequest && (
              <form onSubmit={handleSendRequest} className="mt-6 pt-4 border-t border-slate-100">
                <label htmlFor="req-msg" className="block text-xs font-semibold text-slate-700 mb-1">
                  Message to Owner:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="req-msg"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="E.g., I'd like to take this for 3rd semester..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                  />
                  <Button type="submit" size="sm" variant="primary" loading={requesting} icon={Send}>
                    Request Item
                  </Button>
                </div>
              </form>
            )}

            {!isOwner && myPendingRequest && item.status === 'Available' && (
              <div className="mt-6 p-3 rounded-lg bg-campus-50 border border-campus-200 text-xs text-campus-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-campus-600 shrink-0" />
                <span>Your request has been sent to {item.owner_name}. Waiting for owner review.</span>
              </div>
            )}
          </div>
        </div>

        {/* Item Description */}
        <div className="p-6 pt-2 border-t border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">Item Description & Notes</h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {item.description}
          </p>
        </div>
      </div>

      {/* DUAL-CONFIRMATION HANDOVER SECTION (TC-06, TC-07) */}
      {transaction && (
        <div className="bg-white rounded-xl border-2 border-campus-500 p-6 shadow-md mb-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-campus-700" />
              Verified Physical Handover Confirmation
            </h2>
            <StatusBadge status={item.status} />
          </div>

          <p className="text-xs text-slate-600 mt-2">
            <strong>Dual-Confirmation Policy:</strong> To ensure accurate operational sustainability metrics,
            an item is officially counted as reused only when <em>both</em> the listing owner and the requester
            confirm physical handover in person.
          </p>

          {/* Progress Indicators */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Owner Step */}
            <div
              className={`p-4 rounded-lg border text-xs ${
                transaction.owner_confirmed
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="font-semibold text-sm flex items-center justify-between">
                <span>1. Owner Handover</span>
                {transaction.owner_confirmed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <p className="mt-1">
                Owner: <strong>{item.owner_name}</strong>
              </p>
              <p className="text-[11px] mt-0.5">
                {transaction.owner_confirmed
                  ? `Confirmed on ${new Date(transaction.owner_confirmed_at).toLocaleString()}`
                  : 'Awaiting owner confirmation'}
              </p>

              {isOwner && !transaction.owner_confirmed && (
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      setConfirmDialogData({
                        transactionId: transaction.id,
                        title: 'Confirm Physical Handover',
                        message: `Do you confirm that you have physically handed over "${item.title}" to ${acceptedRequest.requester_name}?`,
                      })
                    }
                  >
                    Confirm Handover to {acceptedRequest.requester_name}
                  </Button>
                </div>
              )}
            </div>

            {/* Requester Step */}
            <div
              className={`p-4 rounded-lg border text-xs ${
                transaction.requester_confirmed
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="font-semibold text-sm flex items-center justify-between">
                <span>2. Requester Receipt</span>
                {transaction.requester_confirmed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <p className="mt-1">
                Recipient: <strong>{acceptedRequest.requester_name}</strong>
              </p>
              <p className="text-[11px] mt-0.5">
                {transaction.requester_confirmed
                  ? `Confirmed on ${new Date(transaction.requester_confirmed_at).toLocaleString()}`
                  : 'Awaiting recipient confirmation'}
              </p>

              {isRequester && !transaction.requester_confirmed && (
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      setConfirmDialogData({
                        transactionId: transaction.id,
                        title: 'Confirm Item Receipt',
                        message: `Do you confirm that you have physically received "${item.title}" in good condition from ${item.owner_name}?`,
                      })
                    }
                  >
                    Confirm Physical Receipt
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Completion Banner */}
          {transaction.completed_at ? (
            <div className="mt-4 p-3 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>
                Dual Handover Fully Confirmed on {new Date(transaction.completed_at).toLocaleString()}!
                This item has been officially recorded in campus sustainability reuse analytics.
              </span>
            </div>
          ) : (
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Waiting for {transaction.owner_confirmed ? 'requester' : 'owner'} to confirm.
                  (One confirmation alone does not increment reuse count).
                </span>
              </div>
              {isOwner && (
                <Button
                  size="sm"
                  variant="outline"
                  icon={XCircle}
                  className="border-amber-400 text-amber-900 hover:bg-amber-100 shrink-0 text-xs py-1 px-2.5"
                  onClick={() => handleCancelAcceptedRequest(acceptedRequest.id)}
                >
                  Cancel Handover (Return to Available)
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Owner Request Management View */}
      {isOwner && item.requests && item.requests.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900 mb-3">
            Incoming Exchange Requests ({item.requests.length})
          </h2>

          <div className="space-y-3">
            {item.requests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 text-sm">{req.requester_name}</strong>
                    <span className="text-slate-500">({req.requester_email})</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        req.status === 'Accepted'
                          ? 'bg-campus-100 text-campus-800'
                          : req.status === 'Completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-600 italic">"{req.message}"</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Requested on {new Date(req.created_at).toLocaleString()}
                  </p>
                </div>

                {req.status === 'Pending' && item.status === 'Available' && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleAcceptRequest(req.id)}
                    >
                      Accept Handover
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRejectRequest(req.id)}
                    >
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!confirmDialogData}
        title={confirmDialogData?.title}
        message={confirmDialogData?.message}
        confirmText="Yes, Confirm Handover"
        onConfirm={handleConfirmHandover}
        onCancel={() => setConfirmDialogData(null)}
        loading={confirmingTx}
      />
    </div>
  );
}
