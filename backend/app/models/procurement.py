from typing import Optional, List, Union
from datetime import datetime
from pydantic import BaseModel, Field


# ═══════════════════════════════════════════════════════════
# PURCHASE ORDERS
# ═══════════════════════════════════════════════════════════

class PurchaseOrderItemBase(BaseModel):
    item_code: Optional[str] = None
    item_name: str
    description: Optional[str] = None
    quantity: float = 0.0
    uom: str = "MT"
    rate: float = 0.0
    discount_percent: float = 0.0
    amount: float = 0.0
    quality_grade: Optional[str] = None
    required_by_date: Optional[str] = None

class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass

class PurchaseOrderItemResponse(PurchaseOrderItemBase):
    id: str
    po_id: str
    received_qty: float = 0.0
    created_at: Optional[Union[datetime, str]] = None


class PurchaseOrderBase(BaseModel):
    supplier_id: Optional[str] = None
    supplier_name: str
    order_date: str
    expected_delivery_date: Optional[str] = None
    currency: str = "USD"
    exchange_rate: float = 1.0
    payment_terms: str = "Net 30"
    incoterms: str = "FOB"
    incoterms_location: Optional[str] = None
    delivery_warehouse: str = "Hanoi HQ"
    remarks: Optional[str] = None

class PurchaseOrderCreate(PurchaseOrderBase):
    items: List[PurchaseOrderItemCreate] = []

class PurchaseOrderResponse(PurchaseOrderBase):
    id: str
    po_number: str
    subtotal: float = 0.0
    tax_amount: float = 0.0
    shipping_charges: float = 0.0
    grand_total: float = 0.0
    status: str = "DRAFT"
    approval_status: str = "PENDING"
    approved_by: Optional[str] = None
    approved_date: Optional[str] = None
    created_by: Optional[str] = None
    created_at: Optional[Union[datetime, str]] = None
    updated_at: Optional[Union[datetime, str]] = None
    items: List[PurchaseOrderItemResponse] = []

class PurchaseOrderStatusUpdate(BaseModel):
    status: str
    approved_by: Optional[str] = None


# ═══════════════════════════════════════════════════════════
# GOODS RECEIPT NOTES (GRN)
# ═══════════════════════════════════════════════════════════

class GRNItemBase(BaseModel):
    po_item_id: Optional[str] = None
    item_code: Optional[str] = None
    item_name: str
    ordered_qty: float = 0.0
    received_qty: float = 0.0
    accepted_qty: float = 0.0
    rejected_qty: float = 0.0
    uom: str = "MT"
    batch_no: Optional[str] = None
    quality_status: str = "PENDING"
    remarks: Optional[str] = None

class GRNItemCreate(GRNItemBase):
    pass

class GRNItemResponse(GRNItemBase):
    id: str
    grn_id: str
    created_at: Optional[Union[datetime, str]] = None


class GRNBase(BaseModel):
    po_id: str
    po_number: str
    supplier_id: Optional[str] = None
    supplier_name: str
    receipt_date: str
    receiving_warehouse: str = "Hanoi HQ"
    transporter: Optional[str] = None
    vehicle_no: Optional[str] = None
    remarks: Optional[str] = None

class GRNCreate(GRNBase):
    items: List[GRNItemCreate] = []

class GRNResponse(GRNBase):
    id: str
    grn_number: str
    status: str = "DRAFT"
    created_by: Optional[str] = None
    created_at: Optional[Union[datetime, str]] = None
    items: List[GRNItemResponse] = []


# ═══════════════════════════════════════════════════════════
# PROCUREMENT DASHBOARD
# ═══════════════════════════════════════════════════════════

class ProcurementSummary(BaseModel):
    total_pos: int = 0
    open_po_value: float = 0.0
    pending_approvals: int = 0
    total_spend: float = 0.0
    grns_this_month: int = 0
    suppliers_active: int = 0
    pos_by_status: dict = {}
    recent_pos: List[PurchaseOrderResponse] = []
