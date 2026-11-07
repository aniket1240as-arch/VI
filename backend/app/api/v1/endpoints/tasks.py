import time
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ....core.database import db_manager
from ....models.common import ApiResponse
from ....models.task import (
    WorkspaceTaskCreate, 
    WorkspaceTaskUpdate, 
    WorkspaceTaskResponse,
    WorkspaceTaskStatusUpdate,
    WorkspaceTaskCommentCreate
)

router = APIRouter(prefix="/tasks", tags=["Workspace & Task Planner"])

def ensure_schema(db):
    """Ensures ServiceNow & Jira lifecycle columns exist in DuckDB workspace_tasks."""
    try:
        cols = [c['name'] for c in db.execute_query("PRAGMA table_info('workspace_tasks')")]
        new_cols = [
            ('description', 'VARCHAR'),
            ('status', "VARCHAR DEFAULT 'ASSIGNED'"),
            ('assigned_by', "VARCHAR DEFAULT 'Admin (Executive)'"),
            ('hold_reason', 'VARCHAR'),
            ('hold_comments', 'VARCHAR'),
            ('resolution_notes', 'VARCHAR'),
            ('activity_log', 'VARCHAR')
        ]
        for col_name, col_type in new_cols:
            if col_name not in cols:
                db.execute_write(f"ALTER TABLE workspace_tasks ADD COLUMN {col_name} {col_type}")

        # Backfill status if empty
        db.execute_write("""
            UPDATE workspace_tasks
            SET status = CASE 
                WHEN completed = TRUE THEN 'COMPLETED'
                ELSE 'ASSIGNED'
            END
            WHERE status IS NULL OR status = ''
        """)
    except Exception as e:
        print("[Task Schema Check Error]:", e)

