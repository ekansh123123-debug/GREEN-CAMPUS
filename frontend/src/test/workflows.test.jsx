import { describe, it, expect, beforeEach } from 'vitest';
import { apiClient, setStoredUser, setStoredToken } from '../lib/apiClient';
import { DEMO_USERS } from '../data/mockData';

describe('GREEN CAMPUS Domain Logic & Specification Verification', () => {
  beforeEach(() => {
    // Reset to default student user
    setStoredUser(DEMO_USERS.student);
    setStoredToken('test-student-token');
  });

  it('TC-02: deterministic similar-issue filter matches unresolved issues by category, building, and floor', async () => {
    // There is an active Water issue in Main Academic Building on 2nd Floor
    const matches = await apiClient.get(
      '/issues/similar?category=Water&building=Main%20Academic%20Building&floor=2nd%20Floor'
    );

    expect(Array.isArray(matches)).toBe(true);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].category).toBe('Water');
    expect(matches[0].building).toBe('Main Academic Building');
    expect(matches[0].floor).toBe('2nd Floor');
    expect(['Submitted', 'Assigned', 'In Progress']).toContain(matches[0].status);
  });

  it('TC-04: prevents reporter from upvoting their own reported issue', async () => {
    // Aarav Sharma (id: 1) is the reporter of issue 101
    setStoredUser(DEMO_USERS.student); // id: 1

    await expect(apiClient.post('/issues/101/upvote')).rejects.toThrow(
      /Students cannot upvote their own reported issues/i
    );
  });

  it('TC-03: allows upvoting another student issue and rejects duplicate upvote', async () => {
    // Issue 102 reported by Pooja Deshmukh (id: 4)
    // First, student removes upvote if already upvoted
    await apiClient.delete('/issues/102/upvote').catch(() => {});

    // Upvote
    const res1 = await apiClient.post('/issues/102/upvote');
    expect(res1.upvote_count).toBeGreaterThan(0);

    // Repeated upvote must return 409 Conflict
    await expect(apiClient.post('/issues/102/upvote')).rejects.toThrow(
      /You have already upvoted this issue/i
    );

    // Remove upvote
    const res2 = await apiClient.delete('/issues/102/upvote');
    expect(res2.upvote_count).toBe(res1.upvote_count - 1);
  });

  it('TC-01: forbids student from modifying issue status or priority', async () => {
    setStoredUser(DEMO_USERS.student);

    await expect(
      apiClient.patch('/issues/101/status', {
        status: 'Resolved',
        priority: 'Critical',
      })
    ).rejects.toThrow(/Forbidden: Students cannot modify issue status or priority/i);
  });

  it('TC-06 & TC-07: dual-confirmation handover workflow for peer marketplace resources', async () => {
    // 1. Student creates an Available listing
    setStoredUser(DEMO_USERS.student); // Aarav (id: 1)
    const newListing = await apiClient.post('/listings', {
      title: 'Engineering Mechanics by Bhavikatti',
      description: 'Used textbook for 1st year engineering mechanics in good condition.',
      category: 'Textbooks',
      condition: 'Good',
      exchange_type: 'Donate',
    });
    expect(newListing.status).toBe('Available');

    // 2. Requester (user id 20) requests this item
    const requesterUser = {
      id: 20,
      name: 'Sneha More',
      email: 'sneha.more@dypcoeakurdi.ac.in',
      role: 'student',
    };
    setStoredUser(requesterUser);
    const req = await apiClient.post(`/listings/${newListing.id}/requests`, {
      message: 'Need this book for mechanics course.',
    });
    expect(req.status).toBe('Pending');

    // 3. Owner accepts request -> moves listing to Requested & creates transaction
    setStoredUser(DEMO_USERS.student); // Owner
    await apiClient.patch(`/requests/${req.id}`, { action: 'accept' });

    const acceptedListing = await apiClient.get(`/listings/${newListing.id}`);
    expect(acceptedListing.status).toBe('Requested');
    const acceptedReq = acceptedListing.requests.find((r) => r.id === req.id);
    expect(acceptedReq.status).toBe('Accepted');
    expect(acceptedReq.transaction).toBeDefined();

    const txId = acceptedReq.transaction.id;

    // 4. TC-06: Requester confirms receipt first
    setStoredUser(requesterUser);
    const step1 = await apiClient.post(`/transactions/${txId}/confirm`);
    expect(step1.transaction.requester_confirmed).toBe(true);
    expect(step1.transaction.owner_confirmed).toBe(false);
    expect(step1.listing_status).toBe('Requested'); // Still Requested!

    // 5. TC-07: Owner confirms handover second -> both confirmed -> Exchanged
    setStoredUser(DEMO_USERS.student);
    const step2 = await apiClient.post(`/transactions/${txId}/confirm`);
    expect(step2.transaction.owner_confirmed).toBe(true);
    expect(step2.transaction.requester_confirmed).toBe(true);
    expect(step2.transaction.completed_at).toBeDefined();
    expect(step2.listing_status).toBe('Exchanged');
  });

  it('TC-12: returns listing to Available if an accepted handover request is cancelled', async () => {
    // Create listing
    setStoredUser(DEMO_USERS.student);
    const listing = await apiClient.post('/listings', {
      title: 'Drawing Board & Clips',
      description: 'Half imperial drawing board for engineering graphics.',
      category: 'Drawing Instruments',
      condition: 'Like New',
      exchange_type: 'Donate',
    });

    // Request listing
    const student2 = { id: 25, name: 'Vikram', email: 'vikram@dypcoeakurdi.ac.in', role: 'student' };
    setStoredUser(student2);
    const req = await apiClient.post(`/listings/${listing.id}/requests`, { message: 'Interested' });

    // Accept request -> Requested
    setStoredUser(DEMO_USERS.student);
    await apiClient.patch(`/requests/${req.id}`, { action: 'accept' });
    let updated = await apiClient.get(`/listings/${listing.id}`);
    expect(updated.status).toBe('Requested');

    // Cancel accepted request -> Returns to Available
    await apiClient.patch(`/requests/${req.id}`, { action: 'cancel' });
    updated = await apiClient.get(`/listings/${listing.id}`);
    expect(updated.status).toBe('Available');
  });

  it('allows listing owner to withdraw listing, and admin to moderate', async () => {
    // Owner withdraws
    setStoredUser(DEMO_USERS.student);
    const item = await apiClient.post('/listings', {
      title: 'Workshop Safety Goggles',
      description: 'Transparent protective glasses.',
      category: 'Stationery',
      condition: 'New',
      exchange_type: 'Donate',
    });

    const withdrawn = await apiClient.patch(`/listings/${item.id}`, { status: 'Withdrawn' });
    expect(withdrawn.status).toBe('Withdrawn');

    // Admin moderates
    setStoredUser(DEMO_USERS.admin);
    const item2 = await apiClient.post('/listings', {
      title: 'Sample Item',
      description: 'Item description.',
      category: 'Stationery',
      condition: 'Good',
      exchange_type: 'Donate',
    });
    const moderated = await apiClient.patch(`/listings/${item2.id}`, {
      status: 'Withdrawn',
      moderation_remarks: 'Non-academic listing violates policy',
    });
    expect(moderated.status).toBe('Withdrawn');
    expect(moderated.moderation_remarks).toBe('Non-academic listing violates policy');
  });

  it('records student post-resolution satisfaction feedback on resolved issues (Screen 6 / FR-07)', async () => {
    // Issue 104 is resolved (Wooden desk in classroom 104)
    // Reporter is Rohan Joshi (id: 6)
    setStoredUser({ id: 6, name: 'Rohan Joshi', role: 'student' });

    const feedbackRes = await apiClient.post('/issues/104/feedback', {
      satisfaction: 'Satisfied (Issue fully resolved)',
      comments: 'Bench desk repaired securely and safe for lectures.',
    });

    expect(feedbackRes.feedback).toBeDefined();
    expect(feedbackRes.feedback.satisfaction).toBe('Satisfied (Issue fully resolved)');
    expect(feedbackRes.feedback.comments).toBe('Bench desk repaired securely and safe for lectures.');
  });

  it('TC-09: validates institutional email domain during account registration', async () => {
    // External non-institutional email must be rejected
    await expect(
      apiClient.post('/auth/register', {
        name: 'John Doe',
        email: 'johndoe@gmail.com',
        student_id: '123456',
        password: 'password123',
      })
    ).rejects.toThrow(/Registration requires an official institutional email ending with @dypcoeakurdi.ac.in/i);

    // Official institutional email succeeds
    const res = await apiClient.post('/auth/register', {
      name: 'Riddhi Patel',
      email: 'riddhi.patel@dypcoeakurdi.ac.in',
      student_id: 'DYP-2024-COMP-088',
      department: 'Computer Engineering',
      password: 'password123',
    });
    expect(res.user.email).toBe('riddhi.patel@dypcoeakurdi.ac.in');
    expect(res.access_token).toBeDefined();
  });
});
