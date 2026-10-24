import logging
from ..core.database import db_manager
from ..core.security import get_password_hash

logger = logging.getLogger("soilex.db.seed")

def seed_database():
    """Populates DuckDB with initial authentic SOILEX Life Science data"""
    try:
        # 1. Users
        existing_users = db_manager.execute_query("SELECT COUNT(*) as count FROM users")
        if not existing_users or existing_users[0]['count'] == 0:
            logger.info("Seeding SOILEX users...")
            users = [
                ("USR-001", "Executive Admin", "admin@soilexlifescience.com", "ADMIN", "Executive Management", get_password_hash("admin123"), "ACTIVE", None),
                ("USR-002", "Vũ Thị Hoan", "hoan.vu@soilexlifescience.com", "EMPLOYEE", "Sales & Export", get_password_hash("emp123"), "ACTIVE", "EMP-001"),
                ("USR-003", "Rajesh Sharma", "rajesh.s@soilexlifescience.com", "QUALITY_MANAGER", "Quality Assurance & Lab", get_password_hash("qa123"), "ACTIVE", "EMP-002"),
                ("USR-004", "Priya Nair", "priya.n@soilexlifescience.com", "HR_MANAGER", "Human Resources", get_password_hash("hr123"), "ACTIVE", "EMP-004"),
                ("USR-005", "Nguyễn Văn Hùng", "hung.nguyen@soilexlifescience.com", "EMPLOYEE", "Operations & Supply", get_password_hash("emp123"), "ACTIVE", "EMP-003"),
                ("USR-006", "Trần Quốc Bảo", "bao.tran@soilexlifescience.com", "EMPLOYEE", "Finance & Accounts", get_password_hash("emp123"), "ACTIVE", "EMP-005"),
            ]
            for u in users:
                db_manager.execute_write(
                    "INSERT INTO users (id, name, email, role, department, hashed_password, status, employee_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    list(u)
                )
        else:
            # Ensure employee_id is linked for existing users
            try:
                db_manager.execute_write("UPDATE users SET employee_id = 'EMP-001' WHERE email = 'hoan.vu@soilexlifescience.com' AND employee_id IS NULL")
                db_manager.execute_write("UPDATE users SET employee_id = 'EMP-002' WHERE email = 'rajesh.s@soilexlifescience.com' AND employee_id IS NULL")
                db_manager.execute_write("UPDATE users SET employee_id = 'EMP-004' WHERE email = 'priya.n@soilexlifescience.com' AND employee_id IS NULL")
                
                # Check if USR-005 and USR-006 exist
                hung = db_manager.execute_one("SELECT id FROM users WHERE email = 'hung.nguyen@soilexlifescience.com'")
                if not hung:
                    db_manager.execute_write(
                        "INSERT INTO users (id, name, email, role, department, hashed_password, status, employee_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        ["USR-005", "Nguyễn Văn Hùng", "hung.nguyen@soilexlifescience.com", "EMPLOYEE", "Operations & Supply", get_password_hash("emp123"), "ACTIVE", "EMP-003"]
                    )
                bao = db_manager.execute_one("SELECT id FROM users WHERE email = 'bao.tran@soilexlifescience.com'")
                if not bao:
                    db_manager.execute_write(
                        "INSERT INTO users (id, name, email, role, department, hashed_password, status, employee_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        ["USR-006", "Trần Quốc Bảo", "bao.tran@soilexlifescience.com", "EMPLOYEE", "Finance & Accounts", get_password_hash("emp123"), "ACTIVE", "EMP-005"]
                    )
            except Exception:
                pass


        # 2. Products (Whole Spices, Commodities, Feed)
        if db_manager.execute_one("SELECT COUNT(*) as c FROM products", [])['c'] == 0:
            products = [
                ("SP-001", "Aniseed / Anise Cigar", "Whole Spices", "Grade A Premium", "Vietnam / India", 140.0, "$3,800", "25kg Jute Bag", "In Stock"),
                ("SP-002", "Black Pepper 550 G/L", "Whole Spices", "Export Quality", "Kerala / Vietnam", 420.0, "$6,400", "50kg PP Bag", "In Stock"),
                ("SP-003", "Green Cardamom 8mm+", "Whole Spices", "Bold Green", "Guatemala / India", 35.0, "$22,500", "10kg Vacuum Carton", "Low Stock"),
                ("SP-004", "Nutmeg & Javitri (Mace)", "Whole Spices", "Sound Clean", "Indonesia / India", 85.0, "$8,900", "25kg Kraft Bag", "In Stock"),
                ("AG-101", "Perfumed Rice DT 8", "Commodities & Grains", "5% Broken Sortex", "Vietnam", 1200.0, "$610", "50kg PP Bag", "In Stock"),
                ("AG-102", "Indian Aromatic Tea (Dooars)", "Commodities & Grains", "BOP / BP Grade", "West Bengal, India", 210.0, "$2,850", "35kg Paper Sacks", "In Stock"),
                ("FD-201", "Rice DDGS 45% Protein", "Animal Feed Ingredients", "Feed Grade", "India", 3400.0, "$285", "Bulk / Loose in Container", "In Stock"),
                ("FD-202", "Soybean Meal De-hulled", "Animal Feed Ingredients", "48% Protein Non-GMO", "India", 2800.0, "$460", "50kg Bag / Bulk", "In Stock"),
            ]
            for p in products:
                db_manager.execute_write(
                    "INSERT INTO products (id, name, category, grade, origin, stock_mt, price_mt, packaging, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    list(p)
                )

        # 3. Partners (Buyers & Suppliers)
        if db_manager.execute_one("SELECT COUNT(*) as c FROM partners", [])['c'] == 0:
            partners = [
                ("BP-101", "Al-Barakah Spices Trading LLC", "BUYER", "United Arab Emirates", "TIER_1", "VERIFIED", "LC at Sight", "$500,000", "trade@albarakah.ae", "+971-4-2238491"),
                ("BP-102", "Saigon Agri-Food Export Corp", "BUYER", "Vietnam", "TIER_1", "VERIFIED", "CAD / 30 Days", "$750,000", "purchasing@saigonagri.vn", "+84-28-3829104"),
                ("BP-103", "Hamburg Commodities GmbH", "BUYER", "Germany", "TIER_1", "VERIFIED", "TT 30% Adv / 70% BL", "$1,200,000", "import@hamburg-comm.de", "+49-40-781920"),
                ("SP-201", "Cochin Spices & Plantations Ltd", "SUPPLIER", "India", "TIER_1", "VERIFIED", "Advance / Escrow", "$300,000", "sales@cochinspices.in", "+91-484-2668100"),
                ("SP-202", "Mekong Delta Milling Federation", "SUPPLIER", "Vietnam", "TIER_1", "VERIFIED", "CAD", "$600,000", "contact@mekonggrain.vn", "+84-292-3847291"),
            ]
            for pt in partners:
                db_manager.execute_write(
                    "INSERT INTO partners (id, name, type, country, tier, kyc_status, payment_terms, credit_limit, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    list(pt)
                )

        # 4. Trade Contracts
        if db_manager.execute_one("SELECT COUNT(*) as c FROM trade_contracts", [])['c'] == 0:
            contracts = [
                ("CT-2026-081", "SC-88102", "EXPORT", "BP-101", "Al-Barakah Spices Trading LLC", "Black Pepper 550 G/L", 120.5, 54.0, 345600.0, "ORDER_IN_PROCESS"),
                ("CT-2026-082", "SC-88103", "EXPORT", "BP-102", "Saigon Agri-Food Export Corp", "Rice DDGS 45% Protein", 540.0, 320.0, 91200.0, "ORDER_IN_PROCESS"),
                ("CT-2026-083", "SC-88104", "EXPORT", "BP-103", "Hamburg Commodities GmbH", "Green Cardamom 8mm+", 45.0, 12.5, 281250.0, "COMPLETED"),
                ("CT-2026-084", "PC-44019", "IMPORT", "SP-201", "Cochin Spices & Plantations Ltd", "Whole Spices Raw Material", 380.0, 180.0, 240000.0, "AWAITING_BUYER_SIGN"),
            ]
            for c in contracts:
                db_manager.execute_write(
                    "INSERT INTO trade_contracts (id, contract_no, type, partner_id, partner_name, commodity, volume_cbm, volume_mt, total_usd, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    list(c)
                )

        # 5. Shipments
        if db_manager.execute_one("SELECT COUNT(*) as c FROM trade_shipments", [])['c'] == 0:
            shipments = [
                ("SH-901", "EXP-2026-4401", "MEDU-BL-99201", "CT-2026-081", "Mediterranean Shipping Company (MSC)", "Hai Phong (VNHPH)", "Jebel Ali (AEJEA)", "2026-09-10", "2026-09-24", 2, "CLEARED"),
                ("SH-902", "EXP-2026-4402", "MAEU-BL-33019", "CT-2026-082", "Maersk Line", "Cochin (INCOK)", "Cat Lai (VNCLI)", "2026-09-15", "2026-09-28", 5, "PENDING_CUSTOMS"),
                ("SH-903", "EXP-2026-4403", "CMA-BL-77120", "CT-2026-083", "CMA CGM", "Cochin (INCOK)", "Hamburg (DEHAM)", "2026-09-02", "2026-09-22", 1, "IN_TRANSIT"),
            ]
            for sh in shipments:
                db_manager.execute_write(
                    "INSERT INTO trade_shipments (id, shipment_no, bl_no, contract_id, carrier, port_of_loading, port_of_discharge, etd, eta, container_count, customs_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    list(sh)
                )

        # 6. Containers
        if db_manager.execute_one("SELECT COUNT(*) as c FROM containers", [])['c'] == 0:
            containers = [
                ("CN-001", "MSCU-884102-1", "SLX-9941", "SH-901", "Black Pepper 550 G/L", 27400.0, 27000.0, 24.5, "CLEARED"),
                ("CN-002", "MSCU-884103-2", "SLX-9942", "SH-901", "Black Pepper 550 G/L", 27350.0, 27000.0, 24.2, "CLEARED"),
                ("CN-003", "MAEU-119402-4", "SLX-8801", "SH-902", "Rice DDGS 45% Protein", 26500.0, 26000.0, 28.0, "PENDING_CUSTOMS"),
                ("CN-004", "TGHU-940182-9", "SLX-7712", "SH-903", "Green Cardamom 8mm+", 14200.0, 12500.0, 18.0, "IN_TRANSIT"),
            ]
            for cn in containers:
                db_manager.execute_write(
                    "INSERT INTO containers (id, container_no, seal_no, shipment_id, commodity, gross_weight_kg, net_weight_kg, temperature_c, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    list(cn)
                )

        # 7. Employees
        if db_manager.execute_one("SELECT COUNT(*) as c FROM employees", [])['c'] == 0:
            employees = [
                ("EMP-001", "SLX-E01", "Vũ Thị Hoan", "hoan.vu@soilexlifescience.com", "+84-908-112233", "Sales & Export", "Senior Sales Executive", "Hanoi HQ", "Morning Shift", "2023-04-15", "ACTIVE", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"),
                ("EMP-002", "SLX-E02", "Rajesh Sharma", "rajesh.s@soilexlifescience.com", "+91-98401-22334", "Quality Assurance", "QA Lab Director", "Kochi Terminal", "Standard Shift", "2022-08-01", "ACTIVE", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"),
                ("EMP-003", "SLX-E03", "Nguyễn Văn Hùng", "hung.nguyen@soilexlifescience.com", "+84-912-445566", "Operations & Supply", "Logistics Supervisor", "Hai Phong Hub", "Night Shift", "2024-01-10", "ACTIVE", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"),
                ("EMP-004", "SLX-E04", "Priya Nair", "priya.n@soilexlifescience.com", "+91-98765-43210", "Human Resources", "HR Operations Lead", "Kochi Terminal", "Morning Shift", "2023-11-20", "ACTIVE", "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150"),
                ("EMP-005", "SLX-E05", "Trần Quốc Bảo", "bao.tran@soilexlifescience.com", "+84-983-998877", "Finance & Accounts", "Senior Trade Accountant", "Hanoi HQ", "Morning Shift", "2021-03-01", "ACTIVE", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"),
            ]
            for emp in employees:
                db_manager.execute_write(
                    "INSERT INTO employees (id, employee_code, full_name, email, phone, department, designation, branch, shift, join_date, status, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    list(emp)
                )

        # 8. Attendance Logs
        if db_manager.execute_one("SELECT COUNT(*) as c FROM attendance_logs", [])['c'] == 0:
            attendance = [
                ("ATT-001", "EMP-001", "Vũ Thị Hoan", "2026-09-05", "08:28 AM", "05:32 PM", 9.06, "PRESENT", "BIOMETRIC_DEVICE", "Hanoi HQ"),
                ("ATT-002", "EMP-002", "Rajesh Sharma", "2026-09-05", "08:55 AM", None, 0.0, "PRESENT", "MOBILE_GEO", "Kochi Terminal"),
                ("ATT-003", "EMP-003", "Nguyễn Văn Hùng", "2026-09-05", "08:15 AM", "05:10 PM", 8.91, "PRESENT", "BIOMETRIC_DEVICE", "Hai Phong Hub"),
                ("ATT-004", "EMP-004", "Priya Nair", "2026-09-05", "09:02 AM", None, 0.0, "PRESENT", "DESKTOP_PUNCH", "Kochi Terminal"),
                ("ATT-005", "EMP-005", "Trần Quốc Bảo", "2026-09-05", None, None, 0.0, "LEAVE", "LEAVE_PORTAL", "Hanoi HQ"),
            ]
            for att in attendance:
                db_manager.execute_write(
                    "INSERT INTO attendance_logs (id, employee_id, employee_name, date, clock_in, clock_out, work_hours, status, source, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    list(att)
                )

        # 9. Leave Requests
        if db_manager.execute_one("SELECT COUNT(*) as c FROM leave_requests", [])['c'] == 0:
            leaves = [
                ("LEV-001", "EMP-005", "Trần Quốc Bảo", "Annual Leave", "2026-09-05", "2026-09-07", 3.0, "Family vacation", "APPROVED"),
                ("LEV-002", "EMP-001", "Vũ Thị Hoan", "Medical Leave", "2026-09-18", "2026-09-19", 2.0, "Dental surgery follow-up", "PENDING"),
            ]
            for lev in leaves:
                db_manager.execute_write(
                    "INSERT INTO leave_requests (id, employee_id, employee_name, leave_type, start_date, end_date, total_days, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    list(lev)
                )

        # 10. Payroll Records
        if db_manager.execute_one("SELECT COUNT(*) as c FROM payroll_records", [])['c'] == 0:
            payrolls = [
                ("PAY-2026-08-1", "EMP-001", "Vũ Thị Hoan", "August 2026", 2200.0, 450.0, 120.0, 180.0, 2350.0, "PAID"),
                ("PAY-2026-08-2", "EMP-002", "Rajesh Sharma", "August 2026", 2600.0, 300.0, 100.0, 220.0, 2580.0, "PAID"),
                ("PAY-2026-08-3", "EMP-003", "Nguyễn Văn Hùng", "August 2026", 1800.0, 350.0, 80.0, 140.0, 1930.0, "PAID"),
                ("PAY-2026-08-4", "EMP-004", "Priya Nair", "August 2026", 1950.0, 250.0, 90.0, 160.0, 1950.0, "PAID"),
                ("PAY-2026-08-5", "EMP-005", "Trần Quốc Bảo", "August 2026", 2400.0, 400.0, 110.0, 200.0, 2490.0, "PAID"),
            ]
            for pay in payrolls:
                db_manager.execute_write(
                    "INSERT INTO payroll_records (id, employee_id, employee_name, month_year, basic_pay, allowances, deductions, tax, net_salary, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    list(pay)
                )

        # 11. Calendar Events
        if db_manager.execute_one("SELECT COUNT(*) as c FROM calendar_events", [])['c'] == 0:
            events = [
                ("EVT-101", "Weekly Export Logistics Sync", "Review container schedules with Maersk & MSC", "MEETING", "2026-09-08 10:00", "2026-09-08 11:30", "Conference Room A / Zoom", "Logistics & Sales Teams", "USR-001"),
                ("EVT-102", "FSSAI & Spice Board Lab Inspection", "Annual quality audit of Kochi sterilization facility", "INSPECTION", "2026-09-12 09:00", "2026-09-12 16:00", "Kochi Terminal QA Lab", "Rajesh Sharma, Lab Auditors", "USR-003"),
                ("EVT-103", "Container Loading: Black Pepper 550 G/L", "Stuffing and phytosanitary seal verification at Hai Phong", "SHIPMENT", "2026-09-14 13:00", "2026-09-14 18:00", "Hai Phong Port Berth 3", "Nguyễn Văn Hùng, Port Ops", "USR-002"),
            ]
            for evt in events:
                db_manager.execute_write(
                    "INSERT INTO calendar_events (id, title, description, event_type, start_time, end_time, location, participants, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    list(evt)
                )

        # 12. Workspace Tasks
        if db_manager.execute_one("SELECT COUNT(*) as c FROM workspace_tasks", [])['c'] == 0:
            tasks = [
                ("TSK-01", "Review Bill of Lading for Dubai Container MSCU-884102", "Operations", "HIGH", "2026-09-08", "Vũ Thị Hoan", False, "Verify gross weights match manifest"),
                ("TSK-02", "Submit Vietnam Perfumed Rice Phytosanitary Certificate", "Compliance", "URGENT", "2026-09-06", "Nguyễn Văn Hùng", False, "Required before customs release"),
                ("TSK-03", "Run Monthly Employee Statutory Deductions & Tax Slips", "HR & Payroll", "MEDIUM", "2026-09-10", "Priya Nair", True, "August salary cycle finalized"),
                ("TSK-04", "Calibrate Moisture Meters at Kochi Spices Lab", "Maintenance", "LOW", "2026-09-15", "Rajesh Sharma", False, "Quarterly calibration routine"),
            ]
            for tsk in tasks:
                db_manager.execute_write(
                    "INSERT INTO workspace_tasks (id, title, category, priority, due_date, assigned_to, completed, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    list(tsk)
                )

        # 13. Admin Facilities
        if db_manager.execute_one("SELECT COUNT(*) as c FROM admin_facilities", [])['c'] == 0:
            facilities = [
                ("FAC-01", "BR-HN", "Hanoi Agro Bio-Hub & HQ", "CORPORATE_HQ_LOGISTICS", "Hanoi, Vietnam", 120000, 85, "OPERATIONAL"),
                ("FAC-02", "BR-KC", "Kochi Spices Extraction & Terminal", "PROCESSING_EXPORT_PLANT", "Kerala, India", 95000, 140, "OPERATIONAL"),
                ("FAC-03", "BR-HP", "Hai Phong Port Logistics Depot", "COLD_STORAGE_CONTAINER_DEPOT", "Hai Phong, Vietnam", 65000, 42, "OPERATIONAL"),
                ("FAC-04", "BR-DXB", "Dubai Middle East Trade Hub", "REGIONAL_SALES_OFFICE", "Jebel Ali, Dubai, UAE", 25000, 18, "OPERATIONAL"),
            ]
            for fac in facilities:
                db_manager.execute_write(
                    "INSERT INTO admin_facilities (id, code, name, type, location, capacity_sqft, active_personnel, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    list(fac)
                )

        # ═══════════════════════════════════════════════════════════
        # 14. PURCHASE ORDERS
        # ═══════════════════════════════════════════════════════════
        purchase_orders = [
            ("PO-001", "PO-2026-00101", "SP-201", "Cochin Spices & Plantations Ltd", "2026-09-01", "2026-09-20", "USD", 1.0, "Advance / Escrow", "FOB", "Cochin Port", "Kochi Terminal", 684000.0, 0.0, 0.0, 684000.0, "APPROVED", "APPROVED", "USR-001", "2026-09-02", "Bulk raw spices procurement Q3", "USR-002"),
            ("PO-002", "PO-2026-00102", "SP-202", "Mekong Delta Milling Federation", "2026-09-05", "2026-09-25", "USD", 1.0, "CAD", "CIF", "Cat Lai Port", "Hanoi HQ", 192000.0, 0.0, 2400.0, 194400.0, "SENT", "APPROVED", "USR-001", "2026-09-06", "DDGS & rice bran for Q4 animal feed production", "USR-002"),
            ("PO-003", "PO-2026-00103", "SP-201", "Cochin Spices & Plantations Ltd", "2026-10-10", "2026-10-30", "USD", 1.0, "Net 30", "FOB", "Cochin Port", "Kochi Terminal", 112500.0, 0.0, 0.0, 112500.0, "DRAFT", "PENDING", None, None, "Green Cardamom 8mm+ re-order", "USR-002"),
            ("PO-004", "PO-2026-00104", "SP-202", "Mekong Delta Milling Federation", "2026-10-15", "2026-11-05", "USD", 1.0, "CAD", "FOB", "Ho Chi Minh Port", "Hai Phong Hub", 460000.0, 0.0, 1800.0, 461800.0, "PENDING_APPROVAL", "PENDING", None, None, "Soybean meal de-hulled 48% protein", "USR-001"),
        ]
        for po in purchase_orders:
            db_manager.execute_write(
                "INSERT INTO purchase_orders (id, po_number, supplier_id, supplier_name, order_date, expected_delivery_date, currency, exchange_rate, payment_terms, incoterms, incoterms_location, delivery_warehouse, subtotal, tax_amount, shipping_charges, grand_total, status, approval_status, approved_by, approved_date, remarks, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                list(po)
            )

        # 15. PO LINE ITEMS
        po_items = [
            ("POI-001-1", "PO-001", "SP-002", "Black Pepper 550 G/L", "Export quality whole black pepper", 180.0, 120.0, "MT", 3800.0, 0.0, 684000.0, "Export Quality", "2026-09-18"),
            ("POI-002-1", "PO-002", "FD-201", "Rice DDGS 45% Protein", "Feed grade DDGS bulk", 600.0, 0.0, "MT", 285.0, 0.0, 171000.0, "Feed Grade", "2026-09-22"),
            ("POI-002-2", "PO-002", "AG-101", "Perfumed Rice DT 8", "5% Broken Sortex white rice", 50.0, 0.0, "MT", 420.0, 0.0, 21000.0, "5% Broken", "2026-09-22"),
            ("POI-003-1", "PO-003", "SP-003", "Green Cardamom 8mm+", "Bold green cardamom premium", 5.0, 0.0, "MT", 22500.0, 0.0, 112500.0, "Bold Green", "2026-10-28"),
            ("POI-004-1", "PO-004", "FD-202", "Soybean Meal De-hulled", "48% protein non-GMO soybean meal", 1000.0, 0.0, "MT", 460.0, 0.0, 460000.0, "48% Protein", "2026-11-01"),
        ]
        for pi in po_items:
            db_manager.execute_write(
                "INSERT INTO purchase_order_items (id, po_id, item_code, item_name, description, quantity, received_qty, uom, rate, discount_percent, amount, quality_grade, required_by_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                list(pi)
            )

        # 16. GOODS RECEIPT NOTES
        grns = [
            ("GRN-001", "GRN-2026-00201", "PO-001", "PO-2026-00101", "SP-201", "Cochin Spices & Plantations Ltd", "2026-09-18", "Kochi Terminal", "TransIndia Logistics", "KL-21-AB-9041", "Partial shipment - 120 MT received", "SUBMITTED", "USR-003"),
        ]
        for g in grns:
            db_manager.execute_write(
                "INSERT INTO goods_receipt_notes (id, grn_number, po_id, po_number, supplier_id, supplier_name, receipt_date, receiving_warehouse, transporter, vehicle_no, remarks, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                list(g)
            )

        # 17. GRN ITEMS
        grn_items = [
            ("GRNI-001-1", "GRN-001", "POI-001-1", "SP-002", "Black Pepper 550 G/L", 180.0, 120.0, 118.5, 1.5, "MT", "LOT-BP-SEP-01", "ACCEPTED", "1.5 MT rejected due to moisture > 12%"),
        ]
        for gi in grn_items:
            db_manager.execute_write(
                "INSERT INTO grn_items (id, grn_id, po_item_id, item_code, item_name, ordered_qty, received_qty, accepted_qty, rejected_qty, uom, batch_no, quality_status, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                list(gi)
            )

        # ═══════════════════════════════════════════════════════════
        # 18. SALES ORDERS
        # ═══════════════════════════════════════════════════════════
        sales_orders = [
            ("SO-001", "SO-2026-00301", "BP-101", "Al-Barakah Spices Trading LLC", "CPO-ABK-2026-441", "2026-08-20", "2026-09-15", "USD", 1.0, "LC at Sight", "FOB", "Jebel Ali", "Vũ Thị Hoan", "Middle East", 345600.0, 0.0, 0.0, 345600.0, 345600.0, 0.0, "INVOICED", "Black Pepper 550GL export to Dubai", "USR-002"),
            ("SO-002", "SO-2026-00302", "BP-102", "Saigon Agri-Food Export Corp", None, "2026-08-25", "2026-09-28", "USD", 1.0, "CAD / 30 Days", "CIF", "Cat Lai Port", "Vũ Thị Hoan", "Southeast Asia", 91200.0, 0.0, 3200.0, 94400.0, 0.0, 94400.0, "CONFIRMED", "Rice DDGS bulk export to Vietnam domestic", "USR-002"),
            ("SO-003", "SO-2026-00303", "BP-103", "Hamburg Commodities GmbH", "DE-HC-PO-8811", "2026-08-10", "2026-09-22", "USD", 1.0, "TT 30% Adv / 70% BL", "CFR", "Hamburg Port", "Vũ Thị Hoan", "Europe", 281250.0, 0.0, 4500.0, 285750.0, 285750.0, 0.0, "PAID", "Green Cardamom premium export to Germany", "USR-002"),
            ("SO-004", "SO-2026-00304", "BP-101", "Al-Barakah Spices Trading LLC", None, "2026-10-18", "2026-11-10", "USD", 1.0, "LC at Sight", "FOB", "Jebel Ali", "Vũ Thị Hoan", "Middle East", 178000.0, 0.0, 0.0, 178000.0, 0.0, 178000.0, "DRAFT", "Nutmeg & Mace Q4 order", "USR-002"),
        ]
        for so in sales_orders:
            db_manager.execute_write(
                "INSERT INTO sales_orders (id, so_number, customer_id, customer_name, customer_po_number, order_date, delivery_date, currency, exchange_rate, payment_terms, incoterms, incoterms_location, salesperson, territory, subtotal, tax_amount, shipping_charges, grand_total, paid_amount, outstanding_amount, status, remarks, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                list(so)
            )

        # 19. SO LINE ITEMS
        so_items = [
            ("SOI-001-1", "SO-001", "SP-002", "Black Pepper 550 G/L", "Export quality black pepper 550GL", 54.0, 54.0, 54.0, "MT", 6400.0, 0.0, 345600.0, "Hai Phong Hub"),
            ("SOI-002-1", "SO-002", "FD-201", "Rice DDGS 45% Protein", "Feed grade DDGS for Vietnam poultry sector", 320.0, 0.0, 0.0, "MT", 285.0, 0.0, 91200.0, "Hanoi HQ"),
            ("SOI-003-1", "SO-003", "SP-003", "Green Cardamom 8mm+", "Bold green premium cardamom", 12.5, 12.5, 12.5, "MT", 22500.0, 0.0, 281250.0, "Kochi Terminal"),
            ("SOI-004-1", "SO-004", "SP-004", "Nutmeg & Javitri (Mace)", "Sound clean nutmeg with mace", 20.0, 0.0, 0.0, "MT", 8900.0, 0.0, 178000.0, "Kochi Terminal"),
        ]
        for si in so_items:
            db_manager.execute_write(
                "INSERT INTO sales_order_items (id, so_id, item_code, item_name, description, quantity, delivered_qty, billed_qty, uom, rate, discount_percent, amount, warehouse) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                list(si)
            )

        # 20. CHART OF ACCOUNTS
        accounts = [
            ("ACC-100", "1000", "Assets", "Asset", None, True, "USD", 0.0, False, "All asset accounts"),
            ("ACC-110", "1100", "Bank Accounts", "Asset", "1000", True, "USD", 485000.0, False, "Bank and cash accounts"),
            ("ACC-111", "1101", "HDFC Bank - Export Account", "Asset", "1100", False, "USD", 325000.0, False, "Primary export revenue account"),
            ("ACC-112", "1102", "Vietcombank - Operations", "Asset", "1100", False, "VND", 160000.0, False, "Vietnam operations account"),
            ("ACC-120", "1200", "Accounts Receivable", "Asset", "1000", False, "USD", 94400.0, False, "Outstanding customer payments"),
            ("ACC-130", "1300", "Inventory", "Asset", "1000", False, "USD", 1250000.0, False, "Stock-in-hand valuation"),
            ("ACC-200", "2000", "Liabilities", "Liability", None, True, "USD", 0.0, False, "All liability accounts"),
            ("ACC-210", "2100", "Accounts Payable", "Liability", "2000", False, "USD", 574200.0, False, "Outstanding supplier payments"),
            ("ACC-220", "2200", "Tax Liabilities", "Liability", "2000", False, "USD", 18500.0, False, "GST/VAT/TDS payable"),
            ("ACC-300", "3000", "Equity", "Equity", None, True, "USD", 0.0, False, "Shareholder equity"),
            ("ACC-310", "3100", "Share Capital", "Equity", "3000", False, "USD", 500000.0, False, "Paid-up capital"),
            ("ACC-320", "3200", "Retained Earnings", "Equity", "3000", False, "USD", 185000.0, False, "Accumulated profits"),
            ("ACC-400", "4000", "Income", "Income", None, True, "USD", 0.0, False, "All income accounts"),
            ("ACC-410", "4100", "Sales Revenue - Export", "Income", "4000", False, "USD", 725750.0, False, "Export sales revenue"),
            ("ACC-420", "4200", "Duty Drawback Income", "Income", "4000", False, "USD", 12400.0, False, "Export duty drawback claims"),
            ("ACC-430", "4300", "Forex Gain", "Income", "4000", False, "USD", 4200.0, False, "Foreign exchange gains"),
            ("ACC-500", "5000", "Expenses", "Expense", None, True, "USD", 0.0, False, "All expense accounts"),
            ("ACC-510", "5100", "Cost of Goods Sold", "Expense", "5000", False, "USD", 420000.0, False, "Direct material costs"),
            ("ACC-520", "5200", "Freight & Shipping", "Expense", "5000", False, "USD", 48200.0, False, "Container freight and logistics"),
            ("ACC-530", "5300", "Commission & Brokerage", "Expense", "5000", False, "USD", 15800.0, False, "Broker and agent commissions"),
            ("ACC-540", "5400", "Salaries & Wages", "Expense", "5000", False, "USD", 52500.0, False, "Employee compensation"),
            ("ACC-550", "5500", "Bank Charges", "Expense", "5000", False, "USD", 8900.0, False, "LC charges, wire fees, bank costs"),
        ]
        for acc in accounts:
            db_manager.execute_write(
                "INSERT INTO chart_of_accounts (id, account_code, account_name, account_type, parent_account, is_group, currency, balance, is_frozen, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                list(acc)
            )

        # 21. JOURNAL ENTRIES (sample GL transactions)
        journal_entries = [
            ("JE-001", "JE-2026-00001", "2026-08-25", "ACC-120", "Accounts Receivable", 345600.0, 0.0, "Customer", "Al-Barakah Spices Trading LLC", "Sales Invoice", "INV-001", "Invoice for Black Pepper export SO-001", "USR-005"),
            ("JE-002", "JE-2026-00002", "2026-08-25", "ACC-410", "Sales Revenue - Export", 0.0, 345600.0, "Customer", "Al-Barakah Spices Trading LLC", "Sales Invoice", "INV-001", "Revenue recognition BP 550GL", "USR-005"),
            ("JE-003", "JE-2026-00003", "2026-09-22", "ACC-120", "Accounts Receivable", 285750.0, 0.0, "Customer", "Hamburg Commodities GmbH", "Sales Invoice", "INV-002", "Invoice for Cardamom export SO-003", "USR-005"),
            ("JE-004", "JE-2026-00004", "2026-09-22", "ACC-410", "Sales Revenue - Export", 0.0, 285750.0, "Customer", "Hamburg Commodities GmbH", "Sales Invoice", "INV-002", "Revenue recognition Cardamom", "USR-005"),
            ("JE-005", "JE-2026-00005", "2026-09-25", "ACC-111", "HDFC Bank - Export Account", 285750.0, 0.0, "Customer", "Hamburg Commodities GmbH", "Payment", "PAY-001", "TT payment received - Cardamom shipment", "USR-005"),
            ("JE-006", "JE-2026-00006", "2026-09-25", "ACC-120", "Accounts Receivable", 0.0, 285750.0, "Customer", "Hamburg Commodities GmbH", "Payment", "PAY-001", "AR cleared - Hamburg payment", "USR-005"),
            ("JE-007", "JE-2026-00007", "2026-09-01", "ACC-510", "Cost of Goods Sold", 420000.0, 0.0, None, None, "Purchase Order", "PO-001", "COGS - Black Pepper procurement", "USR-005"),
            ("JE-008", "JE-2026-00008", "2026-09-01", "ACC-210", "Accounts Payable", 0.0, 420000.0, "Supplier", "Cochin Spices & Plantations Ltd", "Purchase Order", "PO-001", "AP - Cochin Spices PO", "USR-005"),
        ]
        for je in journal_entries:
            db_manager.execute_write(
                "INSERT INTO journal_entries (id, entry_number, entry_date, account_id, account_name, debit, credit, party_type, party_name, reference_type, reference_id, narration, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                list(je)
            )

        # 22. SALES INVOICES
        invoices = [
            ("INV-001", "INV-2026-00401", "BP-101", "Al-Barakah Spices Trading LLC", "SO-001", "SO-2026-00301", "2026-08-25", "2026-09-25", "USD", 1.0, 345600.0, 0.0, 345600.0, 345600.0, 0.0, "PAID", "LC at Sight", "Export invoice - Black Pepper", "USR-005"),
            ("INV-002", "INV-2026-00402", "BP-103", "Hamburg Commodities GmbH", "SO-003", "SO-2026-00303", "2026-09-22", "2026-10-22", "USD", 1.0, 281250.0, 4500.0, 285750.0, 285750.0, 0.0, "PAID", "TT 30% Adv / 70% BL", "Export invoice - Green Cardamom", "USR-005"),
            ("INV-003", "INV-2026-00403", "BP-102", "Saigon Agri-Food Export Corp", "SO-002", "SO-2026-00302", "2026-10-01", "2026-10-31", "USD", 1.0, 91200.0, 3200.0, 94400.0, 0.0, 94400.0, "SUBMITTED", "CAD / 30 Days", "Export invoice - DDGS", "USR-005"),
        ]
        for inv in invoices:
            db_manager.execute_write(
                "INSERT INTO sales_invoices (id, invoice_number, customer_id, customer_name, sales_order_id, so_number, invoice_date, due_date, currency, exchange_rate, subtotal, tax_amount, grand_total, paid_amount, outstanding_amount, status, payment_terms, remarks, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                list(inv)
            )

        # 23. INVOICE ITEMS
        inv_items = [
            ("INVI-001-1", "INV-001", "SP-002", "Black Pepper 550 G/L", "Export quality 550GL", 54.0, 6400.0, 0.0, 0.0, 345600.0),
            ("INVI-002-1", "INV-002", "SP-003", "Green Cardamom 8mm+", "Bold green premium", 12.5, 22500.0, 0.0, 0.0, 281250.0),
            ("INVI-003-1", "INV-003", "FD-201", "Rice DDGS 45% Protein", "Feed grade bulk", 320.0, 285.0, 0.0, 0.0, 91200.0),
        ]
        for ii in inv_items:
            db_manager.execute_write(
                "INSERT INTO invoice_items (id, invoice_id, item_code, item_name, description, quantity, rate, tax_rate, tax_amount, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                list(ii)
            )

        # 24. PAYMENT ENTRIES
        payments = [
            ("PAY-001", "PAY-2026-00501", "RECEIVE", "Customer", "Hamburg Commodities GmbH", "BP-103", "2026-09-25", "TT Wire", "USD", 285750.0, "UTR-DEHAM-88401", "2026-09-25", "HDFC Bank Export", "INV-002", "INV-2026-00402", "TT payment for Cardamom shipment", "SUBMITTED", "USR-005"),
            ("PAY-002", "PAY-2026-00502", "RECEIVE", "Customer", "Al-Barakah Spices Trading LLC", "BP-101", "2026-09-20", "LC Negotiation", "USD", 345600.0, "LC-ABK-2026-441-NEG", "2026-09-20", "HDFC Bank Export", "INV-001", "INV-2026-00401", "LC negotiated - Black Pepper", "SUBMITTED", "USR-005"),
        ]
        for pay in payments:
            db_manager.execute_write(
                "INSERT INTO payment_entries (id, payment_number, payment_type, party_type, party_name, party_id, payment_date, mode_of_payment, currency, paid_amount, reference_no, reference_date, bank_account, allocated_to_invoice, allocated_invoice_number, remarks, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                list(pay)
            )

        logger.info("SOILEX Life Science database seeding completed successfully!")

        # ─── New HR / Recruitment Seed Data ──────────────────────────────────

        # Holidays
        count = db_manager.execute_one("SELECT COUNT(*) as c FROM holidays", [])['c']
        if count == 0:
            holidays_data = [
                ('HOL-001', "Vietnamese New Year (Tết)", '2026-01-28', 'ALL', 'NATIONAL'),
                ('HOL-002', "Republic Day", '2026-01-26', 'Kochi Terminal', 'NATIONAL'),
                ('HOL-003', "Hùng Kings Festival", '2026-04-07', 'Hanoi HQ', 'NATIONAL'),
                ('HOL-004', "Liberation Day Vietnam", '2026-04-30', 'Hanoi HQ', 'NATIONAL'),
                ('HOL-005', "International Labor Day", '2026-05-01', 'ALL', 'NATIONAL'),
                ('HOL-006', "Independence Day India", '2026-08-15', 'Kochi Terminal', 'NATIONAL'),
                ('HOL-007', "UAE National Day", '2026-12-02', 'Dubai Office', 'NATIONAL'),
                ('HOL-008', "SOILEX Foundation Day", '2026-09-01', 'ALL', 'COMPANY'),
            ]
            for row in holidays_data:
                db_manager.execute_write(
                    "INSERT INTO holidays (id, name, date, branch, type) VALUES (?, ?, ?, ?, ?)",
                    list(row)
                )

        # Leave Balances
        count = db_manager.execute_one("SELECT COUNT(*) as c FROM leave_balances", [])['c']
        if count == 0:
            leave_balances_data = [
                ('LB-001', 'EMP-001', 2026, 18, 3, 12, 0, 6, 1),
                ('LB-002', 'EMP-002', 2026, 18, 5, 12, 2, 6, 0),
                ('LB-003', 'EMP-003', 2026, 18, 8, 12, 1, 6, 2),
                ('LB-004', 'EMP-004', 2026, 18, 2, 12, 0, 6, 0),
                ('LB-005', 'EMP-005', 2026, 18, 4, 12, 3, 6, 1),
            ]
            for row in leave_balances_data:
                db_manager.execute_write(
                    "INSERT INTO leave_balances (id, employee_id, year, annual_total, annual_used, sick_total, sick_used, casual_total, casual_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    list(row)
                )

        # Salary Structures
        count = db_manager.execute_one("SELECT COUNT(*) as c FROM salary_structures", [])['c']
        if count == 0:
            salary_structures_data = [
                ('SS-001', 'EMP-001', '2023-04-15', 38400.0, 2200.0, 880.0, 200.0, 100.0, 270.0, 264.0, 264.0, 0.0, 50.0),
                ('SS-002', 'EMP-002', '2022-08-01', 43200.0, 2600.0, 1040.0, 200.0, 100.0, 460.0, 312.0, 312.0, 0.0, 75.0),
                ('SS-003', 'EMP-003', '2024-01-10', 28800.0, 1800.0, 720.0, 150.0, 100.0, 230.0, 216.0, 216.0, 0.0, 50.0),
                ('SS-004', 'EMP-004', '2023-11-20', 32400.0, 1950.0, 780.0, 150.0, 100.0, 270.0, 234.0, 234.0, 0.0, 50.0),
                ('SS-005', 'EMP-005', '2021-03-01', 40800.0, 2400.0, 960.0, 200.0, 100.0, 340.0, 288.0, 288.0, 0.0, 75.0),
            ]
            for row in salary_structures_data:
                db_manager.execute_write(
                    "INSERT INTO salary_structures (id, employee_id, effective_from, ctc_annual, basic_monthly, hra_monthly, transport_allowance, medical_allowance, special_allowance, pf_employee, pf_employer, esi_employee, professional_tax) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    list(row)
                )

        # Overtime Logs
        count = db_manager.execute_one("SELECT COUNT(*) as c FROM overtime_logs", [])['c']
        if count == 0:
            ot_seed = [
                ('OT-001', 'EMP-003', 'Nguyễn Văn Hùng', '2026-09-04', 5.5, 'Container stuffing & berth dispatch at Hai Phong Port', 'APPROVED', 'Operations Director'),
                ('OT-002', 'EMP-001', 'Vũ Thị Hoan', '2026-09-03', 4.0, 'Urgent Dubai export documentation & phytosanitary clearance', 'APPROVED', 'Commercial Head'),
                ('OT-003', 'EMP-002', 'Rajesh Sharma', '2026-09-10', 3.0, 'FSSAI chemical residue re-testing batch Lot-88', 'APPROVED', 'Plant Director'),
                ('OT-004', 'EMP-004', 'Priya Nair', '2026-09-12', 2.5, 'Bi-national shift roster reconciliation', 'PENDING', '-'),
            ]
            for row in ot_seed:
                db_manager.execute_write(
                    "INSERT INTO overtime_logs (id, employee_id, employee_name, date, hours, reason, status, approved_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    list(row)
                )

        # Job Requisitions
        count = db_manager.execute_one("SELECT COUNT(*) as c FROM job_requisitions", [])['c']
        if count == 0:
            jd_data = [
                ('JD-001', 'Senior Export Sales Manager', 'Sales & Export', 'Hanoi HQ', 5, 55000.0, '2026-11-30', 'OPEN', 'admin'),
                ('JD-002', 'QA Laboratory Analyst', 'Quality Assurance', 'Kochi Terminal', 2, 30000.0, '2026-11-15', 'OPEN', 'admin'),
                ('JD-003', 'Logistics Coordinator', 'Operations & Supply', 'Hai Phong Hub', 3, 28000.0, '2026-12-01', 'SCREENING', 'admin'),
            ]
            for row in jd_data:
                db_manager.execute_write(
                    "INSERT INTO job_requisitions (id, title, department, branch, min_experience_years, salary_budget_usd, deadline, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    list(row)
                )

        # Candidates
        count = db_manager.execute_one("SELECT COUNT(*) as c FROM candidates", [])['c']
        if count == 0:
            candidates_data = [
                ('CAN-001', 'JD-001', 'Arjun Mehta', 'arjun.m@gmail.com', '+91-9811123456', 'LINKEDIN', '', 'SHORTLISTED', 45000.0, 55000.0, 30, 'Strong export background'),
                ('CAN-002', 'JD-001', 'Linh Pham Thi', 'linh.pham@outlook.com', '+84-912-334455', 'REFERRAL', '', 'INTERVIEW', 38000.0, 50000.0, 60, 'Referred by Vũ Thị Hoan'),
                ('CAN-003', 'JD-002', 'Deepa Krishnamurthy', 'deepa.k@yahoo.com', '+91-9876-543210', 'JOB_PORTAL', '', 'APPLIED', 22000.0, 28000.0, 15, 'FSSAI certified'),
                ('CAN-004', 'JD-003', 'Minh Tuan Nguyen', 'minhtuan@gmail.com', '+84-908-777888', 'WALK_IN', '', 'OFFER', 20000.0, 26000.0, 30, 'Ex-DHL logistics'),
            ]
            for row in candidates_data:
                db_manager.execute_write(
                    "INSERT INTO candidates (id, jd_id, full_name, email, phone, source, resume_url, stage, current_salary, expected_salary, notice_period_days, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    list(row)
                )

        # Onboarding Checklist
        count = db_manager.execute_one("SELECT COUNT(*) as c FROM onboarding_checklist", [])['c']
        if count == 0:
            onboarding_data = [
                ('OBC-001', 'EMP-001', 'ID proof collected & verified', True),
                ('OBC-002', 'EMP-001', 'Bank account linked for salary disbursement', True),
                ('OBC-003', 'EMP-001', 'System ERP access granted', True),
                ('OBC-004', 'EMP-001', 'Company email account created', True),
                ('OBC-005', 'EMP-001', 'New employee orientation training completed', False),
                ('OBC-006', 'EMP-001', 'Probation confirmation letter issued', False),
            ]
            for row in onboarding_data:
                db_manager.execute_write(
                    "INSERT INTO onboarding_checklist (id, employee_id, item, completed) VALUES (?, ?, ?, ?)",
                    list(row)
                )

        # Shift Roster
        count = db_manager.execute_one("SELECT COUNT(*) as c FROM shift_roster", [])['c']
        if count == 0:
            shifts = [
                ('SR-001', 'EMP-001', 'Vũ Thị Hoan', 'Sales & Export', 'Hanoi HQ', 'GENERAL_OFFICE', 'General Commercial Shift', '08:30 - 17:30', '2026-01-01', 'ACTIVE'),
                ('SR-002', 'EMP-002', 'Rajesh Sharma', 'Quality Assurance', 'Kochi Terminal', 'SHIFT_A_MORNING', 'Morning Extraction Lab Shift', '06:00 - 14:30', '2026-01-01', 'ACTIVE'),
                ('SR-003', 'EMP-003', 'Nguyễn Văn Hùng', 'Operations & Supply', 'Hai Phong Hub', 'SHIFT_B_EVENING', 'Berth Container Dispatch Shift', '14:00 - 22:30', '2026-01-01', 'ACTIVE'),
                ('SR-004', 'EMP-004', 'Priya Nair', 'Human Resources', 'Kochi Terminal', 'GENERAL_OFFICE', 'General HR Admin Shift', '08:30 - 17:30', '2026-01-01', 'ACTIVE'),
                ('SR-005', 'EMP-005', 'Trần Quốc Bảo', 'Finance & Accounts', 'Hanoi HQ', 'GENERAL_OFFICE', 'Finance Audit Shift', '08:30 - 17:30', '2026-01-01', 'ACTIVE'),
            ]
            for row in shifts:
                db_manager.execute_write(
                    "INSERT INTO shift_roster (id, employee_id, employee_name, department, branch, shift_code, shift_name, timings, effective_from, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    list(row)
                )

        # Attendance Regularizations
        count = db_manager.execute_one("SELECT COUNT(*) as c FROM attendance_regularizations", [])['c']
        if count == 0:
            regs = [
                ('REG-001', 'EMP-003', 'Nguyễn Văn Hùng', '2026-09-02', 'BOTH', '08:15 AM', '05:30 PM', 'On-site container inspection at Hai Phong Berth 4 without biometric device access', 'APPROVED', 'Operations Director'),
                ('REG-002', 'EMP-001', 'Vũ Thị Hoan', '2026-09-04', 'CLOCK_OUT', None, '06:45 PM', 'Client meeting with Dubai export consignee extended past office hours', 'PENDING', '-'),
            ]
            for row in regs:
                db_manager.execute_write(
                    "INSERT INTO attendance_regularizations (id, employee_id, employee_name, date, punch_type, requested_clock_in, requested_clock_out, reason, status, approved_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    list(row)
                )

        # Employee Compliance (ISO 22000 & HACCP)
        count = db_manager.execute_one("SELECT COUNT(*) as c FROM employee_compliance", [])['c']
        if count == 0:
            compliance_data = [
                ('CMP-001', 'EMP-001', 'FIT_FOR_FOOD_PROCESSING', '2026-03-10', '2027-03-10', True, '2027-04-15', 'O+', 'Vũ Anh Tuấn (Spouse)', '+84-909-887766', 0),
                ('CMP-002', 'EMP-002', 'FIT_FOR_FOOD_PROCESSING', '2026-01-15', '2027-01-15', True, '2027-02-28', 'B+', 'Lakshmi Sharma (Spouse)', '+91-98401-99887', 0),
                ('CMP-003', 'EMP-003', 'FIT_FOR_FOOD_PROCESSING', '2026-02-20', '2027-02-20', True, '2027-05-30', 'A+', 'Nguyễn Thị Mai (Sister)', '+84-912-332211', 0),
                ('CMP-004', 'EMP-004', 'FIT_FOR_FOOD_PROCESSING', '2026-04-05', '2027-04-05', True, '2027-06-15', 'AB+', 'Sunil Nair (Brother)', '+91-98765-11223', 0),
                ('CMP-005', 'EMP-005', 'FIT_FOR_FOOD_PROCESSING', '2026-03-01', '2027-03-01', True, '2027-03-01', 'O-', 'Trần Lan Hương (Spouse)', '+84-983-445566', 0),
            ]
            for row in compliance_data:
                db_manager.execute_write(
                    "INSERT INTO employee_compliance (id, employee_id, medical_fitness_status, medical_check_date, medical_expiry_date, haccp_certified, haccp_cert_expiry, blood_group, emergency_contact_name, emergency_contact_phone, gmp_violations_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    list(row)
                )

        # Performance Goals & Reviews
        count = db_manager.execute_one("SELECT COUNT(*) as c FROM performance_goals", [])['c']
        if count == 0:
            goals = [
                ('PGL-001', 'EMP-001', 'Expand UAE & GCC Spice Consignment Contracts', 'Achieve $1.8M in Black Pepper & Cardamom export orders', 'Q3-2026', '$1.8M USD Invoices', 85, 'IN_PROGRESS'),
                ('PGL-002', 'EMP-002', 'FSSAI & ASTA Moisture Zero-Defect Rate', 'Maintain batch test rejection below 0.2% across Kochi lab tests', 'Q3-2026', '<0.2% Rejection', 95, 'COMPLETED'),
                ('PGL-003', 'EMP-003', 'Berth Turnaround Time Reduction', 'Reduce container loading & customs seal cycle to under 3.5 hrs', 'Q3-2026', '<3.5 hrs / TEU', 78, 'IN_PROGRESS'),
                ('PGL-004', 'EMP-004', 'Factory Workforce Attendance & Shift Compliance', 'Reach 96% shift attendance compliance across processing hubs', 'Q3-2026', '96% Compliance', 92, 'COMPLETED'),
                ('PGL-005', 'EMP-005', 'Cross-Border FX & VAT Reconciliation', 'Eliminate currency hedging mismatches in VND/INR trade ledgers', 'Q3-2026', 'Zero Variance', 88, 'IN_PROGRESS'),
            ]
            for row in goals:
                db_manager.execute_write(
                    "INSERT INTO performance_goals (id, employee_id, title, description, quarter, target_metric, progress_percent, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    list(row)
                )

        count = db_manager.execute_one("SELECT COUNT(*) as c FROM performance_reviews", [])['c']
        if count == 0:
            reviews = [
                ('REV-001', 'EMP-001', 'Vũ Thị Hoan', 'Annual Cycle 2025-26', 4.5, 4.7, 4.8, 'COMPLETED', 'Outstanding export sales performance in GCC markets. Recommended for promotion to Commercial Director.', 'Executive VP'),
                ('REV-002', 'EMP-002', 'Rajesh Sharma', 'Annual Cycle 2025-26', 4.8, 4.9, 4.7, 'COMPLETED', 'Exemplary leadership in ISO 22000 lab audit and chemical analysis reliability.', 'Plant Director'),
                ('REV-003', 'EMP-003', 'Nguyễn Văn Hùng', 'Annual Cycle 2025-26', 4.0, 4.2, 4.1, 'COMPLETED', 'Strong container logistics dispatch throughput at Hai Phong berth during peak shipping rush.', 'Logistics Head'),
                ('REV-004', 'EMP-004', 'Priya Nair', 'Annual Cycle 2025-26', 4.6, 4.7, 4.6, 'COMPLETED', 'Successfully implemented bi-national workforce payroll and plant shop floor compliance.', 'Executive VP'),
                ('REV-005', 'EMP-005', 'Trần Quốc Bảo', 'Annual Cycle 2025-26', 4.3, 4.4, 4.2, 'COMPLETED', 'Thorough audit execution across cross-border LC settlements.', 'Finance Controller'),
            ]
            for row in reviews:
                db_manager.execute_write(
                    "INSERT INTO performance_reviews (id, employee_id, employee_name, cycle, self_rating, manager_rating, potential_rating, status, feedback, reviewer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    list(row)
                )

        # Separation & Exits
        count = db_manager.execute_one("SELECT COUNT(*) as c FROM employee_exits", [])['c']
        if count == 0:
            exits = [
                ('EXT-001', 'EMP-005', 'Trần Quốc Bảo', 'Finance & Accounts', '2026-08-15', '2026-09-15', 30, 'Relocation to Singapore for family reasons', 'CLEARANCE_PENDING', True, False, True, 15, 6, 2850.0),
            ]
            for row in exits:
                db_manager.execute_write(
                    "INSERT INTO employee_exits (id, employee_id, employee_name, department, resignation_date, last_working_day, notice_days, reason, status, it_clearance, finance_clearance, admin_clearance, unpaid_salary_days, leave_encashment_days, settlement_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    list(row)
                )

        # Corporate Weekly Timesheets
        count = db_manager.execute_one("SELECT COUNT(*) as c FROM timesheets", [])['c']
        if count == 0:
            seed_timesheets = [
                ('TS-001', 'EMP-001', 'Vũ Thị Hoan', '2026-10-19', '2026-10-25', 'PRJ-EXP-01', 'Al Rawdah Dubai Export Shipment', 'Bill of lading prep & export documentation', 8.0, 7.0, 8.0, 6.0, 7.0, 0.0, 0.0, 36.0, 'SUBMITTED', 'Engagement Director', 'All shipment documents verified'),
                ('TS-002', 'EMP-001', 'Vũ Thị Hoan', '2026-10-19', '2026-10-25', 'PRJ-ADM-04', 'Corporate Admin & Weekly Sync', 'Bi-weekly commercial leadership meeting', 0.0, 1.0, 0.0, 2.0, 1.0, 0.0, 0.0, 4.0, 'SUBMITTED', 'Engagement Director', 'Regular operational overhead'),
                ('TS-003', 'EMP-002', 'Rajesh Sharma', '2026-10-19', '2026-10-25', 'PRJ-QA-02', 'ISO 22000 Spices Extraction Lab', 'Moisture & piperine laboratory batch testing', 8.0, 8.0, 8.0, 8.0, 8.0, 0.0, 0.0, 40.0, 'APPROVED', 'Plant Director', 'Compliant with standard lab hours'),
                ('TS-004', 'EMP-003', 'Nguyễn Văn Hùng', '2026-10-19', '2026-10-25', 'PRJ-OPS-03', 'Hai Phong Berth Logistics Hub', 'Container yard dispatch & seal verification', 8.0, 8.0, 8.0, 8.0, 8.0, 0.0, 0.0, 40.0, 'APPROVED', 'Logistics Head', 'Port berth shifts accounted'),
            ]
            for row in seed_timesheets:
                db_manager.execute_write(
                    "INSERT INTO timesheets (id, employee_id, employee_name, week_start, week_end, charge_code, project_name, task_desc, mon_hours, tue_hours, wed_hours, thu_hours, fri_hours, sat_hours, sun_hours, total_hours, status, approver, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    list(row)
                )


    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        raise e

