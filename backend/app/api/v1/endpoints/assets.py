import uuid
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, HTTPException, Query, status
from ....repositories import get_repository
from ....core.database import db_manager
from ....models.common import ApiResponse
from ....models.asset import (
    AssetCreate, AssetUpdate, AssetResponse,
    AssetTypeCreate, AssetTypeUpdate, AssetTypeResponse
)

router = APIRouter(prefix="/assets", tags=["Assets Management"])

asset_repo = get_repository("assets")
type_repo = get_repository("asset_types")

# ─────────────────────────────────────────────────────────────
# Asset Types
# ─────────────────────────────────────────────────────────────

@router.get("/types", response_model=ApiResponse[List[Dict[str, Any]]])
def get_asset_types():
    """Returns list of all asset categories/types."""
    types = type_repo.get_all(limit=500)
    types.sort(key=lambda x: x.get("name", ""))
    return ApiResponse(data=types, message=f"Loaded {len(types)} asset types")

@router.post("/types", response_model=ApiResponse[Dict[str, Any]], status_code=status.HTTP_201_CREATED)
def create_asset_type(payload: AssetTypeCreate):
    """Creates a new asset type / category."""
    clean_name = payload.name.strip().upper()
    existing = db_manager.execute_one("SELECT * FROM asset_types WHERE UPPER(name) = ?", [clean_name])
    if existing:
        raise HTTPException(status_code=400, detail=f"Asset type '{clean_name}' already exists.")
    
    new_type = {
        "id": f"AST-TYP-{uuid.uuid4().hex[:6].upper()}",
        "name": clean_name,
        "status": payload.status or "ACTIVE"
    }
    created = type_repo.create(new_type)
    return ApiResponse(data=created, message=f"Created asset type '{clean_name}'", statusCode=201)

@router.put("/types/{type_id}", response_model=ApiResponse[Dict[str, Any]])
def update_asset_type(type_id: str, payload: AssetTypeUpdate):
    """Updates an existing asset type / category."""
    existing = type_repo.get_by_id(type_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Asset type not found")
    
    update_data = {}
    if payload.name:
        update_data["name"] = payload.name.strip().upper()
    if payload.status:
        update_data["status"] = payload.status
    
    updated = type_repo.update(type_id, update_data)
    return ApiResponse(data=updated, message="Asset type updated successfully")

@router.delete("/types/{type_id}", response_model=ApiResponse[Dict[str, Any]])
def delete_asset_type(type_id: str):
    """Deletes an asset type / category."""
    existing = type_repo.get_by_id(type_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Asset type not found")
    
    # Check if any asset is using this type
    used = db_manager.execute_query("SELECT id FROM assets WHERE type_id = ? OR UPPER(type_name) = ?", [type_id, existing.get("name", "").upper()])
    if used:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete asset type: {len(used)} asset(s) are currently categorized under it."
        )
    
    type_repo.delete(type_id)
    return ApiResponse(data={"id": type_id}, message="Asset type deleted successfully")


# ─────────────────────────────────────────────────────────────
# Assets Master & Tracking
# ─────────────────────────────────────────────────────────────

@router.get("", response_model=ApiResponse[Dict[str, Any]])
def get_assets(
    branch: Optional[str] = Query(None, description="Filter by branch"),
    type_name: Optional[str] = Query(None, description="Filter by asset type"),
    search: Optional[str] = Query(None, description="Search term for code, name, serial_no, or assignee")
):
    """
    Returns filtered assets list along with enterprise valuation & allocation metrics.
    """
    assets = asset_repo.get_all(limit=1000)
    
    # Filter by branch
    if branch and isinstance(branch, str) and branch != "ALL":
        assets = [a for a in assets if a.get("branch") == branch]
    
    # Filter by type
    if type_name and isinstance(type_name, str) and type_name != "ALL":
        assets = [a for a in assets if a.get("type_name") == type_name]
    
    # Text search
    if search and isinstance(search, str):
        s = search.lower().strip()
        assets = [
            a for a in assets
            if s in str(a.get("name", "")).lower()
            or s in str(a.get("code", "")).lower()
            or s in str(a.get("serial_no", "")).lower()
            or s in str(a.get("assigned_to", "")).lower()
            or s in str(a.get("brand", "")).lower()
        ]

    # Compute KPI statistics
    total_assets = len(assets)
    allocated_count = sum(1 for a in assets if a.get("assigned_to") and a.get("assigned_to").strip())
    total_cost = sum(float(a.get("cost") or 0.0) for a in assets)
    avg_depreciation = (
        sum(float(a.get("depreciation_rate") or 0.0) for a in assets) / total_assets
        if total_assets > 0 else 0.0
    )

    metrics = {
        "totalAssets": total_assets,
        "allocatedCount": allocated_count,
        "inStockCount": total_assets - allocated_count,
        "totalValuationUsd": round(total_cost, 2),
        "avgDepreciationRate": round(avg_depreciation, 1)
    }

    return ApiResponse(
        data={
            "assets": assets,
            "metrics": metrics
        },
        message=f"Retrieved {len(assets)} assets"
    )

@router.post("", response_model=ApiResponse[Dict[str, Any]], status_code=status.HTTP_201_CREATED)
def create_asset(payload: AssetCreate):
    """Creates a new enterprise asset record."""
    clean_code = payload.code.strip().upper()
    existing = db_manager.execute_one("SELECT * FROM assets WHERE UPPER(code) = ?", [clean_code])
    if existing:
        raise HTTPException(status_code=400, detail=f"Asset with code '{clean_code}' already exists.")
    
    new_id = f"AST-{uuid.uuid4().hex[:6].upper()}"
    asset_dict = payload.model_dump()
    asset_dict["id"] = new_id
    asset_dict["code"] = clean_code
    
    created = asset_repo.create(asset_dict)
    return ApiResponse(data=created, message=f"Created asset '{payload.name}' ({clean_code})", statusCode=201)

@router.get("/{asset_id}", response_model=ApiResponse[Dict[str, Any]])
def get_asset_by_id(asset_id: str):
    """Returns details for a single asset."""
    asset = asset_repo.get_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return ApiResponse(data=asset, message="Asset details retrieved")

@router.put("/{asset_id}", response_model=ApiResponse[Dict[str, Any]])
def update_asset(asset_id: str, payload: AssetUpdate):
    """Updates an existing asset record."""
    existing = asset_repo.get_by_id(asset_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if "code" in update_data:
        update_data["code"] = update_data["code"].strip().upper()
    
    updated = asset_repo.update(asset_id, update_data)
    return ApiResponse(data=updated, message="Asset record updated successfully")

@router.delete("/{asset_id}", response_model=ApiResponse[Dict[str, Any]])
def delete_asset(asset_id: str):
    """Deletes an asset record."""
    existing = asset_repo.get_by_id(asset_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    asset_repo.delete(asset_id)
    return ApiResponse(data={"id": asset_id}, message="Asset deleted successfully")
