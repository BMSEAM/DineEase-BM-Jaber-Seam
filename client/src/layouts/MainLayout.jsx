import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { NotificationBell } from '../components/NotificationBell.jsx';
import CartDrawer from '../components/CartDrawer.jsx';

// Role-aware primary navigation.
const NAV = {
  guest: [{ to: '/menu', label: 'Menu' }],
  customer: [
    { to: '/menu', label: 'Menu' },
    { to: '/reservations', label: 'Reservations' },
    { to: '/orders', label: 'Orders' },
    { to: '/favourites', label: 'Favourites' },
    { to: '/invoices', label: 'Invoices' },
    { to: '/loyalty', label: 'Loyalty' },
    { to: '/reviews', label: 'Reviews' },
  ],
  waiter: [
    { to: '/staff/reservations', label: 'Approvals' },
    { to: '/staff/orders', label: 'Order Queue' },
    { to: '/staff/tables', label: 'Tables' },
  ],
  cleaner: [{ to: '/staff/cleaning', label: 'Cleaning Tasks' }],
  admin: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/menu', label: 'Menu' },
    { to: '/admin/tables', label: 'Tables' },
    { to: '/admin/staff', label: 'Staff' },
    { to: '/staff/reservations', label: 'Approvals' },
    { to: '/staff/orders', label: 'Orders' },
    { to: '/staff/cleaning', label: 'Cleaning' },
    { to: '/admin/refunds', label: 'Refunds' },
    { to: '/admin/reports', label: 'Reports' },
  ],
};

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
    </button>
  );
}

function CartButton() {
  const { count, setOpen } = useCart();
  return (
    <button className="icon-btn bell" onClick={() => setOpen(true)} aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}>
      <span style={{ fontSize: '1.2rem' }} aria-hidden="true">🛒</span>
      {count > 0 && <span className="cart-count">{count}</span>}
    </button>
  );
}

export default function MainLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawer, setDrawer] = useState(false);

  const role = user?.role || 'guest';
  const links = NAV[role] || NAV.guest;
  const showCart = !isAuthenticated || role === 'customer';

  // Close the mobile drawer on navigation.
  useEffect(() => { setDrawer(false); }, [location.pathname]);

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" className="brand" aria-label="DineEase home">
            <span aria-hidden="true">🍽️</span> Dine<span className="brand-dot">Ease</span>
          </NavLink>

          <div className="nav-links">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')} end={l.to === '/admin'}>
                {l.label}
              </NavLink>
            ))}
          </div>

          <div className="nav-right">
            <ThemeToggle />
            {showCart && <CartButton />}
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <NavLink to="/profile" className="text-sm muted no-print" title="Profile" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name}
                </NavLink>
                <button className="btn btn-sm btn-ghost no-print" onClick={onLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-sm btn-ghost">Sign in</Link>
                <Link to="/register" className="btn btn-sm">Sign up</Link>
              </>
            )}
            <button className="theme-toggle nav-toggle" onClick={() => setDrawer(true)} aria-label="Open navigation menu">
              <span aria-hidden="true">☰</span>
            </button>
          </div>
        </div>
      </nav>

      {drawer && (
        <>
          <div className="nav-drawer-backdrop" onClick={() => setDrawer(false)} />
          <div className="nav-drawer" role="dialog" aria-modal="true" aria-label="Navigation">
            <div className="nav-drawer-head">
              <strong>Menu</strong>
              <button className="icon-btn" onClick={() => setDrawer(false)} aria-label="Close menu">✕</button>
            </div>
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')} end={l.to === '/admin'}>
                {l.label}
              </NavLink>
            ))}
            <div className="divider" />
            {isAuthenticated ? (
              <>
                <NavLink to="/profile">Profile</NavLink>
                <button className="btn btn-ghost btn-block mt" onClick={onLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login">Sign in</Link>
                <Link to="/register">Create account</Link>
              </>
            )}
          </div>
        </>
      )}

      <div className="container">
        <Outlet />
      </div>

      <SiteFooter />
      {showCart && <CartDrawer />}
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer no-print">
      <div className="footer-inner">
        <div>
          <div className="brand" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            <span aria-hidden="true">🍽️</span> Dine<span className="brand-dot">Ease</span>
          </div>
          <p className="muted" style={{ maxWidth: '38ch' }}>
            A modern dining experience — reserve a table, pre-order your favourites, or grab takeaway. Fresh food, made to order.
          </p>
        </div>
        <div>
          <h4>Explore</h4>
          <Link to="/menu">Menu</Link>
          <Link to="/reservations">Reservations</Link>
          <Link to="/orders">Orders</Link>
          <Link to="/reviews">Reviews</Link>
        </div>
        <div>
          <h4>Visit us</h4>
          <p className="muted" style={{ margin: 0 }}>House 9, Road 9, Dhaka</p>
          <p className="muted" style={{ margin: 0 }}>Open daily · 11:00 – 23:00</p>
          <p className="muted" style={{ margin: 0 }}>hello@dineease.example</p>
        </div>
      </div>
      <div className="footer-bottom">
        © {new Date().getFullYear()} DineEase · CSE470 project · Simulated payments for demonstration.
      </div>
    </footer>
  );
}
