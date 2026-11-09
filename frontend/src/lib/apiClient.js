// GREEN CAMPUS — Canonical API Client
// Handles base URL, auth token header, JSON serialization, and error translation.
// Includes a local demo fallback provider when backend is offline.

import { INITIAL_ISSUES, INITIAL_LISTINGS, INITIAL_ANALYTICS, DEMO_USERS, INITIAL_PENDING_USERS } from '../data/mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// In-memory demo state fallback
let demoIssues = [...INITIAL_ISSUES];
let demoListings = [...INITIAL_LISTINGS];
let demoAnalytics = { ...INITIAL_ANALYTICS };
let demoPendingUsers = [...INITIAL_PENDING_USERS];

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getStoredToken() {
  return localStorage.getItem('green_campus_token');
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem('green_campus_token', token);
  } else {
    localStorage.removeItem('green_campus_token');
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('green_campus_user');
    return raw ? JSON.parse(raw) : DEMO_USERS.student;
  } catch {
    return DEMO_USERS.student;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('green_campus_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('green_campus_user');
  }
}

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      setStoredToken(null);
      // Let caller handle or redirect
    }

    if (!res.ok) {
      let errData = null;
      try {
        errData = await res.json();
      } catch {
        // Response wasn't json
      }
      throw new ApiError(
        errData?.detail || `API error ${res.status}: ${res.statusText}`,
        res.status,
        errData
      );
    }

    if (res.status === 204) {
      return null;
    }

    return await res.json();
  } catch (err) {
    // If backend is unreachable (network error / fetch failed), fall back to demo simulation
    if (err instanceof ApiError) {
      throw err;
    }
    // Network failure -> simulate via demo engine
    return simulateDemoResponse(endpoint, options);
  }
}

