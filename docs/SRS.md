# Software Requirements Specification (SRS)
## DineEase — Smart Restaurant Reservation & Management System

| | |
|---|---|
| **Project** | DineEase |
| **Course** | CSE470 — Software Engineering, Spring 2026 |
| **Group** | Group 9, Section 13, BRAC University |
| **Document version** | 0.1 |
| **Status** | Baseline (update after every sprint) |

### Authors
| Name | Student ID |
|------|-----------|
| Provat Saha Pranto | 23301668 |
| B.M. Jaber Seam | 23301364 |
| Mushfique Nayeeb Ayon | 23101211 |
| Noor-E-Jannat | 23201509 |

### Revision history
| Version | Date | Description |
|---------|------|-------------|
| 0.1 | 2026-07-16 | Scope, users, features, architecture, database, class diagram, API baseline. |
| 0.2 | _tbd_ | Architecture/database/class-diagram refinements. |
| 0.3 | _tbd_ | Sprint 1 implementation screenshots. |
| 0.4 | _tbd_ | Sprint 2 updates. |
| 0.5 | _tbd_ | Sprint 3 updates. |
| 1.0 | _tbd_ | Complete final system. |

---

## Table of Contents
1. Introduction
2. Overall System Description
3. Functional Requirements (Authentication + F01–F20)
4. Non-functional Requirements
5. MVC Architecture
6. Class Diagram
7. Database Design
8. Tools and Technologies
9. System Compatibility
10. Implementation Screenshots
11. Testing
12. Challenges
13. Conclusion
14. References

---

## 1. Introduction

### 1.1 Purpose
This document specifies the requirements for **DineEase**, a full-stack web application
that digitises restaurant operations — reservations, menu, ordering, payment, billing,
loyalty, cleaning workflow, and administration — for customers, waiters, cleaners and admins.

### 1.2 Problem Statement
Traditional restaurants rely on manual reservation books, phone orders and paper bills.
This causes double-bookings, slow service, billing errors and no customer insight.
DineEase replaces these with a role-based digital platform.

### 1.3 Project Scope
DineEase provides table reservation with overlap prevention, menu browsing/search,
pre-ordering, simulated digital payment, invoicing, loyalty rewards, reviews,
in-site notifications, a structured cleaning workflow, staff/menu/table management,
an admin dashboard and sales/reservation reports.

### 1.4 Target Users
Customers, Waiters, Cleaners, Administrators.

### 1.5 Definitions and Terminology
| Term | Meaning |
|------|---------|
| MERN | MongoDB, Express, React, Node |
| MVC | Model–View–Controller |
| JWT | JSON Web Token |
| Pre-order | Food ordered together with a reservation |
| Blocking status | A reservation status that holds a table slot (pending/approved) |
| Simulated payment | Virtual bKash/Nagad flow with no real credentials |

---

## 2. Overall System Description

### 2.1 User Roles
- **Customer** — browse menu, reserve tables, pre-order, pay, review, earn loyalty, receive notifications.
- **Waiter** — approve/reject reservations, advance order status, complete dining (raise cleaning).
- **Cleaner** — process cleaning tasks (start → ready).
- **Admin** — manage menu/tables/staff; view dashboard and reports; all staff powers.

### 2.2 Product Perspective
A single-page React frontend consuming a REST API (Express) backed by MongoDB,
following strict MVC separation with JWT authentication and role-based authorization.

---

## 3. Functional Requirements

Each feature below lists: Primary actor · Description · Preconditions · Main flow ·
Alternative flows · Postconditions · Validation rules · Acceptance criteria ·
Related models · Related API endpoints · Screenshot.

### Authentication (mandatory module)
- **Primary actor:** All users.
- **Description:** Registration, login, logout, JWT issuance, protected routes, role authorization.
- **Preconditions:** For login, an active account exists.
- **Main flow:** User registers (customer) or is created by admin (staff) → logs in → receives JWT → accesses role-appropriate routes → logs out.
- **Alternative flows:** Invalid credentials → 401; disabled account → 403; duplicate email → 409.
- **Postconditions:** Authenticated session; password stored as bcrypt hash.
- **Validation rules:** Email format; password ≥ 6 chars; unique email.
- **Acceptance criteria:** Passwords never returned; protected routes reject missing/invalid tokens; roles enforced.
- **Related models:** User.
- **Endpoints:** `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET/PATCH /auth/me`, `PATCH /auth/password`.
- **Screenshot:** _[login & register screens]_

