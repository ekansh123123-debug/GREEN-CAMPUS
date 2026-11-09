from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.issue_model import Issue, IssueCategory, CampusLocation
from app.models.marketplace_model import MarketplaceListing, ExchangeTransaction
from app.schemas.analytics_schema import (
    OverviewKPIResponse,
    CategoryBreakdownItem,
    BuildingHotspotItem,
    FloorHotspotItem,
    CleanlinessLocationItem,
    MarketplaceModeItem,
    TrendPoint
)

class AnalyticsController:
    @staticmethod
    def get_overview_kpis(db: Session) -> OverviewKPIResponse:
        total_issues = db.query(Issue).count()

        # TC-08: Exclude 'Duplicate' and 'Cancelled' from denominator
        valid_issues = db.query(Issue).filter(~Issue.status.in_(["Duplicate", "Cancelled"])).all()
        total_valid = len(valid_issues)
        resolved_issues = [i for i in valid_issues if i.status == "Resolved"]
        in_progress_issues = [i for i in valid_issues if i.status == "In Progress"]
        duplicate_cancelled_count = total_issues - total_valid

        # Issue Resolution Rate (%)
        if total_valid > 0:
            resolution_rate = round((len(resolved_issues) / total_valid) * 100.0, 1)
        else:
            resolution_rate = 0.0

        # TC-13: Average Resolution Time (Hours) strictly over resolved issues
        resolved_durations = []
        for i in resolved_issues:
            if i.created_at and i.resolved_at:
                c_at = i.created_at
                r_at = i.resolved_at
                # ensure timezone compatibility
                if c_at.tzinfo is None:
                    c_at = c_at.replace(tzinfo=timezone.utc)
                if r_at.tzinfo is None:
                    r_at = r_at.replace(tzinfo=timezone.utc)
                diff_seconds = (r_at - c_at).total_seconds()
                resolved_durations.append(diff_seconds / 3600.0)

        if resolved_durations:
            avg_res_time = round(sum(resolved_durations) / len(resolved_durations), 1)
        else:
            avg_res_time = 0.0

        # Marketplace Analytics
        total_listings = db.query(MarketplaceListing).count()
        available_listings = db.query(MarketplaceListing).filter(MarketplaceListing.status == "Available").count()
        requested_listings = db.query(MarketplaceListing).filter(MarketplaceListing.status == "Requested").count()

        # Dual-confirmed completed exchanges
        completed_txns = db.query(ExchangeTransaction).filter(
            ExchangeTransaction.owner_confirmed == True,
            ExchangeTransaction.requester_confirmed == True
        ).count()

        total_reused_items = completed_txns
        if total_listings > 0:
            exchange_success_rate = round((total_reused_items / total_listings) * 100.0, 1)
        else:
            exchange_success_rate = 0.0

        total_donations = db.query(MarketplaceListing).filter(
            MarketplaceListing.exchange_type == "Donate",
            MarketplaceListing.status == "Exchanged"
        ).count()

        return OverviewKPIResponse(
            total_issues=total_issues,
            total_valid_issues=total_valid,
            resolved_issues=len(resolved_issues),
            in_progress_issues=len(in_progress_issues),
            duplicate_or_cancelled_issues=duplicate_cancelled_count,
            issue_resolution_rate_pct=resolution_rate,
            avg_resolution_time_hours=avg_res_time,
            total_listings=total_listings,
            available_listings=available_listings,
            requested_listings=requested_listings,
            total_reused_items=total_reused_items,
            total_donations=total_donations,
            exchange_success_rate_pct=exchange_success_rate
        )

    @staticmethod
    def get_issues_analytics(db: Session) -> Dict[str, Any]:
        categories = db.query(IssueCategory).all()
        cat_breakdown = []
        for cat in categories:
            total_cat = db.query(Issue).filter(Issue.category_id == cat.category_id).count()
            resolved_cat = db.query(Issue).filter(
                Issue.category_id == cat.category_id,
                Issue.status == "Resolved"
            ).count()
            cat_breakdown.append(CategoryBreakdownItem(
                category_id=cat.category_id,
                category_name=cat.category_name,
                total=total_cat,
                resolved=resolved_cat
            ))

        # Building hotspots
        building_counts = (
            db.query(CampusLocation.building_name, func.count(Issue.issue_id))
            .join(Issue, CampusLocation.location_id == Issue.location_id)
            .group_by(CampusLocation.building_name)
            .order_by(func.count(Issue.issue_id).desc())
            .all()
        )
        b_hotspots = [BuildingHotspotItem(building_name=b[0], issue_count=b[1]) for b in building_counts]

        # Floor hotspots
        floor_counts = (
            db.query(CampusLocation.building_name, CampusLocation.floor_no, func.count(Issue.issue_id))
            .join(Issue, CampusLocation.location_id == Issue.location_id)
            .group_by(CampusLocation.building_name, CampusLocation.floor_no)
            .order_by(func.count(Issue.issue_id).desc())
            .all()
        )
        f_hotspots = [FloorHotspotItem(building_name=f[0], floor_no=f[1], issue_count=f[2]) for f in floor_counts]

        # Cleanliness & Sanitation metrics by building location
        cleanliness_categories = ["Cleanliness", "Sanitation", "Waste Management"]
        cleanliness_data = []
        for b in building_counts:
            b_name = b[0]
            total_clean = (
                db.query(Issue)
                .join(CampusLocation, Issue.location_id == CampusLocation.location_id)
                .join(IssueCategory, Issue.category_id == IssueCategory.category_id)
                .filter(CampusLocation.building_name == b_name, IssueCategory.category_name.in_(cleanliness_categories))
                .count()
            )
            resolved_clean = (
                db.query(Issue)
                .join(CampusLocation, Issue.location_id == CampusLocation.location_id)
                .join(IssueCategory, Issue.category_id == IssueCategory.category_id)
                .filter(
                    CampusLocation.building_name == b_name,
                    IssueCategory.category_name.in_(cleanliness_categories),
                    Issue.status == "Resolved"
                )
                .count()
            )
            score = round((resolved_clean / total_clean) * 100.0, 1) if total_clean > 0 else 100.0
            cleanliness_data.append(CleanlinessLocationItem(
                building_name=b_name,
                cleanliness_score_pct=score,
                total_cleanliness_issues=total_clean,
                resolved_cleanliness_issues=resolved_clean,
                pending_cleanliness_issues=total_clean - resolved_clean
            ))

        return {
            "category_breakdown": cat_breakdown,
            "building_hotspots": b_hotspots,
            "floor_hotspots": f_hotspots,
            "cleanliness_by_location": cleanliness_data
        }

    @staticmethod
    def get_marketplace_analytics(db: Session) -> Dict[str, Any]:
        modes = ["Donate", "Sell", "Exchange"]
        mode_dist = []
        for m in modes:
            cnt = db.query(MarketplaceListing).filter(MarketplaceListing.exchange_type == m).count()
            mode_dist.append(MarketplaceModeItem(exchange_type=m, count=cnt))

        total = db.query(MarketplaceListing).count()
        completed = db.query(ExchangeTransaction).filter(
            ExchangeTransaction.owner_confirmed == True,
            ExchangeTransaction.requester_confirmed == True
        ).count()

        return {
            "mode_distribution": mode_dist,
            "category_distribution": [],
            "total_listings": total,
            "completed_exchanges": completed
        }

    @staticmethod
    def get_trends_analytics(db: Session) -> Dict[str, Any]:
        # Monthly grouping
        current_year = datetime.now().year
        monthly_data = []
        for month_idx in range(1, 13):
            period_str = f"{current_year}-{month_idx:02d}"
            # Count issues in month
            sub_count = db.query(Issue).filter(
                func.extract("month", Issue.created_at) == month_idx,
                func.extract("year", Issue.created_at) == current_year
            ).count()
            res_count = db.query(Issue).filter(
                Issue.status == "Resolved",
                func.extract("month", Issue.resolved_at) == month_idx,
                func.extract("year", Issue.resolved_at) == current_year
            ).count()
            ex_count = db.query(ExchangeTransaction).filter(
                ExchangeTransaction.completed_at != None,
                func.extract("month", ExchangeTransaction.completed_at) == month_idx,
                func.extract("year", ExchangeTransaction.completed_at) == current_year
            ).count()
            monthly_data.append(TrendPoint(
                period=period_str,
                submitted_count=sub_count,
                resolved_count=res_count,
                exchanged_count=ex_count
            ))
        return {"monthly_trends": monthly_data}

analytics_controller = AnalyticsController()
