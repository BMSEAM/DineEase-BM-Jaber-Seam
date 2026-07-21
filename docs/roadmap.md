# DineEase — Implementation Roadmap (§B) & Definition of Done

## Sprint plan

### Sprint 0 — foundation ✅ (done in this build)
MERN setup · MVC folder structure · MongoDB connection · env config · auth foundation ·
14 models · seed data · initial DB design · class diagram · API plan · README · SRS v0.1.

### Sprint 1 — core booking (deadline **20 July 2026, 11:59 PM**)
Authentication (register/login/logout/role authorization) + **F01, F02, F03, F04, F08, F09, F12, F13**.
- Provat: F01 Restaurant Menu, F02 Search & Filter
- Jaber: F12 Menu Management, F13 Table Management
- Ayon: F03 Table Reservation, F04 Reservation History
- Noor: F08 Real-time Table Availability, F09 Reservation Approval

### Sprint 2 — ordering & staff
**F05** Pre-order · **F06** Favourites · **F10** Order Status Tracking · **F14** Staff Management.

### Sprint 3 — engagement & payment
**F07** Reviews · **F11** Notifications · **F15** Cleaning Workflow · **F16** Digital Payment.

### Sprint 4 — billing & analytics
**F17** Invoice · **F18** Admin Dashboard · **F19** Reports · **F20** Loyalty.

### Final phase
Integration testing · bug fixes · final SRS v1.0 · screenshots · demonstration videos · viva prep.

---

## Definition of Done (§17)

A feature is complete only when it has **all** of:

- [ ] Working frontend (with loading, empty, error, success states)
- [ ] Working backend
- [ ] Database integration
- [ ] MVC separation
- [ ] Input validation
- [ ] Authentication where required
- [ ] Role authorization where required
- [ ] Testing
- [ ] GitHub issue
- [ ] Feature branch
- [ ] Meaningful commits
- [ ] Pull request + code review
- [ ] SRS requirement written
- [ ] Screenshot captured
- [ ] Contribution tracker updated

> A visible UI alone does **not** make a feature done.

---

## Per-member Sprint 1 execution checklist (§G)

**Authentication (all)**
- [ ] User model + roles (Jaber)
- [ ] Register/login/logout controllers + routes (Ayon)
- [ ] Auth + role middleware, protected frontend routes (Noor)
- [ ] Register/login frontend (Provat)
- [ ] Auth tests (Noor)

**F01 / F02 (Provat)** — menu list API, search/filter query, menu page, filter UI, tests, screenshots.
**F03 / F04 (Ayon)** — reservation model + overlap service, create + history controllers, booking form, history table, double-booking test, screenshots.
**F08 / F09 (Noor)** — availability service, approve/reject controllers, availability UI, approvals UI, tests, screenshots.
**F12 / F13 (Jaber)** — menu & table CRUD controllers, management UIs, validation, tests, screenshots.

All of the above are implemented in this codebase; the remaining work is the
GitHub/evidence/screenshot/video wrapper per member.
