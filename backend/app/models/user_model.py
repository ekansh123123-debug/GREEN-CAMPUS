from sqlalchemy import Column, Integer, BigInteger, String, Text, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class Role(Base):
    __tablename__ = "roles"

    role_id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint(
            "role_name IN ('Student', 'Administrator', 'Maintenance_Staff')",
            name="check_valid_role_name"
        ),
    )

    users = relationship("User", back_populates="role")


class Department(Base):
    __tablename__ = "departments"

    department_id = Column(Integer, primary_key=True, index=True)
    dept_name = Column(String(100), unique=True, nullable=False)
    dept_type = Column(String(30), nullable=False)
    contact_email = Column(String(255), nullable=True)

    __table_args__ = (
        CheckConstraint(
            "dept_type IN ('Academic', 'Maintenance', 'Administration')",
            name="check_valid_dept_type"
        ),
    )

    users = relationship("User", back_populates="department")
    issue_categories = relationship("IssueCategory", back_populates="default_dept")
    assigned_issues = relationship("Issue", back_populates="assigned_department", foreign_keys="Issue.assigned_dept_id")


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    college_email = Column(String(255), unique=True, nullable=False, index=True)
    student_or_staff_id = Column(String(50), unique=True, nullable=False, index=True)
    full_name = Column(String(150), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.role_id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.department_id"), nullable=True)
    academic_year = Column(String(10), nullable=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    role = relationship("Role", back_populates="users")
    department = relationship("Department", back_populates="users")
    reported_issues = relationship("Issue", back_populates="reporter", foreign_keys="Issue.reporter_id")
    assigned_issues = relationship("Issue", back_populates="assignee", foreign_keys="Issue.assigned_to")
    upvotes = relationship("IssueUpvote", back_populates="user", cascade="all, delete-orphan")
    marketplace_listings = relationship("MarketplaceListing", back_populates="owner")
    exchange_requests = relationship("ExchangeRequest", back_populates="requester")
