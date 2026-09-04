import { useState, useEffect, useCallback } from 'react';
import { reservationApi, tableApi, menuApi, reviewApi } from '../../api/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { AsyncBoundary } from '../../components/StateViews.jsx';
import { Card, StatusBadge, Field, Modal, currency } from '../../components/ui.jsx';
import { SEATING } from '../../constants.js';

const todayStr = () => new Date().toISOString().slice(0, 10);

// 30-minute booking slots (backend aligns reservations to :00 / :30).
const SLOTS = [];
for (let h = 10; h <= 22; h += 1) {
  SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 22) SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

export default function ReservationsPage() {
  const toast = useToast();
  const [form, setForm] = useState({ date: todayStr(), startTime: '19:00', guests: 2, seatingPreference: 'any' });
  const [available, setAvailable] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [searching, setSearching] = useState(false);
  const [booking, setBooking] = useState(false);
  const [cancelling, setCancelling] = useState(null);

  // Pre-order (F05)
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({}); // menuItemId -> qty

  const history = useAsync(() => reservationApi.mine(), []);
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [reviewFor, setReviewFor] = useState(null);

  const loadReviewed = useCallback(() => {
    reviewApi
      .mine()
      .then((r) => setReviewedIds(new Set(r.data.map((v) => String(v.reservation?._id || v.reservation)).filter(Boolean))))
      .catch((err) => toast.error(`Could not load your review status: ${err.message}`));
  }, [toast]);

  useEffect(() => {
    menuApi.list({ available: true, limit: 100 }).then((r) => setMenu(r.data)).catch(() => {});
    loadReviewed();
  }, [loadReviewed]);

  // Changing any search criterion invalidates the previous table results so a
  // stale table can never be booked for the wrong slot.
  const updateForm = useCallback((patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setAvailable(null);
    setSelectedTable(null);
  }, []);

  const findTables = async () => {
    setSearching(true);
    setSelectedTable(null);
    try {
      const res = await tableApi.available(form);
      setAvailable(res.data);
      if (res.data.length === 0) toast.info('No tables available for that slot');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSearching(false);
    }
  };

  const cartItems = Object.entries(cart).filter(([, q]) => q > 0);
  const cartTotal = cartItems.reduce((sum, [id, q]) => {
    const m = menu.find((x) => x._id === id);
    return sum + (m ? m.price * q : 0);
  }, 0);

  const setQty = (id, delta) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) + delta) }));

  const book = async () => {
    if (!selectedTable) return toast.error('Select an available table first');
    setBooking(true);
    try {
      // Revalidate availability immediately before booking to avoid racing a
      // reservation that was taken while the customer was choosing.
      const fresh = await tableApi.available(form);
      const stillFree = fresh.data.some((t) => t._id === selectedTable._id);
      if (!stillFree) {
        setAvailable(fresh.data);
        setSelectedTable(null);
        toast.error('That table was just taken. Please pick another.');
        return;
      }

      const body = { ...form, table: selectedTable._id };
      if (cartItems.length > 0) body.items = cartItems.map(([menuItem, quantity]) => ({ menuItem, quantity }));
      await reservationApi.create(body);
      toast.success('Reservation created — pending approval');
      setAvailable(null);
      setSelectedTable(null);
      setCart({});
      history.reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBooking(false);
    }
  };

  const cancel = async (id) => {
    if (!window.confirm('Cancel this reservation? This cannot be undone.')) return;
    setCancelling(id);
    try {
      await reservationApi.cancel(id);
      toast.success('Reservation cancelled');
      history.reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(null);
    }
  };

  const onReviewed = () => {
    if (reviewFor) setReviewedIds((s) => new Set(s).add(String(reviewFor._id)));
    setReviewFor(null);
    toast.success('Review submitted');
    history.reload();
  };

  return (
    <>
      <div className="section-head">
        <div>
          <span className="eyebrow">Plan your visit</span>
          <h2>Reservations</h2>
          <p>Find a table, optionally pre-order, and track your bookings.</p>
        </div>
      </div>

      <div className="grid grid-2">
        {/* F03 booking form */}
        <Card title="Book a table">
          <div className="row">
            <Field label="Date">
              <input type="date" min={todayStr()} value={form.date} onChange={(e) => updateForm({ date: e.target.value })} />
            </Field>
            <Field label="Time">
              <select value={form.startTime} onChange={(e) => updateForm({ startTime: e.target.value })}>
                {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div className="row">
            <Field label="Guests">
              <input type="number" min="1" value={form.guests} onChange={(e) => updateForm({ guests: Number(e.target.value) })} />
            </Field>
            <Field label="Seating">
              <select value={form.seatingPreference} onChange={(e) => updateForm({ seatingPreference: e.target.value })}>
                {SEATING.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <button className="btn" onClick={findTables} disabled={searching}>
            {searching ? 'Searching…' : 'Find available tables'}
          </button>

          {available && (
            <div className="mt">
              <p className="text-sm muted">{available.length} table(s) available:</p>
              <div className="row">
                {available.map((t) => (
                  <button key={t._id} className={`btn btn-sm ${selectedTable?._id === t._id ? '' : 'btn-ghost'}`} onClick={() => setSelectedTable(t)}>
                    {t.tableNumber} · {t.capacity}p · {t.seatingPreference}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* F05 pre-order */}
        <Card title="Pre-order food (optional)">
          <div className="stack" style={{ maxHeight: 220, overflowY: 'auto' }}>
            {menu.map((m) => (
              <div key={m._id} className="row between">
                <span className="text-sm">{m.name} <span className="muted">· {currency(m.price)}</span></span>
                <span className="qty">
                  <button onClick={() => setQty(m._id, -1)} aria-label={`Decrease ${m.name}`}>−</button>
                  <span>{cart[m._id] || 0}</span>
                  <button onClick={() => setQty(m._id, 1)} aria-label={`Increase ${m.name}`}>+</button>
                </span>
              </div>
            ))}
          </div>
          <div className="row between mt">
            <strong>Pre-order total</strong>
            <span className="price">{currency(cartTotal)}</span>
          </div>
          <button className="btn btn-block mt" onClick={book} disabled={booking || !selectedTable}>
            {booking ? 'Booking…' : `Confirm reservation${cartItems.length ? ' + pre-order' : ''}`}
          </button>
          {!selectedTable && <p className="text-sm muted center" style={{ marginTop: '0.5rem' }}>Find and select a table to continue.</p>}
        </Card>
      </div>

      {/* F04 history */}
      <div className="section-head mt">
        <h2 style={{ margin: 0 }}>My reservation history</h2>
      </div>
      <AsyncBoundary
        loading={history.loading}
        error={history.error}
        isEmpty={history.data && history.data.data.length === 0}
        onRetry={history.reload}
        emptyProps={{ title: 'No reservations yet', hint: 'Book a table above to get started.', emoji: '📅' }}
      >
        <div className="table-wrap card">
          <table>
            <thead>
              <tr><th>Date</th><th>Time</th><th>Table</th><th>Guests</th><th>Pre-order</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {history.data?.data.map((r) => (
                <tr key={r._id}>
                  <td>{r.date}</td>
                  <td>{r.startTime}–{r.endTime}</td>
                  <td>{r.table?.tableNumber || '—'}</td>
                  <td>{r.guests}</td>
                  <td>{r.order ? `${r.order.items.length} item(s) · ${currency(r.order.subtotal)}` : '—'}</td>
                  <td>
                    <StatusBadge status={r.status} />
                    {r.status === 'rejected' && r.decisionReason && (
                      <div className="text-sm muted" style={{ marginTop: 4 }}>Reason: {r.decisionReason}</div>
                    )}
                  </td>
                  <td>
                    {['pending', 'approved'].includes(r.status) && (
                      <button className="btn btn-sm btn-danger" onClick={() => cancel(r._id)} disabled={cancelling === r._id}>
                        {cancelling === r._id ? 'Cancelling…' : 'Cancel'}
                      </button>
                    )}
                    {r.status === 'completed' && !reviewedIds.has(String(r._id)) && (
                      <button className="btn btn-sm" onClick={() => setReviewFor(r)}>Review</button>
                    )}
                    {r.status === 'completed' && reviewedIds.has(String(r._id)) && (
                      <span className="pill">Reviewed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AsyncBoundary>

      {/* key remounts the modal per reservation so rating/comment reset cleanly
          when opening it for a different (or the same) reservation. */}
      <ReviewModal key={reviewFor?._id || 'none'} reservation={reviewFor} onClose={() => setReviewFor(null)} onDone={onReviewed} />
    </>
  );
}

function ReviewModal({ reservation, onClose, onDone }) {
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  if (!reservation) return null;

  const submit = async () => {
    setBusy(true);
    try {
      await reviewApi.create({ reservation: reservation._id, rating, comment });
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!reservation}
      title="Leave a review"
      onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn" onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit'}</button></>}
    >
      <Field label="Rating">
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
        </select>
      </Field>
      <Field label="Comment">
        <textarea rows="4" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was your experience?" />
      </Field>
    </Modal>
  );
}
