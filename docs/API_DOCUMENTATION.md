# DineEase API Documentation

This document outlines the primary REST API endpoints available in the DineEase backend.

## Base URL
All API endpoints are prefixed with `/api/v1` (e.g., `http://localhost:5000/api/v1`).

---

## 1. Authentication (`/auth`)

| Method | Endpoint | Description | Auth Required | Allowed Roles |
|--------|----------|-------------|---------------|---------------|
| POST | `/auth/register` | Register a new customer account | No | Any |
| POST | `/auth/login` | Log in and receive a JWT | No | Any |
| POST | `/auth/logout` | Log out and invalidate token | Yes | Any |
| GET | `/auth/me` | Get current user profile | Yes | Any |

---

## 2. Menu (`/menu-items`, `/categories`)

| Method | Endpoint | Description | Auth Required | Allowed Roles |
|--------|----------|-------------|---------------|---------------|
| GET | `/menu-items` | Get all menu items with search/filter | No | Any |
| GET | `/menu-items/:id` | Get single menu item details | No | Any |
| POST | `/menu-items` | Create a new menu item | Yes | Admin |
| PUT | `/menu-items/:id` | Update an existing menu item | Yes | Admin |
| DELETE | `/menu-items/:id` | Delete a menu item | Yes | Admin |
| GET | `/categories` | Get all menu categories | No | Any |

---

## 3. Tables (`/tables`)

| Method | Endpoint | Description | Auth Required | Allowed Roles |
|--------|----------|-------------|---------------|---------------|
| GET | `/tables` | Get all tables and their statuses | Yes | Admin, Staff |
| GET | `/tables/availability` | Check table availability | No | Any |
| POST | `/tables` | Add a new table | Yes | Admin |
| PUT | `/tables/:id` | Update table details/status | Yes | Admin, Staff |
| DELETE | `/tables/:id` | Remove a table | Yes | Admin |

---

## 4. Reservations (`/reservations`)

| Method | Endpoint | Description | Auth Required | Allowed Roles |
|--------|----------|-------------|---------------|---------------|
| GET | `/reservations/history` | Get user's reservation history | Yes | Customer |
| GET | `/reservations` | Get all reservations | Yes | Admin, Staff |
| POST | `/reservations` | Create a new reservation | Yes | Customer |
| PUT | `/reservations/:id/status` | Approve, reject, or update status | Yes | Admin, Staff |
| PUT | `/reservations/:id/preorder` | Add pre-order food to reservation | Yes | Customer |
| DELETE | `/reservations/:id` | Cancel a reservation | Yes | Customer, Admin |

---

## 5. Orders (`/orders`)

| Method | Endpoint | Description | Auth Required | Allowed Roles |
|--------|----------|-------------|---------------|---------------|
| GET | `/orders` | Get all active orders | Yes | Admin, Staff |
| GET | `/orders/:id` | Get specific order details | Yes | Any |
| POST | `/orders` | Create a new direct order | Yes | Customer, Staff |
| PUT | `/orders/:id/status` | Update order status (Preparing, Served) | Yes | Staff |

---

## 6. Favourites (`/favourites`)

| Method | Endpoint | Description | Auth Required | Allowed Roles |
|--------|----------|-------------|---------------|---------------|
| GET | `/favourites` | Get user's favorite menu items | Yes | Customer |
| POST | `/favourites/:itemId` | Add item to favorites | Yes | Customer |
| DELETE | `/favourites/:itemId` | Remove item from favorites | Yes | Customer |

---

## 7. Reviews (`/reviews`)

| Method | Endpoint | Description | Auth Required | Allowed Roles |
|--------|----------|-------------|---------------|---------------|
| GET | `/reviews` | Get all reviews | No | Any |
| POST | `/reviews` | Submit a new review | Yes | Customer |
| DELETE | `/reviews/:id` | Delete a review | Yes | Admin |

---

## 8. Notifications (`/notifications`)

| Method | Endpoint | Description | Auth Required | Allowed Roles |
|--------|----------|-------------|---------------|---------------|
| GET | `/notifications` | Get user's notifications | Yes | Any |
| PUT | `/notifications/:id/read` | Mark notification as read | Yes | Any |

---

## 9. Cleaning (`/cleaning`)

| Method | Endpoint | Description | Auth Required | Allowed Roles |
|--------|----------|-------------|---------------|---------------|
| GET | `/cleaning` | Get all table cleaning tasks | Yes | Staff, Admin |
| POST | `/cleaning` | Assign a cleaning task | Yes | Admin, Staff |
| PUT | `/cleaning/:id/complete` | Mark a cleaning task as completed | Yes | Staff |

---

## 10. Staff (`/staff`)

| Method | Endpoint | Description | Auth Required | Allowed Roles |
|--------|----------|-------------|---------------|---------------|
| GET | `/staff` | Get all staff members | Yes | Admin |
| POST | `/staff` | Create a new staff account | Yes | Admin |
| PUT | `/staff/:id` | Update staff details | Yes | Admin |
| DELETE | `/staff/:id` | Deactivate staff account | Yes | Admin |

---

## 11. Payments & Refunds (`/payments`, `/refunds`, `/invoices`)

| Method | Endpoint | Description | Auth Required | Allowed Roles |
|--------|----------|-------------|---------------|---------------|
| POST | `/payments/process` | Process a simulated digital payment | Yes | Customer |
| GET | `/invoices/:id` | Get digital invoice details | Yes | Customer, Admin |
| POST | `/refunds/request` | Request a refund for an order/reservation | Yes | Customer |
| PUT | `/refunds/:id/process` | Approve and process a refund | Yes | Admin |

---

## 12. Loyalty (`/loyalty`)

| Method | Endpoint | Description | Auth Required | Allowed Roles |
|--------|----------|-------------|---------------|---------------|
| GET | `/loyalty/points` | Get user's current loyalty point balance | Yes | Customer |
| POST | `/loyalty/redeem` | Redeem points for a discount | Yes | Customer |

---

## 13. Admin Dashboard & Reports (`/admin`)

| Method | Endpoint | Description | Auth Required | Allowed Roles |
|--------|----------|-------------|---------------|---------------|
| GET | `/admin/dashboard` | Get high-level dashboard metrics | Yes | Admin |
| GET | `/admin/reports/sales` | Generate detailed sales report | Yes | Admin |
| GET | `/admin/reports/reservations` | Generate reservation analytics report | Yes | Admin |

---

## Common Error Responses

| Status Code | Description | Example Payload |
|-------------|-------------|-----------------|
| `400 Bad Request` | Missing or invalid parameters | `{ "success": false, "message": "Invalid email format" }` |
| `401 Unauthorized` | Missing or invalid JWT token | `{ "success": false, "message": "Not authorized to access this route" }` |
| `403 Forbidden` | User lacks required role permissions | `{ "success": false, "message": "User role Customer is not authorized" }` |
| `404 Not Found` | Requested resource does not exist | `{ "success": false, "message": "Resource not found with id of X" }` |
| `500 Server Error` | Unexpected backend failure | `{ "success": false, "message": "Server Error" }` |
