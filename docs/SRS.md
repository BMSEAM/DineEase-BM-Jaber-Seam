# Software Requirements Specification (SRS) for DineEase

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to outline the software requirements for DineEase, a comprehensive restaurant reservation and management system. It details the functional and non-functional requirements, user roles, and system constraints.

### 1.2 Scope
DineEase is a web-based application designed to streamline restaurant operations, enhance customer dining experiences, and provide administrative control. It handles everything from customer reservations and food pre-orders to staff task management and admin reporting. 

## 2. Project Overview
DineEase is built using the MERN stack (MongoDB, Express.js, React, Node.js). The system aims to replace manual booking and ordering processes with a streamlined digital solution, offering real-time updates and centralized management.

## 3. User Roles
The application supports three distinct user roles with specific access levels:
- **Customer**: End-users who can view the menu, make reservations, pre-order food, pay digitally, and manage their loyalty points.
- **Staff**: Employees who manage active orders, track table availability, handle table cleaning workflows, and approve or reject reservations.
- **Admin**: System administrators with full control over the platform, including managing menus, tables, staff accounts, and viewing comprehensive business reports.

## 4. Functional Requirements

### 4.1 Authentication & Authorization
- **Secure Login & Registration**: Users can register and log in using email and password.
- **Role-Based Access Control (RBAC)**: The system enforces role-based authorization to protect routes and features based on the user's role (Customer, Staff, Admin).
- **JWT Authentication**: Sessions are securely managed using JSON Web Tokens (JWT).

### 4.2 Core Features (F01-F20)
- **F01 Restaurant Menu**: Customers can view available food items, descriptions, and prices.
- **F02 Search and Filter**: Customers can search for specific food items by keyword and filter them by category.
- **F03 Table Reservation**: Customers can book tables for specific dates, times, and guest counts.
- **F04 Reservation History**: Customers can view their past and upcoming reservations.
- **F05 Pre-order Food**: Customers can add food items to an upcoming reservation before arriving at the restaurant.
- **F06 Favourite Menu Items**: Customers can save and manage their favorite food items for quick access.
- **F07 Reviews & Ratings**: Customers can review and rate their dining experience and specific menu items.
- **F08 Table Availability**: Staff can view a real-time dashboard of which tables are currently occupied, reserved, or available.
- **F09 Reservation Approval**: Staff can review incoming reservations and either approve or reject them based on availability.
- **F10 Order Status Tracking**: Staff and Customers can track the real-time status of food orders (e.g., Pending, Preparing, Served).
- **F11 Notifications**: Users receive real-time alerts for reservation status changes, order updates, and system events.
- **F12 Menu Management**: Admins can add new menu items, edit existing items, update prices, or remove items entirely.
- **F13 Table Management**: Admins can configure the restaurant's table layout, capacity, and availability.
- **F14 Staff Management**: Admins can create new staff accounts, manage roles, and deactivate accounts.
- **F15 Table Cleaning Workflow**: Staff can view, manage, and track table cleaning tasks to ensure tables are ready for new guests.
- **F16 Digital Payment**: Customers can securely pay for their orders and reservations through a simulated digital payment gateway.
- **F17 Digital Invoice**: The system automatically generates and provides a digital invoice for customers after successful payments.
- **F18 Admin Dashboard**: Admins have a high-level overview dashboard displaying key restaurant metrics and daily activities.
- **F19 Reports**: Admins can generate and view detailed reports on sales, reservations, and operational performance.
- **F20 Loyalty Points**: Customers earn loyalty points based on their spending and can redeem them for discounts on future orders.

## 5. Non-Functional Requirements

### 5.1 Performance
- The application should respond to user interactions and API requests promptly.
- Real-time features (like Table Availability and Notifications) must update with minimal latency.

### 5.2 Security
- Passwords must be hashed (using bcrypt) before being stored in the database.
- Environment variables (like `JWT_SECRET` and `MONGODB_URI`) must be securely managed and never committed to version control.
- API endpoints must validate input data to prevent injection attacks.

### 5.3 Reliability
- The system should safely handle errors and provide meaningful feedback to users without crashing the application.

## 6. Data Requirements
- **User Data**: Must securely store user credentials, contact information, and role assignments.
- **Menu Data**: Must store item names, descriptions, prices, categories, and image URLs.
- **Reservation Data**: Must store booking details, guest counts, assigned tables, and status.
- **Transaction Data**: Must accurately record payment statuses and invoice details.

## 7. Constraints
- The backend must be built using Express.js and Node.js.
- The frontend must be built using React.
- The database must be MongoDB.
- Digital Payments (F16) must remain a simulated workflow without integrating an actual external payment gateway like SSLCommerz.

## 8. Assumptions
- Users have access to a modern web browser and a stable internet connection.
- The restaurant operates in a single timezone.
