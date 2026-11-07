-- ==============================================================================
-- Green Campus V1: 12-Entity 3NF PostgreSQL Relational Database Schema
-- Institution: D. Y. Patil College of Engineering, Akurdi, Pune
-- Department: Artificial Intelligence and Data Science
-- ==============================================================================

-- 1. Roles Table (Locked: Student, Administrator, Maintenance_Staff)
CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL CHECK (role_name IN ('Student', 'Administrator', 'Maintenance_Staff')),
    description TEXT
);

-- 2. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    department_id SERIAL PRIMARY KEY,
    dept_name VARCHAR(100) UNIQUE NOT NULL,
    dept_type VARCHAR(30) NOT NULL CHECK (dept_type IN ('Academic', 'Maintenance', 'Administration')),
    contact_email VARCHAR(255)
);

-- 3. Users Table (Institutional Email + ID Verification)
CREATE TABLE IF NOT EXISTS users (
    user_id BIGSERIAL PRIMARY KEY,
    college_email VARCHAR(255) UNIQUE NOT NULL,
    student_or_staff_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(role_id),
    department_id INTEGER REFERENCES departments(department_id),
    academic_year VARCHAR(10),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Campus Locations Table
CREATE TABLE IF NOT EXISTS campus_locations (
    location_id SERIAL PRIMARY KEY,
    building_name VARCHAR(100) NOT NULL,
    floor_no VARCHAR(20) NOT NULL,
    room_or_area_type VARCHAR(50) NOT NULL CHECK (room_or_area_type IN ('Classroom','Laboratory','Washroom','Water_Cooler','Corridor','Canteen','Other')),
    room_code VARCHAR(50) NOT NULL,
    UNIQUE (building_name, floor_no, room_code)
);

-- 5. Issue Categories Table (8 Locked Categories)
CREATE TABLE IF NOT EXISTS issue_categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(80) UNIQUE NOT NULL CHECK (category_name IN ('Water','Electricity','Waste Management','Cleanliness','Sanitation','Infrastructure','Laboratory Equipment','Other')),
    default_dept_id INTEGER REFERENCES departments(department_id),
    description TEXT
);

-- 6. Issues Table
CREATE TABLE IF NOT EXISTS issues (
    issue_id BIGSERIAL PRIMARY KEY,
    reporter_id BIGINT NOT NULL REFERENCES users(user_id),
    category_id INTEGER NOT NULL REFERENCES issue_categories(category_id),
    location_id INTEGER NOT NULL REFERENCES campus_locations(location_id),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted','Assigned','In Progress','Resolved','Duplicate','Cancelled')),
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High','Critical')),
    assigned_dept_id INTEGER REFERENCES departments(department_id),
    assigned_to BIGINT REFERENCES users(user_id),
    upvote_count INTEGER NOT NULL DEFAULT 0 CHECK (upvote_count >= 0),
    student_confirmed_resolved BOOLEAN DEFAULT FALSE,
    student_feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

-- 7. Issue Upvotes Table (1 Upvote Per Student, Reporter Cannot Self-Upvote)
CREATE TABLE IF NOT EXISTS issue_upvotes (
    upvote_id BIGSERIAL PRIMARY KEY,
    issue_id BIGINT NOT NULL REFERENCES issues(issue_id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (issue_id, user_id)
);

-- 8. Issue Status History (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS issue_status_history (
    history_id BIGSERIAL PRIMARY KEY,
    issue_id BIGINT NOT NULL REFERENCES issues(issue_id) ON DELETE CASCADE,
    changed_by BIGINT NOT NULL REFERENCES users(user_id),
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    remarks TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Marketplace Categories Table (8 Academic Categories)
CREATE TABLE IF NOT EXISTS marketplace_categories (
    mkt_category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(80) UNIQUE NOT NULL,
    description TEXT
);

-- 10. Marketplace Listings Table (Donate, Sell, Exchange)
CREATE TABLE IF NOT EXISTS marketplace_listings (
    listing_id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL REFERENCES users(user_id),
    mkt_category_id INTEGER NOT NULL REFERENCES marketplace_categories(mkt_category_id),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    item_condition VARCHAR(30) NOT NULL CHECK (item_condition IN ('New','Like New','Good','Fair')),
    exchange_type VARCHAR(20) NOT NULL CHECK (exchange_type IN ('Donate','Sell','Exchange')),
    price_inr NUMERIC(10,2) DEFAULT 0.00 CHECK (price_inr >= 0),
    desired_exchange_item VARCHAR(200),
    image_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available','Requested','Exchanged','Withdrawn')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Exchange Requests Table
CREATE TABLE IF NOT EXISTS exchange_requests (
    request_id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES marketplace_listings(listing_id) ON DELETE CASCADE,
    requester_id BIGINT NOT NULL REFERENCES users(user_id),
    message TEXT,
    request_status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (request_status IN ('Pending','Accepted','Rejected','Cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (listing_id, requester_id)
);

-- 12. Exchange Transactions Table (Atomic Dual-Confirmation Gate)
CREATE TABLE IF NOT EXISTS exchange_transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT UNIQUE NOT NULL REFERENCES marketplace_listings(listing_id),
    request_id BIGINT UNIQUE NOT NULL REFERENCES exchange_requests(request_id),
    owner_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    requester_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    owner_confirmed_at TIMESTAMPTZ,
    requester_confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- B-Tree Performance Indexes
CREATE INDEX IF NOT EXISTS idx_issues_similar ON issues(category_id, location_id, status);
CREATE INDEX IF NOT EXISTS idx_issues_status_priority ON issues(status, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_listings_filter ON marketplace_listings(mkt_category_id, exchange_type, status);
