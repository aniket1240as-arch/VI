from typing import Optional, List, Union
from datetime import datetime
from pydantic import BaseModel, Field


# ═══════════════════════════════════════════════════════════
# SALES ORDERS
# ═══════════════════════════════════════════════════════════

class SalesOrderItemBase(BaseModel):
    item_code: Optional[str] = None
    item_name: str
    description: Optional[str] = None
    quantity: float = 0.0
    uom: str = "MT"
    rate: float = 0.0
    discount_percent: float = 0.0
    amount: float = 0.0
    warehouse: str = "Hanoi HQ"

class SalesOrderItemCreate(SalesOrderItemBase):
    pass

class SalesOrderItemResponse(SalesOrderItemBase):
    id: str
    so_id: str
    delivered_qty: float = 0.0
    billed_qty: float = 0.0
    created_at: Optional[Union[datetime, str]] = None


class SalesOrderBase(BaseModel):
    customer_id: Optional[str] = None
    customer_name: str
    customer_po_number: Optional[str] = None
    order_date: str
    delivery_date: Optional[str] = None
    currency: str = "USD"
    exchange_rate: float = 1.0
    payment_terms: str = "LC at Sight"
    incoterms: str = "FOB"
    incoterms_location: Optional[str] = None
    salesperson: Optional[str] = None
    territory: Optional[str] = None
    remarks: Optional[str] = None

class SalesOrderCreate(SalesOrderBase):
    items: List[SalesOrderItemCreate] = []

class SalesOrderResponse(SalesOrderBase):
    id: str
    so_number: str
    subtotal: float = 0.0
    tax_amount: float = 0.0
    shipping_charges: float = 0.0
    grand_total: float = 0.0
    paid_amount: float = 0.0
    outstanding_amount: float = 0.0
    status: str = "DRAFT"
    created_by: Optional[str] = None
    created_at: Optional[Union[datetime, str]] = None
    updated_at: Optional[Union[datetime, str]] = None
    items: List[SalesOrderItemResponse] = []

class SalesOrderStatusUpdate(BaseModel):
    status: str


# ═══════════════════════════════════════════════════════════
# CHART OF ACCOUNTS (GENERAL LEDGER)
# ═══════════════════════════════════════════════════════════

class AccountBase(BaseModel):
    account_code: str
    account_name: str
    account_type: str  # Asset, Liability, Equity, Income, Expense
    parent_account: Optional[str] = None
    is_group: bool = False
    currency: str = "USD"
    description: Optional[str] = None

class AccountCreate(AccountBase):
    pass

class AccountResponse(AccountBase):
    id: str
    balance: float = 0.0
    is_frozen: bool = False
    created_at: Optional[Union[datetime, str]] = None


# ═══════════════════════════════════════════════════════════
# JOURNAL ENTRIES
# ═══════════════════════════════════════════════════════════

class JournalEntryBase(BaseModel):
    entry_date: str
    account_id: str
    account_name: str
    debit: float = 0.0
    credit: float = 0.0
    party_type: Optional[str] = None  # Customer, Supplier
    party_name: Optional[str] = None
    reference_type: Optional[str] = None  # Sales Invoice, Purchase Order, Payment
    reference_id: Optional[str] = None
    narration: Optional[str] = None

class JournalEntryCreate(JournalEntryBase):
    pass

class JournalEntryResponse(JournalEntryBase):
    id: str
    entry_number: str
    created_by: Optional[str] = None
    created_at: Optional[Union[datetime, str]] = None


# ═══════════════════════════════════════════════════════════
# SALES INVOICES
# ═══════════════════════════════════════════════════════════

class InvoiceItemBase(BaseModel):
    item_code: Optional[str] = None
    item_name: str
    description: Optional[str] = None
    quantity: float = 0.0
    rate: float = 0.0
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    amount: float = 0.0

class InvoiceItemCreate(InvoiceItemBase):
    pass

class InvoiceItemResponse(InvoiceItemBase):
    id: str
    invoice_id: str
    created_at: Optional[Union[datetime, str]] = None


class SalesInvoiceBase(BaseModel):
    customer_id: Optional[str] = None
    customer_name: str
    sales_order_id: Optional[str] = None
    so_number: Optional[str] = None
    invoice_date: str
    due_date: str
    currency: str = "USD"
    exchange_rate: float = 1.0
    payment_terms: Optional[str] = None
    remarks: Optional[str] = None

class SalesInvoiceCreate(SalesInvoiceBase):
    items: List[InvoiceItemCreate] = []

class SalesInvoiceResponse(SalesInvoiceBase):
    id: str
    invoice_number: str
    subtotal: float = 0.0
    tax_amount: float = 0.0
    grand_total: float = 0.0
    paid_amount: float = 0.0
    outstanding_amount: float = 0.0
    status: str = "DRAFT"
    created_by: Optional[str] = None
    created_at: Optional[Union[datetime, str]] = None
    items: List[InvoiceItemResponse] = []


# ═══════════════════════════════════════════════════════════
# PAYMENT ENTRIES
# ═══════════════════════════════════════════════════════════

class PaymentEntryBase(BaseModel):
    payment_type: str  # RECEIVE, PAY
    party_type: str  # Customer, Supplier
    party_name: str
    party_id: Optional[str] = None
    payment_date: str
    mode_of_payment: str = "Bank Transfer"
    currency: str = "USD"
    paid_amount: float = 0.0
    reference_no: Optional[str] = None
    reference_date: Optional[str] = None
    bank_account: Optional[str] = None
    allocated_to_invoice: Optional[str] = None
    allocated_invoice_number: Optional[str] = None
    remarks: Optional[str] = None

class PaymentEntryCreate(PaymentEntryBase):
    pass

class PaymentEntryResponse(PaymentEntryBase):
    id: str
    payment_number: str
    status: str = "SUBMITTED"
    created_by: Optional[str] = None
    created_at: Optional[Union[datetime, str]] = None


# ═══════════════════════════════════════════════════════════
# FINANCE DASHBOARD
# ═══════════════════════════════════════════════════════════

class FinanceSummary(BaseModel):
    total_revenue: float = 0.0
    total_receivable: float = 0.0
    total_payable: float = 0.0
    total_sales_orders: int = 0
    total_invoices: int = 0
    overdue_invoices: int = 0
    payments_received: float = 0.0
    so_by_status: dict = {}
    recent_invoices: List[SalesInvoiceResponse] = []
    ar_aging: dict = {}
