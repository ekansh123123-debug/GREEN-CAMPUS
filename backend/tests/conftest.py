import pytest
from datetime import datetime, timezone
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.config.database import Base, get_db
from app.config.settings import settings
from app.controllers.auth_controller import create_access_token, get_password_hash
from app.main import app
from app.models.user_model import Role, Department, User
from app.models.issue_model import CampusLocation, IssueCategory, Issue, IssueStatusHistory
from app.models.marketplace_model import MarketplaceCategory, MarketplaceListing, ExchangeRequest, ExchangeTransaction

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # 1. Seed Roles
    roles = [
        Role(role_id=1, role_name="Student", description="Student"),
        Role(role_id=2, role_name="Administrator", description="Admin"),
        Role(role_id=3, role_name="Maintenance_Staff", description="Staff")
    ]
    db.add_all(roles)

    # 2. Seed Departments
    depts = [
        Department(department_id=1, dept_name="AIDS", dept_type="Academic", contact_email="aids@dypcoeakurdi.ac.in"),
        Department(department_id=6, dept_name="Estate Maintenance", dept_type="Maintenance", contact_email="maint@dypcoeakurdi.ac.in"),
        Department(department_id=9, dept_name="Administration", dept_type="Administration", contact_email="admin@dypcoeakurdi.ac.in"),
    ]
    db.add_all(depts)

    # 3. Seed Issue Categories
    cats = [
        IssueCategory(category_id=1, category_name="Water", default_dept_id=6, description="Water issues"),
        IssueCategory(category_id=2, category_name="Electricity", default_dept_id=6, description="Electrical"),
        IssueCategory(category_id=3, category_name="Waste Management", default_dept_id=6, description="Waste"),
        IssueCategory(category_id=4, category_name="Cleanliness", default_dept_id=6, description="Cleanliness"),
        IssueCategory(category_id=5, category_name="Sanitation", default_dept_id=6, description="Sanitation"),
        IssueCategory(category_id=6, category_name="Infrastructure", default_dept_id=6, description="Infra"),
        IssueCategory(category_id=7, category_name="Laboratory Equipment", default_dept_id=1, description="Lab"),
        IssueCategory(category_id=8, category_name="Other", default_dept_id=6, description="Other")
    ]
    db.add_all(cats)

    # 4. Seed Marketplace Categories
    mkt_cats = [
        MarketplaceCategory(mkt_category_id=1, category_name="Textbooks", description="Textbooks"),
        MarketplaceCategory(mkt_category_id=2, category_name="Reference Books", description="Ref Books"),
        MarketplaceCategory(mkt_category_id=3, category_name="Notes", description="Notes"),
        MarketplaceCategory(mkt_category_id=4, category_name="Calculators", description="Calculators"),
        MarketplaceCategory(mkt_category_id=5, category_name="Drawing Instruments", description="Drawing"),
        MarketplaceCategory(mkt_category_id=6, category_name="Lab Equipment", description="Lab Equipment"),
        MarketplaceCategory(mkt_category_id=7, category_name="Electronics", description="Electronics"),
        MarketplaceCategory(mkt_category_id=8, category_name="Stationery", description="Stationery")
    ]
    db.add_all(mkt_cats)

    # 5. Seed Campus Locations
    locs = [
        CampusLocation(location_id=1, building_name="Building A", floor_no="Floor 1", room_or_area_type="Classroom", room_code="A-101"),
        CampusLocation(location_id=2, building_name="Building A", floor_no="Floor 2", room_or_area_type="Water_Cooler", room_code="A-201-WC"),
        CampusLocation(location_id=3, building_name="Building B", floor_no="Floor 1", room_or_area_type="Laboratory", room_code="B-101"),
    ]
    db.add_all(locs)

    # 6. Seed Users
    hashed = get_password_hash("Password123!")
    users = [
        User(user_id=10, college_email="student_a@dypcoeakurdi.ac.in", student_or_staff_id="STU001", full_name="Student A", password_hash=hashed, role_id=1, is_verified=True),
        User(user_id=20, college_email="student_b@dypcoeakurdi.ac.in", student_or_staff_id="STU002", full_name="Student B", password_hash=hashed, role_id=1, is_verified=True),
        User(user_id=30, college_email="admin@dypcoeakurdi.ac.in", student_or_staff_id="ADM001", full_name="Admin User", password_hash=hashed, role_id=2, is_verified=True),
        User(user_id=40, college_email="staff@dypcoeakurdi.ac.in", student_or_staff_id="STF001", full_name="Staff User", password_hash=hashed, role_id=3, department_id=6, is_verified=True),
    ]
    db.add_all(users)
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

def make_auth_headers(user_id: int, role: str, email: str):
    token = create_access_token({"sub": str(user_id), "role": role, "email": email})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def student_a_headers():
    return make_auth_headers(10, "Student", "student_a@dypcoeakurdi.ac.in")

@pytest.fixture
def student_b_headers():
    return make_auth_headers(20, "Student", "student_b@dypcoeakurdi.ac.in")

@pytest.fixture
def admin_headers():
    return make_auth_headers(30, "Administrator", "admin@dypcoeakurdi.ac.in")

@pytest.fixture
def staff_headers():
    return make_auth_headers(40, "Maintenance_Staff", "staff@dypcoeakurdi.ac.in")
