import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { ProtectedRoute, RoleRoute } from './routes/guards.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import { ROLES } from './constants.js';

import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import HomePage from './pages/HomePage.jsx';

import MenuPage from './pages/customer/MenuPage.jsx';
import ReservationsPage from './pages/customer/ReservationsPage.jsx';
import OrdersPage from './pages/customer/OrdersPage.jsx';
import FavouritesPage from './pages/customer/FavouritesPage.jsx';
import ReviewsPage from './pages/customer/ReviewsPage.jsx';
import InvoicesPage from './pages/customer/InvoicesPage.jsx';
import InvoiceDetailPage from './pages/customer/InvoiceDetailPage.jsx';
import LoyaltyPage from './pages/customer/LoyaltyPage.jsx';

import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import MenuManagement from './pages/admin/MenuManagement.jsx';
import TableManagement from './pages/admin/TableManagement.jsx';
import StaffManagement from './pages/admin/StaffManagement.jsx';
import RefundsManagement from './pages/admin/RefundsManagement.jsx';
import ReportsPage from './pages/admin/ReportsPage.jsx';
import ReservationApprovals from './pages/staff/ReservationApprovals.jsx';
import OrderQueue from './pages/staff/OrderQueue.jsx';
import StaffTables from './pages/staff/StaffTables.jsx';
import CleaningTasks from './pages/staff/CleaningTasks.jsx';

// Landing route: staff/admin go straight to their workspace; everyone else
// (customers and anonymous visitors) sees the marketing home page.
function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === ROLES.ADMIN) return <Navigate to="/admin" replace />;
  if (user?.role === ROLES.WAITER) return <Navigate to="/staff/reservations" replace />;
  if (user?.role === ROLES.CLEANER) return <Navigate to="/staff/cleaning" replace />;
  return <HomePage />;
}

const staff = [ROLES.WAITER, ROLES.ADMIN];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* The main layout renders for everyone; individual routes gate access. */}
      <Route element={<MainLayout />}>
        {/* Public */}
        <Route path="/" element={<HomeRoute />} />
        <Route path="/menu" element={<MenuPage />} />

        {/* Authenticated (any role) */}
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Customer */}
        <Route path="/reservations" element={<ProtectedRoute><ReservationsPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/favourites" element={<ProtectedRoute><FavouritesPage /></ProtectedRoute>} />
        <Route path="/reviews" element={<ProtectedRoute><ReviewsPage /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
        <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceDetailPage /></ProtectedRoute>} />
        <Route path="/loyalty" element={<ProtectedRoute><LoyaltyPage /></ProtectedRoute>} />

        {/* Staff / Admin */}
        <Route path="/staff/reservations" element={<RoleRoute roles={staff}><ReservationApprovals /></RoleRoute>} />
        <Route path="/staff/orders" element={<RoleRoute roles={staff}><OrderQueue /></RoleRoute>} />
        <Route path="/staff/tables" element={<RoleRoute roles={staff}><StaffTables /></RoleRoute>} />
        <Route path="/staff/cleaning" element={<RoleRoute roles={[ROLES.CLEANER, ROLES.ADMIN]}><CleaningTasks /></RoleRoute>} />

        {/* Admin only */}
        <Route path="/admin" element={<RoleRoute roles={[ROLES.ADMIN]}><AdminDashboard /></RoleRoute>} />
        <Route path="/admin/menu" element={<RoleRoute roles={[ROLES.ADMIN]}><MenuManagement /></RoleRoute>} />
        <Route path="/admin/tables" element={<RoleRoute roles={[ROLES.ADMIN]}><TableManagement /></RoleRoute>} />
        <Route path="/admin/staff" element={<RoleRoute roles={[ROLES.ADMIN]}><StaffManagement /></RoleRoute>} />
        <Route path="/admin/refunds" element={<RoleRoute roles={[ROLES.ADMIN]}><RefundsManagement /></RoleRoute>} />
        <Route path="/admin/reports" element={<RoleRoute roles={[ROLES.ADMIN]}><ReportsPage /></RoleRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
