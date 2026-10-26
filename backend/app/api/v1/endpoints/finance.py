import time
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ....repositories import get_repository
from ....models.common import ApiResponse
from ....models.finance import (
    SalesOrderCreate, SalesOrderResponse, SalesOrderStatusUpdate,
    SalesOrderItemResponse,
    AccountCreate, AccountResponse,
    JournalEntryCreate, JournalEntryResponse,
    SalesInvoiceCreate, SalesInvoiceResponse, InvoiceItemResponse,
    PaymentEntryCreate, PaymentEntryResponse,
    FinanceSummary
)

router = APIRouter(prefix="/finance", tags=["Finance & Accounting"])
so_repo = get_repository("sales_orders")
so_items_repo = get_repository("sales_order_items")
coa_repo = get_repository("chart_of_accounts")
journal_repo = get_repository("journal_entries")
invoice_repo = get_repository("sales_invoices")
invoice_items_repo = get_repository("invoice_items")
payment_repo = get_repository("payment_entries")


# ─────────────── Sales Orders ───────────────

@router.get("/sales-orders", response_model=ApiResponse[List[SalesOrderResponse]])
def get_sales_orders(
    status: Optional[str] = None,
    customer_id: Optional[str] = None
):
    filters = {}
    if status:
        filters["status"] = status
    if customer_id:
        filters["customer_id"] = customer_id
    sos = so_repo.get_all(filters=filters if filters else None, limit=200)

    result = []
    for so in sos:
        items = so_items_repo.get_all(filters={"so_id": so["id"]}, limit=100)
        result.append(SalesOrderResponse(
            **so,
            items=[SalesOrderItemResponse(**i) for i in items]
        ))
    return ApiResponse(data=result)


@router.get("/sales-orders/{so_id}", response_model=ApiResponse[SalesOrderResponse])
def get_sales_order(so_id: str):
    so = so_repo.get_by_id(so_id)
    if not so:
        raise HTTPException(status_code=404, detail=f"Sales Order {so_id} not found")
    items = so_items_repo.get_all(filters={"so_id": so_id}, limit=100)
    return ApiResponse(data=SalesOrderResponse(
        **so,
        items=[SalesOrderItemResponse(**i) for i in items]
    ))


@router.post("/sales-orders", response_model=ApiResponse[SalesOrderResponse], status_code=201)
def create_sales_order(so_in: SalesOrderCreate):
    ts = int(time.time() * 1000) % 100000
    so_id = f"SO-{ts}"
    so_number = f"SO-2026-{ts:05d}"

    subtotal = 0.0
    item_records = []
    for idx, item in enumerate(so_in.items):
        item_amount = item.quantity * item.rate * (1 - item.discount_percent / 100)
        subtotal += item_amount
        item_id = f"SOI-{ts}-{idx + 1}"
        item_records.append({
            "id": item_id,
            "so_id": so_id,
            "item_code": item.item_code,
            "item_name": item.item_name,
            "description": item.description,
            "quantity": item.quantity,
            "delivered_qty": 0.0,
            "billed_qty": 0.0,
            "uom": item.uom,
            "rate": item.rate,
            "discount_percent": item.discount_percent,
            "amount": round(item_amount, 2),
            "warehouse": item.warehouse,
        })

    grand_total = subtotal

    so_data = so_in.model_dump(exclude={"items"})
    so_data.update({
        "id": so_id,
        "so_number": so_number,
        "subtotal": round(subtotal, 2),
        "tax_amount": 0.0,
        "shipping_charges": 0.0,
        "grand_total": round(grand_total, 2),
        "paid_amount": 0.0,
        "outstanding_amount": round(grand_total, 2),
        "status": "DRAFT",
    })

    so_repo.create(so_data)
    for item_rec in item_records:
        so_items_repo.create(item_rec)

    created = so_repo.get_by_id(so_id)
    items = so_items_repo.get_all(filters={"so_id": so_id}, limit=100)
    return ApiResponse(
        message="Sales Order created",
        data=SalesOrderResponse(**created, items=[SalesOrderItemResponse(**i) for i in items])
    )