// -------------------------------------------------------------
// Interactive Demo Engine (Active when backend is not connected)
// -------------------------------------------------------------
async function simulateDemoResponse(endpoint, options = {}) {
  const method = options.method || 'GET';
  const currentUser = getStoredUser();

  // Auth: /auth/login
  if (endpoint === '/auth/login' && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const matched = Object.values(DEMO_USERS).find((u) => u.email === body.email) || {
      id: 99,
      name: body.email.split('@')[0],
      email: body.email,
      role: 'student',
      is_verified: true,
      department: 'General Engineering',
    };
    const token = `demo-jwt-${matched.role}-${Date.now()}`;
    return { access_token: token, token_type: 'bearer', user: matched };
  }

  // Auth: /auth/register (TC-09 Institutional Email Validation)
  if (endpoint === '/auth/register' && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    if (!body.email || !body.email.toLowerCase().endsWith('@dypcoeakurdi.ac.in')) {
      throw new ApiError('Registration requires an official institutional email ending with @dypcoeakurdi.ac.in', 400);
    }
    const newUser = {
      id: Date.now(),
      name: body.name || body.email.split('@')[0],
      email: body.email,
      student_id: body.student_id || `DYP-${Date.now().toString().slice(-6)}`,
      role: body.role || 'student',
      is_verified: true,
      department: body.department || 'General Engineering',
      submitted_at: new Date().toISOString(),
    };
    demoPendingUsers.unshift({ ...newUser, is_verified: false });
    const token = `demo-jwt-${newUser.role}-${Date.now()}`;
    return { access_token: token, token_type: 'bearer', user: newUser };
  }

  // Users: GET /users/pending (Admin Review Queue)
  if (endpoint === '/users/pending' && method === 'GET') {
    if (currentUser.role !== 'admin') {
      throw new ApiError('Forbidden: Only administrators can view pending verification queue.', 403);
    }
    return demoPendingUsers;
  }

  // Users: PATCH /users/:id/verify (Admin Approval)
  const userVerifyMatch = endpoint.match(/^\/users\/(\d+)\/verify$/);
  if (userVerifyMatch && method === 'PATCH') {
    if (currentUser.role !== 'admin') {
      throw new ApiError('Forbidden: Only administrators can verify users.', 403);
    }
    const id = Number(userVerifyMatch[1]);
    const target = demoPendingUsers.find((u) => u.id === id);
    if (!target) throw new ApiError('Pending user record not found', 404);
    target.is_verified = true;
    return target;
  }

  // Auth: /users/me
  if (endpoint === '/users/me') {
    return currentUser;
  }

  // Issues: /issues/similar (Deterministic SQL filter simulation)
  if (endpoint.startsWith('/issues/similar')) {
    const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
    const category = urlParams.get('category');
    const building = urlParams.get('building');
    const floor = urlParams.get('floor');

    const matches = demoIssues.filter(
      (iss) =>
        ['Submitted', 'Assigned', 'In Progress'].includes(iss.status) &&
        (!category || iss.category.toLowerCase() === category.toLowerCase()) &&
        (!building || iss.building.toLowerCase() === building.toLowerCase()) &&
        (!floor || iss.floor.toLowerCase() === floor.toLowerCase())
    );
    return matches;
  }

  // Issues: GET /issues
  if ((endpoint === '/issues' || endpoint.startsWith('/issues?')) && method === 'GET') {
    const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
    const category = urlParams.get('category');
    const status = urlParams.get('status');
    const building = urlParams.get('building');

    let result = [...demoIssues];
    // Staff view: only assigned tasks
    if (currentUser.role === 'staff') {
      result = result.filter((i) => i.assigned_to_id === currentUser.id);
    }
    if (category) result = result.filter((i) => i.category === category);
    if (status) result = result.filter((i) => i.status === status);
    if (building) result = result.filter((i) => i.building === building);

    return result;
  }

  // Issues: POST /issues
  if (endpoint === '/issues' && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const newIssue = {
      id: Date.now(),
      title: body.title,
      description: body.description,
      category: body.category,
      building: body.building,
      floor: body.floor,
      room_area: body.room_area || 'Unspecified',
      status: 'Submitted',
      priority: 'Medium',
      created_at: new Date().toISOString(),
      reporter_id: currentUser.id,
      reporter_name: currentUser.name,
      assigned_to_id: null,
      assigned_to_name: null,
      assigned_department: null,
      upvote_count: 0,
      upvoted_by_me: false,
      image_url: body.image_url || null,
      history: [
        {
          id: Date.now(),
          status: 'Submitted',
          actor: `${currentUser.name} (${currentUser.role})`,
          remarks: 'Issue reported by student.',
          timestamp: new Date().toISOString(),
        },
      ],
    };
    demoIssues.unshift(newIssue);
    return newIssue;
  }

  // Issue detail: GET /issues/:id
  const issueDetailMatch = endpoint.match(/^\/issues\/(\d+)$/);
  if (issueDetailMatch && method === 'GET') {
    const id = Number(issueDetailMatch[1]);
    const issue = demoIssues.find((i) => i.id === id);
    if (!issue) throw new ApiError('Issue not found', 404);
    return issue;
  }

  // Issue status: PATCH /issues/:id/status
  const issueStatusMatch = endpoint.match(/^\/issues\/(\d+)\/status$/);
  if (issueStatusMatch && method === 'PATCH') {
    const id = Number(issueStatusMatch[1]);
    const body = JSON.parse(options.body || '{}');
    const issue = demoIssues.find((i) => i.id === id);
    if (!issue) throw new ApiError('Issue not found', 404);

    // Enforce role restrictions (TC-01)
    if (currentUser.role === 'student') {
      throw new ApiError('Forbidden: Students cannot modify issue status or priority', 403);
    }

    if (body.status) issue.status = body.status;
    if (body.priority && currentUser.role === 'admin') issue.priority = body.priority;
    if (body.assigned_to_name && currentUser.role === 'admin') {
      issue.assigned_to_name = body.assigned_to_name;
      issue.assigned_to_id = body.assigned_to_id || 3;
    }
    if (body.assigned_department && currentUser.role === 'admin') {
      issue.assigned_department = body.assigned_department;
    }

    issue.history.push({
      id: Date.now(),
      status: issue.status,
      actor: `${currentUser.name} (${currentUser.role})`,
      remarks: body.remarks || `Status transitioned to ${issue.status}.`,
      timestamp: new Date().toISOString(),
    });

    return issue;
  }

  // Issue Upvote: POST /issues/:id/upvote
  const upvotePostMatch = endpoint.match(/^\/issues\/(\d+)\/upvote$/);
  if (upvotePostMatch && method === 'POST') {
    const id = Number(upvotePostMatch[1]);
    const issue = demoIssues.find((i) => i.id === id);
    if (!issue) throw new ApiError('Issue not found', 404);

    // TC-04: Cannot upvote own issue
    if (issue.reporter_id === currentUser.id) {
      throw new ApiError('Students cannot upvote their own reported issues.', 400);
    }
    // TC-03: Cannot upvote twice
    if (issue.upvoted_by_me) {
      throw new ApiError('You have already upvoted this issue.', 409);
    }

    issue.upvoted_by_me = true;
    issue.upvote_count += 1;
    return { message: 'Upvote recorded', upvote_count: issue.upvote_count };
  }

  // Issue Upvote Remove: DELETE /issues/:id/upvote
  if (upvotePostMatch && method === 'DELETE') {
    const id = Number(upvotePostMatch[1]);
    const issue = demoIssues.find((i) => i.id === id);
    if (!issue) throw new ApiError('Issue not found', 404);

    if (issue.upvoted_by_me) {
      issue.upvoted_by_me = false;
      issue.upvote_count = Math.max(0, issue.upvote_count - 1);
    }
    return { message: 'Upvote removed', upvote_count: issue.upvote_count };
  }

  // Issue Feedback: POST /issues/:id/feedback (Personal Issue Tracking & Confirmation)
  const issueFeedbackMatch = endpoint.match(/^\/issues\/(\d+)\/feedback$/);
  if (issueFeedbackMatch && method === 'POST') {
    const id = Number(issueFeedbackMatch[1]);
    const body = JSON.parse(options.body || '{}');
    const issue = demoIssues.find((i) => i.id === id);
    if (!issue) throw new ApiError('Issue not found', 404);
    if (issue.status !== 'Resolved') {
      throw new ApiError('Feedback can only be recorded for resolved issues.', 400);
    }
    issue.feedback = {
      satisfaction: body.satisfaction || 'Satisfied',
      comments: body.comments || 'Repair verified by reporting student.',
      submitted_at: new Date().toISOString(),
    };
    issue.history.push({
      id: Date.now(),
      status: 'Resolved',
      actor: `${currentUser.name} (Student Feedback)`,
      remarks: `Student satisfaction confirmation (${issue.feedback.satisfaction}): "${issue.feedback.comments}"`,
      timestamp: new Date().toISOString(),
    });
    return issue;
  }

  // Marketplace: GET /listings
  if ((endpoint === '/listings' || endpoint.startsWith('/listings?')) && method === 'GET') {
    const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
    const category = urlParams.get('category');
    const mode = urlParams.get('exchange_type');
    const status = urlParams.get('status');

    let result = [...demoListings];
    if (category) result = result.filter((l) => l.category === category);
    if (mode) result = result.filter((l) => l.exchange_type === mode);
    if (status) result = result.filter((l) => l.status === status);
    return result;
  }

  // Marketplace: POST /listings
  if (endpoint === '/listings' && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const newListing = {
      id: Date.now(),
      title: body.title,
      description: body.description,
      category: body.category,
      condition: body.condition,
      exchange_type: body.exchange_type,
      price_inr: body.exchange_type === 'Sell' ? Number(body.price_inr || 0) : 0,
      desired_exchange_item: body.exchange_type === 'Exchange' ? body.desired_exchange_item : null,
      status: 'Available',
      owner_id: currentUser.id,
      owner_name: currentUser.name,
      owner_email: currentUser.email,
      created_at: new Date().toISOString(),
      image_url: body.image_url || null,
      requests: [],
    };
    demoListings.unshift(newListing);
    return newListing;
  }

  // Marketplace: GET /listings/:id
  const listingDetailMatch = endpoint.match(/^\/listings\/(\d+)$/);
  if (listingDetailMatch && method === 'GET') {
    const id = Number(listingDetailMatch[1]);
    const listing = demoListings.find((l) => l.id === id);
    if (!listing) throw new ApiError('Listing not found', 404);
    return listing;
  }

  // Marketplace: PATCH /listings/:id (Owner withdraw or Admin moderate)
  if (listingDetailMatch && method === 'PATCH') {
    const id = Number(listingDetailMatch[1]);
    const body = JSON.parse(options.body || '{}');
    const listing = demoListings.find((l) => l.id === id);
    if (!listing) throw new ApiError('Listing not found', 404);

    const isOwner = listing.owner_id === currentUser.id;
    const isAdmin = currentUser.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new ApiError('Unauthorized: You cannot modify this listing.', 403);
    }

    if (body.status === 'Withdrawn') {
      listing.status = 'Withdrawn';
      listing.withdrawn_at = new Date().toISOString();
      if (body.moderation_remarks) {
        listing.moderation_remarks = body.moderation_remarks;
      }
    }
    return listing;
  }

  // Marketplace: DELETE /listings/:id
  if (listingDetailMatch && method === 'DELETE') {
    const id = Number(listingDetailMatch[1]);
    const listing = demoListings.find((l) => l.id === id);
    if (!listing) throw new ApiError('Listing not found', 404);
    const isOwner = listing.owner_id === currentUser.id;
    const isAdmin = currentUser.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new ApiError('Unauthorized: You cannot withdraw this listing.', 403);
    }
    listing.status = 'Withdrawn';
    return { message: 'Listing withdrawn successfully', id };
  }

  // Marketplace: POST /listings/:id/requests
  const listingRequestMatch = endpoint.match(/^\/listings\/(\d+)\/requests$/);
  if (listingRequestMatch && method === 'POST') {
    const id = Number(listingRequestMatch[1]);
    const listing = demoListings.find((l) => l.id === id);
    if (!listing) throw new ApiError('Listing not found', 404);

    if (listing.owner_id === currentUser.id) {
      throw new ApiError('You cannot request your own listing.', 400);
    }
    if (listing.status !== 'Available') {
      throw new ApiError('This listing is no longer available.', 400);
    }

    const body = JSON.parse(options.body || '{}');
    const newReq = {
      id: Date.now(),
      requester_id: currentUser.id,
      requester_name: currentUser.name,
      requester_email: currentUser.email,
      status: 'Pending',
      message: body.message || 'I am interested in this item.',
      created_at: new Date().toISOString(),
      transaction: null,
    };
    listing.requests.push(newReq);
    return newReq;
  }

  // Marketplace: PATCH /requests/:id (Owner accepts/rejects)
  const requestPatchMatch = endpoint.match(/^\/requests\/(\d+)$/);
  if (requestPatchMatch && method === 'PATCH') {
    const reqId = Number(requestPatchMatch[1]);
    const body = JSON.parse(options.body || '{}');

    for (const listing of demoListings) {
      const foundReq = listing.requests.find((r) => r.id === reqId);
      if (foundReq) {
        if (body.action === 'accept') {
          foundReq.status = 'Accepted';
          listing.status = 'Requested';
          foundReq.transaction = {
            id: Date.now(),
            owner_confirmed: false,
            requester_confirmed: false,
            owner_confirmed_at: null,
            requester_confirmed_at: null,
            completed_at: null,
          };
        } else if (body.action === 'reject' || body.action === 'cancel') {
          foundReq.status = body.action === 'cancel' ? 'Cancelled' : 'Rejected';
          if (listing.status === 'Requested') {
            listing.status = 'Available';
          }
          foundReq.transaction = null;
        }
        return foundReq;
      }
    }
    throw new ApiError('Request not found', 404);
  }

  // Marketplace Dual Confirmation: POST /transactions/:id/confirm (TC-06, TC-07)
  const confirmMatch = endpoint.match(/^\/transactions\/(\d+)\/confirm$/);
  if (confirmMatch && method === 'POST') {
    const txId = Number(confirmMatch[1]);

    for (const listing of demoListings) {
      for (const req of listing.requests) {
        if (req.transaction && req.transaction.id === txId) {
          const tx = req.transaction;
          const isOwner = listing.owner_id === currentUser.id;
          const isRequester = req.requester_id === currentUser.id;

          if (!isOwner && !isRequester) {
            throw new ApiError('Unauthorized: You are not a party to this handover transaction.', 403);
          }

          if (isOwner) {
            tx.owner_confirmed = true;
            tx.owner_confirmed_at = new Date().toISOString();
          }
          if (isRequester) {
            tx.requester_confirmed = true;
            tx.requester_confirmed_at = new Date().toISOString();
          }

          // Both confirmed -> mark complete atomically (TC-07)
          if (tx.owner_confirmed && tx.requester_confirmed) {
            tx.completed_at = new Date().toISOString();
            listing.status = 'Exchanged';
            demoAnalytics.kpi.confirmed_reused_items += 1;
          }

          return { transaction: tx, listing_status: listing.status };
        }
      }
    }
    throw new ApiError('Transaction not found', 404);
  }

  // Analytics: GET /analytics/overview (Public campus sustainability stats visible to all authenticated users)
  if (endpoint.startsWith('/analytics')) {
    return demoAnalytics;
  }

  return { status: 'ok' };
}

// Canonical Public API methods
export const apiClient = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, data) =>
    request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  patch: (endpoint, data) =>
    request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  
  // Safe Image Mock / Upload
  uploadImage: async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          url: reader.result,
          filename: file.name,
          size_bytes: file.size,
        });
      };
      reader.readAsDataURL(file);
    });
  },
};
