from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.controllers.analytics_controller import analytics_controller
from app.middleware.auth_middleware import require_role
from app.models.user_model import User
from app.schemas.analytics_schema import (
    OverviewKPIResponse,
    AnalyticsIssuesResponse,
    AnalyticsMarketplaceResponse,
    AnalyticsTrendsResponse
)

router = APIRouter(prefix="/analytics", tags=["Analytics & Sustainability"])

@router.get("/overview", response_model=OverviewKPIResponse)
def get_overview_kpis(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrator", "Student", "Staff"]))
):
    """V1 Sustainability Dashboard Overview KPIs accessible to all campus users (TC-08, TC-13)."""
    return analytics_controller.get_overview_kpis(db)

@router.get("/issues", response_model=AnalyticsIssuesResponse)
def get_issues_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrator", "Student", "Staff"]))
):
    """Category breakdown, cleanliness scores, and building/floor maintenance hotspots."""
    return analytics_controller.get_issues_analytics(db)

@router.get("/marketplace", response_model=AnalyticsMarketplaceResponse)
def get_marketplace_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrator", "Student", "Staff"]))
):
    """Marketplace transaction modes and resource reuse stats."""
    return analytics_controller.get_marketplace_analytics(db)

@router.get("/trends", response_model=AnalyticsTrendsResponse)
def get_trends_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrator", "Student", "Staff"]))
):
    """Monthly timeline trend analytics for issues and exchanges."""
    return analytics_controller.get_trends_analytics(db)