def seed_unique_employee_tasks(db):
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    def make_log(action, user, comment, hold_reason=None):
        entry = {
            "action": action,
            "user": user,
            "timestamp": now,
            "comment": comment
        }
        if hold_reason:
            entry["hold_reason"] = hold_reason
        return json.dumps([entry])

    unique_tasks = [
        # EMP-001 Vũ Thị Hoan (Sales & Export)
        (
            "TSK-EXP-01", 
            "Review Bill of Lading & Phytosanitary for Dubai Container MSCU-884102",
            "Verify gross weights match container manifest and check customs declaration",
            "Operations", "HIGH", "ASSIGNED", "2026-10-23", 
            "Vũ Thị Hoan", "Admin (Executive)", None, None, None, False,
            "Verify gross weights match container manifest",
            make_log("ASSIGNED", "Admin (Executive)", "Assigned to Vũ Thị Hoan for Dubai export clearance.")
        ),
        (
            "TSK-EXP-02", 
            "Draft CIF Rotterdam Price Quotation for Black Pepper 550 G/L",
            "Inquiry from Naturex GmbH for 18.5 MT batch with ASTA quality certificate",
            "Operations", "HIGH", "IN_PROGRESS", "2026-10-23", 
            "Vũ Thị Hoan", "Admin (Executive)", None, None, None, False,
            "Inquiry from Naturex GmbH for 18.5 MT batch",
            make_log("ACCEPTED", "Vũ Thị Hoan", "Task accepted. Price models and ocean freight kalkulations underway.")
        ),
        (
            "TSK-EXP-03", 
            "Finalize Letter of Credit (LC 90 Days) with Al Rawdah Trading LLC",
            "Export contract SLX-EXP-2026-001 documentation verification",
            "Finance", "URGENT", "ON_HOLD", "2026-10-24", 
            "Vũ Thị Hoan", "Admin (Executive)", "Awaiting 3rd Party / Vendor Documents", 
            "Awaiting Al Rawdah commercial bank SWIFT MT700 copy before releasing export contract.", None, False,
            "Export contract SLX-EXP-2026-001",
            make_log("PUT_ON_HOLD", "Vũ Thị Hoan", "Awaiting Al Rawdah bank SWIFT confirmation.", "Awaiting 3rd Party / Vendor Documents")
        ),
        (
            "TSK-EXP-04", 
            "Verify customs HS code 090411 for EU Spice Consignment",
            "Phytosanitary inspection cleared and HS codes reconciled with Rotterdam customs",
            "Compliance", "MEDIUM", "COMPLETED", "2026-10-25", 
            "Vũ Thị Hoan", "Priya Nair (HR Manager)", None, None, "HS Code 090411 verified against EU tariff schedule.", True,
            "Phytosanitary inspection cleared",
            make_log("COMPLETED", "Vũ Thị Hoan", "HS Code 090411 confirmed and released.")
        ),
        (
            "TSK-EXP-05", 
            "Weekly sales pipeline review with Regional Dubai Commercial Desk",
            "Q4 volume allocation targets and spice container booking quotas",
            "Operations", "LOW", "ASSIGNED", "2026-10-26", 
            "Vũ Thị Hoan", "Admin (Executive)", None, None, None, False,
            "Q4 volume allocation targets",
            make_log("ASSIGNED", "Admin (Executive)", "Agenda queued for Friday morning trade sync.")
        ),

        # EMP-002 Rajesh Sharma (Quality Assurance)
        (
            "TSK-QA-01", 
            "Calibrate Moisture Meters & Bulk Density Testers at Kochi Spices Lab",
            "Quarterly calibration routine per ISO 17025 standard operating procedure",
            "Maintenance", "HIGH", "IN_PROGRESS", "2026-10-23", 
            "Rajesh Sharma", "Admin (Executive)", None, None, None, False,
            "Quarterly calibration routine per ISO 17025",
            make_log("ACCEPTED", "Rajesh Sharma", "Calibration in progress with standard reference samples.")
        ),
        (
            "TSK-QA-02", 
            "Inspect FSSAI & ASTA chemical laboratory samples for Cardamom Lot 88",
            "Test volatile oil content and moisture below 11.5% before warehouse lot stamping",
            "Compliance", "URGENT", "ON_HOLD", "2026-10-23", 
            "Rajesh Sharma", "Admin (Executive)", "Blocked by Upstream Dependency", 
            "Gas Chromatography column replacement required. Awaiting parts arrival tomorrow morning.", None, False,
            "Test volatile oil content and moisture below 11.5%",
            make_log("PUT_ON_HOLD", "Rajesh Sharma", "GC column maintenance pending. Hold for spare arrival.", "Blocked by Upstream Dependency")
        ),
        (
            "TSK-QA-03", 
            "Review aflatoxin & pesticide residue chromatography for Kerala harvest",
            "Export batch release verification for EU dispatch per Regulation (EC) No 1881/2006",
            "Compliance", "HIGH", "ASSIGNED", "2026-10-24", 
            "Rajesh Sharma", "Admin (Executive)", None, None, None, False,
            "Export batch release verification for EU dispatch",
            make_log("ASSIGNED", "Admin (Executive)", "Assigned for regulatory pre-dispatch audit.")
        ),
        (
            "TSK-QA-04", 
            "Verify ISO 22000 cleanroom sanitization logs for spice extraction hall",
            "Microbial swab testing negative and environmental monitoring validated",
            "Compliance", "MEDIUM", "COMPLETED", "2026-10-24", 
            "Rajesh Sharma", "Admin (Executive)", None, None, "Cleanroom sanitization audited and verified.", True,
            "Microbial swab testing negative",
            make_log("COMPLETED", "Rajesh Sharma", "ISO 22000 cleanroom report approved.")
        ),

        # EMP-003 Nguyễn Văn Hùng (Operations & Supply)
        (
            "TSK-OPS-01", 
            "Submit Vietnam Perfumed Rice Phytosanitary Certificate to Customs",
            "Hai Phong Customs Berth 3 release clearance for vessel SLX-SH-2026-002",
            "Compliance", "URGENT", "IN_PROGRESS", "2026-10-23", 
            "Nguyễn Văn Hùng", "Admin (Executive)", None, None, None, False,
            "Hai Phong Customs Berth 3 release clearance",
            make_log("ACCEPTED", "Nguyễn Văn Hùng", "Documents submitted to customs officer for final clearance.")
        ),
        (
            "TSK-OPS-02", 
            "Port berth container dispatch for Maersk Line shipment SLX-SH-2026-002",
            "Ensure 4 reefer containers loaded before vessel cutoff deadline",
            "Operations", "HIGH", "ON_HOLD", "2026-10-23", 
            "Nguyễn Văn Hùng", "Admin (Executive)", "Awaiting Client / Buyer Response", 
            "Buyer requesting amendment to container seal number on the shipping order manifest.", None, False,
            "Ensure 4 reefer containers loaded before cutoff",
            make_log("PUT_ON_HOLD", "Nguyễn Văn Hùng", "Waiting for buyer confirmation on seal swap.", "Awaiting Client / Buyer Response")
        ),

        # EMP-004 Priya Nair (Human Resources)
        (
            "TSK-HR-01", 
            "Run Monthly Employee Statutory Deductions, PF & Tax Slips",
            "October salary reconciliation finalized with corporate finance",
            "HR & Payroll", "URGENT", "COMPLETED", "2026-10-23", 
            "Priya Nair", "Admin (Executive)", None, None, "Statutory deductions calculated and salary slips issued.", True,
            "October salary reconciliation finalized",
            make_log("COMPLETED", "Priya Nair", "All salary slips dispatched to employee portal.")
        ),
        (
            "TSK-HR-02", 
            "Screen shortlist candidate applications for Senior Export Sales Manager JD",
            "Review candidate profiles with HR Director and VP of Global Trade",
            "HR & Payroll", "HIGH", "ASSIGNED", "2026-10-23", 
            "Priya Nair", "Admin (Executive)", None, None, None, False,
            "Review candidate profiles with HR Director",
            make_log("ASSIGNED", "Admin (Executive)", "Shortlist pool of 8 candidates submitted for screening.")
        ),

        # EMP-005 Trần Quốc Bảo (Finance & Accounts)
        (
            "TSK-FIN-01", 
            "Reconcile SWIFT wire remittance for export contract SLX-EXP-2026-001",
            "$198,000 USD payment receipt confirmation from Standard Chartered Bank",
            "Finance", "URGENT", "IN_PROGRESS", "2026-10-23", 
            "Trần Quốc Bảo", "Admin (Executive)", None, None, None, False,
            "$198,000 USD payment receipt confirmation",
            make_log("ACCEPTED", "Trần Quốc Bảo", "Treasury statement requested from corporate banker.")
        ),
        (
            "TSK-FIN-02", 
            "Review supplier payment vouchers for Mekong Delta Agro Farms",
            "TT 15 Days procurement milestone invoice check",
            "Finance", "HIGH", "ON_HOLD", "2026-10-23", 
            "Trần Quốc Bảo", "Admin (Executive)", "Awaiting Management / Regulatory Approval", 
            "Waiting for procurement director approval stamp on weight discrepancy credit note.", None, False,
            "TT 15 Days procurement milestone",
            make_log("PUT_ON_HOLD", "Trần Quốc Bảo", "Credit note adjustment pending director sign-off.", "Awaiting Management / Regulatory Approval")
        )
    ]

    for tsk in unique_tasks:
        exists = db.execute_one("SELECT id FROM workspace_tasks WHERE id = ?", [tsk[0]])
        if not exists:
            db.execute_write("""
                INSERT INTO workspace_tasks (
                    id, title, description, category, priority, status, due_date, 
                    assigned_to, assigned_by, hold_reason, hold_comments, resolution_notes, 
                    completed, notes, activity_log
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, list(tsk))

@router.get("", response_model=ApiResponse[List[WorkspaceTaskResponse]])
def get_tasks(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    employee_id: Optional[str] = Query(None),
):
    ensure_schema(db_manager)

    # Check if table has seed data
    try:
        count = db_manager.execute_one("SELECT COUNT(*) as c FROM workspace_tasks", [])['c']
        if count <= 4:
            seed_unique_employee_tasks(db_manager)
    except Exception:
        pass

    query = "SELECT * FROM workspace_tasks WHERE 1=1"
    params = []

    if category and category != "ALL":
        query += " AND category = ?"
        params.append(category)

    if status and status != "ALL":
        query += " AND status = ?"
        params.append(status)

    emp_filter = assigned_to or employee_id
    if emp_filter and emp_filter != "ALL":
        try:
            emp_row = db_manager.execute_one(
                "SELECT id, full_name, employee_code FROM employees WHERE id = ? OR full_name = ? OR employee_code = ?",
                [emp_filter, emp_filter, emp_filter]
            )
            if emp_row:
                query += " AND (assigned_to = ? OR assigned_to = ? OR assigned_to = ?)"
                params.extend([emp_row["id"], emp_row["full_name"], emp_row.get("employee_code", "")])
            else:
                query += " AND (assigned_to = ? OR assigned_to ILIKE ?)"
                params.extend([emp_filter, f"%{emp_filter}%"])
        except Exception:
            query += " AND (assigned_to = ? OR assigned_to ILIKE ?)"
            params.extend([emp_filter, f"%{emp_filter}%"])

    query += """
        ORDER BY 
            CASE status 
                WHEN 'ON_HOLD' THEN 1 
                WHEN 'ASSIGNED' THEN 2 
                WHEN 'IN_PROGRESS' THEN 3 
                ELSE 4 
            END,
            CASE priority 
                WHEN 'URGENT' THEN 1 
                WHEN 'HIGH' THEN 2 
                WHEN 'MEDIUM' THEN 3 
                ELSE 4 
            END, 
            due_date ASC 
        LIMIT 150
    """
    rows = db_manager.execute_query(query, params)
    
    # Parse activity_log JSON if stored as string
    parsed_rows = []
    for r in rows:
        row_dict = dict(r)
        if isinstance(row_dict.get('activity_log'), str):
            try:
                row_dict['activity_log'] = json.loads(row_dict['activity_log'])
            except Exception:
                row_dict['activity_log'] = []
        elif not row_dict.get('activity_log'):
            row_dict['activity_log'] = []
        parsed_rows.append(WorkspaceTaskResponse(**row_dict))

    return ApiResponse(data=parsed_rows)

@router.post("", response_model=ApiResponse[WorkspaceTaskResponse], status_code=201)
def create_task(task_in: WorkspaceTaskCreate):
    ensure_schema(db_manager)
    new_id = f"TSK-{int(time.time() * 1000) % 100000}"
    data = task_in.model_dump()
    data["id"] = new_id
    
    # Manager assigns new task -> initial status is ASSIGNED
    status = data.get("status") or "ASSIGNED"
    assigned_by = data.get("assigned_by") or "Admin (Executive)"
    assigned_to = data.get("assigned_to") or "Unassigned"
    
    initial_log = [
        {
            "action": "ASSIGNED",
            "user": assigned_by,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "comment": f"Task created and assigned to {assigned_to} with {data.get('priority', 'MEDIUM')} priority."
        }
    ]
    
    db_manager.execute_write("""
        INSERT INTO workspace_tasks (
            id, title, description, category, priority, status, due_date, 
            assigned_to, assigned_by, completed, notes, activity_log
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        new_id,
        data.get("title"),
        data.get("description"),
        data.get("category", "Operations"),
        data.get("priority", "MEDIUM"),
        status,
        data.get("due_date"),
        assigned_to,
        assigned_by,
        False,
        data.get("notes"),
        json.dumps(initial_log)
    ])

    created_row = db_manager.execute_one("SELECT * FROM workspace_tasks WHERE id = ?", [new_id])
    res_dict = dict(created_row)
    res_dict["activity_log"] = initial_log
    return ApiResponse(message="Task assigned successfully", data=WorkspaceTaskResponse(**res_dict))

