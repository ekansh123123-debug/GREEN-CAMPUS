-- ==============================================================================
-- Green Campus V1 - Initial Seed Data
-- ==============================================================================

-- 1. Insert 3 Canonical Roles
INSERT INTO roles (role_id, role_name, description) VALUES
(1, 'Student', 'Enrolled college student with issue reporting and resource exchange permissions'),
(2, 'Administrator', 'Campus administrative authority for issue triage, staff assignment, and analytics'),
(3, 'Maintenance_Staff', 'Campus operational personnel assigned to resolve physical infrastructure tickets')
ON CONFLICT (role_id) DO NOTHING;

-- 2. Insert Departments
INSERT INTO departments (department_id, dept_name, dept_type, contact_email) VALUES
(1, 'Department of Artificial Intelligence & Data Science', 'Academic', 'aids@dypcoeakurdi.ac.in'),
(2, 'Department of Computer Engineering', 'Academic', 'comp@dypcoeakurdi.ac.in'),
(3, 'Department of Mechanical Engineering', 'Academic', 'mech@dypcoeakurdi.ac.in'),
(4, 'Department of Civil Engineering', 'Academic', 'civil@dypcoeakurdi.ac.in'),
(5, 'Department of Electrical Engineering', 'Academic', 'electrical@dypcoeakurdi.ac.in'),
(6, 'Estate & General Maintenance Office', 'Maintenance', 'maintenance@dypcoeakurdi.ac.in'),
(7, 'Electrical & Power Maintenance Section', 'Maintenance', 'electrical.maint@dypcoeakurdi.ac.in'),
(8, 'Sanitation & Housekeeping Cell', 'Maintenance', 'housekeeping@dypcoeakurdi.ac.in'),
(9, 'Campus Administration & Registrar Office', 'Administration', 'admin@dypcoeakurdi.ac.in')
ON CONFLICT (department_id) DO NOTHING;

-- 3. Insert 8 Locked Issue Categories (with default maintenance department routing)
INSERT INTO issue_categories (category_id, category_name, default_dept_id, description) VALUES
(1, 'Water', 6, 'Water coolers, drinking supply, pipeline leakages, washroom taps'),
(2, 'Electricity', 7, 'Power failures, flickering lights, exposed wiring, faulty switchboards, fans'),
(3, 'Waste Management', 8, 'Dustbin overflow, littering, non-segregated waste, compost maintenance'),
(4, 'Cleanliness', 8, 'Dirty classrooms, unwashed corridor floors, dust accumulation'),
(5, 'Sanitation', 8, 'Washroom hygiene, soap dispensers, clogged drainage, foul odor'),
(6, 'Infrastructure', 6, 'Broken benches, cracked floor tiles, damaged doors, window glass, railings'),
(7, 'Laboratory Equipment', 1, 'Faulty computer monitors, loose LAN cables, broken apparatus, defective instruments'),
(8, 'Other', 6, 'General campus maintenance issues not covered by above specific categories')
ON CONFLICT (category_id) DO NOTHING;

-- 4. Insert 8 Marketplace Categories
INSERT INTO marketplace_categories (mkt_category_id, category_name, description) VALUES
(1, 'Textbooks', 'Prescribed academic curriculum textbooks for engineering departments'),
(2, 'Reference Books', 'Higher-level reference books, research manuals, handbook collections'),
(3, 'Notes', 'Handwritten or typed lecture notes, exam preparation summaries'),
(4, 'Calculators', 'Approved scientific calculators (e.g., Casio fx-991MS / ES Plus)'),
(5, 'Drawing Instruments', 'Engineering drawing drafter kits, compass sets, roll-n-draw rulers'),
(6, 'Lab Equipment', 'Breadboards, multimeter sets, Arduino/Raspberry Pi boards, lab coats'),
(7, 'Electronics', 'USB cables, display adapters, power banks, keyboards, mice'),
(8, 'Stationery', 'Files, unused notebooks, graph pads, workshop record sheets')
ON CONFLICT (mkt_category_id) DO NOTHING;

-- 5. Insert Sample Campus Locations
INSERT INTO campus_locations (location_id, building_name, floor_no, room_or_area_type, room_code) VALUES
(1, 'Building A', 'Floor 1', 'Classroom', 'A-101'),
(2, 'Building A', 'Floor 1', 'Washroom', 'A-102-WR'),
(3, 'Building A', 'Floor 2', 'Water_Cooler', 'A-201-WC'),
(4, 'Building A', 'Floor 2', 'Laboratory', 'A-204-AIDS'),
(5, 'Building B', 'Floor 1', 'Corridor', 'B-100-COR'),
(6, 'Building B', 'Floor 2', 'Classroom', 'B-205'),
(7, 'Main Workshop Building', 'Ground Floor', 'Laboratory', 'WS-GF-01'),
(8, 'Central Library Building', 'Floor 1', 'Other', 'LIB-READING-HALL')
ON CONFLICT (building_name, floor_no, room_code) DO NOTHING;
