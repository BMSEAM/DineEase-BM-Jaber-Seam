import { useState } from 'react';
import { reservationApi, cleaningApi } from '../../api/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { AsyncBoundary } from '../../components/StateViews.jsx';
import { StatusBadge, Modal, Field, currency } from '../../components/ui.jsx';
import { RESERVATION_STATUSES } from '../../constants.js';

/** F09 Reservation Approval + trigger for F15 (waiter marks dining complete). */
export default function ReservationApprovals() {
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const { data, loading, error, reload } = useAsync(() => reservationApi.list(status ? { status } : {}), [status]);
  const reservations = data?.data || [];
  const [busyId, setBusyId] = useState(null);
  const [rejectFor, setRejectFor] = useState(null);

  const act = async (fn, id, msg) => {
    setBusyId(id);
    try {
      await fn(id);
      toast.success(msg);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const completeDining = async (r) => {
    if (!window.confirm(`Mark dining complete for ${r.customer?.name}? This raises a cleaning task.`)) return;
    act(cleaningApi.completeDining, r._id, 'Dining completed — cleaning task created');
  };

  return (
    <>
      <div className="section-head">
        <div>
          <span className="eyebrow">Front of house</span>
          <h2 style={{ margin: 0 }}>Reservation Approvals</h2>
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 200 }} aria-label="Filter by status">
          <option value="">All statuses</option>
          {RESERVATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <AsyncBoundary loading={loading} error={error} isEmpty={reservations.length === 0} onRetry={reload} emptyProps={{ title: `No ${status || ''} reservations`, emoji: '📋' }}>
        <div className="table-wrap card">
          <table>
            <thead><tr><th>Customer</th><th>Date</th><th>Time</th><th>Table</th><th>Guests</th><th>Pre-order</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r._id}>
                  <td>{r.customer?.name}<br /><span className="muted text-sm">{r.customer?.email}</span></td>
                  <td>{r.date}</td>
                  <td>{r.startTime}–{r.endTime}</td>
                  <td>{r.table?.tableNumber}</td>
                  <td>{r.guests}</td>
                  <td>{r.order ? `${r.order.items.length} item(s) · ${currency(r.order.subtotal)}` : '—'}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td className="row">
                    {r.status === 'pending' && (
                      <>
                        <button className="btn btn-sm btn-success" disabled={busyId === r._id} onClick={() => act(reservationApi.approve, r._id, 'Reservation approved')}>Approve</button>
                        <button className="btn btn-sm btn-danger" disabled={busyId === r._id} onClick={() => setRejectFor(r)}>Reject</button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <button className="btn btn-sm" disabled={busyId === r._id} onClick={() => completeDining(r)}>
                        {busyId === r._id ? 'Working…' : 'Complete dining'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AsyncBoundary>

      <RejectModal
        reservation={rejectFor}
        onClose={() => setRejectFor(null)}
        onDone={() => { setRejectFor(null); reload(); }}
      />
    </>
  );
}

function RejectModal({ reservation, onClose, onDone }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  if (!reservation) return null;

  const submit = async () => {
    const trimmed = reason.trim();
    if (!trimmed) return toast.error('Please enter a rejection reason');
    setBusy(true);
    try {
      await reservationApi.reject(reservation._id, trimmed);
      toast.success('Reservation rejected — customer notified');
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
      title="Reject reservation"
      onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger" onClick={submit} disabled={busy}>{busy ? 'Rejecting…' : 'Reject & notify'}</button>
      </>}
    >
      <p className="muted text-sm">
        Rejecting {reservation.customer?.name}’s booking for {reservation.date} at {reservation.startTime}. The reason is shown to the customer.
      </p>
      <Field label="Reason for rejection (required)">
        <textarea rows="3" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Fully booked for this slot" autoFocus />
      </Field>
    </Modal>
  );
}
