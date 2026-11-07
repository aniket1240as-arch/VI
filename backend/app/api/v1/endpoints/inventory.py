import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status
from ....core.database import db_manager
from ....models.common import ApiResponse
from ....models.inventory import (
    InventoryItemCreate,
    InventoryItemUpdate,
    WarehouseTransactionCreate,
    WarehouseDamageCreate
)

router = APIRouter()

@router.get("/items", response_model=ApiResponse[Dict[str, Any]])
def get_inventory_items(
    warehouse: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    """Retrieve all inventory items with summary analytics"""
    sql = "SELECT * FROM warehouse_inventory WHERE 1=1"
    params = []
    
    if warehouse and warehouse != "ALL":
        sql += " AND warehouse_name = ?"
        params.append(warehouse)
    if category and category != "ALL":
        sql += " AND category = ?"
        params.append(category)
    if search and isinstance(search, str) and search.strip():
        sql += " AND (item_code ILIKE ? OR item_name ILIKE ?)"
        s = f"%{search.strip()}%"
        params.extend([s, s])
        
    sql += " ORDER BY item_name ASC"
    items = db_manager.execute_query(sql, params)
    
    # Calculate operational metrics
    total_stock = sum(float(i.get('stock_mt') or 0) for i in items)
    allocated_stock = sum(float(i.get('allocated_mt') or 0) for i in items)
    available_stock = sum(float(i.get('available_mt') or 0) for i in items)
    total_valuation = sum(float(i.get('stock_mt') or 0) * float(i.get('unit_cost_usd') or 0) for i in items)
    
    return ApiResponse(
        data={
            "items": items,
            "metrics": {
                "totalStockMt": round(total_stock, 2),
                "allocatedMt": round(allocated_stock, 2),
                "availableMt": round(available_stock, 2),
                "totalValuationUsd": round(total_valuation, 2),
                "totalLots": len(items)
            }
        },
        message="Warehouse inventory fetched successfully"
    )

@router.post("/items", response_model=ApiResponse[Dict[str, Any]], status_code=status.HTTP_201_CREATED)
def create_inventory_item(payload: InventoryItemCreate):
    """Register a new warehouse inventory lot"""
    new_id = f"WH-INV-{uuid.uuid4().hex[:6].upper()}"
    available = max(0.0, payload.stock_mt - payload.allocated_mt)
    
    sql = """
    INSERT INTO warehouse_inventory (id, item_code, item_name, category, warehouse_name, stock_mt, allocated_mt, available_mt, reorder_level_mt, unit_cost_usd, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    db_manager.execute_write(
        sql,
        [new_id, payload.item_code, payload.item_name, payload.category, payload.warehouse_name, payload.stock_mt, payload.allocated_mt, available, payload.reorder_level_mt, payload.unit_cost_usd, payload.status]
    )
    
    item = db_manager.execute_one("SELECT * FROM warehouse_inventory WHERE id = ?", [new_id])
    return ApiResponse(data=item, message="Inventory lot registered successfully")

@router.get("/transactions", response_model=ApiResponse[List[Dict[str, Any]]])
def get_warehouse_transactions(
    txn_type: Optional[str] = Query(None, alias="type"),
    search: Optional[str] = Query(None)
):
    """Retrieve warehouse movement transactions (STOCK_IN, WH_DELIVERY, WH_RETURN, WH_NOTE)"""
    sql = "SELECT * FROM warehouse_transactions WHERE 1=1"
    params = []
    
    if txn_type and txn_type != "ALL":
        sql += " AND transaction_type = ?"
        params.append(txn_type)
    if search and isinstance(search, str) and search.strip():
        sql += " AND (transaction_no ILIKE ? OR item_name ILIKE ? OR reference_order_no ILIKE ? OR partner_name ILIKE ?)"
        s = f"%{search.strip()}%"
        params.extend([s, s, s, s])
        
    sql += " ORDER BY date DESC, created_at DESC"
    txns = db_manager.execute_query(sql, params)
    return ApiResponse(data=txns, message="Warehouse movements fetched successfully")

@router.post("/transactions", response_model=ApiResponse[Dict[str, Any]], status_code=status.HTTP_201_CREATED)
def create_warehouse_transaction(payload: WarehouseTransactionCreate):
    """Record warehouse receipt, delivery, return or dispatch note"""
    new_id = f"TXN-{uuid.uuid4().hex[:6].upper()}"
    sql = """
    INSERT INTO warehouse_transactions (id, transaction_no, transaction_type, item_code, item_name, warehouse_name, quantity_mt, reference_order_no, partner_name, driver_truck_no, date, remarks, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    db_manager.execute_write(
        sql,
        [new_id, payload.transaction_no, payload.transaction_type, payload.item_code, payload.item_name, payload.warehouse_name, payload.quantity_mt, payload.reference_order_no, payload.partner_name, payload.driver_truck_no, payload.date, payload.remarks, payload.status]
    )
    
    # Adjust stock if STOCK_IN or WH_DELIVERY
    if payload.transaction_type == "STOCK_IN":
        db_manager.execute_write(
            "UPDATE warehouse_inventory SET stock_mt = stock_mt + ?, available_mt = available_mt + ? WHERE item_code = ?",
            [payload.quantity_mt, payload.quantity_mt, payload.item_code]
        )
    elif payload.transaction_type == "WH_DELIVERY":
        db_manager.execute_write(
            "UPDATE warehouse_inventory SET stock_mt = GREATEST(0.0, stock_mt - ?), available_mt = GREATEST(0.0, available_mt - ?) WHERE item_code = ?",
            [payload.quantity_mt, payload.quantity_mt, payload.item_code]
        )
        
    txn = db_manager.execute_one("SELECT * FROM warehouse_transactions WHERE id = ?", [new_id])
    return ApiResponse(data=txn, message="Warehouse movement logged successfully")

@router.get("/damages", response_model=ApiResponse[List[Dict[str, Any]]])
def get_warehouse_damages(
    damage_type: Optional[str] = Query(None, alias="type"),
    search: Optional[str] = Query(None)
):
    """Retrieve warehouse damage and shrinkage/weight loss records"""
    sql = "SELECT * FROM warehouse_damage_logs WHERE 1=1"
    params = []
    
    if damage_type and damage_type != "ALL":
        sql += " AND log_type = ?"
        params.append(damage_type)
    if search and isinstance(search, str) and search.strip():
        sql += " AND (log_no ILIKE ? OR item_name ILIKE ? OR reason ILIKE ?)"
        s = f"%{search.strip()}%"
        params.extend([s, s, s])
        
    sql += " ORDER BY date DESC"
    damages = db_manager.execute_query(sql, params)
    return ApiResponse(data=damages, message="Warehouse damage records fetched successfully")

@router.post("/damages", response_model=ApiResponse[Dict[str, Any]], status_code=status.HTTP_201_CREATED)
def create_warehouse_damage(payload: WarehouseDamageCreate):
    """Record loss due to storage damage or moisture shrinkage"""
    new_id = f"DMG-{uuid.uuid4().hex[:6].upper()}"
    sql = """
    INSERT INTO warehouse_damage_logs (id, log_no, log_type, item_code, item_name, warehouse_name, loss_mt, reason, date, inspection_officer, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    db_manager.execute_write(
        sql,
        [new_id, payload.log_no, payload.log_type, payload.item_code, payload.item_name, payload.warehouse_name, payload.loss_mt, payload.reason, payload.date, payload.inspection_officer, payload.status]
    )
    
    # Deduct loss from warehouse inventory
    db_manager.execute_write(
        "UPDATE warehouse_inventory SET stock_mt = GREATEST(0.0, stock_mt - ?), available_mt = GREATEST(0.0, available_mt - ?) WHERE item_code = ?",
        [payload.loss_mt, payload.loss_mt, payload.item_code]
    )
    
    dmg = db_manager.execute_one("SELECT * FROM warehouse_damage_logs WHERE id = ?", [new_id])
    return ApiResponse(data=dmg, message="Warehouse damage/weight-loss recorded successfully")
