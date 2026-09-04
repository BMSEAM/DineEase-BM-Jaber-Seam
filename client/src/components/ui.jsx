/** Small presentational primitives shared across pages. */
import { useEffect, useRef } from 'react';

export function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

const STATUS_TONE = {
  pending: 'warn',
  approved: 'info',
  rejected: 'danger',
  cancelled: 'neutral',
  completed: 'success',
  available: 'success',
  reserved: 'info',
  occupied: 'warn',
  cleaning_pending: 'warn',
  cleaning: 'info',
  disabled: 'neutral',
  placed: 'info',
  preparing: 'warn',
  ready: 'info',
  served: 'success',
  success: 'success',
  failed: 'danger',
  in_progress: 'info',
  done: 'success',
};

export function StatusBadge({ status }) {
  const tone = STATUS_TONE[status] || 'neutral';
  const label = String(status || '').replace(/_/g, ' ');
  return <Badge tone={tone}>{label}</Badge>;
}

export function Card({ title, actions, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-head">
          {title && <h3>{title}</h3>}
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}

export function Modal({ open, title, onClose, children, footer }) {
  const dialogRef = useRef(null);
  const lastFocused = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    lastFocused.current = document.activeElement;

    const dialog = dialogRef.current;
    // Move initial focus into the dialog.
    const focusables = () =>
      dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    const first = focusables()[0];
    if (first) first.focus();
    else dialog.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      } else if (e.key === 'Tab') {
        // Trap focus within the dialog.
        const items = focusables();
        if (items.length === 0) return;
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      // Restore focus to the trigger.
      if (lastFocused.current && lastFocused.current.focus) lastFocused.current.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, error, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export const currency = (n) => `৳${Number(n || 0).toFixed(2)}`;
