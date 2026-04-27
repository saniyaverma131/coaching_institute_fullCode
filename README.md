# Smart Coaching Institute Management System

Full-stack project aligned with your presentation: **coaching institute** problem domain, **Admin / Teacher / Student** roles, **timetable**, **notes upload & download**, **fees / payments / receipts**, **notifications**, **certificates**, **attendance**, **marks**, **assignments**, **notices**, and **course + batch** structure (class diagram / ER / DFD themes).

| Layer | Stack |
|--------|--------|
| Frontend | React (Vite), React Router |
| Backend | Node.js, Express |
| ORM | **Sequelize** (MySQL dialect) |
| Database | **MySQL** 8.x (manage with **DBeaver**) |

Repository layout:

- `frontend/` — React SPA (port **5173** in dev, proxies `/api` → backend)
- `backend/` — REST API + Sequelize models (port **5000**)
- `database/schema.sql` — **authoritative** MySQL DDL (same script duplicated below for a single-document report)

---

## 1. DBeaver: create connection and database

1. Open **DBeaver** → **Database** → **New Database Connection** → **MySQL**.
2. Set **Host** (often `localhost`), **Port** `3306`, **Username** / **Password** (e.g. `root` and your password).
3. **Test Connection** → Finish.
4. Open an **SQL Editor** on the server (or on a database), then run the **full script** in section 3 below (or **SQL Editor** → load file `database/schema.sql` → **Execute SQL Script**).

The database name used everywhere is: **`coaching_institute`**.

### Optional: dedicated MySQL user (recommended)

```sql
CREATE USER 'coaching_app'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON coaching_institute.* TO 'coaching_app'@'localhost';
FLUSH PRIVILEGES;
```

Use the same credentials in `backend/.env` (`DB_USER`, `DB_PASSWORD`).

---

## 2. Sequelize connection (Node backend)

Copy the example env file and edit values to match DBeaver:

```bash
cd backend
cp .env.example .env
```

| Variable | Meaning |
|----------|---------|
| `DB_HOST` | MySQL host (e.g. `127.0.0.1`) |
| `DB_PORT` | `3306` |
| `DB_NAME` | `coaching_institute` |
| `DB_USER` / `DB_PASSWORD` | Same as in DBeaver |
| `JWT_SECRET` | Long random string (production) |
| `PORT` | API port, default `5000` |

Sequelize is configured in `backend/src/config/database.js` with:

- `dialect: 'mysql'`
- `define.underscored: true` and explicit `created_at` / `updated_at` to match the SQL column names.

**Models ↔ tables** (under `backend/src/models/`):

| Sequelize model | MySQL table |
|-----------------|-------------|
| `User` | `users` |
| `Course` | `courses` |
| `Batch` | `batches` |
| `Enrollment` | `enrollments` |
| `TimetableEntry` | `timetable_entries` |
| `Note` | `notes` |
| `Assignment` | `assignments` |
| `Notice` | `notices` |
| `Invoice` | `invoices` |
| `Payment` | `payments` |
| `Notification` | `notifications` |
| `Certificate` | `certificates` |
| `Attendance` | `attendances` |
| `Mark` | `marks` |

Associations are wired in `backend/src/models/index.js`.

---

## 3. Full MySQL DDL (same as `database/schema.sql`)

Run this entire block in DBeaver (or execute the file `database/schema.sql`).

