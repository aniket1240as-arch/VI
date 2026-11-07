from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class OrderExecutionBase(BaseModel):
    po_no: str
    date: str
    supplier_name: str
    purchase_manager: str
    contract_no: str
    quantity_mt: float = 0.0
    total_amount: float = 0.0
    currency: str = "USD"
    execution_status: str = "PENDING"
    container_no: Optional[str] = None
    bl_no: Optional[str] = None

class OrderExecutionCreate(OrderExecutionBase):
    pass

class OrderExecutionUpdate(BaseModel):
    execution_status: Optional[str] = None
    container_no: Optional[str] = None
    bl_no: Optional[str] = None
    quantity_mt: Optional[float] = None
    total_amount: Optional[float] = None

class DocumentSubmissionBase(BaseModel):
    submission_no: str
    date: str
    ref_no: str
    contract_no: str
    supplier_name: str
    document_types: str
    status: str = "SUBMITTED"
    reviewer: Optional[str] = None
    remarks: Optional[str] = None

class DocumentSubmissionCreate(DocumentSubmissionBase):
    pass

class DocumentSubmissionUpdate(BaseModel):
    status: Optional[str] = None
    reviewer: Optional[str] = None
    remarks: Optional[str] = None

class DeliveryClaimBase(BaseModel):
    claim_no: str
    date: str
    delivery_ref: str
    customer_name: str
    claim_amount: float = 0.0
    currency: str = "USD"
    reason: str
    status: str = "UNDER_REVIEW"

class DeliveryClaimCreate(DeliveryClaimBase):
    pass

class DeliveryClaimUpdate(BaseModel):
    status: Optional[str] = None
    claim_amount: Optional[float] = None

