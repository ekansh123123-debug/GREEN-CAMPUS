from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.controllers.marketplace_controller import marketplace_controller
from app.middleware.auth_middleware import get_current_user, require_role
from app.models.user_model import User
from app.models.marketplace_model import MarketplaceListing, ExchangeRequest, ExchangeTransaction
from app.schemas.marketplace_schema import (
    ListingCreateRequest,
    RequestCreateRequest,
    RequestStatusUpdateRequest,
    ListingResponse,
    RequestResponse,
    TransactionResponse
)

router = APIRouter(tags=["Marketplace"])

def serialize_request(req: ExchangeRequest) -> RequestResponse:
    return RequestResponse(
        request_id=req.request_id,
        listing_id=req.listing_id,
        requester_id=req.requester_id,
        requester_name=req.requester.full_name if req.requester else None,
        requester_email=req.requester.college_email if req.requester else None,
        message=req.message,
        request_status=req.request_status,
        created_at=req.created_at
    )

def serialize_listing(listing: MarketplaceListing) -> ListingResponse:
    requests = [serialize_request(r) for r in listing.requests] if listing.requests else []
    owner_dept = None
    if listing.owner and listing.owner.department:
        owner_dept = listing.owner.department.dept_name

    return ListingResponse(
        listing_id=listing.listing_id,
        owner_id=listing.owner_id,
        owner_name=listing.owner.full_name if listing.owner else None,
        owner_department=owner_dept,
        mkt_category_id=listing.mkt_category_id,
        category_name=listing.category.category_name if listing.category else None,
        title=listing.title,
        description=listing.description,
        item_condition=listing.item_condition,
        exchange_type=listing.exchange_type,
        price_inr=listing.price_inr,
        desired_exchange_item=listing.desired_exchange_item,
        image_url=listing.image_url,
        status=listing.status,
        created_at=listing.created_at,
        requests=requests
    )

def serialize_transaction(txn: ExchangeTransaction) -> TransactionResponse:
    return TransactionResponse(
        transaction_id=txn.transaction_id,
        listing_id=txn.listing_id,
        request_id=txn.request_id,
        owner_confirmed=txn.owner_confirmed,
        requester_confirmed=txn.requester_confirmed,
        owner_confirmed_at=txn.owner_confirmed_at,
        requester_confirmed_at=txn.requester_confirmed_at,
        completed_at=txn.completed_at,
        listing_status=txn.listing.status if txn.listing else "Requested"
    )

@router.post("/listings", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
def create_listing(
    request: ListingCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Student"]))
):
    """Create a marketplace item listing."""
    listing = marketplace_controller.create_listing(db, current_user, request)
    return serialize_listing(listing)

@router.get("/listings", response_model=List[ListingResponse])
def list_listings(
    category_id: Optional[int] = Query(None),
    exchange_type: Optional[str] = Query(None),
    condition: Optional[str] = Query(None),
    status_filter: Optional[str] = Query("Available", alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Browse and filter active listings."""
    listings = marketplace_controller.list_listings(
        db=db,
        category_id=category_id,
        exchange_type=exchange_type,
        condition=condition,
        status_filter=status_filter
    )
    return [serialize_listing(l) for l in listings]

@router.get("/listings/{listing_id}", response_model=ListingResponse)
def get_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single listing details."""
    listing = marketplace_controller.get_listing_by_id(db, listing_id)
    return serialize_listing(listing)

@router.post("/listings/{listing_id}/requests", response_model=RequestResponse, status_code=status.HTTP_201_CREATED)
def request_item(
    listing_id: int,
    request: RequestCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Student"]))
):
    """Submit a peer exchange or purchase request."""
    req = marketplace_controller.create_request(db, listing_id, current_user, request)
    return serialize_request(req)

@router.patch("/requests/{request_id}", response_model=RequestResponse)
def update_request(
    request_id: int,
    request: RequestStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Student"]))
):
    """Accept or reject a request (listing owner only). Cancelling rolls back listing to Available (TC-12)."""
    req = marketplace_controller.update_request_status(db, request_id, current_user, request)
    return serialize_request(req)

@router.post("/transactions/{transaction_id}/confirm", response_model=TransactionResponse)
def confirm_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Student"]))
):
    """Dual-confirmation protocol gate (TC-06, TC-07)."""
    txn = marketplace_controller.confirm_transaction(db, transaction_id, current_user)
    return serialize_transaction(txn)
