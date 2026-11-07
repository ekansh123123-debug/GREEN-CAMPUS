from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator, ConfigDict

class ListingCreateRequest(BaseModel):
    mkt_category_id: int
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    item_condition: str = Field(..., description="New, Like New, Good, Fair")
    exchange_type: str = Field(..., description="Donate, Sell, Exchange")
    price_inr: Optional[Decimal] = Field(default=Decimal("0.00"), ge=0)
    desired_exchange_item: Optional[str] = Field(None, max_length=200)
    image_url: Optional[str] = None

    @field_validator("exchange_type")
    @classmethod
    def validate_exchange_type(cls, v: str) -> str:
        if v not in ("Donate", "Sell", "Exchange"):
            raise ValueError("exchange_type must be 'Donate', 'Sell', or 'Exchange'")
        return v

    @field_validator("item_condition")
    @classmethod
    def validate_item_condition(cls, v: str) -> str:
        if v not in ("New", "Like New", "Good", "Fair"):
            raise ValueError("item_condition must be 'New', 'Like New', 'Good', or 'Fair'")
        return v

class RequestCreateRequest(BaseModel):
    message: Optional[str] = Field(None, max_length=500)

class RequestStatusUpdateRequest(BaseModel):
    request_status: str = Field(..., description="Accepted, Rejected, Cancelled")

    @field_validator("request_status")
    @classmethod
    def validate_request_status(cls, v: str) -> str:
        if v not in ("Accepted", "Rejected", "Cancelled"):
            raise ValueError("request_status must be 'Accepted', 'Rejected', or 'Cancelled'")
        return v

class RequestResponse(BaseModel):
    request_id: int
    listing_id: int
    requester_id: int
    requester_name: Optional[str] = None
    requester_email: Optional[str] = None
    message: Optional[str] = None
    request_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ListingResponse(BaseModel):
    listing_id: int
    owner_id: int
    owner_name: Optional[str] = None
    owner_department: Optional[str] = None
    mkt_category_id: int
    category_name: Optional[str] = None
    title: str
    description: str
    item_condition: str
    exchange_type: str
    price_inr: Optional[Decimal] = Decimal("0.00")
    desired_exchange_item: Optional[str] = None
    image_url: Optional[str] = None
    status: str
    created_at: datetime
    requests: List[RequestResponse] = []

    model_config = ConfigDict(from_attributes=True)

class TransactionResponse(BaseModel):
    transaction_id: int
    listing_id: int
    request_id: int
    owner_confirmed: bool
    requester_confirmed: bool
    owner_confirmed_at: Optional[datetime] = None
    requester_confirmed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    listing_status: str

    model_config = ConfigDict(from_attributes=True)
