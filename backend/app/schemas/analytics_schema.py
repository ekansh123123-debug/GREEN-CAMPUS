from typing import List
from pydantic import BaseModel

class OverviewKPIResponse(BaseModel):
    total_issues: int
    total_valid_issues: int
    resolved_issues: int
    in_progress_issues: int
    duplicate_or_cancelled_issues: int
    issue_resolution_rate_pct: float
    avg_resolution_time_hours: float
    total_listings: int
    available_listings: int
    requested_listings: int
    total_reused_items: int
    total_donations: int
    exchange_success_rate_pct: float

class CategoryBreakdownItem(BaseModel):
    category_id: int
    category_name: str
    total: int
    resolved: int

class BuildingHotspotItem(BaseModel):
    building_name: str
    issue_count: int

class FloorHotspotItem(BaseModel):
    building_name: str
    floor_no: str
    issue_count: int

class CleanlinessLocationItem(BaseModel):
    building_name: str
    cleanliness_score_pct: float
    total_cleanliness_issues: int
    resolved_cleanliness_issues: int
    pending_cleanliness_issues: int

class MarketplaceModeItem(BaseModel):
    exchange_type: str
    count: int

class TrendPoint(BaseModel):
    period: str # e.g. "2026-03"
    submitted_count: int
    resolved_count: int
    exchanged_count: int

class AnalyticsIssuesResponse(BaseModel):
    category_breakdown: List[CategoryBreakdownItem]
    building_hotspots: List[BuildingHotspotItem]
    floor_hotspots: List[FloorHotspotItem]
    cleanliness_by_location: List[CleanlinessLocationItem] = []

class AnalyticsMarketplaceResponse(BaseModel):
    mode_distribution: List[MarketplaceModeItem]
    category_distribution: List[dict]
    total_listings: int
    completed_exchanges: int

class AnalyticsTrendsResponse(BaseModel):
    monthly_trends: List[TrendPoint]
