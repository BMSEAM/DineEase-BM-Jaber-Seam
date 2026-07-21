# DineEase — REST API Documentation (§D)

Base URL: `http://localhost:5000/api`

**Response envelope**
```json
{ "success": true, "message": "…", "data": {}, "meta": {} }
```
**Error envelope**
```json
{ "success": false, "message": "…", "errors": [{ "field": "…", "message": "…" }] }
```

**Auth:** send the JWT as `Authorization: Bearer <token>` (also set as an httpOnly cookie).
Roles: `C`=customer, `W`=waiter, `Cl`=cleaner, `A`=admin, `P`=public.

---

## Authentication — `/auth`
| Method | Endpoint | Role | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/auth/register` | P | name, email, password, phone? | Register customer |
| POST | `/auth/login` | P | email, password | Login, returns token |
| POST | `/auth/logout` | P | — | Clears auth cookie |
| GET | `/auth/me` | any | — | Current user |
| PATCH | `/auth/me` | any | name?, phone? | Update profile |
| PATCH | `/auth/password` | any | currentPassword, newPassword | Change password |

## Menu & Categories — `/menu-items`, `/categories` (F01, F02, F12)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/menu-items` | P | List with `search, category, minPrice, maxPrice, available, sort, page, limit` |
| GET | `/menu-items/:id` | P | Single item |
| POST | `/menu-items` | A | Create item |
| PATCH | `/menu-items/:id` | A | Update item |
| PATCH | `/menu-items/:id/availability` | A | Toggle availability |
| DELETE | `/menu-items/:id` | A | Delete item |
| GET | `/categories` | P | List categories |
| POST | `/categories` | A | Create category |
| PATCH | `/categories/:id` | A | Update category |
| DELETE | `/categories/:id` | A | Delete (blocked if in use) |

## Tables — `/tables` (F08, F13)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/tables/available` | any | Available tables for `date, startTime, guests?, seatingPreference?` |
| GET | `/tables` | W/A | All tables with status |
| POST | `/tables` | A | Create table |
| PATCH | `/tables/:id` | A | Update table |
| PATCH | `/tables/:id/disable` | A | Disable table |
| PATCH | `/tables/:id/enable` | A | Enable table |

## Reservations — `/reservations` (F03, F04, F09)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/reservations` | C | Create (optional pre-order `items[]`) |
| GET | `/reservations/my` | C | History (`status?` filter) |
| PATCH | `/reservations/:id/cancel` | C | Cancel own reservation |
| GET | `/reservations` | W/A | List (`status?`, `date?`) |
| PATCH | `/reservations/:id/approve` | W/A | Approve |
| PATCH | `/reservations/:id/reject` | W/A | Reject (`reason?`) |
| GET | `/reservations/:id` | owner/W/A | Details |

## Orders — `/orders` (F05, F10)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/orders` | C | Create order/pre-order |
| GET | `/orders/my` | C | My orders |
| GET | `/orders` | W/A | Active order queue (`status?`) |
| PATCH | `/orders/:id/status` | W/A | Advance status (validated) |
| GET | `/orders/:id` | owner/W/A | Details |

## Favourites — `/favourites` (F06)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/favourites` | C | List favourites |
| POST | `/favourites` | C | Add (`menuItem`) |
| DELETE | `/favourites/:menuItemId` | C | Remove |

## Reviews — `/reviews` (F07)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/reviews` | P | Recent reviews + average (with visit context: date/table) |
| GET | `/reviews/my` | C | My reviews (with visit + pre-ordered items) |
| POST | `/reviews` | C | Create — for a completed `reservation` **or** a served/completed standalone takeaway `order` (exactly one) |
| PATCH | `/reviews/:id` | C (owner) | Edit own review (`rating?`, `comment?`) |
| DELETE | `/reviews/:id` | C (owner) | Delete own review |

## Notifications — `/notifications` (F11)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | any | List (`unread=true?`) + unread count |
| PATCH | `/notifications/read-all` | any | Mark all read |
| PATCH | `/notifications/:id/read` | any | Mark one read |

## Cleaning — `/cleaning` (F15)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| PATCH | `/cleaning/reservations/:id/complete` | W/A | Complete dining → raise table task |
| GET | `/cleaning/tasks` | Cl/A | Task queue (`status?`, `mine=true?`) |
| POST | `/cleaning/tasks` | **A** | Assign a manual task (`area`, `table?`, `location?`, `description?`) — areas: table/floor/window/restroom/kitchen/general |
| PATCH | `/cleaning/tasks/:id/start` | **Cl** | Start cleaning |
| PATCH | `/cleaning/tasks/:id/ready` | **Cl** | Mark ready → table available (non-table tasks just complete) |

> **Role split:** management vs. floor work are kept separate. Only an **admin**
> assigns/creates cleaning tasks; only a **cleaner** performs them (start / mark
> ready). Admins retain read-only oversight of the queue. Besides the automatic
> table task raised when a waiter completes dining, an admin can assign tasks for
> the floor, windows, restrooms, kitchen or general areas — non-table tasks carry
> a free-text location and do not affect any table's status.

## Staff — `/staff` (F14)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/staff` | A | List staff (`role?`) |
| POST | `/staff` | A | Create staff account |
| PATCH | `/staff/:id` | A | Update (name, phone, role) |
| PATCH | `/staff/:id/disable` | A | Disable account |
| PATCH | `/staff/:id/enable` | A | Enable account |

## Payments — `/payments` (F16)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/payments` | C | Pay order (`method`, `redeemPoints?`, `simulate?`) → invoice + loyalty |
| GET | `/payments/my` | C | My payments |

## Refunds — `/refunds` (F16 extension — user-requested, simulated)
> Not part of the formal F16 list. A customer requests a full simulated refund for
> their own **successfully-paid** order; an **admin only** processes or rejects it.
> Waiters and cleaners have no refund authority. Approval is atomic and idempotent
> (the Payment `success → refunded` flip is the single gate), reverses earned
> loyalty points and restores redeemed points exactly once, marks the order
> refunded, and excludes the payment from net revenue. The original invoice/charge
> is preserved immutably.

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/refunds` | C | Request refund (`order`, `reason?`, `idempotencyKey?`) → pending |
| GET | `/refunds/my` | C | My refund requests |
| GET | `/refunds` | A | All refunds (`status?`) |
| POST | `/refunds/:id/process` | A | Execute refund (`simulate?` = success/fail) |
| POST | `/refunds/:id/reject` | A | Decline a pending refund (`note?`) |

## Invoices — `/invoices` (F17)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/invoices/my` | C | My invoices |
| GET | `/invoices/:id` | owner/A | Invoice detail (printable) |

## Loyalty — `/loyalty` (F20)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/loyalty` | C | Balance, history, rules |

## Admin — `/admin` (F18, F19)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/admin/dashboard` | A | Operational snapshot |
| GET | `/admin/reports` | A | Reports (`period=daily/weekly/monthly`) |

## Health
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/health` | P | API status |

---

### Example: create reservation with pre-order
```http
POST /api/reservations
Authorization: Bearer <token>
Content-Type: application/json

{
  "table": "665...",
  "date": "2026-07-25",
  "startTime": "19:00",
  "guests": 2,
  "seatingPreference": "window",
  "items": [{ "menuItem": "665...", "quantity": 2 }]
}
```
Success `201`:
```json
{ "success": true, "message": "Reservation created and pending approval", "data": { "_id": "…", "status": "pending" } }
```
