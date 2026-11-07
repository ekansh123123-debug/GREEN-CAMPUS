from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.controllers.issue_controller import issue_controller
from app.middleware.auth_middleware import get_current_user, require_role
from app.models.user_model import User
from app.models.issue_model import Issue
from app.schemas.issue_schema import (
    IssueCreateRequest,
    IssueStatusUpdateRequest,
    StudentResolveFeedbackRequest,
    IssueResponse,
    StatusHistoryItem
)

router = APIRouter(prefix="/issues", tags=["Issues"])

def serialize_issue(issue: Issue) -> IssueResponse:
    history_items = []
    if hasattr(issue, "status_history") and issue.status_history:
        for h in issue.status_history:
            history_items.append(StatusHistoryItem(
                history_id=h.history_id,
                old_status=h.old_status,
                new_status=h.new_status,
                remarks=h.remarks,
                changed_by_name=h.actor.full_name if h.actor else None,
                changed_at=h.changed_at
            ))

    return IssueResponse(
        issue_id=issue.issue_id,
        reporter_id=issue.reporter_id,
        reporter_name=issue.reporter.full_name if issue.reporter else None,
        category_id=issue.category_id,
        category_name=issue.category.category_name if issue.category else None,
        location_id=issue.location_id,
        building_name=issue.location.building_name if issue.location else None,
        floor_no=issue.location.floor_no if issue.location else None,
        room_code=issue.location.room_code if issue.location else None,
        room_or_area_type=issue.location.room_or_area_type if issue.location else None,
        title=issue.title,
        description=issue.description,
        image_url=issue.image_url,
        status=issue.status,
        priority=issue.priority,
        assigned_dept_id=issue.assigned_dept_id,
        assigned_dept_name=issue.assigned_department.dept_name if issue.assigned_department else None,
        assigned_to=issue.assigned_to,
        assigned_to_name=issue.assignee.full_name if issue.assignee else None,
        upvote_count=issue.upvote_count,
        student_confirmed_resolved=issue.student_confirmed_resolved,
        student_feedback=issue.student_feedback,
        created_at=issue.created_at,
        assigned_at=issue.assigned_at,
        resolved_at=issue.resolved_at,
        status_history=history_items
    )

@router.get("/similar", response_model=List[IssueResponse])
def get_similar_issues(
    category_id: int = Query(...),
    building: str = Query(...),
    floor: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Student", "Administrator"]))
):
    """Rule-based similar-issue duplicate prevention endpoint (TC-02)."""
    issues = issue_controller.get_similar_issues(db, category_id, building, floor)
    return [serialize_issue(i) for i in issues]

@router.post("", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
def create_issue(
    request: IssueCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Student", "Administrator"]))
):
    """Create campus issue report."""
    issue = issue_controller.create_issue(db, current_user, request)
    return serialize_issue(issue)

@router.get("", response_model=List[IssueResponse])
def list_issues(
    status_filter: Optional[str] = Query(None, alias="status"),
    category_id: Optional[int] = Query(None),
    building: Optional[str] = Query(None),
    assigned_to_me: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List issues with optional filters."""
    issues = issue_controller.list_issues(
        db=db,
        current_user=current_user,
        status_filter=status_filter,
        category_id=category_id,
        building=building,
        assigned_to_me=assigned_to_me
    )
    return [serialize_issue(i) for i in issues]

@router.get("/{issue_id}", response_model=IssueResponse)
def get_issue(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get full issue details by ID."""
    issue = issue_controller.get_issue_by_id(db, issue_id)
    return serialize_issue(issue)

@router.patch("/{issue_id}/status", response_model=IssueResponse)
def update_issue_status(
    issue_id: int,
    request: IssueStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin sets priority/assignment; Staff updates work status (TC-01, TC-10, TC-11)."""
    issue = issue_controller.update_status(db, issue_id, current_user, request)
    return serialize_issue(issue)

@router.post("/{issue_id}/upvote", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
def add_upvote(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Student"]))
):
    """1 upvote per student; reporters blocked from self-upvote (TC-03, TC-04)."""
    issue = issue_controller.add_upvote(db, issue_id, current_user)
    return serialize_issue(issue)

@router.delete("/{issue_id}/upvote", response_model=IssueResponse)
def remove_upvote(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Student"]))
):
    """Withdraw an upvote."""
    issue = issue_controller.remove_upvote(db, issue_id, current_user)
    return serialize_issue(issue)

@router.post("/{issue_id}/feedback", response_model=IssueResponse)
def provide_feedback(
    issue_id: int,
    request: StudentResolveFeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Student"]))
):
    """Student confirmation/feedback post-resolution."""
    issue = issue_controller.provide_student_feedback(db, issue_id, current_user, request)
    return serialize_issue(issue)
