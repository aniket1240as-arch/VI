import os
from fastapi import APIRouter
from typing import List, Dict, Any
from ....repositories import get_repository
from ....core.config import settings
from ....core.database import db_manager
from ....models.common import ApiResponse

router = APIRouter(prefix="/admin", tags=["Administrative Masters & System"])
fac_repo = get_repository("admin_facilities")

@router.get("/facilities", response_model=ApiResponse[List[Dict[str, Any]]])
def get_facilities():
    facilities = fac_repo.get_all(limit=100)
    return ApiResponse(data=facilities)

@router.get("/system-info", response_model=ApiResponse[Dict[str, Any]])
def get_system_info():
    # Database stats and migration status
    file_size_bytes = 0
    if os.path.exists(settings.DUCKDB_PATH):
        file_size_bytes = os.path.getsize(settings.DUCKDB_PATH)

    table_counts = {}
    tables = ["products", "partners", "trade_contracts", "trade_shipments", "containers", "employees", "attendance_logs", "payroll_records", "calendar_events", "workspace_tasks", "admin_facilities"]
    for t in tables:
        cnt = db_manager.execute_one(f"SELECT COUNT(*) as c FROM {t}")
        table_counts[t] = cnt["c"] if cnt else 0

    return ApiResponse(
        message="System runtime diagnostics",
        data={
            "databaseType": settings.DATABASE_TYPE,
            "databaseFile": settings.DUCKDB_PATH,
            "databaseSizeBytes": file_size_bytes,
            "databaseSizeMB": round(file_size_bytes / (1024 * 1024), 2),
            "tableCounts": table_counts,
            "migrationReady": True,
            "supportedTargets": ["PostgreSQL 16", "MySQL 8.4", "SQL Server"]
        }
    )

# ─── IAM User Management ──────────────────────────────────────────────────────
from pydantic import BaseModel
from typing import Optional
import time
from fastapi import HTTPException

class UserCreateRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "EMPLOYEE"
    department: Optional[str] = None
    employee_id: Optional[str] = None
    status: str = "ACTIVE"

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    employee_id: Optional[str] = None
    status: Optional[str] = None

@router.get("/users")
def get_admin_users():
    users = db_manager.execute_query(
        """SELECT u.id, u.name, u.email, u.role, u.department, u.status, u.employee_id, u.created_at,
                  e.employee_code, e.branch, e.designation
           FROM users u
           LEFT JOIN employees e ON u.employee_id = e.id OR u.email = e.email
           ORDER BY u.created_at ASC"""
    )
    return ApiResponse(data=users)

@router.post("/users", status_code=201)
def create_admin_user(data: UserCreateRequest):
    from ....core.security import get_password_hash
    existing = db_manager.execute_one("SELECT id FROM users WHERE email = ?", [data.email])
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_id = f"USR-{int(time.time() * 1000) % 100000:05d}"
    hashed_pwd = get_password_hash(data.password)

    db_manager.execute_write(
        "INSERT INTO users (id, name, email, role, department, hashed_password, status, employee_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
            new_id,
            data.name,
            data.email,
            data.role,
            data.department,
            hashed_pwd,
            data.status,
            data.employee_id
        ]
    )

    created = db_manager.execute_one("SELECT id, name, email, role, department, status, employee_id, created_at FROM users WHERE id = ?", [new_id])
    return ApiResponse(message="IAM user created successfully", data=created)

@router.patch("/users/{id}")
def update_admin_user(id: str, data: UserUpdateRequest):
    from ....core.security import get_password_hash
    existing = db_manager.execute_one("SELECT * FROM users WHERE id = ?", [id])
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")

    updates = data.model_dump(exclude_unset=True)
    if "password" in updates and updates["password"]:
        updates["hashed_password"] = get_password_hash(updates.pop("password"))
    elif "password" in updates:
        updates.pop("password")

    merged = {**existing, **{k: v for k, v in updates.items() if v is not None}}
    db_manager.execute_write(
        "UPDATE users SET name = ?, email = ?, role = ?, department = ?, hashed_password = ?, status = ?, employee_id = ? WHERE id = ?",
        [
            merged.get("name"),
            merged.get("email"),
            merged.get("role"),
            merged.get("department"),
            merged.get("hashed_password"),
            merged.get("status"),
            merged.get("employee_id"),
            id
        ]
    )

    updated = db_manager.execute_one("SELECT id, name, email, role, department, status, employee_id, created_at FROM users WHERE id = ?", [id])
    return ApiResponse(message="IAM user updated", data=updated)

