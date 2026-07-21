# DineEase — GitHub Plan (§E, §10, §11)

## Repository
- One shared repository owned by the group; every member commits from **their own** GitHub account.
- Permanent branches: **`main`** (stable sprint submissions) and **`develop`** (integrated work).
- Never develop directly on `main`. Every feature uses its own branch and a pull request into `develop`.
- Each PR is reviewed by **another** group member. At the end of a sprint, merge `develop` → `main` and tag (e.g. `sprint-1`).

## Branch naming
```
feature/F01-restaurant-menu-provat
feature/F03-table-reservation-ayon
feature/F08-table-availability-noor
feature/F12-menu-management-jaber
fix/F03-double-booking
docs/srs-sprint-1
```

## Commit message convention
```
feat(F03): add reservation mongoose model
feat(F03): implement table availability validation
feat(F03): create reservation controller
feat(F03): build reservation form
test(F03): add reservation API tests
docs(F03): add reservation screenshots
fix(F03): prevent overlapping table reservations
```
Avoid meaningless messages (`update`, `done`, `final`, `changes`, `fixed`).

## Review assignments (suggested)
| Author | Reviewer |
|--------|----------|
| Provat | Jaber |
| Jaber | Ayon |
| Ayon | Noor |
| Noor | Provat |

## Sprint tags
`sprint-0`, `sprint-1`, `sprint-2`, `sprint-3`, `sprint-4`, `v1.0`.

---

## Issue list (one per feature + supporting work)

Create these as GitHub Issues using the feature template. Each carries labels:
`feature`, the owner, and its sprint.

| # | Title | Owner | Sprint |
|---|-------|-------|--------|
| 1 | F01 Restaurant Menu | Provat | 1 |
| 2 | F02 Search and Filter Menu | Provat | 1 |
| 3 | F03 Table Reservation | Ayon | 1 |
| 4 | F04 Reservation History | Ayon | 1 |
| 5 | F05 Pre-order Food | Ayon | 2 |
| 6 | F06 Favourite Menu Items | Provat | 2 |
| 7 | F07 Customer Reviews and Ratings | Provat | 3 |
| 8 | F08 Real-time Table Availability | Noor | 1 |
| 9 | F09 Reservation Approval | Noor | 1 |
| 10 | F10 Order Status Tracking | Noor | 2 |
| 11 | F11 In-site Notification System | Noor | 3 |
| 12 | F12 Menu Management | Jaber | 1 |
| 13 | F13 Table Management | Jaber | 1 |
| 14 | F14 Staff Management | Jaber | 2 |
| 15 | F15 Table Cleaning Workflow | Noor | 3 |
| 16 | F16 Digital Payment Integration | Ayon | 3 |
| 17 | F17 Digital Invoice | Ayon | 4 |
| 18 | F18 Admin Dashboard | Jaber | 4 |
| 19 | F19 Sales and Reservation Reports | Jaber | 4 |
| 20 | F20 Customer Loyalty and Reward Points | Provat | 4 |
| 21 | Authentication module | All | 1 |
| 22 | Repository & MERN setup | All | 0 |
| 23 | Database design & seed | All | 0 |
| 24 | Class diagram | All | 0 |
| 25 | SRS document | All | 0→ |
| 26 | README | All | 0 |
| 27 | Testing | All | ongoing |
| 28 | Deployment | All | 4 |
| 29 | Integration bugs | All | ongoing |
| 30 | Final documentation | All | 4 |

## Each feature issue must include
Feature ID · Feature name · Owner · Sprint · Description · Backend tasks ·
Frontend tasks · Validation requirements · Acceptance criteria · Testing requirements ·
Documentation requirements.

## GitHub Project board columns
`Backlog → To Do → In Progress → In Review → Done`.

## Pull-request workflow
1. Branch off `develop`.
2. Implement the feature to the Definition of Done (see `docs/roadmap.md`).
3. Open a PR into `develop` using the PR template; link the issue (`Closes #3`).
4. Assign the designated reviewer; address review comments.
5. Merge after approval; delete the feature branch.
6. End of sprint: PR `develop` → `main`, tag the sprint.
