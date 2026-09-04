import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'dineease_cart';

function readCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Takeaway cart. Persisted in localStorage so it survives reloads, and cleared
 * only after a confirmed order is created (see OrdersPage checkout).
 */
export function CartProvider({ children }) {
  const [lines, setLines] = useState(readCart);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines]);

  const add = useCallback((item, qty = 1) => {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.menuItem === item._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [
        ...prev,
        { menuItem: item._id, name: item.name, price: item.price, imageUrl: item.imageUrl || '', quantity: qty },
      ];
    });
  }, []);

  const setQty = useCallback((menuItem, quantity) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.menuItem !== menuItem)
        : prev.map((l) => (l.menuItem === menuItem ? { ...l, quantity } : l))
    );
  }, []);

  const remove = useCallback((menuItem) => {
    setLines((prev) => prev.filter((l) => l.menuItem !== menuItem));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const { count, subtotal } = useMemo(
    () => ({
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: lines.reduce((n, l) => n + l.price * l.quantity, 0),
    }),
    [lines]
  );

  const qtyOf = useCallback((menuItem) => lines.find((l) => l.menuItem === menuItem)?.quantity || 0, [lines]);

  const value = {
    lines, count, subtotal, open, setOpen,
    add, setQty, remove, clear, qtyOf,
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
