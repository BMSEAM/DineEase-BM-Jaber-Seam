# DineEase — Test Plan (§16)

## Automated tests (implemented)
Run: `cd server && npm test` (uses `mongodb-memory-server`, no real DB needed).

| Suite | Covers |
|-------|--------|
| `tests/auth.test.js` | Registration, duplicate email, validation, login success/failure, protected route |
| `tests/reservation.test.js` | Reservation creation, **double-booking prevention**, capacity validation |

## Areas to test (per §16) — expand each sprint
Authentication · Authorization · Input validation · Menu searching · Menu filtering ·
Table availability · Reservation creation · Double-booking prevention · Reservation
approval · Reservation rejection · Reservation history · Order-status transitions ·
Payment success · Payment failure · Invoice generation · Loyalty calculations ·
Cleaning workflow · Report calculations.

## Manual end-to-end checklist
- [ ] Register → login → logout for each role
- [ ] Browse, search and filter the menu
- [ ] Add/remove favourites
- [ ] Book a table; attempt an overlapping booking (must fail)
- [ ] Pre-order food; verify subtotal
- [ ] Approve/reject reservation (staff); customer notified
- [ ] Advance order status through the queue
- [ ] Pay (success and failure); invoice generated; loyalty earned
- [ ] Redeem loyalty points; discount applied
- [ ] Complete dining → cleaning task → start → ready → table available
- [ ] Admin dashboard figures correct
- [ ] Reports for daily/weekly/monthly

## Suggested screenshots to capture (docs/screenshots)
One per feature (F01–F20) plus login/register, showing valid use and an invalid-input case.