@router.delete("/users/{id}")
def delete_admin_user(id: str):
    existing = db_manager.execute_one("SELECT * FROM users WHERE id = ?", [id])
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    if existing.get("role") == "ADMIN" and existing.get("email") == "admin@soilexlifescience.com":
        raise HTTPException(status_code=400, detail="Root Executive Admin account cannot be deleted")

    db_manager.execute_write("DELETE FROM users WHERE id = ?", [id])
    return ApiResponse(message="User deleted successfully", data={"id": id})



# ─── Extended Masters: Banks, Ports, QC Parties, Notify Parties, Payees ───────

bank_repo = get_repository("admin_banks")
port_repo = get_repository("admin_ports")
qc_repo = get_repository("admin_qc_parties")
np_repo = get_repository("admin_notify_parties")
payee_repo = get_repository("admin_payees")

@router.get("/banks")
def get_admin_banks():
    banks = bank_repo.get_all(limit=100)
    return ApiResponse(data=banks)

@router.post("/banks", status_code=201)
def create_admin_bank(data: Dict[str, Any]):
    new_id = f"BNK-{int(time.time() * 1000) % 100000:05d}"
    data["id"] = new_id
    created = bank_repo.create(data)
    return ApiResponse(message="Bank created successfully", data=created)

@router.delete("/banks/{id}")
def delete_admin_bank(id: str):
    bank_repo.delete(id)
    return ApiResponse(message="Bank deleted", data={"id": id})

@router.get("/ports")
def get_admin_ports():
    ports = port_repo.get_all(limit=100)
    return ApiResponse(data=ports)

@router.post("/ports", status_code=201)
def create_admin_port(data: Dict[str, Any]):
    new_id = f"PRT-{int(time.time() * 1000) % 100000:05d}"
    data["id"] = new_id
    created = port_repo.create(data)
    return ApiResponse(message="Port created successfully", data=created)

@router.delete("/ports/{id}")
def delete_admin_port(id: str):
    port_repo.delete(id)
    return ApiResponse(message="Port deleted", data={"id": id})

@router.get("/qc-parties")
def get_admin_qc_parties():
    qc_parties = qc_repo.get_all(limit=100)
    return ApiResponse(data=qc_parties)

@router.post("/qc-parties", status_code=201)
def create_admin_qc_party(data: Dict[str, Any]):
    new_id = f"QC-{int(time.time() * 1000) % 100000:05d}"
    data["id"] = new_id
    created = qc_repo.create(data)
    return ApiResponse(message="QC Party created successfully", data=created)

@router.delete("/qc-parties/{id}")
def delete_admin_qc_party(id: str):
    qc_repo.delete(id)
    return ApiResponse(message="QC Party deleted", data={"id": id})

@router.get("/notify-parties")
def get_admin_notify_parties():
    notify_parties = np_repo.get_all(limit=100)
    return ApiResponse(data=notify_parties)

@router.post("/notify-parties", status_code=201)
def create_admin_notify_party(data: Dict[str, Any]):
    new_id = f"NP-{int(time.time() * 1000) % 100000:05d}"
    data["id"] = new_id
    created = np_repo.create(data)
    return ApiResponse(message="Notify Party created successfully", data=created)

@router.delete("/notify-parties/{id}")
def delete_admin_notify_party(id: str):
    np_repo.delete(id)
    return ApiResponse(message="Notify Party deleted", data={"id": id})

@router.get("/payees")
def get_admin_payees():
    payees = payee_repo.get_all(limit=100)
    return ApiResponse(data=payees)

@router.post("/payees", status_code=201)
def create_admin_payee(data: Dict[str, Any]):
    new_id = f"PY-{int(time.time() * 1000) % 100000:05d}"
    data["id"] = new_id
    created = payee_repo.create(data)
    return ApiResponse(message="Payee created successfully", data=created)

@router.delete("/payees/{id}")
def delete_admin_payee(id: str):
    payee_repo.delete(id)
    return ApiResponse(message="Payee deleted", data={"id": id})



# ─────────────────────────────────────────────────────────────
# Complete Live Master Module Endpoints
# ─────────────────────────────────────────────────────────────

comp_repo = get_repository("admin_company_profiles")
branch_repo = get_repository("admin_branches")
wh_master_repo = get_repository("admin_master_warehouses")
loc_master_repo = get_repository("admin_master_locations")
exp_cat_repo = get_repository("admin_expense_categories")
vendor_repo = get_repository("admin_vendors")
setting_repo = get_repository("admin_global_settings")
common_page_repo = get_repository("admin_common_pages")
log_repo = get_repository("admin_access_logs")

@router.get("/company-profiles")
def get_admin_company_profiles():
    return ApiResponse(data=comp_repo.get_all(limit=50))

