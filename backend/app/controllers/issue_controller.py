from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.models.issue_model import Issue, CampusLocation, IssueCategory, IssueUpvote, IssueStatusHistory
from app.models.user_model import User
from app.schemas.issue_schema import IssueCreateRequest, IssueStatusUpdateRequest, StudentResolveFeedbackRequest

class IssueController:
    @staticmethod
    def get_similar_issues(
        db: Session,
        category_id: int,
        building: str,
        floor: str
    ) -> List[Issue]:
        """
        Deterministic rule-based query for duplicate prevention (TC-02).
        Matches category_id + building_name + floor_no across active open issues.
        """
        active_statuses = ["Submitted", "Assigned", "In Progress"]
        query = (
            db.query(Issue)
            .join(CampusLocation, Issue.location_id == CampusLocation.location_id)
            .filter(
                Issue.category_id == category_id,
                CampusLocation.building_name == building,
                CampusLocation.floor_no == floor,
                Issue.status.in_(active_statuses)
            )
            .order_by(Issue.upvote_count.desc())
        )
        return query.all()

    @staticmethod
    def create_issue(db: Session, reporter: User, data: IssueCreateRequest) -> Issue:
        # Verify category exists
        cat = db.query(IssueCategory).filter(IssueCategory.category_id == data.category_id).first()
        if not cat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue category not found.")

        # Verify location exists
        loc = db.query(CampusLocation).filter(CampusLocation.location_id == data.location_id).first()
        if not loc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campus location not found.")

        new_issue = Issue(
            reporter_id=reporter.user_id,
            category_id=data.category_id,
            location_id=data.location_id,
            title=data.title,
            description=data.description,
            image_url=data.image_url,
            status="Submitted",
            priority="Medium",
            assigned_dept_id=cat.default_dept_id,
            upvote_count=0
        )
        db.add(new_issue)
        db.flush()

        # Initial status history record
        history = IssueStatusHistory(
            issue_id=new_issue.issue_id,
            changed_by=reporter.user_id,
            old_status=None,
            new_status="Submitted",
            remarks="Initial report submitted by student."
        )
        db.add(history)
        db.commit()
        db.refresh(new_issue)
        return new_issue

    @staticmethod
    def get_issue_by_id(db: Session, issue_id: int) -> Issue:
        issue = db.query(Issue).filter(Issue.issue_id == issue_id).first()
        if not issue:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")
        return issue

    @staticmethod
    def list_issues(
        db: Session,
        current_user: User,
        status_filter: Optional[str] = None,
        category_id: Optional[int] = None,
        building: Optional[str] = None,
        assigned_to_me: bool = False
    ) -> List[Issue]:
        query = db.query(Issue)

        role_name = current_user.role.role_name if current_user.role else "Student"
        # Maintenance staff seeing assigned queue
        if role_name == "Maintenance_Staff" or assigned_to_me:
            query = query.filter(Issue.assigned_to == current_user.user_id)

        if status_filter:
            query = query.filter(Issue.status == status_filter)
        if category_id:
            query = query.filter(Issue.category_id == category_id)
        if building:
            query = query.join(CampusLocation).filter(CampusLocation.building_name == building)

        # Sort priority Critical first (1), High (2), Medium (3), Low (4), then upvotes, then created_at
        priority_order = case(
            (Issue.priority == "Critical", 1),
            (Issue.priority == "High", 2),
            (Issue.priority == "Medium", 3),
            (Issue.priority == "Low", 4),
            else_=5
        )
        return query.order_by(
            priority_order.asc(),
            Issue.upvote_count.desc(),
            Issue.created_at.desc()
        ).all()

    @staticmethod
    def add_upvote(db: Session, issue_id: int, current_user: User) -> Issue:
        issue = db.query(Issue).filter(Issue.issue_id == issue_id).first()
        if not issue:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")

        # TC-04: Reporter cannot self-upvote
        if issue.reporter_id == current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reporters cannot upvote their own issue"
            )

        # TC-03: Duplicate upvote block (UNIQUE check)
        existing_upvote = db.query(IssueUpvote).filter(
            IssueUpvote.issue_id == issue_id,
            IssueUpvote.user_id == current_user.user_id
        ).first()

        if existing_upvote:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You have already upvoted this issue."
            )

        upvote = IssueUpvote(issue_id=issue_id, user_id=current_user.user_id)
        db.add(upvote)
        issue.upvote_count += 1
        db.commit()
        db.refresh(issue)
        return issue

    @staticmethod
    def remove_upvote(db: Session, issue_id: int, current_user: User) -> Issue:
        issue = db.query(Issue).filter(Issue.issue_id == issue_id).first()
        if not issue:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")

        existing_upvote = db.query(IssueUpvote).filter(
            IssueUpvote.issue_id == issue_id,
            IssueUpvote.user_id == current_user.user_id
        ).first()

        if not existing_upvote:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Upvote not found for this user."
            )

        db.delete(existing_upvote)
        issue.upvote_count = max(0, issue.upvote_count - 1)
        db.commit()
        db.refresh(issue)
        return issue

    @staticmethod
    def update_status(
        db: Session,
        issue_id: int,
        current_user: User,
        data: IssueStatusUpdateRequest
    ) -> Issue:
        issue = db.query(Issue).filter(Issue.issue_id == issue_id).first()
        if not issue:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")

        role_name = current_user.role.role_name if current_user.role else "Student"

        # TC-01: Student cannot set priority or assign tickets
        if role_name == "Student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students are not permitted to change issue status or priority."
            )

        # Maintenance staff can only update tickets assigned to them
        if role_name == "Maintenance_Staff":
            if issue.assigned_to != current_user.user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Maintenance staff can only update tickets assigned to themselves."
                )
            if data.priority is not None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Maintenance staff cannot alter administrative priority."
                )

        old_status = issue.status
        status_changed = False

        # Apply priority change (Admin only)
        if data.priority is not None and role_name == "Administrator":
            issue.priority = data.priority

        # Apply department & assignee assignment (Admin only)
        if data.assigned_dept_id is not None and role_name == "Administrator":
            issue.assigned_dept_id = data.assigned_dept_id
        if data.assigned_to is not None and role_name == "Administrator":
            issue.assigned_to = data.assigned_to
            issue.assigned_at = datetime.now(timezone.utc)
            if issue.status == "Submitted":
                issue.status = "Assigned"
                status_changed = True

        # Apply explicit status transition
        if data.status and data.status != old_status:
            issue.status = data.status
            status_changed = True
            if data.status == "Resolved":
                issue.resolved_at = datetime.now(timezone.utc)
            elif data.status == "In Progress" and not issue.assigned_at:
                issue.assigned_at = datetime.now(timezone.utc)

        # TC-11: Immutable Audit Trail
        remarks = data.remarks or f"Status changed from {old_status} to {issue.status}"
        history = IssueStatusHistory(
            issue_id=issue.issue_id,
            changed_by=current_user.user_id,
            old_status=old_status,
            new_status=issue.status,
            remarks=remarks
        )
        db.add(history)
        db.commit()
        db.refresh(issue)
        return issue

    @staticmethod
    def provide_student_feedback(
        db: Session,
        issue_id: int,
        current_user: User,
        data: StudentResolveFeedbackRequest
    ) -> Issue:
        issue = db.query(Issue).filter(Issue.issue_id == issue_id).first()
        if not issue:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")

        if issue.reporter_id != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the student who reported this issue can provide resolution feedback."
            )

        issue.student_confirmed_resolved = data.student_confirmed_resolved
        issue.student_feedback = data.student_feedback
        db.commit()
        db.refresh(issue)
        return issue

issue_controller = IssueController()
