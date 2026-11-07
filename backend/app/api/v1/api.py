from fastapi import APIRouter
from .endpoints import (
    auth,
    dashboard,
    products,
    trade,
    partners,
    employees,
    attendance,
    payroll,
    calendar,
    tasks,
    reports,
    admin,
    recruitment,
    performance,
    procurement,
    finance,
    assets,
    inventory,
    operations
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(products.router)
api_router.include_router(trade.router)
api_router.include_router(partners.router)
api_router.include_router(employees.router)
api_router.include_router(attendance.router)
api_router.include_router(payroll.router)
api_router.include_router(calendar.router)
api_router.include_router(tasks.router)
api_router.include_router(reports.router)
api_router.include_router(admin.router)
api_router.include_router(recruitment.router)
api_router.include_router(attendance.overtime_router)
api_router.include_router(performance.router)
api_router.include_router(procurement.router)
api_router.include_router(finance.router)
api_router.include_router(assets.router)
api_router.include_router(inventory.router, prefix="/inventory", tags=["Warehouse & Inventory"])
api_router.include_router(operations.router, prefix="/operations", tags=["Operations & Order Execution"])
