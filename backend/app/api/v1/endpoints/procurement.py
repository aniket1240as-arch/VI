import time
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ....repositories import get_repository
from ....models.common import ApiResponse
from ....models.procurement import (
    PurchaseOrderCreate, PurchaseOrderResponse, PurchaseOrderStatusUpdate,
    PurchaseOrderItemResponse,
    GRNCreate, GRNResponse, GRNItemResponse,
    ProcurementSummary
)

router = APIRouter(prefix="/procurement", tags=["Procurement"])
po_repo = get_repository("purchase_orders")
po_items_repo = get_repository("purchase_order_items")
grn_repo = get_repository("goods_receipt_notes")
grn_items_repo = get_repository("grn_items")
supplier_repo = get_repository("partners")


# ─────────────── Purchase Orders ───────────────

@router.get("/purchase-orders", response_model=ApiResponse[List[PurchaseOrderResponse]])
def get_purchase_orders(
    status: Optional[str] = None,
    supplier_id: Optional[str] = None
):
    filters = {}
    if status:
        filters["status"] = status
    if supplier_id:
        filters["supplier_id"] = supplier_id
    pos = po_repo.get_all(filters=filters if filters else None, limit=200)

    result = []
    for po in pos:
        # Fetch line items for each PO
        items = po_items_repo.get_all(filters={"po_id": po["id"]}, limit=100)
        po_data = PurchaseOrderResponse(
            **po,
            items=[PurchaseOrderItemResponse(**i) for i in items]
        )
        result.append(po_data)
    return ApiResponse(data=result)


@router.get("/purchase-orders/{po_id}", response_model=ApiResponse[PurchaseOrderResponse])
def get_purchase_order(po_id: str):
    po = po_repo.get_by_id(po_id)
    if not po:
        raise HTTPException(status_code=404, detail=f"Purchase Order {po_id} not found")
    items = po_items_repo.get_all(filters={"po_id": po_id}, limit=100)
    return ApiResponse(data=PurchaseOrderResponse(
        **po,
        items=[PurchaseOrderItemResponse(**i) for i in items]
    ))


@router.post("/purchase-orders", response_model=ApiResponse[PurchaseOrderResponse], status_code=201)
def create_purchase_order(po_in: PurchaseOrderCreate):
    ts = int(time.time() * 1000) % 100000
    po_id = f"PO-{ts}"
    po_number = f"PO-2026-{ts:05d}"

    # Calculate totals from items
    subtotal = 0.0
    item_records = []
    for idx, item in enumerate(po_in.items):
        item_amount = item.quantity * item.rate * (1 - item.discount_percent / 100)
        subtotal += item_amount
        item_id = f"POI-{ts}-{idx + 1}"
        item_records.append({
            "id": item_id,
            "po_id": po_id,
            "item_code": item.item_code,
            "item_name": item.item_name,
            "description": item.description,
            "quantity": item.quantity,
            "received_qty": 0.0,
            "uom": item.uom,
            "rate": item.rate,
            "discount_percent": item.discount_percent,
            "amount": round(item_amount, 2),
            "quality_grade": item.quality_grade,
            "required_by_date": item.required_by_date,
        })

    grand_total = subtotal  # V1: no tax calculation

    po_data = po_in.model_dump(exclude={"items"})
    po_data.update({
        "id": po_id,
        "po_number": po_number,
        "subtotal": round(subtotal, 2),
        "tax_amount": 0.0,
        "shipping_charges": 0.0,
        "grand_total": round(grand_total, 2),
        "status": "DRAFT",
        "approval_status": "PENDING",
    })

    po_repo.create(po_data)
    for item_rec in item_records:
        po_items_repo.create(item_rec)

    created = po_repo.get_by_id(po_id)
    items = po_items_repo.get_all(filters={"po_id": po_id}, limit=100)
    return ApiResponse(
        message="Purchase Order created",
        data=PurchaseOrderResponse(**created, items=[PurchaseOrderItemResponse(**i) for i in items])
    )


@router.patch("/purchase-orders/{po_id}/status", response_model=ApiResponse[PurchaseOrderResponse])
def update_po_status(po_id: str, update: PurchaseOrderStatusUpdate):
    existing = po_repo.get_by_id(po_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Purchase Order {po_id} not found")

    valid_transitions = {
        "DRAFT": ["PENDING_APPROVAL", "CANCELLED"],
        "PENDING_APPROVAL": ["APPROVED", "REJECTED", "DRAFT"],
        "APPROVED": ["SENT", "CANCELLED"],
        "REJECTED": ["DRAFT"],
        "SENT": ["PARTIALLY_RECEIVED", "FULLY_RECEIVED", "CANCELLED"],
        "PARTIALLY_RECEIVED": ["FULLY_RECEIVED"],
        "FULLY_RECEIVED": ["CLOSED"],
        "CLOSED": [],
        "CANCELLED": [],
    }

    current = existing.get("status", "DRAFT")
    allowed = valid_transitions.get(current, [])
    if update.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from {current} to {update.status}. Allowed: {allowed}"
        )

    update_data = {"status": update.status}
    if update.status == "APPROVED":
        update_data["approval_status"] = "APPROVED"
        update_data["approved_by"] = update.approved_by or "admin"
        import datetime as dt
        update_data["approved_date"] = dt.date.today().isoformat()
    elif update.status == "REJECTED":
        update_data["approval_status"] = "REJECTED"

    po_repo.update(po_id, update_data)
    updated = po_repo.get_by_id(po_id)
    items = po_items_repo.get_all(filters={"po_id": po_id}, limit=100)
    return ApiResponse(
        message=f"Purchase Order status updated to {update.status}",
        data=PurchaseOrderResponse(**updated, items=[PurchaseOrderItemResponse(**i) for i in items])
    )


