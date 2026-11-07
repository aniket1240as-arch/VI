from typing import Optional, Union
from datetime import datetime
from pydantic import BaseModel, Field

class AssetTypeBase(BaseModel):
    name: str
    status: str = "ACTIVE"

class AssetTypeCreate(AssetTypeBase):
    pass

class AssetTypeUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None

class AssetTypeResponse(AssetTypeBase):
    id: str
    created_at: Optional[Union[datetime, str]] = None


class AssetBase(BaseModel):
    name: str
    code: str
    type_name: str
    type_id: Optional[str] = None
    assigned_to: Optional[str] = None
    branch: str = "Hanoi HQ"
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_no: Optional[str] = None
    purchase_date: Optional[str] = None
    expiry_date: Optional[str] = None
    depreciation_rate: float = 10.0
    cost: float = 0.0
    status: str = "ACTIVE"

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    type_name: Optional[str] = None
    type_id: Optional[str] = None
    assigned_to: Optional[str] = None
    branch: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_no: Optional[str] = None
    purchase_date: Optional[str] = None
    expiry_date: Optional[str] = None
    depreciation_rate: Optional[float] = None
    cost: Optional[float] = None
    status: Optional[str] = None

class AssetResponse(AssetBase):
    id: str
    created_at: Optional[Union[datetime, str]] = None

