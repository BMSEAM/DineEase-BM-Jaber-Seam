import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../api/endpoints.js';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/** F11 — bell icon with unread count and a dropdown of recent notifications. */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const res = await notificationApi.list();
      setItems(res.data);
      setUnread(res.meta?.unreadCount || 0);
    } catch {
      /* silent — non-critical */
    }
  }, []);

  // Poll every 20s for near-real-time updates; interval cleaned up on unmount.
  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  // Close on outside click or Escape.
  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const markAll = async () => {
    try {
      await notificationApi.markAllRead();
    } finally {
      load();
    }
  };

  // Clicking a notification marks it read, closes the dropdown and navigates.
  const openNotification = async (n) => {
    setOpen(false);
    if (!n.isRead) {
      setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      try {
        await notificationApi.markRead(n._id);
      } catch {
        /* ignore */
      }
    }
    if (n.link && n.link.startsWith('/')) navigate(n.link);
  };

  return (
    <div className="bell" ref={ref}>
      <button
        className="icon-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span style={{ fontSize: '1.2rem' }} aria-hidden="true">🔔</span>
        {unread > 0 && <span className="bell-count">{unread}</span>}
      </button>
      {open && (
        <div className="dropdown" role="menu">
          <div className="dropdown-head">
            <strong>Notifications</strong>
            {unread > 0 && (
              <button className="btn btn-sm btn-ghost" onClick={markAll}>
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 && <div className="notif muted">No notifications yet</div>}
          {items.map((n) => (
            <div
              key={n._id}
              role="menuitem"
              tabIndex={0}
              className={`notif ${n.isRead ? '' : 'unread'}`}
              onClick={() => openNotification(n)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openNotification(n);
                }
              }}
            >
              <div className="notif-title">{n.title}</div>
              <div className="notif-msg">{n.message}</div>
              <div className="notif-time">{timeAgo(n.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