@router.patch("/{id}/status", response_model=ApiResponse[WorkspaceTaskResponse])
def update_task_status(id: str, payload: WorkspaceTaskStatusUpdate):
    """
    ServiceNow & Jira Ticket State Transition:
    - ASSIGNED -> IN_PROGRESS (Accept Task)
    - IN_PROGRESS / ASSIGNED -> ON_HOLD (Requires hold reason & comments)
    - ON_HOLD -> IN_PROGRESS (Resume Task)
    - ANY -> COMPLETED / CLOSED (Resolution notes & closure)
    - COMPLETED -> REOPENED (Reopens ticket back to IN_PROGRESS)
    """
    ensure_schema(db_manager)
    existing = db_manager.execute_one("SELECT * FROM workspace_tasks WHERE id = ?", [id])
    if not existing:
        raise HTTPException(status_code=404, detail=f"Task {id} not found")

    old_status = existing.get("status") or ("COMPLETED" if existing.get("completed") else "ASSIGNED")
    new_status = payload.status.upper()
    user = payload.user or "Staff"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")

    # Parse existing activity log
    raw_log = existing.get("activity_log")
    try:
        activity_log = json.loads(raw_log) if isinstance(raw_log, str) and raw_log else (raw_log or [])
    except Exception:
        activity_log = []

    hold_reason = existing.get("hold_reason")
    hold_comments = existing.get("hold_comments")
    resolution_notes = existing.get("resolution_notes")
    completed = bool(existing.get("completed", False))

    if new_status == "IN_PROGRESS":
        completed = False
        if old_status == "ASSIGNED":
            action = "ACCEPTED"
            comment = payload.comment or f"Task accepted by {user}. Work commenced."
        elif old_status == "ON_HOLD":
            action = "RESUMED"
            comment = payload.comment or f"Task resumed from hold by {user}."
            hold_reason = None
            hold_comments = None
        else:
            action = "IN_PROGRESS"
            comment = payload.comment or f"Status shifted to In Progress by {user}."

        activity_log.append({
            "action": action,
            "user": user,
            "timestamp": now_str,
            "comment": comment
        })

    elif new_status == "ON_HOLD":
        if not payload.hold_reason and not payload.hold_comments and not payload.comment:
            raise HTTPException(status_code=400, detail="ServiceNow rule: Hold reason or work notes/comments are mandatory when placing a ticket on hold.")
        
        completed = False
        hold_reason = payload.hold_reason or "Blocked by Dependency"
        hold_comments = payload.hold_comments or payload.comment or "Task placed on hold."
        
        activity_log.append({
            "action": "PUT_ON_HOLD",
            "user": user,
            "timestamp": now_str,
            "hold_reason": hold_reason,
            "comment": hold_comments
        })

    elif new_status in ["COMPLETED", "CLOSED"]:
        completed = True
        new_status = "COMPLETED"
        resolution_notes = payload.resolution_notes or payload.comment or "Work finished and task closed."
        
        activity_log.append({
            "action": "COMPLETED",
            "user": user,
            "timestamp": now_str,
            "comment": resolution_notes
        })

    elif new_status == "REOPENED":
        new_status = "IN_PROGRESS"
        completed = False
        comment = payload.comment or f"Ticket reopened by {user} for further verification."
        
        activity_log.append({
            "action": "REOPENED",
            "user": user,
            "timestamp": now_str,
            "comment": comment
        })
    else:
        activity_log.append({
            "action": new_status,
            "user": user,
            "timestamp": now_str,
            "comment": payload.comment or f"Status changed to {new_status}."
        })

    db_manager.execute_write("""
        UPDATE workspace_tasks
        SET status = ?, 
            hold_reason = ?, 
            hold_comments = ?, 
            resolution_notes = ?, 
            completed = ?, 
            activity_log = ?
        WHERE id = ?
    """, [
        new_status,
        hold_reason,
        hold_comments,
        resolution_notes,
        completed,
        json.dumps(activity_log),
        id
    ])

    updated_row = db_manager.execute_one("SELECT * FROM workspace_tasks WHERE id = ?", [id])
    res_dict = dict(updated_row)
    res_dict["activity_log"] = activity_log
    return ApiResponse(message=f"Task transitioned to {new_status}", data=WorkspaceTaskResponse(**res_dict))

