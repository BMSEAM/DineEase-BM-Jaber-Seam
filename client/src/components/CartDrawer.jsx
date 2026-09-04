import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { orderApi } from '../api/endpoints.js';
import { currency } from './ui.jsx';
import FoodImage from './FoodImage.jsx';

/**
 * Slide-over takeaway cart. Checkout creates a standalone takeaway order (no
 * reservation required) and is disabled while submitting to prevent duplicate
 * orders. The cart is cleared only after the order is confirmed.
 */
export default function CartDrawer() {
  const { lines, subtotal, count, open, setOpen, setQty, remove, clear } = useCart();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  // Close on Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  if (!open) return null;

  const checkout = async () => {
    if (count === 0) return;
    if (!isAuthenticated) {
      setOpen(false);
      toast.info('Please sign in to place your order');
      navigate('/login', { state: { from: { pathname: '/menu' } } });
      return;
    }
    setBusy(true);
    try {
      await orderApi.create({
        items: lines.map((l) => ({ menuItem: l.menuItem, quantity: l.quantity })),
        type: 'takeaway',
      });
      clear();
      setOpen(false);
      toast.success('Takeaway order placed!');
      navigate('/orders');
    } catch (err) {
      toast.error(err.message || 'Could not place the order');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={() => setOpen(false)} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Your cart">
        <div className="drawer-head">
          <h3 style={{ margin: 0 }}>Your Cart</h3>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close cart">✕</button>
        </div>

        <div className="drawer-body">
          {lines.length === 0 && (
            <div className="state">
              <span className="state-emoji" aria-hidden="true">🛒</span>
              <p className="empty-title">Your cart is empty</p>
              <p className="muted">Add dishes from the menu to get started.</p>
            </div>
          )}
          {lines.map((l) => (
            <div key={l.menuItem} className="cart-line">
              <div className="thumb">
                <FoodImage src={l.imageUrl} alt={l.name} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row between">
                  <strong style={{ fontSize: '0.92rem' }}>{l.name}</strong>
                  <button className="icon-btn" onClick={() => remove(l.menuItem)} aria-label={`Remove ${l.name}`}>🗑️</button>
                </div>
                <div className="row between">
                  <div className="qty">
                    <button onClick={() => setQty(l.menuItem, l.quantity - 1)} aria-label={`Decrease ${l.name}`}>−</button>
                    <span>{l.quantity}</span>
                    <button onClick={() => setQty(l.menuItem, l.quantity + 1)} aria-label={`Increase ${l.name}`}>+</button>
                  </div>
                  <span className="price">{currency(l.price * l.quantity)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {lines.length > 0 && (
          <div className="drawer-foot">
            <div className="row between mb">
              <span className="muted">Subtotal</span>
              <strong className="price" style={{ fontSize: '1.15rem' }}>{currency(subtotal)}</strong>
            </div>
            <button className="btn btn-block btn-lg" onClick={checkout} disabled={busy}>
              {busy ? 'Placing order…' : isAuthenticated ? 'Checkout (Takeaway)' : 'Sign in to checkout'}
            </button>
            <p className="text-sm muted center" style={{ marginTop: '0.6rem' }}>
              Takeaway — no reservation required.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