@router.post("/company-profiles", status_code=201)
def create_admin_company_profile(data: Dict[str, Any]):
    new_id = f"COMP-{int(time.time() * 1000) % 100000:05d}"
    data["id"] = new_id
    created = comp_repo.create(data)
    return ApiResponse(message="Company Profile saved", data=created)

@router.get("/branches")
def get_admin_branches():
    return ApiResponse(data=branch_repo.get_all(limit=100))

@router.post("/branches", status_code=201)
def create_admin_branch(data: Dict[str, Any]):
    new_id = f"BR-{int(time.time() * 1000) % 100000:05d}"
    data["id"] = new_id
    created = branch_repo.create(data)
    return ApiResponse(message="Branch saved", data=created)

@router.get("/master-warehouses")
def get_admin_master_warehouses():
    return ApiResponse(data=wh_master_repo.get_all(limit=100))

@router.post("/master-warehouses", status_code=201)
def create_admin_master_warehouse(data: Dict[str, Any]):
    new_id = f"WH-{int(time.time() * 1000) % 100000:05d}"
    data["id"] = new_id
    created = wh_master_repo.create(data)
    return ApiResponse(message="Warehouse Hub saved", data=created)

@router.get("/master-locations")
def get_admin_master_locations():
    return ApiResponse(data=loc_master_repo.get_all(limit=200))

@router.post("/master-locations", status_code=201)
def create_admin_master_location(data: Dict[str, Any]):
    new_id = f"LOC-{int(time.time() * 1000) % 100000:05d}"
    data["id"] = new_id
    created = loc_master_repo.create(data)
    return ApiResponse(message="Storage location saved", data=created)

@router.get("/expense-categories")
def get_admin_expense_categories():
    return ApiResponse(data=exp_cat_repo.get_all(limit=100))

@router.post("/expense-categories", status_code=201)
def create_admin_expense_category(data: Dict[str, Any]):
    new_id = f"EXP-{int(time.time() * 1000) % 100000:05d}"
    data["id"] = new_id
    created = exp_cat_repo.create(data)
    return ApiResponse(message="Expense category saved", data=created)

@router.get("/vendors")
def get_admin_vendors():
    return ApiResponse(data=vendor_repo.get_all(limit=200))

@router.post("/vendors", status_code=201)
def create_admin_vendor(data: Dict[str, Any]):
    new_id = f"VND-{int(time.time() * 1000) % 100000:05d}"
    data["id"] = new_id
    created = vendor_repo.create(data)
    return ApiResponse(message="Service vendor saved", data=created)

@router.get("/settings")
def get_admin_settings():
    return ApiResponse(data=setting_repo.get_all(limit=200))

@router.post("/settings", status_code=201)
def create_admin_setting(data: Dict[str, Any]):
    new_id = f"SET-{int(time.time() * 1000) % 100000:05d}"
    data["id"] = new_id
    created = setting_repo.create(data)
    return ApiResponse(message="Global setting saved", data=created)

@router.get("/common-pages")
def get_admin_common_pages():
    return ApiResponse(data=common_page_repo.get_all(limit=100))

@router.post("/common-pages", status_code=201)
def create_admin_common_page(data: Dict[str, Any]):
    new_id = f"CP-{int(time.time() * 1000) % 100000:05d}"
    data["id"] = new_id
    created = common_page_repo.create(data)
    return ApiResponse(message="Contract boilerplate saved", data=created)

@router.get("/access-logs")
def get_admin_access_logs():
    return ApiResponse(data=log_repo.get_all(limit=500))

transporter_repo = get_repository("admin_transporters")
country_repo = get_repository("admin_countries")

@router.get("/transporters")
def get_admin_transporters():
    return ApiResponse(data=transporter_repo.get_all(limit=100))

@router.post("/transporters", status_code=201)
def create_admin_transporter(data: Dict[str, Any]):
    new_id = f"TRP-{int(time.time() * 1000) % 100000:05d}"
    data["id"] = new_id
    created = transporter_repo.create(data)
    return ApiResponse(message="Transporter created successfully", data=created)

@router.delete("/transporters/{id}")
def delete_admin_transporter(id: str):
    transporter_repo.delete(id)
    return ApiResponse(message="Transporter deleted", data={"id": id})

@router.get("/countries")
def get_admin_countries():
    return ApiResponse(data=country_repo.get_all(limit=250))

@router.post("/countries", status_code=201)
def create_admin_country(data: Dict[str, Any]):
    new_id = f"CTY-{int(time.time() * 1000) % 100000:05d}"
    data["id"] = new_id
    created = country_repo.create(data)
    return ApiResponse(message="Country created successfully", data=created)

@router.delete("/countries/{id}")
def delete_admin_country(id: str):
    country_repo.delete(id)
    return ApiResponse(message="Country deleted", data={"id": id})
