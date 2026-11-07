from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class IssueCreateRequest(BaseModel):
    category_id: int
    location_id: int
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    image_url: Optional[str] = None

class IssueStatusUpdateRequest(BaseModel):
    status: Optional[str] = Field(None, description="Submitted, Assigned, In Progress, Resolved, Duplicate, Cancelled")
    priority: Optional[str] = Field(None, description="Low, Medium, High, Critical")
    assigned_dept_id: Optional[int] = None
    assigned_to: Optional[int] = None
    remarks: Optional[str] = Field(None, max_length=500)

class StudentResolveFeedbackRequest(BaseModel):
    student_confirmed_resolved: bool
    student_feedback: Optional[str] = Field(None, max_length=1000)

class StatusHistoryItem(BaseModel):
    history_id: int
    old_status: Optional[str] = None
    new_status: str
    remarks: Optional[str] = None
    changed_by_name: Optional[str] = None
    changed_at: datetime

    model_config = ConfigDict(from_attributes=True)

class IssueResponse(BaseModel):
    issue_id: int
    reporter_id: int
    reporter_name: Optional[str] = None
    category_id: int
    category_name: Optional[str] = None
    location_id: int
    building_name: Optional[str] = None
    floor_no: Optional[str] = None
    room_code: Optional[str] = None
    room_or_area_type: Optional[str] = None
    title: str
    description: str
    image_url: Optional[str] = None
    status: str
    priority: str
    assigned_dept_id: Optional[int] = None
    assigned_dept_name: Optional[str] = None
    assigned_to: Optional[int] = None
    assigned_to_name: Optional[str] = None
    upvote_count: int
    student_confirmed_resolved: Optional[bool] = False
    student_feedback: Optional[str] = None
    created_at: datetime
    assigned_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    status_history: List[StatusHistoryItem] = []

    model_config = ConfigDict(from_attributes=True)

class SimilarIssueQuery(BaseModel):
    category_id: int
    building: str
    floor: str
