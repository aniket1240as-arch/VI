import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status
from ....core.database import db_manager
from ....models.common import ApiResponse
from ....models.operations import (
    OrderExecutionCreate,
    OrderExecutionUpdate,
    DocumentSubmissionCreate,
    DocumentSubmissionUpdate,
    DeliveryClaimCreate,
    DeliveryClaimUpdate
)

router = APIRouter()

# ─────────────────────────────────────────────────────────────
# Order Executions
# ─────────────────────────────────────────────────────────────
@router.get("/executions", response_model=ApiResponse[Dict[str, Any]])
def get_order_executions(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None)
):
    """Retrieve PO milestone execution status and container assignments"""
    sql = "SELECT * FROM order_executions WHERE 1=1"
    params = []
    
    if status_filter and status_filter != "ALL":
        sql += " AND execution_status = ?"
        params.append(status_filter)
    if search and isinstance(search, str) and search.strip():
        sql += " AND (po_no ILIKE ? OR supplier_name ILIKE ? OR contract_no ILIKE ? OR bl_no ILIKE ?)"
        s = f"%{search.strip()}%"
        params.extend([s, s, s, s])
        
    sql += " ORDER BY date DESC"
    executions = db_manager.execute_query(sql, params)
    
    # Milestone Metrics
    total_val = sum(float(e.get('total_amount') or 0) for e in executions)
    completed_count = sum(1 for e in executions if e.get('execution_status') == 'COMPLETED')
    in_process_count = sum(1 for e in executions if e.get('execution_status') == 'IN_PROCESS')
    pending_count = sum(1 for e in executions if e.get('execution_status') == 'PENDING')
    
    return ApiResponse(
        data={
            "executions": executions,
            "metrics": {
                "totalOrders": len(executions),
                "totalValueUsd": round(total_val, 2),
                "completed": completed_count,
                "inProcess": in_process_count,
                "pending": pending_count
            }
        },
        message="Order executions fetched successfully"
    )

@router.post("/executions", response_model=ApiResponse[Dict[str, Any]], status_code=status.HTTP_201_CREATED)
def create_order_execution(payload: OrderExecutionCreate):
    """Create new order execution milestone"""
    new_id = f"EXEC-{uuid.uuid4().hex[:6].upper()}"
    sql = """
    INSERT INTO order_executions (id, po_no, date, supplier_name, purchase_manager, contract_no, quantity_mt, total_amount, currency, execution_status, container_no, bl_no)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    db_manager.execute_write(
        sql,
        [new_id, payload.po_no, payload.date, payload.supplier_name, payload.purchase_manager, payload.contract_no, payload.quantity_mt, payload.total_amount, payload.currency, payload.execution_status, payload.container_no, payload.bl_no]
    )
    row = db_manager.execute_one("SELECT * FROM order_executions WHERE id = ?", [new_id])
    return ApiResponse(data=row, message="Order execution milestone created")

# ─────────────────────────────────────────────────────────────
# Document Submissions
# ─────────────────────────────────────────────────────────────
@router.get("/documents", response_model=ApiResponse[List[Dict[str, Any]]])
def get_document_submissions(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None)
):
    """Retrieve compliance document submissions and status"""
    sql = "SELECT * FROM document_submissions WHERE 1=1"
    params = []
    
    if status_filter and status_filter != "ALL":
        sql += " AND status = ?"
        params.append(status_filter)
    if search and isinstance(search, str) and search.strip():
        sql += " AND (submission_no ILIKE ? OR supplier_name ILIKE ? OR ref_no ILIKE ?)"
        s = f"%{search.strip()}%"
        params.extend([s, s, s])
        
    sql += " ORDER BY date DESC"
    docs = db_manager.execute_query(sql, params)
    return ApiResponse(data=docs, message="Document submissions fetched successfully")

@router.post("/documents", response_model=ApiResponse[Dict[str, Any]], status_code=status.HTTP_201_CREATED)
def create_document_submission(payload: DocumentSubmissionCreate):
    """Record shipping document compliance pack"""
    new_id = f"SUB-{uuid.uuid4().hex[:6].upper()}"
    sql = """
    INSERT INTO document_submissions (id, submission_no, date, ref_no, contract_no, supplier_name, document_types, status, reviewer, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    db_manager.execute_write(
        sql,
        [new_id, payload.submission_no, payload.date, payload.ref_no, payload.contract_no, payload.supplier_name, payload.document_types, payload.status, payload.reviewer, payload.remarks]
    )
    row = db_manager.execute_one("SELECT * FROM document_submissions WHERE id = ?", [new_id])
    return ApiResponse(data=row, message="Document submission recorded")

# ─────────────────────────────────────────────────────────────
# Delivery Claims
# ─────────────────────────────────────────────────────────────
@router.get("/claims", response_model=ApiResponse[List[Dict[str, Any]]])
def get_delivery_claims(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None)
):
    """Retrieve customer delivery dispute and quality claims"""
    sql = "SELECT * FROM delivery_claims WHERE 1=1"
    params = []
    
    if status_filter and status_filter != "ALL":
        sql += " AND status = ?"
        params.append(status_filter)
    if search and isinstance(search, str) and search.strip():
        sql += " AND (claim_no ILIKE ? OR customer_name ILIKE ? OR delivery_ref ILIKE ?)"
        s = f"%{search.strip()}%"
        params.extend([s, s, s])
        
    sql += " ORDER BY date DESC"
    claims = db_manager.execute_query(sql, params)
    return ApiResponse(data=claims, message="Delivery claims fetched successfully")

@router.post("/claims", response_model=ApiResponse[Dict[str, Any]], status_code=status.HTTP_201_CREATED)
def create_delivery_claim(payload: DeliveryClaimCreate):
    """File a customer delivery dispute or claim"""
    new_id = f"CLM-{uuid.uuid4().hex[:6].upper()}"
    sql = """
    INSERT INTO delivery_claims (id, claim_no, date, delivery_ref, customer_name, claim_amount, currency, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    db_manager.execute_write(
        sql,
        [new_id, payload.claim_no, payload.date, payload.delivery_ref, payload.customer_name, payload.claim_amount, payload.currency, payload.reason, payload.status]
    )
    row = db_manager.execute_one("SELECT * FROM delivery_claims WHERE id = ?", [new_id])
    return ApiResponse(data=row, message="Delivery claim filed successfully")