@router.patch("/sales-orders/{so_id}/status", response_model=ApiResponse[SalesOrderResponse])
def update_so_status(so_id: str, update: SalesOrderStatusUpdate):
    existing = so_repo.get_by_id(so_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Sales Order {so_id} not found")

    new_st = (update.status or "DRAFT").upper()
    if new_st in ("APPROVED", "CONFIRMED"):
        new_st = "CONFIRMED"

    update_data = {"status": new_st}
    grand_total = float(existing.get("grand_total") or 0.0)

    if new_st == "FULLY_DELIVERED":
        items = so_items_repo.get_all(filters={"so_id": so_id}, limit=100)
        for item in items:
            so_items_repo.update(item["id"], {"delivered_qty": item.get("quantity", 0.0)})
    elif new_st == "PARTIALLY_DELIVERED":
        items = so_items_repo.get_all(filters={"so_id": so_id}, limit=100)
        for item in items:
            if item.get("delivered_qty", 0.0) == 0.0:
                so_items_repo.update(item["id"], {"delivered_qty": round(item.get("quantity", 0.0) * 0.5, 2)})
    elif new_st == "INVOICED":
        items = so_items_repo.get_all(filters={"so_id": so_id}, limit=100)
        for item in items:
            so_items_repo.update(item["id"], {"billed_qty": item.get("quantity", 0.0)})

        # Check if invoice exists, if not auto-create
        existing_invoices = invoice_repo.get_all(filters={"sales_order_id": so_id}, limit=5)
        if not existing_invoices and existing.get("so_number"):
            existing_invoices = invoice_repo.get_all(filters={"so_number": existing.get("so_number")}, limit=5)

        if not existing_invoices:
            ts = int(time.time() * 1000) % 100000
            inv_id = f"INV-{ts}"
            inv_number = f"INV-2026-{ts:05d}"
            today_str = datetime.now().strftime("%Y-%m-%d")
            inv_data = {
                "id": inv_id,
                "invoice_number": inv_number,
                "customer_id": existing.get("customer_id") or "CUST-001",
                "customer_name": existing.get("customer_name") or "Commercial Customer",
                "sales_order_id": so_id,
                "so_number": existing.get("so_number") or "",
                "invoice_date": today_str,
                "due_date": today_str,
                "currency": existing.get("currency") or "USD",
                "exchange_rate": 1.0,
                "payment_terms": existing.get("payment_terms") or "Net 30",
                "remarks": f"Commercial invoice generated for Sales Order {existing.get('so_number')}",
                "subtotal": round(float(existing.get("subtotal") or grand_total), 2),
                "tax_amount": round(float(existing.get("tax_amount") or 0.0), 2),
                "grand_total": round(grand_total, 2),
                "paid_amount": 0.0,
                "outstanding_amount": round(grand_total, 2),
                "status": "SUBMITTED",
            }
            invoice_repo.create(inv_data)
            for idx, it in enumerate(items):
                item_tax = (it.get("quantity", 0) * it.get("rate", 0)) * (it.get("tax_rate", 0) / 100.0)
                invoice_items_repo.create({
                    "id": f"INVI-{ts}-{idx+1}",
                    "invoice_id": inv_id,
                    "item_code": it.get("item_code") or f"ITM-{idx+1}",
                    "item_name": it.get("item_name") or "Item",
                    "description": it.get("description") or "",
                    "quantity": it.get("quantity", 0.0),
                    "rate": it.get("rate", 0.0),
                    "tax_rate": it.get("tax_rate", 0.0),
                    "tax_amount": round(item_tax, 2),
                    "amount": round(it.get("amount", 0.0), 2)
                })
    elif new_st == "PARTIALLY_PAID":
        half = round(grand_total * 0.5, 2)
        update_data["paid_amount"] = half
        update_data["outstanding_amount"] = round(grand_total - half, 2)
        # Synchronize linked invoice
        invoices = invoice_repo.get_all(filters={"sales_order_id": so_id}, limit=5)
        if not invoices and existing.get("so_number"):
            invoices = invoice_repo.get_all(filters={"so_number": existing.get("so_number")}, limit=5)
        for inv in invoices:
            invoice_repo.update(inv["id"], {
                "paid_amount": half,
                "outstanding_amount": round(grand_total - half, 2),
                "status": "PARTIALLY_PAID"
            })
    elif new_st == "PAID":
        update_data["paid_amount"] = grand_total
        update_data["outstanding_amount"] = 0.0
        items = so_items_repo.get_all(filters={"so_id": so_id}, limit=100)
        for item in items:
            so_items_repo.update(item["id"], {
                "delivered_qty": item.get("quantity", 0.0),
                "billed_qty": item.get("quantity", 0.0)
            })
        # Synchronize linked invoice
        invoices = invoice_repo.get_all(filters={"sales_order_id": so_id}, limit=5)
        if not invoices and existing.get("so_number"):
            invoices = invoice_repo.get_all(filters={"so_number": existing.get("so_number")}, limit=5)
        for inv in invoices:
            invoice_repo.update(inv["id"], {
                "paid_amount": grand_total,
                "outstanding_amount": 0.0,
                "status": "PAID"
            })
    elif new_st == "CLOSED":
        if float(existing.get("paid_amount") or 0.0) >= grand_total or existing.get("status") == "PAID":
            update_data["paid_amount"] = grand_total
            update_data["outstanding_amount"] = 0.0
    elif new_st == "DRAFT":
        update_data["paid_amount"] = 0.0
        update_data["outstanding_amount"] = grand_total

    so_repo.update(so_id, update_data)
    updated = so_repo.get_by_id(so_id)
    items = so_items_repo.get_all(filters={"so_id": so_id}, limit=100)
    return ApiResponse(
        message=f"Sales Order status updated to {update.status}",
        data=SalesOrderResponse(**updated, items=[SalesOrderItemResponse(**i) for i in items])
    )


@router.delete("/sales-orders/{so_id}", response_model=ApiResponse)
def delete_sales_order(so_id: str):
    existing = so_repo.get_by_id(so_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Sales Order {so_id} not found")
    if existing.get("status") not in ("DRAFT", "CANCELLED"):
        raise HTTPException(status_code=400, detail="Can only delete DRAFT or CANCELLED sales orders")

    from ....core.database import db_manager
    db_manager.execute_write("DELETE FROM sales_order_items WHERE so_id = ?", [so_id])
    so_repo.delete(so_id)
    return ApiResponse(message=f"Sales Order {so_id} deleted")


# ─────────────── Chart of Accounts ───────────────

@router.get("/chart-of-accounts", response_model=ApiResponse[List[AccountResponse]])
def get_chart_of_accounts(
    account_type: Optional[str] = None
):
    filters = {"account_type": account_type} if account_type else None
    accounts = coa_repo.get_all(filters=filters, limit=500)
    return ApiResponse(data=[AccountResponse(**a) for a in accounts])


@router.post("/chart-of-accounts", response_model=ApiResponse[AccountResponse], status_code=201)
def create_account(acc_in: AccountCreate):
    ts = int(time.time() * 1000) % 100000
    acc_id = f"ACC-{ts}"
    data = acc_in.model_dump()
    data["id"] = acc_id
    data["balance"] = 0.0
    data["is_frozen"] = False
    coa_repo.create(data)
    created = coa_repo.get_by_id(acc_id)
    return ApiResponse(message="Account created", data=AccountResponse(**created))


# ─────────────── Journal Entries (General Ledger) ───────────────

@router.get("/journal-entries", response_model=ApiResponse[List[JournalEntryResponse]])
def get_journal_entries(
    account_id: Optional[str] = None,
    party_name: Optional[str] = None,
    reference_type: Optional[str] = None
):
    filters = {}
    if account_id:
        filters["account_id"] = account_id
    if party_name:
        filters["party_name"] = party_name
    if reference_type:
        filters["reference_type"] = reference_type
    entries = journal_repo.get_all(filters=filters if filters else None, limit=500)
    return ApiResponse(data=[JournalEntryResponse(**e) for e in entries])


@router.post("/journal-entries", response_model=ApiResponse[JournalEntryResponse], status_code=201)
def create_journal_entry(entry_in: JournalEntryCreate):
    ts = int(time.time() * 1000) % 100000
    entry_id = f"JE-{ts}"
    entry_number = f"JE-2026-{ts:05d}"
    data = entry_in.model_dump()
    data.update({
        "id": entry_id,
        "entry_number": entry_number,
    })
    journal_repo.create(data)

    # Update account balance
    account = coa_repo.get_by_id(entry_in.account_id)
    if account:
        new_balance = account.get("balance", 0) + entry_in.debit - entry_in.credit
        coa_repo.update(entry_in.account_id, {"balance": round(new_balance, 2)})

    created = journal_repo.get_by_id(entry_id)
    return ApiResponse(message="Journal Entry created", data=JournalEntryResponse(**created))


# ─────────────── Sales Invoices ───────────────

@router.get("/invoices", response_model=ApiResponse[List[SalesInvoiceResponse]])
def get_invoices(
    status: Optional[str] = None,
    customer_id: Optional[str] = None
):
    filters = {}
    if status:
        filters["status"] = status
    if customer_id:
        filters["customer_id"] = customer_id
    invoices = invoice_repo.get_all(filters=filters if filters else None, limit=200)

    result = []
    for inv in invoices:
        items = invoice_items_repo.get_all(filters={"invoice_id": inv["id"]}, limit=100)
        result.append(SalesInvoiceResponse(**inv, items=[InvoiceItemResponse(**i) for i in items]))
    return ApiResponse(data=result)


@router.post("/invoices", response_model=ApiResponse[SalesInvoiceResponse], status_code=201)
def create_invoice(inv_in: SalesInvoiceCreate):
    ts = int(time.time() * 1000) % 100000
    inv_id = f"INV-{ts}"
    inv_number = f"INV-2026-{ts:05d}"

    subtotal = 0.0
    total_tax = 0.0
    item_records = []
    for idx, item in enumerate(inv_in.items):
        line_amount = item.quantity * item.rate
        line_tax = line_amount * (item.tax_rate / 100)
        subtotal += line_amount
        total_tax += line_tax
        item_id = f"INVI-{ts}-{idx + 1}"
        item_records.append({
            "id": item_id,
            "invoice_id": inv_id,
            "item_code": item.item_code,
            "item_name": item.item_name,
            "description": item.description,
            "quantity": item.quantity,
            "rate": item.rate,
            "tax_rate": item.tax_rate,
            "tax_amount": round(line_tax, 2),
            "amount": round(line_amount + line_tax, 2),
        })

    grand_total = subtotal + total_tax

    inv_data = inv_in.model_dump(exclude={"items"})
    inv_data.update({
        "id": inv_id,
        "invoice_number": inv_number,
        "subtotal": round(subtotal, 2),
        "tax_amount": round(total_tax, 2),
        "grand_total": round(grand_total, 2),
        "paid_amount": 0.0,
        "outstanding_amount": round(grand_total, 2),
        "status": "SUBMITTED",
    })

    invoice_repo.create(inv_data)
    for item_rec in item_records:
        invoice_items_repo.create(item_rec)

    # Update Sales Order status to INVOICED if linked
    if inv_in.sales_order_id:
        so = so_repo.get_by_id(inv_in.sales_order_id)
        if so and so.get("status") in ("CONFIRMED", "FULLY_DELIVERED"):
            so_repo.update(inv_in.sales_order_id, {"status": "INVOICED"})

    created = invoice_repo.get_by_id(inv_id)
    items = invoice_items_repo.get_all(filters={"invoice_id": inv_id}, limit=100)
    return ApiResponse(
        message="Sales Invoice created",
        data=SalesInvoiceResponse(**created, items=[InvoiceItemResponse(**i) for i in items])
    )


# ─────────────── Payment Entries ───────────────

@router.get("/payments", response_model=ApiResponse[List[PaymentEntryResponse]])
def get_payments(
    payment_type: Optional[str] = None,
    party_type: Optional[str] = None
):
    filters = {}
    if payment_type:
        filters["payment_type"] = payment_type
    if party_type:
        filters["party_type"] = party_type
    payments = payment_repo.get_all(filters=filters if filters else None, limit=200)
    return ApiResponse(data=[PaymentEntryResponse(**p) for p in payments])


@router.post("/payments", response_model=ApiResponse[PaymentEntryResponse], status_code=201)
def create_payment(pay_in: PaymentEntryCreate):
    ts = int(time.time() * 1000) % 100000
    pay_id = f"PAY-{ts}"
    pay_number = f"PAY-2026-{ts:05d}"

    data = pay_in.model_dump()
    data.update({
        "id": pay_id,
        "payment_number": pay_number,
        "status": "SUBMITTED",
    })

    payment_repo.create(data)

    # If allocated to an invoice, update the invoice's paid/outstanding amounts
    if pay_in.allocated_to_invoice:
        inv = invoice_repo.get_by_id(pay_in.allocated_to_invoice)
        if inv:
            new_paid = inv.get("paid_amount", 0) + pay_in.paid_amount
            new_outstanding = inv.get("grand_total", 0) - new_paid
            inv_status = "PAID" if new_outstanding <= 0 else "PARTIALLY_PAID"
            invoice_repo.update(pay_in.allocated_to_invoice, {
                "paid_amount": round(new_paid, 2),
                "outstanding_amount": round(max(new_outstanding, 0), 2),
                "status": inv_status,
            })

            # Also update the linked Sales Order if fully paid
            if inv_status == "PAID" and inv.get("sales_order_id"):
                so_repo.update(inv["sales_order_id"], {
                    "paid_amount": round(new_paid, 2),
                    "outstanding_amount": round(max(new_outstanding, 0), 2),
                    "status": "PAID",
                })

    created = payment_repo.get_by_id(pay_id)
    return ApiResponse(message="Payment recorded", data=PaymentEntryResponse(**created))


# ─────────────── Finance Dashboard ───────────────

@router.get("/summary", response_model=ApiResponse[FinanceSummary])
def get_finance_summary():
    all_sos = so_repo.get_all(limit=500)
    all_invoices = invoice_repo.get_all(limit=500)
    all_payments = payment_repo.get_all(filters={"payment_type": "RECEIVE"}, limit=500)

    total_revenue = sum(so.get("grand_total", 0) for so in all_sos if so.get("status") not in ("DRAFT", "CANCELLED"))
    total_receivable = sum(inv.get("outstanding_amount", 0) for inv in all_invoices if inv.get("status") not in ("PAID", "CANCELLED"))
    total_invoices = len(all_invoices)
    overdue_invoices = sum(1 for inv in all_invoices if inv.get("status") == "OVERDUE")
    payments_received = sum(p.get("paid_amount", 0) for p in all_payments)

    # SO by status
    so_by_status = {}
    for so in all_sos:
        s = so.get("status", "DRAFT")
        so_by_status[s] = so_by_status.get(s, 0) + 1

    # Recent invoices
    recent_inv = sorted(all_invoices, key=lambda x: x.get("created_at", ""), reverse=True)[:5]
    recent_invoices = [SalesInvoiceResponse(**inv, items=[]) for inv in recent_inv]

    # AR Aging (simplified)
    ar_aging = {
        "current": sum(inv.get("outstanding_amount", 0) for inv in all_invoices if inv.get("status") == "SUBMITTED"),
        "30_days": 0,
        "60_days": 0,
        "90_plus": 0,
    }

    return ApiResponse(data=FinanceSummary(
        total_revenue=round(total_revenue, 2),
        total_receivable=round(total_receivable, 2),
        total_payable=0.0,  # V1: AP not yet implemented
        total_sales_orders=len(all_sos),
        total_invoices=total_invoices,
        overdue_invoices=overdue_invoices,
        payments_received=round(payments_received, 2),
        so_by_status=so_by_status,
        recent_invoices=recent_invoices,
        ar_aging=ar_aging,
    ))
