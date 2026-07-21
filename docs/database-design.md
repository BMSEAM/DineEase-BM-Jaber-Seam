# DineEase — Database Design (§C)

MongoDB database `dineease`. All collections use Mongoose schemas with
`timestamps: true` (adds `createdAt`, `updatedAt`). Money is stored as `Number`.

## Enumerations

| Enum | Values |
|------|--------|
| role | `customer`, `waiter`, `cleaner`, `admin` |
| table status | `available`, `reserved`, `occupied`, `cleaning_pending`, `cleaning`, `disabled` |
| seating preference | `any`, `indoor`, `outdoor`, `window`, `private` |
| reservation status | `pending`, `approved`, `rejected`, `cancelled`, `completed` |
| order type | `dine_in`, `takeaway` |
| order status | `placed`, `preparing`, `ready`, `served`, `completed`, `cancelled` |
| payment method | `bkash`, `nagad` |
| payment status | `pending`, `success`, `failed` |
| cleaning status | `pending`, `in_progress`, `done` |
| loyalty tx type | `earn`, `redeem` |

---

## Collections

### users
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | String | ✓ | 2–80 chars |
| email | String | ✓ | unique, lowercase, validated |
| phone | String | | |
| password | String | ✓ | bcrypt hash, `select:false` |
| role | String (enum) | ✓ | default `customer`, indexed |
| isActive | Boolean | | default `true` |
| loyaltyPoints | Number | | default `0`, min `0` |

**Indexes:** `email` (unique), `role`. **Rules:** password hashed on save; never serialised.

### menucategories
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | String | ✓ | unique |
| description | String | | |
| displayOrder | Number | | default 0 |
| isActive | Boolean | | default true |

**Indexes:** `name` (unique).

### menuitems
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | String | ✓ | indexed |
| description | String | | ≤ 600 |
| price | Number | ✓ | min 0 |
| category | ObjectId → MenuCategory | ✓ | indexed |
| imageUrl | String | | |
| isAvailable | Boolean | | default true, indexed |

**Indexes:** text index on `name, description` (search F02); `category`, `isAvailable`.

### restauranttables
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| tableNumber | String | ✓ | unique |
| capacity | Number | ✓ | 1–20 |
| seatingPreference | String (enum) | | default `any` |
| status | String (enum) | | default `available`, indexed |
| isActive | Boolean | | default true |

### reservations
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| customer | ObjectId → User | ✓ | indexed |
| table | ObjectId → RestaurantTable | ✓ | indexed |
| date | String | ✓ | `YYYY-MM-DD` |
| startTime / endTime | String | ✓ | `HH:mm` |
| startAt / endAt | Date | ✓ | overlap detection, indexed |
| guests | Number | ✓ | min 1 |
| seatingPreference | String (enum) | | |
| status | String (enum) | | default `pending`, indexed |
| decidedBy | ObjectId → User | | approver |
| order | ObjectId → Order | | pre-order link |

**Indexes:** compound `{ table, startAt, endAt }` for overlap checks.
**Rules:** blocking statuses (`pending`, `approved`) prevent overlapping bookings; guests ≤ table capacity; start must be in the future.

### orders
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| customer | ObjectId → User | ✓ | indexed |
| reservation | ObjectId → Reservation | | indexed |
| type | String (enum) | | default `dine_in` |
| items | OrderItem[] | ✓ | ≥ 1 item |
| subtotal | Number | ✓ | computed server-side |
| status | String (enum) | | default `placed`, indexed |
| isPaid | Boolean | | default false |

**Embedded OrderItem:** `menuItem`, `name` (snapshot), `unitPrice` (snapshot), `quantity` (≥1), `lineTotal`.
**Rules:** status transitions validated by `ORDER_STATUS_FLOW`.

### payments
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| order | ObjectId → Order | ✓ | indexed |
| customer | ObjectId → User | ✓ | indexed |
| method | String (enum) | ✓ | bkash/nagad |
| transactionRef | String | ✓ | unique (simulated) |
| amount | Number | ✓ | charged total |
| pointsRedeemed | Number | | default 0 |
| discountApplied | Number | | default 0 |
| status | String (enum) | | default `pending`, indexed |
| paidAt | Date | | |

### invoices
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| invoiceNumber | String | ✓ | unique |
| order / payment / customer | ObjectId | ✓ | references |
| customerName / customerEmail | String | ✓ | denormalised snapshot |
| items | Array | ✓ | snapshot lines |
| subtotal / discount / vat / total | Number | ✓ | |
| paymentMethod / transactionRef | String | ✓ | |
| issuedAt | Date | | default now |

### reviews
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| customer | ObjectId → User | ✓ | indexed |
| reservation | ObjectId → Reservation | ✓ | |
| rating | Number | ✓ | 1–5 |
| comment | String | | ≤ 600 |

**Indexes:** unique `{ customer, reservation }` (no duplicate reviews).
**Rules:** only for the customer's own `completed` reservation.

### favourites
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| customer | ObjectId → User | ✓ | indexed |
| menuItem | ObjectId → MenuItem | ✓ | |

**Indexes:** unique `{ customer, menuItem }`.

### notifications
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| user | ObjectId → User | ✓ | indexed |
| type | String (enum) | ✓ | |
| title / message | String | ✓ | |
| link | String | | |
| isRead | Boolean | | default false, indexed |

### cleaningtasks
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| table | ObjectId → RestaurantTable | ✓ | indexed |
| reservation | ObjectId → Reservation | | |
| raisedBy | ObjectId → User | ✓ | waiter |
| cleaner | ObjectId → User | | acting cleaner |
| status | String (enum) | | default `pending`, indexed |
| startedAt / completedAt | Date | | |

### loyaltytransactions
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| customer | ObjectId → User | ✓ | indexed |
| type | String (enum) | ✓ | earn/redeem |
| points | Number | ✓ | magnitude, min 0 |
| balanceAfter | Number | ✓ | running balance |
| description | String | | |
| payment | ObjectId → Payment | | |

---

## Validation & integrity rules (cross-cutting)

- Passwords hashed with bcrypt; never returned in any response.
- Object IDs validated by middleware before DB access.
- Reservation overlap prevented via time-window query on `{ table, startAt, endAt }`.
- Order/loyalty amounts guarded against negative values and over-redemption.
- Order status changes restricted to a legal state machine.
- Ownership checks stop customers reading other customers' data.