@router.post("/{id}/comment", response_model=ApiResponse[WorkspaceTaskResponse])
def add_task_comment(id: str, payload: WorkspaceTaskCommentCreate):
    """Adds a ServiceNow work note / Jira comment to the task activity stream."""
    ensure_schema(db_manager)
    existing = db_manager.execute_one("SELECT * FROM workspace_tasks WHERE id = ?", [id])
    if not existing:
        raise HTTPException(status_code=404, detail=f"Task {id} not found")

    raw_log = existing.get("activity_log")
    try:
        activity_log = json.loads(raw_log) if isinstance(raw_log, str) and raw_log else (raw_log or [])
    except Exception:
        activity_log = []

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    activity_log.append({
        "action": "COMMENT",
        "user": payload.user or "Staff",
        "timestamp": now_str,
        "comment": payload.comment
    })

    db_manager.execute_write("""
        UPDATE workspace_tasks
        SET activity_log = ?
        WHERE id = ?
    """, [json.dumps(activity_log), id])

    updated_row = db_manager.execute_one("SELECT * FROM workspace_tasks WHERE id = ?", [id])
    res_dict = dict(updated_row)
    res_dict["activity_log"] = activity_log
    return ApiResponse(message="Comment recorded", data=WorkspaceTaskResponse(**res_dict))

