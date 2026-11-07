from sqlalchemy import Column, Integer, BigInteger, String, Text, Boolean, DateTime, ForeignKey, CheckConstraint, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class CampusLocation(Base):
    __tablename__ = "campus_locations"

    location_id = Column(Integer, primary_key=True, index=True)
    building_name = Column(String(100), nullable=False)
    floor_no = Column(String(20), nullable=False)
    room_or_area_type = Column(String(50), nullable=False)
    room_code = Column(String(50), nullable=False)

    __table_args__ = (
        UniqueConstraint("building_name", "floor_no", "room_code", name="uq_campus_locations_building_floor_room"),
        CheckConstraint(
            "room_or_area_type IN ('Classroom','Laboratory','Washroom','Water_Cooler','Corridor','Canteen','Other')",
            name="check_valid_room_type"
        ),
    )

    issues = relationship("Issue", back_populates="location")


class IssueCategory(Base):
    __tablename__ = "issue_categories"

    category_id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String(80), unique=True, nullable=False, index=True)
    default_dept_id = Column(Integer, ForeignKey("departments.department_id"), nullable=True)
    description = Column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint(
            "category_name IN ('Water','Electricity','Waste Management','Cleanliness','Sanitation','Infrastructure','Laboratory Equipment','Other')",
            name="check_valid_category_name"
        ),
    )

    default_dept = relationship("Department", back_populates="issue_categories")
    issues = relationship("Issue", back_populates="category")


class Issue(Base):
    __tablename__ = "issues"

    issue_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    reporter_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("issue_categories.category_id"), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("campus_locations.location_id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    image_url = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="Submitted", index=True)
    priority = Column(String(20), nullable=False, default="Medium", index=True)
    assigned_dept_id = Column(Integer, ForeignKey("departments.department_id"), nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.user_id"), nullable=True, index=True)
    upvote_count = Column(Integer, nullable=False, default=0)
    student_confirmed_resolved = Column(Boolean, default=False)
    student_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint(
            "status IN ('Submitted','Assigned','In Progress','Resolved','Duplicate','Cancelled')",
            name="check_valid_issue_status"
        ),
        CheckConstraint(
            "priority IN ('Low','Medium','High','Critical')",
            name="check_valid_issue_priority"
        ),
        CheckConstraint("upvote_count >= 0", name="check_positive_upvotes"),
        Index("idx_issues_similar", "category_id", "location_id", "status"),
        Index("idx_issues_status_priority", "status", "priority", "created_at"),
    )

    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reported_issues")
    category = relationship("IssueCategory", back_populates="issues")
    location = relationship("CampusLocation", back_populates="issues")
    assigned_department = relationship("Department", foreign_keys=[assigned_dept_id], back_populates="assigned_issues")
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="assigned_issues")
    upvotes = relationship("IssueUpvote", back_populates="issue", cascade="all, delete-orphan")
    status_history = relationship("IssueStatusHistory", back_populates="issue", cascade="all, delete-orphan", order_by="IssueStatusHistory.changed_at.desc()")


class IssueUpvote(Base):
    __tablename__ = "issue_upvotes"

    upvote_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    issue_id = Column(Integer, ForeignKey("issues.issue_id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("issue_id", "user_id", name="uq_issue_upvotes_issue_user"),
    )

    issue = relationship("Issue", back_populates="upvotes")
    user = relationship("User", back_populates="upvotes")


class IssueStatusHistory(Base):
    __tablename__ = "issue_status_history"

    history_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    issue_id = Column(Integer, ForeignKey("issues.issue_id", ondelete="CASCADE"), nullable=False, index=True)
    changed_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    old_status = Column(String(30), nullable=True)
    new_status = Column(String(30), nullable=False)
    remarks = Column(Text, nullable=True)
    changed_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    issue = relationship("Issue", back_populates="status_history")
    actor = relationship("User")
