# DineEase

DineEase is a MERN-stack restaurant reservation and management system for CSE470 Group 9.

## Project Overview
DineEase provides a complete solution for restaurant management, handling everything from customer reservations and food pre-orders to staff task management and admin reporting. The system is designed to streamline restaurant operations and enhance the customer dining experience.

## Technologies Used
- **MongoDB**: NoSQL database for flexible data storage
- **Express.js**: Backend web application framework
- **React**: Frontend user interface library (built with Vite)
- **Node.js**: JavaScript runtime environment

## User Roles
The application supports four distinct user roles:
- **Customer**: Can view menus, make reservations, pre-order food, pay digitally, and manage their loyalty points.
- **Waiter**: Can view and manage active orders, track table availability, and approve/reject reservations.
- **Cleaner**: Can manage and track table cleaning tasks.
- **Admin**: Has full control over the system, including menu management, table configuration, staff management, refund processing, and viewing comprehensive reports.

## Features (F01-F20)
- **Authentication**: Secure JWT-based login, registration, and role-based access control.
- **F01 Restaurant Menu**: View available food items.
- **F02 Search and Filter**: Find specific food items by category or keyword.
- **F03 Table Reservation**: Book tables for specific dates and times.
- **F04 Reservation History**: View past and upcoming reservations.
- **F05 Pre-order Food**: Add food items to a reservation before arriving.
- **F06 Favourite Menu Items**: Customers can save their favorite food items.
- **F07 Reviews & Ratings**: Customers can review and rate their dining experience.
- **F08 Table Availability**: Real-time view of which tables are currently occupied or reserved.
- **F09 Reservation Approval**: Staff can approve or reject incoming reservations.
- **F10 Order Status Tracking**: Track the status of orders in real-time.
- **F11 Notifications**: Real-time alerts for reservation status changes and order updates.
- **F12 Menu Management**: Admins can add, edit, or remove menu items.
- **F13 Table Management**: Admins can configure table layouts and capacities.
- **F14 Staff Management**: Admins can manage staff accounts and roles.
- **F15 Table Cleaning Workflow**: Manage and track table cleaning tasks for staff.
- **F16 Digital Payment**: Simulated secure digital payment integration.
- **F17 Digital Invoice**: Automated invoice generation after successful payments.
- **F18 Admin Dashboard**: High-level overview of restaurant metrics and daily activities.
- **F19 Reports**: Detailed reporting on sales, reservations, and operational performance.
- **F20 Loyalty Points**: Customers earn and spend points based on their orders.

## Project Structure
The project uses a monorepo structure managed via npm workspaces:
- `client/`: React frontend application
- `server/`: Express backend API
- `docs/diagrams/`: See the [System Architecture Diagram](docs/diagrams/system-architecture.md) for the data flow pipeline.

## Prerequisites
- **Node.js**: `^20.19 || >=22.12`
- **MongoDB**: A running local or cloud instance.

## Installation & Setup
1. Clone the repository
2. Install dependencies for all workspaces:
   ```bash
   npm install
   ```

## Environment Setup
Create a `.env` file in the `server` directory using the provided example:
```bash
cp server/.env.example server/.env
```
Ensure you configure the MongoDB URI and JWT secrets in the `.env` file.

Create a `.env` file in the `client` directory using the provided example:
```bash
cp client/.env.example client/.env
```

## Seeding the Database
To populate the database with initial users, menus, and tables for the demo:
```bash
npm run seed --workspace server
```
**Test Account Credentials (Password for all is `password123`):**
- admin@dineease.com
- waiter@dineease.com
- cleaner@dineease.com
- customer@dineease.com

## Running the Application
**Backend:**
```bash
npm --workspace server run dev
```

**Frontend:**
```bash
npm --workspace client run dev
```

## Tests
To run the backend test suite:
```bash
npm --workspace server test
```
**Status:** Verified to pass all 75 tests across 6 test suites.

To verify the frontend production build:
```bash
npm --workspace client run build
```

## Team Contribution Summary

| Member | GitHub Username | Features Assigned | Percentage | Branch / PR Evidence | Commit Evidence |
|--------|-----------------|-------------------|------------|----------------------|-----------------|
| **Provat Saha Pranto** | `provatsahanobo` | F01, F02, F06, F07, F20 | 25% | PR #35, PR #36, PR #40, PR #44, PR #45 | `a3c6c38`, `8ad75c5`, `553a265`, `d32ead2`, `4219fde` |
| **Mushfique Nayeeb Ayon** | `AyonO1` | F03, F04, F05, F16, F17, Auth Backend | 25% | PR #19, PR #21, PR #23, PR #25, PR #27, PR #17 | `1a5eff0`, `1ae7039`, `b1b8340`, `f956cfe`, `24a49ba`, `3f4e257` |
| **Noor-E-Jannat** | `Noor-E-Jannat20` | F08, F09, F10, F11, F15 | 25% | PR #38, PR #39, PR #41, PR #42, PR #43 | `846020a`, `3b5d296`, `9bb859a`, `872379e`, `8e8c40c` |
| **B.M. Jaber Seam** | `bmjaberseam-spec` | F12, F13, F14, F18, F19, Auth Models | 25% | PR #29, PR #30, PR #31, PR #32, PR #33, PR #28 | `2aaa9fe`, `de54d65`, `be21f5d`, `c757546`, `25c8f25`, `cdb2b50` |

## Current Release
**Version**: v1.0 (Final Release)