### F01 — Restaurant Menu
- **Primary actor:** Customer. **Owner:** Provat.
- **Description:** Browse the full menu (name, category, price, description, image, availability).
- **Preconditions:** Menu items seeded/created.
- **Main flow:** Customer opens Menu → sees paginated dish cards grouped by category.
- **Alternative flows:** Empty menu → empty state.
- **Postconditions:** None (read-only).
- **Validation rules:** Query params validated (page/limit).
- **Acceptance criteria:** All available fields shown; availability indicated.
- **Related models:** MenuItem, MenuCategory.
- **Endpoints:** `GET /menu-items`, `GET /menu-items/:id`, `GET /categories`.
- **Screenshot:** _[menu grid]_

### F02 — Search and Filter Menu
- **Primary actor:** Customer. **Owner:** Provat.
- **Description:** Search by name; filter by category, price, availability; sort.
- **Main flow:** Customer types a query / selects filters → list updates (debounced).
- **Alternative flows:** No matches → empty state.
- **Validation rules:** Numeric price filters; known sort keys.
- **Acceptance criteria:** Combined filters narrow results correctly.
- **Related models:** MenuItem.
- **Endpoints:** `GET /menu-items?search=&category=&minPrice=&maxPrice=&available=&sort=`.
- **Screenshot:** _[filtered menu]_

### F03 — Table Reservation
- **Primary actor:** Customer. **Owner:** Ayon.
- **Description:** Reserve a table by date, time, guests, seating preference and available table; prevent invalid/overlapping bookings.
- **Preconditions:** Authenticated customer; an available table.
- **Main flow:** Customer picks date/time/guests → system lists available tables (F08) → customer selects a table (optionally pre-orders, F05) → reservation created as `pending`.
- **Alternative flows:** Overlapping slot → 409; guests > capacity → 400; past time → 400.
- **Postconditions:** Reservation stored; optional order attached.
- **Validation rules:** Valid date/time; guests ≥ 1 ≤ capacity; no overlap with blocking reservations.
- **Acceptance criteria:** Double-booking impossible (verified by test).
- **Related models:** Reservation, RestaurantTable, Order.
- **Endpoints:** `POST /reservations`.
- **Screenshot:** _[booking form]_

### F04 — Reservation History
- **Primary actor:** Customer. **Owner:** Ayon.
- **Description:** View own reservations (pending/approved/rejected/cancelled/completed).
- **Main flow:** Customer opens Reservations → history table with statuses; cancel pending/approved; review completed.
- **Validation rules:** Ownership enforced.
- **Acceptance criteria:** Only the customer's reservations are visible.
- **Related models:** Reservation.
- **Endpoints:** `GET /reservations/my?status=`, `PATCH /reservations/:id/cancel`.
- **Screenshot:** _[history table]_

### F05 — Pre-order Food
- **Primary actor:** Customer. **Owner:** Ayon.
- **Description:** Pre-order food while creating/managing a reservation (dine-in/takeaway, quantity, price calculation).
- **Main flow:** Customer adds items with quantities → subtotal computed → order attached to reservation.
- **Alternative flows:** Unavailable item → 400; quantity < 1 → 400.
- **Validation rules:** Items exist and are available; positive integer quantities.
- **Acceptance criteria:** Subtotal equals Σ(unitPrice × quantity).
- **Related models:** Order, OrderItem, MenuItem, Reservation.
- **Endpoints:** `POST /orders`, `POST /reservations` (with items).
- **Screenshot:** _[pre-order selector]_

### F06 — Favourite Menu Items
- **Primary actor:** Customer. **Owner:** Provat.
- **Description:** Add/remove/view favourite dishes.
- **Validation rules:** No duplicate favourite (unique index).
- **Acceptance criteria:** Toggling heart persists across sessions.
- **Related models:** Favourite, MenuItem.
- **Endpoints:** `GET /favourites`, `POST /favourites`, `DELETE /favourites/:menuItemId`.
- **Screenshot:** _[favourites page]_

### F07 — Customer Reviews and Ratings
- **Primary actor:** Customer. **Owner:** Provat.
- **Description:** Submit a rating + comment after a completed reservation.
- **Preconditions:** Reservation is `completed` and owned by the customer.
- **Alternative flows:** Duplicate review → 409; not completed → 400; not owner → 403.
- **Validation rules:** Rating 1–5; one review per reservation.
- **Acceptance criteria:** Average rating recalculated; unauthorized reviews blocked.
- **Related models:** Review, Reservation.
- **Endpoints:** `GET /reviews`, `GET /reviews/my`, `POST /reviews`.
- **Screenshot:** _[review modal & feed]_

### F08 — Real-time Table Availability
- **Primary actor:** Customer/Staff. **Owner:** Noor.
- **Description:** Show tables free for a requested window (capacity + preference + no overlap).
- **Main flow:** Requestor supplies date/time/guests → system returns non-overlapping active tables.
- **Validation rules:** Valid date/time; excludes disabled tables and blocking reservations.
- **Acceptance criteria:** A booked slot never appears as available.
- **Related models:** RestaurantTable, Reservation.
- **Endpoints:** `GET /tables/available`.
- **Screenshot:** _[availability list]_