@router.patch("/{id}/toggle", response_model=ApiResponse[WorkspaceTaskResponse])
def toggle_task(id: str):
    ensure_schema(db_manager)
    existing = db_manager.execute_one("SELECT * FROM workspace_tasks WHERE id = ?", [id])
    if not existing:
        raise HTTPException(status_code=404, detail=f"Task {id} not found")
    
    current_completed = bool(existing.get("completed", False))
    new_completed = not current_completed
    new_status = "COMPLETED" if new_completed else "IN_PROGRESS"

    db_manager.execute_write("""
        UPDATE workspace_tasks
        SET completed = ?, status = ?
        WHERE id = ?
    """, [new_completed, new_status, id])

    updated = db_manager.execute_one("SELECT * FROM workspace_tasks WHERE id = ?", [id])
    res_dict = dict(updated)
    try:
        res_dict["activity_log"] = json.loads(res_dict.get("activity_log") or "[]")
    except Exception:
        res_dict["activity_log"] = []
    return ApiResponse(message="Task completion status updated", data=WorkspaceTaskResponse(**res_dict))

@router.delete("/{id}", response_model=ApiResponse[dict])
def delete_task(id: str):
    ensure_schema(db_manager)
    existing = db_manager.execute_one("SELECT id FROM workspace_tasks WHERE id = ?", [id])
    if not existing:
        raise HTTPException(status_code=404, detail=f"Task {id} not found")
    db_manager.execute_write("DELETE FROM workspace_tasks WHERE id = ?", [id])
    return ApiResponse(message=f"Task {id} removed", data={"id": id})
