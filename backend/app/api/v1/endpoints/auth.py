from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from ....core.database import db_manager
from ....core.security import verify_password, create_access_token, get_password_hash
from ....models.common import ApiResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str

class SwitchUserRequest(BaseModel):
    email: str

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    role: str
    department: Optional[str] = None
    status: str
    employee_id: Optional[str] = None

class LoginResponse(BaseModel):
    accessToken: str
    tokenType: str = "Bearer"
    user: UserProfile

@router.post("/login", response_model=ApiResponse[LoginResponse])
def login(creds: LoginRequest):
    user = db_manager.execute_one("SELECT * FROM users WHERE email = ?", [creds.email])
    if not user or not verify_password(creds.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    emp_id = user.get("employee_id")
    if not emp_id:
        emp = db_manager.execute_one("SELECT id FROM employees WHERE email = ?", [creds.email])
        if emp:
            emp_id = emp["id"]

    token = create_access_token(subject=user["id"], role=user["role"])
    user_profile = UserProfile(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        department=user.get("department"),
        status=user.get("status", "ACTIVE"),
        employee_id=emp_id
    )
    return ApiResponse(
        message="Login successful",
        data=LoginResponse(accessToken=token, user=user_profile)
    )

@router.post("/switch", response_model=ApiResponse[LoginResponse])
def switch_user(req: SwitchUserRequest):
    """
    Seamlessly switch session to any registered IAM user or employee.
    If employee exists but has no IAM user record, provisions one automatically.
    """
    email_clean = req.email.strip().lower()
    user = db_manager.execute_one("SELECT * FROM users WHERE LOWER(email) = ?", [email_clean])
    
    if not user:
        # Check if exists in employees
        emp = db_manager.execute_one("SELECT * FROM employees WHERE LOWER(email) = ?", [email_clean])
        if emp:
            new_uid = f"USR-{emp['id']}"
            hashed = get_password_hash("emp123")
            role_to_assign = "EMPLOYEE"
            dept = emp.get("department") or "Operations"
            if "HR" in dept or "Human" in dept:
                role_to_assign = "HR_MANAGER"
            elif "Quality" in dept or "QA" in dept:
                role_to_assign = "QUALITY_MANAGER"
            elif "Admin" in dept or "Executive" in dept:
                role_to_assign = "ADMIN"

            db_manager.execute_write(
                "INSERT INTO users (id, name, email, role, department, hashed_password, status, employee_id) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?)",
                [new_uid, emp["full_name"], emp["email"], role_to_assign, dept, hashed, emp["id"]]
            )
            user = db_manager.execute_one("SELECT * FROM users WHERE LOWER(email) = ?", [email_clean])
        else:
            raise HTTPException(
                status_code=404,
                detail=f"User or employee with email {req.email} not found"
            )

    emp_id = user.get("employee_id")
    if not emp_id:
        emp = db_manager.execute_one("SELECT id FROM employees WHERE LOWER(email) = ?", [email_clean])
        if emp:
            emp_id = emp["id"]

    token = create_access_token(subject=user["id"], role=user["role"])
    user_profile = UserProfile(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        department=user.get("department"),
        status=user.get("status", "ACTIVE"),
        employee_id=emp_id
    )
    return ApiResponse(
        message=f"Switched session to {user['name']} ({user['role']})",
        data=LoginResponse(accessToken=token, user=user_profile)
    )

@router.get("/users", response_model=ApiResponse[List[Dict[str, Any]]])
def get_available_users():
    """
    Returns all registered IAM users & employees for the global Navbar role switcher.
    """
    query = """
        SELECT u.id, u.name, u.email, u.role, u.department, u.status, u.employee_id,
               e.employee_code, e.designation, e.branch
        FROM users u
        LEFT JOIN employees e ON u.employee_id = e.id OR LOWER(u.email) = LOWER(e.email)
        WHERE u.status = 'ACTIVE'
        ORDER BY 
            CASE u.role 
                WHEN 'ADMIN' THEN 1 
                WHEN 'HR_MANAGER' THEN 2 
                WHEN 'QUALITY_MANAGER' THEN 3 
                ELSE 4 
            END,
            u.name ASC
    """
    users = db_manager.execute_query(query)
    
    # Also include any active employees who might not yet have a users record
    existing_emails = {u["email"].lower() for u in users if u.get("email")}
    all_emps = db_manager.execute_query("SELECT id, employee_code, full_name, email, department, designation, branch FROM employees WHERE status = 'ACTIVE'")
    
    for emp in all_emps:
        if emp.get("email") and emp["email"].lower() not in existing_emails:
            users.append({
                "id": f"USR-{emp['id']}",
                "name": emp["full_name"],
                "email": emp["email"],
                "role": "EMPLOYEE",
                "department": emp.get("department"),
                "status": "ACTIVE",
                "employee_id": emp["id"],
                "employee_code": emp.get("employee_code"),
                "designation": emp.get("designation"),
                "branch": emp.get("branch")
            })
            existing_emails.add(emp["email"].lower())

    return ApiResponse(data=users)

@router.get("/me", response_model=ApiResponse[UserProfile])
def get_current_user():
    # Return default admin if no auth header provided (demo convenience)
    user = db_manager.execute_one("SELECT * FROM users WHERE role = 'ADMIN' LIMIT 1")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    emp_id = user.get("employee_id")
    if not emp_id:
        emp = db_manager.execute_one("SELECT id FROM employees WHERE email = ?", [user["email"]])
        if emp:
            emp_id = emp["id"]

    return ApiResponse(
        data=UserProfile(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            role=user["role"],
            department=user.get("department"),
            status=user.get("status", "ACTIVE"),
            employee_id=emp_id
        )
    )