### F09 — Reservation Approval
- **Primary actor:** Waiter/Admin. **Owner:** Noor.
- **Description:** Approve or reject pending reservations; notify the customer.
- **Alternative flows:** Non-pending → 400; slot already approved → 409.
- **Validation rules:** Only pending reservations; re-check overlap on approve.
- **Acceptance criteria:** Approval sets table `reserved` and notifies customer.
- **Related models:** Reservation, RestaurantTable, Notification.
- **Endpoints:** `GET /reservations`, `PATCH /reservations/:id/approve`, `PATCH /reservations/:id/reject`.
- **Screenshot:** _[approvals table]_

### F10 — Order Status Tracking
- **Primary actor:** Customer (track), Waiter/Admin (update). **Owner:** Noor.
- **Description:** Advance orders through placed → preparing → ready → served → completed (or cancelled); customers track progress.
- **Alternative flows:** Illegal transition → 400.
- **Validation rules:** State machine `ORDER_STATUS_FLOW`.
- **Acceptance criteria:** Only legal transitions allowed; customer notified on change.
- **Related models:** Order, Notification.
- **Endpoints:** `GET /orders/my`, `GET /orders`, `PATCH /orders/:id/status`.
- **Screenshot:** _[order queue & tracking]_

### F11 — In-site Notification System
- **Primary actor:** All users. **Owner:** Noor.
- **Description:** Notify users of approvals/rejections, order status, payment success, invoices, table-ready, cleaning completion, loyalty updates.
- **Validation rules:** Users read only their own notifications.
- **Acceptance criteria:** Unread count accurate; mark-read works.
- **Related models:** Notification.
- **Endpoints:** `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`.
- **Screenshot:** _[notification bell dropdown]_

### F12 — Menu Management
- **Primary actor:** Admin. **Owner:** Jaber.
- **Description:** Add/edit/delete/disable menu items; manage categories; update availability.
- **Alternative flows:** Delete category in use → 409; bad category → 400.
- **Validation rules:** Name/price/category validated.
- **Acceptance criteria:** Changes reflected immediately in the customer menu.
- **Related models:** MenuItem, MenuCategory.
- **Endpoints:** `POST/PATCH/DELETE /menu-items`, `/menu-items/:id/availability`, `POST/PATCH/DELETE /categories`.
- **Screenshot:** _[menu management]_

### F13 — Table Management
- **Primary actor:** Admin. **Owner:** Jaber.
- **Description:** Add/update/disable tables; set capacity, seating preference, status.
- **Validation rules:** Unique table number; capacity 1–20.
- **Acceptance criteria:** Disabled tables never offered for booking.
- **Related models:** RestaurantTable.
- **Endpoints:** `GET/POST /tables`, `PATCH /tables/:id`, `/tables/:id/disable`, `/tables/:id/enable`.
- **Screenshot:** _[table management]_

### F14 — Staff Management
- **Primary actor:** Admin. **Owner:** Jaber.
- **Description:** Create staff accounts, update info, disable accounts, assign waiter/cleaner roles, view staff.
- **Alternative flows:** Duplicate email → 409; self-disable → 400.
- **Validation rules:** Staff roles only; valid email/password.
- **Acceptance criteria:** Disabled staff cannot log in.
- **Related models:** User.
- **Endpoints:** `GET/POST /staff`, `PATCH /staff/:id`, `/staff/:id/disable`, `/staff/:id/enable`.
- **Screenshot:** _[staff management]_

### F15 — Table Cleaning Workflow
- **Primary actor:** Waiter (raise), Cleaner (process). **Owner:** Noor.
- **Description:** Waiter completes dining → table Cleaning Pending + task created → cleaner starts (Cleaning) → marks ready → table Available.
- **Alternative flows:** Wrong status transition → 400.
- **Validation rules:** Ordered status progression pending → in_progress → done.
- **Acceptance criteria:** Table auto-returns to Available; waiter notified.
- **Related models:** CleaningTask, RestaurantTable, Reservation, Notification.
- **Endpoints:** `PATCH /cleaning/reservations/:id/complete`, `GET /cleaning/tasks`, `/cleaning/tasks/:id/start`, `/cleaning/tasks/:id/ready`.
- **Screenshot:** _[cleaning queue]_