@router.delete("/purchase-orders/{po_id}", response_model=ApiResponse)
def delete_purchase_order(po_id: str):
    existing = po_repo.get_by_id(po_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Purchase Order {po_id} not found")
    if existing.get("status") not in ("DRAFT", "CANCELLED"):
        raise HTTPException(status_code=400, detail="Can only delete DRAFT or CANCELLED purchase orders")

    # Delete line items first
    from ....core.database import db_manager
    db_manager.execute_write("DELETE FROM purchase_order_items WHERE po_id = ?", [po_id])
    po_repo.delete(po_id)
    return ApiResponse(message=f"Purchase Order {po_id} deleted")


# ─────────────── Goods Receipt Notes ───────────────

@router.get("/grns", response_model=ApiResponse[List[GRNResponse]])
def get_grns(po_id: Optional[str] = None):
    filters = {"po_id": po_id} if po_id else None
    grns = grn_repo.get_all(filters=filters, limit=200)

    result = []
    for grn in grns:
        items = grn_items_repo.get_all(filters={"grn_id": grn["id"]}, limit=100)
        result.append(GRNResponse(**grn, items=[GRNItemResponse(**i) for i in items]))
    return ApiResponse(data=result)


@router.post("/grns", response_model=ApiResponse[GRNResponse], status_code=201)
def create_grn(grn_in: GRNCreate):
    # Verify PO exists
    po = po_repo.get_by_id(grn_in.po_id)
    if not po:
        raise HTTPException(status_code=404, detail=f"Purchase Order {grn_in.po_id} not found")

    ts = int(time.time() * 1000) % 100000
    grn_id = f"GRN-{ts}"
    grn_number = f"GRN-2026-{ts:05d}"

    grn_data = grn_in.model_dump(exclude={"items"})
    grn_data.update({
        "id": grn_id,
        "grn_number": grn_number,
        "status": "SUBMITTED",
    })
    grn_repo.create(grn_data)

    # Create GRN items and update PO item received quantities
    for idx, item in enumerate(grn_in.items):
        item_id = f"GRNI-{ts}-{idx + 1}"
        item_data = item.model_dump()
        item_data.update({
            "id": item_id,
            "grn_id": grn_id,
        })
        grn_items_repo.create(item_data)

        # Update received_qty on PO item
        if item.po_item_id:
            po_item = po_items_repo.get_by_id(item.po_item_id)
            if po_item:
                new_received = po_item.get("received_qty", 0) + item.accepted_qty
                po_items_repo.update(item.po_item_id, {"received_qty": new_received})

    # Check if PO is fully received
    po_items = po_items_repo.get_all(filters={"po_id": grn_in.po_id}, limit=100)
    all_received = all(
        i.get("received_qty", 0) >= i.get("quantity", 0)
        for i in po_items
    )
    some_received = any(i.get("received_qty", 0) > 0 for i in po_items)

    if all_received:
        po_repo.update(grn_in.po_id, {"status": "FULLY_RECEIVED"})
    elif some_received:
        po_repo.update(grn_in.po_id, {"status": "PARTIALLY_RECEIVED"})

    created = grn_repo.get_by_id(grn_id)
    items = grn_items_repo.get_all(filters={"grn_id": grn_id}, limit=100)
    return ApiResponse(
        message="Goods Receipt Note created",
        data=GRNResponse(**created, items=[GRNItemResponse(**i) for i in items])
    )


# ─────────────── Procurement Dashboard ───────────────

@router.get("/summary", response_model=ApiResponse[ProcurementSummary])
def get_procurement_summary():
    all_pos = po_repo.get_all(limit=500)

    total_pos = len(all_pos)
    open_po_value = sum(
        po.get("grand_total", 0) for po in all_pos
        if po.get("status") not in ("CLOSED", "CANCELLED", "FULLY_RECEIVED")
    )
    pending_approvals = sum(1 for po in all_pos if po.get("status") == "PENDING_APPROVAL")
    total_spend = sum(
        po.get("grand_total", 0) for po in all_pos
        if po.get("status") in ("FULLY_RECEIVED", "CLOSED")
    )

    all_grns = grn_repo.get_all(limit=500)
    grns_this_month = len(all_grns)  # Simplified for V1

    suppliers = supplier_repo.get_all(filters={"type": "SUPPLIER"}, limit=200)
    suppliers_active = len(suppliers)

    # POs by status
    pos_by_status = {}
    for po in all_pos:
        s = po.get("status", "DRAFT")
        pos_by_status[s] = pos_by_status.get(s, 0) + 1

    # Recent POs (last 5)
    recent = sorted(all_pos, key=lambda x: x.get("created_at", ""), reverse=True)[:5]
    recent_pos = [PurchaseOrderResponse(**po, items=[]) for po in recent]

    return ApiResponse(data=ProcurementSummary(
        total_pos=total_pos,
        open_po_value=round(open_po_value, 2),
        pending_approvals=pending_approvals,
        total_spend=round(total_spend, 2),
        grns_this_month=grns_this_month,
        suppliers_active=suppliers_active,
        pos_by_status=pos_by_status,
        recent_pos=recent_pos,
    ))
