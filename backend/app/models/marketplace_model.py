from sqlalchemy import Column, Integer, BigInteger, String, Text, Boolean, Numeric, DateTime, ForeignKey, CheckConstraint, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class MarketplaceCategory(Base):
    __tablename__ = "marketplace_categories"

    mkt_category_id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String(80), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)

    listings = relationship("MarketplaceListing", back_populates="category")


class MarketplaceListing(Base):
    __tablename__ = "marketplace_listings"

    listing_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    mkt_category_id = Column(Integer, ForeignKey("marketplace_categories.mkt_category_id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    item_condition = Column(String(30), nullable=False)
    exchange_type = Column(String(20), nullable=False)
    price_inr = Column(Numeric(10, 2), nullable=True, default=0.00)
    desired_exchange_item = Column(String(200), nullable=True)
    image_url = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="Available", index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "item_condition IN ('New','Like New','Good','Fair')",
            name="check_valid_item_condition"
        ),
        CheckConstraint(
            "exchange_type IN ('Donate','Sell','Exchange')",
            name="check_valid_exchange_type"
        ),
        CheckConstraint(
            "status IN ('Available','Requested','Exchanged','Withdrawn')",
            name="check_valid_listing_status"
        ),
        CheckConstraint("price_inr >= 0", name="check_positive_price"),
        Index("idx_listings_filter", "mkt_category_id", "exchange_type", "status"),
    )

    owner = relationship("User", back_populates="marketplace_listings")
    category = relationship("MarketplaceCategory", back_populates="listings")
    requests = relationship("ExchangeRequest", back_populates="listing", cascade="all, delete-orphan")
    transaction = relationship("ExchangeTransaction", back_populates="listing", uselist=False)


class ExchangeRequest(Base):
    __tablename__ = "exchange_requests"

    request_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    listing_id = Column(Integer, ForeignKey("marketplace_listings.listing_id", ondelete="CASCADE"), nullable=False, index=True)
    requester_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    message = Column(Text, nullable=True)
    request_status = Column(String(30), nullable=False, default="Pending", index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("listing_id", "requester_id", name="uq_exchange_requests_listing_requester"),
        CheckConstraint(
            "request_status IN ('Pending','Accepted','Rejected','Cancelled')",
            name="check_valid_request_status"
        ),
    )

    listing = relationship("MarketplaceListing", back_populates="requests")
    requester = relationship("User", back_populates="exchange_requests")
    transaction = relationship("ExchangeTransaction", back_populates="request", uselist=False)


class ExchangeTransaction(Base):
    __tablename__ = "exchange_transactions"

    transaction_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    listing_id = Column(Integer, ForeignKey("marketplace_listings.listing_id"), unique=True, nullable=False)
    request_id = Column(Integer, ForeignKey("exchange_requests.request_id"), unique=True, nullable=False)
    owner_confirmed = Column(Boolean, nullable=False, default=False)
    requester_confirmed = Column(Boolean, nullable=False, default=False)
    owner_confirmed_at = Column(DateTime(timezone=True), nullable=True)
    requester_confirmed_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    listing = relationship("MarketplaceListing", back_populates="transaction")
    request = relationship("ExchangeRequest", back_populates="transaction")
