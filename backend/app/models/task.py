from typing import Optional, Union, List, Any
from datetime import datetime
from pydantic import BaseModel, Field

class TaskActivityLog(BaseModel):
    action: str  # ASSIGNED, ACCEPTED, PUT_ON_HOLD, RESUMED, COMPLETED, REOPENED, COMMENT
    user: str
    timestamp: str
    comment: Optional[str] = None
    hold_reason: Optional[str] = None

class WorkspaceTaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "Operations"  # Operations, Compliance, HR & Payroll, Maintenance, Finance
    priority: str = "MEDIUM"      # LOW, MEDIUM, HIGH, URGENT
    status: str = "ASSIGNED"      # ASSIGNED, IN_PROGRESS, ON_HOLD, COMPLETED, CLOSED
    due_date: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_by: Optional[str] = "Admin (Executive)"
    hold_reason: Optional[str] = None
    hold_comments: Optional[str] = None
    resolution_notes: Optional[str] = None
    completed: bool = False
    notes: Optional[str] = None
    activity_log: Optional[Union[List[Any], str]] = None

class WorkspaceTaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "Operations"
    priority: str = "MEDIUM"
    status: str = "ASSIGNED"
    due_date: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_by: Optional[str] = "Admin (Executive)"
    notes: Optional[str] = None

class WorkspaceTaskStatusUpdate(BaseModel):
    status: str  # IN_PROGRESS, ON_HOLD, COMPLETED, CLOSED, REOPENED
    hold_reason: Optional[str] = None
    hold_comments: Optional[str] = None
    resolution_notes: Optional[str] = None
    comment: Optional[str] = None
    user: Optional[str] = "Current User"

class WorkspaceTaskCommentCreate(BaseModel):
    comment: str
    user: Optional[str] = "Current User"

class WorkspaceTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_by: Optional[str] = None
    hold_reason: Optional[str] = None
    hold_comments: Optional[str] = None
    resolution_notes: Optional[str] = None
    completed: Optional[bool] = None
    notes: Optional[str] = None

class WorkspaceTaskResponse(WorkspaceTaskBase):
    id: str
    created_at: Optional[Union[datetime, str]] = None
    updated_at: Optional[Union[datetime, str]] = None
