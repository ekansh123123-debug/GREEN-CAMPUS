import io
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.issue_model import Issue, IssueStatusHistory
from app.models.marketplace_model import MarketplaceListing, ExchangeRequest, ExchangeTransaction

# ==============================================================================
# TC-01: Auth & RBAC Guard
# Input: Authenticated Student sends PATCH /issues/{id}/status attempting priority = "Critical"
# Expected: HTTP 403 Forbidden
# ==============================================================================
def test_tc01_student_cannot_set_priority_or_status(client: TestClient, db_session: Session, student_a_headers):
    # Setup issue
    issue = Issue(
        reporter_id=20,
        category_id=1,
        location_id=1,
        title="Water leak in restroom",
        description="Continuous water leakage from pipe",
        status="Submitted",
        priority="Medium"
    )
    db_session.add(issue)
    db_session.commit()
    db_session.refresh(issue)

    # Student attempts to change priority
    response = client.patch(
        f"/issues/{issue.issue_id}/status",
        json={"priority": "Critical"},
        headers=student_a_headers
    )
    assert response.status_code == 403
    assert "Students are not permitted" in response.json()["detail"]


# ==============================================================================
# TC-02: Module 1: Similar-Issue Suggestion
# Input: Open issue #104 in Water, Building A, Floor 2.
# Student queries GET /issues/similar?category_id=1&building=Building+A&floor=Floor+2
# Expected: HTTP 200 OK containing #104 ordered by upvote_count DESC
# ==============================================================================
def test_tc02_similar_issue_query(client: TestClient, db_session: Session, student_a_headers):
    # Location 2 is Building A, Floor 2
    issue_open = Issue(
        reporter_id=20,
        category_id=1,
        location_id=2,
        title="Water cooler leaking cold water",
        description="Puddle forming near cooler",
        status="Submitted",
        priority="Medium",
        upvote_count=5
    )
    issue_closed = Issue(
        reporter_id=20,
        category_id=1,
        location_id=2,
        title="Older resolved water leak",
        description="Fixed last week",
        status="Resolved",
        priority="Low",
        upvote_count=10
    )
    db_session.add_all([issue_open, issue_closed])
    db_session.commit()

    response = client.get(
        "/issues/similar?category_id=1&building=Building+A&floor=Floor+2",
        headers=student_a_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Water cooler leaking cold water"
    assert data[0]["status"] == "Submitted"


# ==============================================================================
# TC-03: Module 1: Duplicate Upvote Block
# Input: Student A sends POST /issues/{id}/upvote twice
# Expected: First request HTTP 201 Created; second returns HTTP 409 Conflict
# ==============================================================================
def test_tc03_duplicate_upvote_block(client: TestClient, db_session: Session, student_a_headers):
    # Reporter is student_b (20)
    issue = Issue(
        reporter_id=20,
        category_id=1,
        location_id=1,
        title="Broken tap in lab",
        description="Tap running continuously",
        status="Submitted",
        upvote_count=0
    )
    db_session.add(issue)
    db_session.commit()
    db_session.refresh(issue)

    # First upvote by student_a (10)
    res1 = client.post(f"/issues/{issue.issue_id}/upvote", headers=student_a_headers)
    assert res1.status_code == 201
    assert res1.json()["upvote_count"] == 1

    # Second upvote by same student
    res2 = client.post(f"/issues/{issue.issue_id}/upvote", headers=student_a_headers)
    assert res2.status_code == 409
    assert "already upvoted" in res2.json()["detail"].lower()


# ==============================================================================
# TC-04: Module 1: Self-Upvote Block
# Input: Student B (who created issue) sends POST /issues/{id}/upvote
# Expected: HTTP 400 Bad Request ("Reporters cannot upvote their own issue")
# ==============================================================================
def test_tc04_self_upvote_block(client: TestClient, db_session: Session, student_b_headers):
    issue = Issue(
        reporter_id=20, # Student B's ID
        category_id=2,
        location_id=1,
        title="Flickering fluorescent tube",
        description="Light keeps flickering in classroom",
        status="Submitted",
        upvote_count=0
    )
    db_session.add(issue)
    db_session.commit()
    db_session.refresh(issue)

    response = client.post(f"/issues/{issue.issue_id}/upvote", headers=student_b_headers)
    assert response.status_code == 400
    assert "Reporters cannot upvote their own issue" in response.json()["detail"]


# ==============================================================================
# TC-05: Security: File Upload Validation
# Input: User uploads 12 MB file or executable script renamed to .jpg
# Expected: HTTP 422 Unprocessable Entity
# ==============================================================================
def test_tc05_upload_validation(client: TestClient, student_a_headers):
    # 1. Fake image with executable / invalid magic bytes
    fake_exe_content = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00This is an executable"
    files = {"file": ("malicious.jpg", io.BytesIO(fake_exe_content), "image/jpeg")}
    res1 = client.post("/upload/image", files=files, headers=student_a_headers)
    assert res1.status_code == 422

    # 2. File size exceeding 5 MB limit
    large_payload = b"\xff\xd8\xff" + b"0" * (6 * 1024 * 1024) # 6MB
    files2 = {"file": ("toolarge.jpg", io.BytesIO(large_payload), "image/jpeg")}
    res2 = client.post("/upload/image", files=files2, headers=student_a_headers)
    assert res2.status_code == 422


# ==============================================================================
# TC-06: Module 2: Single-Party Confirmation
# Input: Requester calls POST /transactions/{id}/confirm, Owner not confirmed yet
# Expected: requester_confirmed = True, owner_confirmed = False, status = Requested
# ==============================================================================
def test_tc06_single_party_confirmation(client: TestClient, db_session: Session, student_a_headers):
    # Owner: Student B (20), Requester: Student A (10)
    listing = MarketplaceListing(
        owner_id=20,
        mkt_category_id=4,
        title="Scientific Calculator fx-991ES",
        description="Used in 1st year engineering",
        item_condition="Good",
        exchange_type="Sell",
        price_inr=Decimal("500.00"),
        status="Requested"
    )
    db_session.add(listing)
    db_session.flush()

    req = ExchangeRequest(
        listing_id=listing.listing_id,
        requester_id=10,
        message="Interested in purchasing",
        request_status="Accepted"
    )
    db_session.add(req)
    db_session.flush()

    txn = ExchangeTransaction(
        listing_id=listing.listing_id,
        request_id=req.request_id,
        owner_confirmed=False,
        requester_confirmed=False
    )
    db_session.add(txn)
    db_session.commit()
    db_session.refresh(txn)

    # Requester (Student A) confirms
    response = client.post(f"/transactions/{txn.transaction_id}/confirm", headers=student_a_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["requester_confirmed"] is True
    assert data["owner_confirmed"] is False
    assert data["completed_at"] is None
    assert data["listing_status"] == "Requested"


# ==============================================================================
# TC-07: Module 2: Dual-Confirmation Gate
# Input: Owner calls POST /transactions/{id}/confirm after requester confirmation
# Expected: Both TRUE, completed_at recorded, listing status Exchanged
# ==============================================================================
def test_tc07_dual_confirmation_gate(client: TestClient, db_session: Session, student_b_headers):
    # Owner: Student B (20), Requester: Student A (10)
    listing = MarketplaceListing(
        owner_id=20,
        mkt_category_id=1,
        title="Engineering Mathematics Vol 1",
        description="Standard textbook",
        item_condition="Fair",
        exchange_type="Donate",
        price_inr=Decimal("0.00"),
        status="Requested"
    )
    db_session.add(listing)
    db_session.flush()

    req = ExchangeRequest(
        listing_id=listing.listing_id,
        requester_id=10,
        request_status="Accepted"
    )
    db_session.add(req)
    db_session.flush()

    # Requester has already confirmed
    txn = ExchangeTransaction(
        listing_id=listing.listing_id,
        request_id=req.request_id,
        owner_confirmed=False,
        requester_confirmed=True,
        requester_confirmed_at=datetime.now(timezone.utc)
    )
    db_session.add(txn)
    db_session.commit()
    db_session.refresh(txn)

    # Now owner (Student B) confirms
    response = client.post(f"/transactions/{txn.transaction_id}/confirm", headers=student_b_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["requester_confirmed"] is True
    assert data["owner_confirmed"] is True
    assert data["completed_at"] is not None
    assert data["listing_status"] == "Exchanged"


# ==============================================================================
# TC-08: Module 3: Resolution Rate Formula
# Input: 10 valid issues (8 Resolved, 2 In Progress) plus 2 Duplicate issues
# Expected: Resolution Rate = (8 / 10) * 100 = 80.0%
# ==============================================================================
def test_tc08_resolution_rate_formula(client: TestClient, db_session: Session, admin_headers):
    # Clear prior issues in session for clean calculation
    db_session.query(Issue).delete()

    now = datetime.now(timezone.utc)
    # 8 Resolved
    for i in range(8):
        db_session.add(Issue(
            reporter_id=10, category_id=1, location_id=1,
            title=f"Resolved issue {i}", description="Resolved description",
            status="Resolved", priority="Medium",
            created_at=now - timedelta(hours=10),
            resolved_at=now
        ))
    # 2 In Progress
    for i in range(2):
        db_session.add(Issue(
            reporter_id=10, category_id=1, location_id=1,
            title=f"In progress issue {i}", description="Active description",
            status="In Progress", priority="Medium",
            created_at=now
        ))
    # 2 Duplicate (must be excluded from denominator)
    for i in range(2):
        db_session.add(Issue(
            reporter_id=10, category_id=1, location_id=1,
            title=f"Duplicate issue {i}", description="Duplicate description",
            status="Duplicate", priority="Low",
            created_at=now
        ))
    db_session.commit()

    response = client.get("/analytics/overview", headers=admin_headers)
    assert response.status_code == 200
    kpi = response.json()
    assert kpi["total_issues"] == 12
    assert kpi["total_valid_issues"] == 10
    assert kpi["resolved_issues"] == 8
    assert kpi["issue_resolution_rate_pct"] == 80.0


# ==============================================================================
# TC-09: Auth: College Email Domain
# Input: user123@gmail.com vs student@dypcoeakurdi.ac.in
# Expected: External email HTTP 400; Institutional email HTTP 201
# ==============================================================================
def test_tc09_institutional_email_domain(client: TestClient):
    # Non-institutional email
    bad_payload = {
        "college_email": "user123@gmail.com",
        "student_or_staff_id": "STU999",
        "full_name": "Test User",
        "password": "Password123!",
        "role_id": 1
    }
    res_bad = client.post("/auth/register", json=bad_payload)
    assert res_bad.status_code == 400
    assert "dypcoeakurdi.ac.in" in res_bad.json()["detail"].lower()

    # Valid institutional email
    good_payload = {
        "college_email": "newstudent@dypcoeakurdi.ac.in",
        "student_or_staff_id": "STU888",
        "full_name": "New Valid Student",
        "password": "Password123!",
        "role_id": 1
    }
    res_good = client.post("/auth/register", json=good_payload)
    assert res_good.status_code == 201
    assert res_good.json()["college_email"] == "newstudent@dypcoeakurdi.ac.in"


# ==============================================================================
# TC-10: Module 1: Admin Priority Authority
# Input: Issue #1 (0 upvotes) set to Critical; Issue #2 (25 upvotes) set to Low
# Expected: Critical prioritized at the top of maintenance queue
# ==============================================================================
def test_tc10_admin_priority_authority(client: TestClient, db_session: Session, admin_headers, staff_headers):
    issue_low = Issue(
        reporter_id=10, category_id=1, location_id=1,
        title="Peeling paint in lobby", description="Aesthetic issue",
        status="Submitted", priority="Low", upvote_count=25
    )
    issue_crit = Issue(
        reporter_id=10, category_id=2, location_id=1,
        title="Exposed electrical wire", description="Hazard near laboratory",
        status="Submitted", priority="Critical", upvote_count=0
    )
    db_session.add_all([issue_low, issue_crit])
    db_session.commit()

    # Admin assigns issue_crit to staff (user 40)
    client.patch(
        f"/issues/{issue_crit.issue_id}/status",
        json={"priority": "Critical", "assigned_to": 40},
        headers=admin_headers
    )

    # Admin assigns issue_low to staff (user 40)
    client.patch(
        f"/issues/{issue_low.issue_id}/status",
        json={"priority": "Low", "assigned_to": 40},
        headers=admin_headers
    )

    # Staff fetches their task list
    res = client.get("/issues", headers=staff_headers)
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 2
    # Critical must be prioritized ahead of Low regardless of upvotes
    assert items[0]["priority"] == "Critical"
    assert items[0]["title"] == "Exposed electrical wire"


# ==============================================================================
# TC-11: Module 1: Status Audit Trail
# Input: Transition issue across Submitted -> Assigned -> In Progress -> Resolved
# Expected: issue_status_history stores 3 immutable audit rows
# ==============================================================================
def test_tc11_status_audit_trail(client: TestClient, db_session: Session, admin_headers, staff_headers):
    issue = Issue(
        reporter_id=10, category_id=1, location_id=1,
        title="Audit trail test ticket", description="Tracking state changes",
        status="Submitted", priority="Medium"
    )
    db_session.add(issue)
    db_session.commit()
    db_session.refresh(issue)

    # Transition 1: Admin assigns (Submitted -> Assigned)
    client.patch(
        f"/issues/{issue.issue_id}/status",
        json={"assigned_to": 40, "remarks": "Assigned to staff"},
        headers=admin_headers
    )

    # Transition 2: Staff marks In Progress (Assigned -> In Progress)
    client.patch(
        f"/issues/{issue.issue_id}/status",
        json={"status": "In Progress", "remarks": "Started repairs"},
        headers=staff_headers
    )

    # Transition 3: Staff marks Resolved (In Progress -> Resolved)
    client.patch(
        f"/issues/{issue.issue_id}/status",
        json={"status": "Resolved", "remarks": "Completed repairs"},
        headers=staff_headers
    )

    # Verify history rows
    history = db_session.query(IssueStatusHistory).filter(
        IssueStatusHistory.issue_id == issue.issue_id
    ).order_by(IssueStatusHistory.history_id.asc()).all()

    assert len(history) == 3
    assert history[0].old_status == "Submitted"
    assert history[0].new_status == "Assigned"
    assert history[1].old_status == "Assigned"
    assert history[1].new_status == "In Progress"
    assert history[2].old_status == "In Progress"
    assert history[2].new_status == "Resolved"


# ==============================================================================
# TC-12: Module 2: Multiple Request Rollback
# Input: Owner accepts Request #1 (listing -> Requested), then cancels Request #1
# Expected: Cancelling Request #1 reverts listing to Available
# ==============================================================================
def test_tc12_marketplace_request_rollback(client: TestClient, db_session: Session, student_b_headers):
    # Owner: Student B (20)
    listing = MarketplaceListing(
        owner_id=20, mkt_category_id=1,
        title="Machine Learning Handbook", description="Textbook for AIDS",
        item_condition="Like New", exchange_type="Donate",
        status="Available"
    )
    db_session.add(listing)
    db_session.flush()

    req1 = ExchangeRequest(listing_id=listing.listing_id, requester_id=10, request_status="Pending")
    db_session.add(req1)
    db_session.commit()
    db_session.refresh(req1)

    # Owner accepts Request 1 -> listing becomes Requested
    res_accept = client.patch(
        f"/requests/{req1.request_id}",
        json={"request_status": "Accepted"},
        headers=student_b_headers
    )
    assert res_accept.status_code == 200
    db_session.refresh(listing)
    assert listing.status == "Requested"

    # Handover falls through -> Owner cancels Request 1 -> listing reverts to Available
    res_cancel = client.patch(
        f"/requests/{req1.request_id}",
        json={"request_status": "Cancelled"},
        headers=student_b_headers
    )
    assert res_cancel.status_code == 200
    db_session.refresh(listing)
    assert listing.status == "Available"


# ==============================================================================
# TC-13: Module 3: Average Resolution Time
# Input: 2 resolved issues (12.0 hrs and 24.0 hrs) plus 1 unresolved In Progress
# Expected: AVG = (12.0 + 24.0) / 2 = 18.0 hours
# ==============================================================================
def test_tc13_average_resolution_time(client: TestClient, db_session: Session, admin_headers):
    db_session.query(Issue).delete()

    base_time = datetime(2026, 3, 1, 10, 0, 0, tzinfo=timezone.utc)
    # Issue 1: 12 hours resolution time
    i1 = Issue(
        reporter_id=10, category_id=1, location_id=1,
        title="Issue 12h", description="Desc 1",
        status="Resolved", priority="Medium",
        created_at=base_time,
        resolved_at=base_time + timedelta(hours=12)
    )
    # Issue 2: 24 hours resolution time
    i2 = Issue(
        reporter_id=10, category_id=1, location_id=1,
        title="Issue 24h", description="Desc 2",
        status="Resolved", priority="Medium",
        created_at=base_time,
        resolved_at=base_time + timedelta(hours=24)
    )
    # Issue 3: In Progress (excluded from resolution time mean)
    i3 = Issue(
        reporter_id=10, category_id=1, location_id=1,
        title="Issue ongoing", description="Desc 3",
        status="In Progress", priority="Medium",
        created_at=base_time
    )
    db_session.add_all([i1, i2, i3])
    db_session.commit()

    response = client.get("/analytics/overview", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["avg_resolution_time_hours"] == 18.0


# ==============================================================================
# TC-14: Deployment: CORS & JWT Tamper Check
# Input: Tampered JWT signature sent to GET /users/me
# Expected: HTTP 401 Unauthorized
# ==============================================================================
def test_tc14_jwt_tamper_check(client: TestClient):
    tampered_token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tamperedpayload.invalidsignature"
    response = client.get("/users/me", headers={"Authorization": tampered_token})
    assert response.status_code == 401
