from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class InventoryItemBase(BaseModel):
    item_code: str
    item_name: str
    category: str
    warehouse_name: str
    stock_mt: float = 0.0
    allocated_mt: float = 0.0
    available_mt: float = 0.0
    reorder_level_mt: float = 5.0
    unit_cost_usd: float = 0.0
    status: str = "IN_STOCK"

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(BaseModel):
    item_name: Optional[str] = None
    category: Optional[str] = None
    warehouse_name: Optional[str] = None
    stock_mt: Optional[float] = None
    allocated_mt: Optional[float] = None
    available_mt: Optional[float] = None
    reorder_level_mt: Optional[float] = None
    unit_cost_usd: Optional[float] = None
    status: Optional[str] = None

class InventoryItemResponse(InventoryItemBase):
    id: str
    created_at: Optional[datetime] = None

class WarehouseTransactionBase(BaseModel):
    transaction_no: str
    transaction_type: str # STOCK_IN, WH_DELIVERY, WH_RETURN, WH_NOTE
    item_code: str
    item_name: str
    warehouse_name: str
    quantity_mt: float = 0.0
    reference_order_no: Optional[str] = None
    partner_name: Optional[str] = None
    driver_truck_no: Optional[str] = None
    date: str
    remarks: Optional[str] = None
    status: str = "COMPLETED"

class WarehouseTransactionCreate(WarehouseTransactionBase):
    pass

class WarehouseTransactionResponse(WarehouseTransactionBase):
    id: str
    created_at: Optional[datetime] = None

class WarehouseDamageBase(BaseModel):
    log_no: str
    log_type: str # DAMAGE, WEIGHT_LOSS
    item_code: str
    item_name: str
    warehouse_name: str
    loss_mt: float = 0.0
    reason: str
    date: str
    inspection_officer: Optional[str] = None
    status: str = "CONFIRMED"

class WarehouseDamageCreate(WarehouseDamageBase):
    pass

class WarehouseDamageResponse(WarehouseDamageBase):
    id: str
    created_at: Optional[datetime] = None

