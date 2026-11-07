from datetime import datetime, timezone
from typing import List, Optional
from decimal import Decimal
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.marketplace_model import MarketplaceListing, MarketplaceCategory, ExchangeRequest, ExchangeTransaction
from app.models.user_model import User
from app.schemas.marketplace_schema import ListingCreateRequest, RequestCreateRequest, RequestStatusUpdateRequest

class MarketplaceController:
    @staticmethod
    def create_listing(db: Session, owner: User, data: ListingCreateRequest) -> MarketplaceListing:
        category = db.query(MarketplaceCategory).filter(
            MarketplaceCategory.mkt_category_id == data.mkt_category_id
        ).first()
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Marketplace category not found.")

        # Business Rule Validation for Modes
        price = data.price_inr or Decimal("0.00")
        if data.exchange_type == "Donate":
            price = Decimal("0.00")
        elif data.exchange_type == "Sell":
            if price <= Decimal("0.00"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Sell listings require a positive INR price."
                )
        elif data.exchange_type == "Exchange":
            if not data.desired_exchange_item:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Exchange listings require desired_exchange_item specified."
                )

        new_listing = MarketplaceListing(
            owner_id=owner.user_id,
            mkt_category_id=data.mkt_category_id,
            title=data.title,
            description=data.description,
            item_condition=data.item_condition,
            exchange_type=data.exchange_type,
            price_inr=price,
            desired_exchange_item=data.desired_exchange_item,
            image_url=data.image_url,
            status="Available"
        )
        db.add(new_listing)
        db.commit()
        db.refresh(new_listing)
        return new_listing

    @staticmethod
    def list_listings(
        db: Session,
        category_id: Optional[int] = None,
        exchange_type: Optional[str] = None,
        condition: Optional[str] = None,
        status_filter: Optional[str] = "Available"
    ) -> List[MarketplaceListing]:
        query = db.query(MarketplaceListing)
        if status_filter:
            query = query.filter(MarketplaceListing.status == status_filter)
        if category_id:
            query = query.filter(MarketplaceListing.mkt_category_id == category_id)
        if exchange_type:
            query = query.filter(MarketplaceListing.exchange_type == exchange_type)
        if condition:
            query = query.filter(MarketplaceListing.item_condition == condition)
        return query.order_by(MarketplaceListing.created_at.desc()).all()

    @staticmethod
    def get_listing_by_id(db: Session, listing_id: int) -> MarketplaceListing:
        listing = db.query(MarketplaceListing).filter(MarketplaceListing.listing_id == listing_id).first()
        if not listing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Marketplace listing not found.")
        return listing

    @staticmethod
    def create_request(
        db: Session,
        listing_id: int,
        requester: User,
        data: RequestCreateRequest
    ) -> ExchangeRequest:
        listing = db.query(MarketplaceListing).filter(MarketplaceListing.listing_id == listing_id).first()
        if not listing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Marketplace listing not found.")

        # Self-request forbidden
        if listing.owner_id == requester.user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Listing owners cannot request their own item."
            )

        if listing.status != "Available":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot request listing with status '{listing.status}'."
            )

        # Duplicate request check
        existing_req = db.query(ExchangeRequest).filter(
            ExchangeRequest.listing_id == listing_id,
            ExchangeRequest.requester_id == requester.user_id
        ).first()
        if existing_req:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You have already submitted a request for this item."
            )

        new_request = ExchangeRequest(
            listing_id=listing_id,
            requester_id=requester.user_id,
            message=data.message,
            request_status="Pending"
        )
        db.add(new_request)
        db.commit()
        db.refresh(new_request)
        return new_request

    @staticmethod
    def update_request_status(
        db: Session,
        request_id: int,
        current_user: User,
        data: RequestStatusUpdateRequest
    ) -> ExchangeRequest:
        req = db.query(ExchangeRequest).filter(ExchangeRequest.request_id == request_id).first()
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exchange request not found.")

        listing = req.listing
        if listing.owner_id != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the listing owner can accept, reject, or cancel requests."
            )

        new_status = data.request_status
        req.request_status = new_status
        db.flush()

        if new_status == "Accepted":
            listing.status = "Requested"
            # Ensure Transaction record exists
            txn = db.query(ExchangeTransaction).filter(
                ExchangeTransaction.listing_id == listing.listing_id
            ).first()
            if not txn:
                txn = ExchangeTransaction(
                    listing_id=listing.listing_id,
                    request_id=req.request_id,
                    owner_confirmed=False,
                    requester_confirmed=False
                )
                db.add(txn)
            else:
                txn.request_id = req.request_id
                txn.owner_confirmed = False
                txn.requester_confirmed = False
                txn.completed_at = None

        elif new_status in ("Cancelled", "Rejected"):
            # TC-12: If this request was accepted and now cancelled/rejected, rollback listing to Available
            active_accepted = db.query(ExchangeRequest).filter(
                ExchangeRequest.listing_id == listing.listing_id,
                ExchangeRequest.request_id != req.request_id,
                ExchangeRequest.request_status == "Accepted"
            ).first()
            if not active_accepted:
                listing.status = "Available"
                # If transaction existed, reset confirmation
                txn = db.query(ExchangeTransaction).filter(
                    ExchangeTransaction.listing_id == listing.listing_id
                ).first()
                if txn:
                    txn.owner_confirmed = False
                    txn.requester_confirmed = False
                    txn.completed_at = None

        db.commit()
        db.refresh(req)
        return req

    @staticmethod
    def confirm_transaction(
        db: Session,
        transaction_id: int,
        current_user: User
    ) -> ExchangeTransaction:
        txn = db.query(ExchangeTransaction).filter(
            ExchangeTransaction.transaction_id == transaction_id
        ).first()
        if not txn:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exchange transaction not found.")

        listing = txn.listing
        req = txn.request

        is_owner = (listing.owner_id == current_user.user_id)
        is_requester = (req.requester_id == current_user.user_id)

        if not is_owner and not is_requester:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the listing owner or designated requester can confirm this transaction."
            )

        now = datetime.now(timezone.utc)

        # TC-06: Single-party confirmation
        if is_requester:
            txn.requester_confirmed = True
            txn.requester_confirmed_at = now
        if is_owner:
            txn.owner_confirmed = True
            txn.owner_confirmed_at = now

        # TC-07: Dual-confirmation gate
        if txn.owner_confirmed and txn.requester_confirmed:
            txn.completed_at = now
            listing.status = "Exchanged"
        else:
            listing.status = "Requested"

        db.commit()
        db.refresh(txn)
        return txn

marketplace_controller = MarketplaceController()