```sql
-- =============================================================================
-- Smart Coaching Institute Management System — MySQL schema
-- Run in DBeaver: create database first, then execute this script on that database.
-- Charset: utf8mb4 for full Unicode (names, notices).
-- =============================================================================

CREATE DATABASE IF NOT EXISTS coaching_institute
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE coaching_institute;

-- -----------------------------------------------------------------------------
-- users: single table for Admin, Teacher, Student (role-based)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'teacher', 'student') NOT NULL,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(40) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- courses (class diagram: course name, duration, fees)
-- -----------------------------------------------------------------------------
CREATE TABLE courses (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  description TEXT NULL,
  duration_text VARCHAR(120) NULL,
  fee_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- batches: a course offering with schedule, teacher, capacity (class diagram)
-- -----------------------------------------------------------------------------
CREATE TABLE batches (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id INT UNSIGNED NOT NULL,
  teacher_id INT UNSIGNED NULL,
  name VARCHAR(120) NOT NULL,
  schedule_text VARCHAR(255) NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  capacity INT UNSIGNED NOT NULL DEFAULT 30,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_batches_course (course_id),
  KEY idx_batches_teacher (teacher_id),
  CONSTRAINT fk_batches_course FOREIGN KEY (course_id) REFERENCES courses (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_batches_teacher FOREIGN KEY (teacher_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- enrollments: student ↔ batch
-- -----------------------------------------------------------------------------
CREATE TABLE enrollments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id INT UNSIGNED NOT NULL,
  batch_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_enrollment_student_batch (student_id, batch_id),
  KEY idx_enrollments_batch (batch_id),
  CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_enrollments_batch FOREIGN KEY (batch_id) REFERENCES batches (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- timetable_entries: admin-managed slots (ER / DFD: timetable)
-- -----------------------------------------------------------------------------
CREATE TABLE timetable_entries (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  batch_id INT UNSIGNED NOT NULL,
  day_of_week TINYINT UNSIGNED NOT NULL COMMENT '0=Sunday .. 6=Saturday',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject VARCHAR(120) NOT NULL,
  room VARCHAR(80) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_timetable_batch (batch_id),
  CONSTRAINT fk_timetable_batch FOREIGN KEY (batch_id) REFERENCES batches (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- notes: teacher upload, student download (functional requirements)
-- -----------------------------------------------------------------------------
CREATE TABLE notes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id INT UNSIGNED NOT NULL,
  uploaded_by INT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notes_course (course_id),
  KEY idx_notes_uploader (uploaded_by),
  CONSTRAINT fk_notes_course FOREIGN KEY (course_id) REFERENCES courses (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_notes_uploader FOREIGN KEY (uploaded_by) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- assignments (proposed solution: digital assignments)
-- -----------------------------------------------------------------------------
CREATE TABLE assignments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id INT UNSIGNED NOT NULL,
  created_by INT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  due_date DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_assignments_course (course_id),
  CONSTRAINT fk_assignments_course FOREIGN KEY (course_id) REFERENCES courses (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_assignments_creator FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- notices: faculty / admin (DFD)
-- -----------------------------------------------------------------------------
CREATE TABLE notices (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  author_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notices_author (author_id),
  CONSTRAINT fk_notices_author FOREIGN KEY (author_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- invoices + payments (fees, receipts, online payment flow)
-- -----------------------------------------------------------------------------
CREATE TABLE invoices (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id INT UNSIGNED NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  status ENUM('pending', 'paid', 'overdue') NOT NULL DEFAULT 'pending',
  due_date DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_invoices_student (student_id),
  KEY idx_invoices_course (course_id),
  CONSTRAINT fk_invoices_student FOREIGN KEY (student_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_invoices_course FOREIGN KEY (course_id) REFERENCES courses (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  invoice_id INT UNSIGNED NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(80) NOT NULL DEFAULT 'online',
  receipt_number VARCHAR(40) NOT NULL,
  paid_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_receipt (receipt_number),
  KEY idx_payments_invoice (invoice_id),
  CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- notifications (instant updates)
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user (user_id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- certificates: admin issues, student downloads (DFD / flowchart)
-- -----------------------------------------------------------------------------
CREATE TABLE certificates (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id INT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  issued_by INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_certificates_student (student_id),
  CONSTRAINT fk_certificates_student FOREIGN KEY (student_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_certificates_issuer FOREIGN KEY (issued_by) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- attendance (sequence / methodology diagram)
-- -----------------------------------------------------------------------------
CREATE TABLE attendances (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id INT UNSIGNED NOT NULL,
  batch_id INT UNSIGNED NOT NULL,
  class_date DATE NOT NULL,
  status ENUM('present', 'absent', 'late') NOT NULL DEFAULT 'absent',
  recorded_by INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_attendance_student_batch_date (student_id, batch_id, class_date),
  KEY idx_attendances_batch (batch_id),
  CONSTRAINT fk_attendances_student FOREIGN KEY (student_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_attendances_batch FOREIGN KEY (batch_id) REFERENCES batches (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_attendances_teacher FOREIGN KEY (recorded_by) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- marks (sequence diagram)
-- -----------------------------------------------------------------------------
CREATE TABLE marks (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id INT UNSIGNED NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  exam_title VARCHAR(120) NOT NULL,
  score DECIMAL(8, 2) NOT NULL,
  max_score DECIMAL(8, 2) NOT NULL DEFAULT 100.00,
  recorded_by INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_marks_student (student_id),
  KEY idx_marks_course (course_id),
  CONSTRAINT fk_marks_student FOREIGN KEY (student_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_marks_course FOREIGN KEY (course_id) REFERENCES courses (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_marks_teacher FOREIGN KEY (recorded_by) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Extra verification queries

See `database/verify_queries.sql` for row counts and a sample join.

---

## 4. Seed demo users and sample data (bcrypt passwords)

After tables exist:

```bash
cd backend
npm install
npm run seed
```

Demo logins (change in production):

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@coaching.local` | `admin123` |
| Teacher | `teacher@coaching.local` | `teacher123` |
| Student | `student@coaching.local` | `student123` |

The seed creates a course, batch, enrollment, sample timetable rows, a pending invoice for the demo student, and a welcome notice. Students can also **self-register** from the React **Register** page (`POST /api/auth/register`).

---

## 5. Run the API and the React app

Terminal 1 — backend:

```bash
cd backend
npm run dev
```

Check: `http://localhost:5000/api/health` should return `{ "ok": true, "database": "connected" }`.

Terminal 2 — frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`, log in as admin/teacher/student, and use the role-specific sections on the dashboard.

**Uploads:** note and certificate files are stored under `backend/uploads/` and served read-only at `/uploads/...` (metadata in MySQL).

---

## 6. Security notes (non-functional requirements)

- Passwords are stored as **bcrypt** hashes only.
- API uses **JWT** (`Authorization: Bearer <token>`) on protected routes.
- **CORS** is open in development; restrict `origin` in production.
- Payment flow is a **demo** (no real gateway); swap `POST /api/student/pay` for Razorpay/Stripe in a real deployment.

---

## 7. Clean reinstall of the database

In DBeaver, to wipe and recreate:

```sql
DROP DATABASE IF EXISTS coaching_institute;
```

Then run section 3 again, run `npm run seed`, and restart the backend.

---

Older placeholder projects (`project-ii-student-hub`, `project-ppt23-inventory`) were **removed**; this repository now contains a **single** coherent system matching your coaching-institute specification.
