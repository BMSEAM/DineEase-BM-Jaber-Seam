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
The application supports three distinct user roles:
- **Customer**: Can view menus, make reservations, pre-order food, pay digitally, and manage their loyalty points.
- **Staff**: Can view and manage active orders, track table availability, handle cleaning tasks, and approve/reject reservations.
- **Admin**: Has full control over the system, including menu management, table configuration, staff management, refund processing, and viewing comprehensive reports.

## Features (F01-F20)
- **Authentication**: Secure JWT-based login, registration, and role-based access control.
- **F01 Restaurant Menu**: View available food items.
- **F02 Search and Filter Menu**: Find specific food items by category or keyword.
- **F03 Table Reservation**: Book tables for specific dates and times.
- **F04 Reservation History**: View past and upcoming reservations.
- **F05 Pre-order Food**: Add food items to a reservation before arriving.
- **F06 Order Management**: Staff can manage food orders.
- **F07 Order Tracking**: Track the status of orders in real-time.
- **F08 Real-time Table Availability**: View which tables are currently occupied or reserved.
- **F09 Reservation Approval**: Staff can approve or reject incoming reservations.
- **F10 Cleaning Schedule**: Manage and track table cleaning tasks for staff.
- **F11 Real-time Notifications**: Alerts for reservation status changes and order updates.
- **F12 Menu Management**: Admins can add, edit, or remove menu items.
- **F13 Table Management**: Admins can configure table layouts and capacities.
- **F14 Staff Management**: Admins can manage staff accounts and roles.
- **F15 Refund Management**: Admins can process refunds for cancelled reservations or orders.
- **F16 Digital Payment**: Simulated secure digital payment integration.
- **F17 Digital Invoice**: Automated invoice generation after successful payments.
- **F18 Admin Dashboard**: High-level overview of restaurant metrics and daily activities.
- **F19 Reports**: Detailed reporting on sales, reservations, and operational performance.
- **F20 Loyalty Program**: Customers earn and spend points based on their orders.

## Project Structure
The project uses a monorepo structure managed via npm workspaces:
- `client/`: React frontend application
- `server/`: Express backend API

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

To verify the frontend production build:
```bash
npm --workspace client run build
```

## Team Contribution Summary
- **Mushfique Nayeeb Ayon (AyonO1)**: Project Owner, Authentication backend, Table Reservation (F03), Reservation History (F04), Pre-order Food (F05), Digital Payment (F16), Digital Invoice (F17), Final Project Integration.
- **Provat Saha (provatsahanobo)**: Auth Frontend, Menu Management (F12), Staff Management (F14), Refund Management (F15), Admin Dashboard (F18), Reports (F19).
- **Noor-E-Jannat20**: Restaurant Menu (F01), Search & Filter (F02), Order Management (F06), Order Tracking (F07), Reservation Approval (F09), Real-time Notifications (F11).
- **Bm Jaber Seam (bmjaberseam-spec)**: Auth User Models, Table Availability (F08), Cleaning Schedule (F10), Table Management (F13), Loyalty Program (F20).

## Current Release
**Version**: v1.0 (Final Release)