### F16 — Digital Payment Integration
- **Primary actor:** Customer. **Owner:** Ayon.
- **Description:** Simulated bKash/Nagad payment with method, transaction ref, status, total, success/failure simulation.
- **Alternative flows:** Simulated failure → 400 (payment `failed`); already paid → 409.
- **Validation rules:** Valid method; non-negative amount; loyalty redemption validated.
- **Acceptance criteria:** Success marks order paid, generates invoice, earns loyalty.
- **Related models:** Payment, Order, LoyaltyTransaction.
- **Endpoints:** `POST /payments`, `GET /payments/my`.
- **Screenshot:** _[checkout modal]_

### F17 — Digital Invoice
- **Primary actor:** Customer. **Owner:** Ayon.
- **Description:** After successful payment, generate a viewable/downloadable invoice (customer, reservation, items, quantities, prices, subtotal, VAT, total, method, ref, date).
- **Validation rules:** Ownership enforced; snapshot immutable.
- **Acceptance criteria:** Invoice totals equal subtotal − discount + VAT.
- **Related models:** Invoice, Payment, Order.
- **Endpoints:** `GET /invoices/my`, `GET /invoices/:id`.
- **Screenshot:** _[invoice document]_

### F18 — Admin Dashboard
- **Primary actor:** Admin. **Owner:** Jaber.
- **Description:** Show today's/pending/approved reservations, occupied/available/cleaning tables, orders in progress, revenue, customer & staff counts.
- **Acceptance criteria:** Figures match underlying collections.
- **Related models:** Reservation, RestaurantTable, Order, Payment, User.
- **Endpoints:** `GET /admin/dashboard`.
- **Screenshot:** _[dashboard]_

### F19 — Sales and Reservation Reports
- **Primary actor:** Admin. **Owner:** Jaber.
- **Description:** Daily/weekly/monthly reports: revenue, reservation count, most-ordered foods, peak hours, order count, payment-method usage.
- **Acceptance criteria:** Aggregates match the selected period.
- **Related models:** Payment, Order, Reservation.
- **Endpoints:** `GET /admin/reports?period=`.
- **Screenshot:** _[reports]_

### F20 — Customer Loyalty and Reward Points
- **Primary actor:** Customer. **Owner:** Provat.
- **Description:** Earn points on successful payments; view balance/history; redeem points for discounts; prevent invalid redemption.
- **Alternative flows:** Redeem > balance → 400; discount > payable → 400.
- **Validation rules:** Integer points; sufficient balance; ledger with running balance.
- **Acceptance criteria:** Balance and history reconcile with transactions.
- **Related models:** LoyaltyTransaction, User, Payment.
- **Endpoints:** `GET /loyalty` (redemption via `POST /payments`).
- **Screenshot:** _[loyalty page]_

---

## 4. Non-functional Requirements
- **Security:** bcrypt password hashing; JWT verification; role checks; ID validation; ownership enforcement; secrets in env.
- **Performance:** Indexed queries; pagination on menu; debounced search.
- **Usability:** Consistent loading/empty/error/success states; responsive layout.
- **Maintainability:** MVC separation; services for business logic; centralised error handling; consistent response format.
- **Reliability:** Validated state transitions; overlap prevention; idempotent seeding.
- **Portability:** Runs on Node `^20.19.0 || >=22.12.0` (required by Vite 8) with MongoDB (local or Atlas).

## 5. MVC Architecture
See `README.md` (MVC section) and the request-flow pipeline: View → route → validation →
auth → role → controller → service/model → MongoDB → response → View.

## 6. Class Diagram
See `docs/class-diagram.md` (software-generated Mermaid diagram).

## 7. Database Design
See `docs/database-design.md` (collections, fields, types, enums, indexes, validation).

## 8. Tools and Technologies
MongoDB, Express.js, React.js (Vite), Node.js, Mongoose, JWT, bcryptjs,
express-validator, axios, react-router-dom, Jest, Supertest, mongodb-memory-server.

## 9. System Compatibility
Modern browsers (Chrome, Edge, Firefox). Backend on Windows/Linux/macOS with Node `^20.19.0 || >=22.12.0`.

## 10. Implementation Screenshots
_Insert captured screenshots per feature (placeholders marked above) during each sprint._

## 11. Testing
Automated (Jest + Supertest + in-memory MongoDB) covering authentication, validation,
protected routes, reservation creation and double-booking prevention. Manual end-to-end
testing for full flows (booking → approval → order → payment → invoice → loyalty).
Expand per §16 as sprints progress.

## 12. Challenges
- Preventing overlapping reservations via time-window queries.
- Coordinating payment → invoice → loyalty as one consistent flow.
- Enforcing valid order/cleaning state transitions.
- Role-based access across four roles.

## 13. Conclusion
DineEase delivers a complete, MVC-structured MERN system covering all 20 features and a
robust authentication module, ready for sprint demonstrations and viva.

## 14. References
- Course materials (CSE470, BRAC University).
- MongoDB, Express, React, Node, Mongoose official documentation.
- JWT (RFC 7519).
