import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { orderApi, paymentApi, loyaltyApi, refundApi, reviewApi } from '../../api/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { AsyncBoundary } from '../../components/StateViews.jsx';
import { Card, StatusBadge, Field, Modal, currency, Badge } from '../../components/ui.jsx';

// Human-readable order-type label.
const typeLabel = (t) => (t === 'takeaway' ? 'Takeaway' : 'Dine-in');

const REFUND_TONE = { pending: 'warn', approved: 'success', rejected: 'neutral', failed: 'danger' };

/** F10 Order Status Tracking + F16 Digital Payment + refund extension. */
export default function OrdersPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => orderApi.mine(), []);
  const [payFor, setPayFor] = useState(null);
  const [refundFor, setRefundFor] = useState(null);
  const [refundBusy, setRefundBusy] = useState(null);
  // Map orderId -> latest refund, so a paid order shows its refund status.
  const [refundByOrder, setRefundByOrder] = useState({});
  const [reviewFor, setReviewFor] = useState(null);
  const [reviewedOrderIds, setReviewedOrderIds] = useState(new Set());
  const orders = data?.data || [];

  const loadReviewed = useCallback(() => {
    reviewApi
      .mine()
      .then((r) => setReviewedOrderIds(new Set(r.data.map((v) => String(v.order?._id || v.order)).filter(Boolean))))
      .catch(() => {});
  }, []);
  useEffect(() => { loadReviewed(); }, [loadReviewed]);

  // A standalone takeaway order (no reservation) can be reviewed once served/completed.
  const canReview = (o) => o.type === 'takeaway' && !o.reservation && ['served', 'completed'].includes(o.status);

  const loadRefunds = useCallback(() => {
    refundApi
      .mine()
      .then((r) => {
        const map = {};
        for (const rf of r.data) {
          const oid = String(rf.order?._id || rf.order);
          if (!map[oid]) map[oid] = rf; // list is newest-first
        }
        setRefundByOrder(map);
      })
      .catch((err) => toast.error(`Could not load refund status: ${err.message}`));
  }, [toast]);

  useEffect(() => { loadRefunds(); }, [loadRefunds]);

  const requestRefund = async (order, reason) => {
    setRefundBusy(order._id);
    try {
      await refundApi.request({ order: order._id, reason });
      toast.success('Refund requested — an admin will review it.');
      setRefundFor(null);
      loadRefunds();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRefundBusy(null);
    }
  };

  return (
    <>
      <div className="section-head">
        <div>
          <span className="eyebrow">Your orders</span>
          <h2 style={{ margin: 0 }}>My Orders</h2>
          <p>Takeaway orders and reservation pre-orders — track progress and pay securely.</p>
        </div>
        <Link to="/menu" className="btn btn-soft">Order takeaway →</Link>
      </div>

      <AsyncBoundary
        loading={loading}
        error={error}
        isEmpty={orders.length === 0}
        onRetry={reload}
        emptyProps={{
          title: 'No orders yet',
          hint: 'Order takeaway from the menu — no reservation needed — or pre-order when booking a table.',
          emoji: '🧾',
          action: <Link to="/menu" className="btn mt">Browse the menu</Link>,
        }}
      >
        <div className="grid grid-2">
          {orders.map((o) => (
            <Card
              key={o._id}
              title={<span className="row" style={{ gap: '0.5rem' }}><Badge tone={o.type === 'takeaway' ? 'info' : 'neutral'}>{typeLabel(o.type)}</Badge></span>}
              actions={<StatusBadge status={o.status} />}
            >
              <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {o.items.map((it, i) => (
                  <li key={i} className="row between text-sm">
                    <span>{it.quantity}× {it.name}</span>
                    <span>{currency(it.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <div className="divider" />
              <div className="row between">
                <span className="muted text-sm">Placed {new Date(o.createdAt).toLocaleString()}</span>
              </div>
              <div className="row between mt">
                <strong>Subtotal</strong>
                <span className="price">{currency(o.subtotal)}</span>
              </div>
              <div className="row between mt">
                {o.isRefunded ? <Badge tone="info">Refunded</Badge> : o.isPaid ? <Badge tone="success">Paid</Badge> : <Badge tone="warn">Unpaid</Badge>}
                {!o.isPaid && o.status !== 'cancelled' && <button className="btn btn-sm" onClick={() => setPayFor(o)}>Pay now</button>}
                {o.isPaid && !o.isRefunded && !refundByOrder[String(o._id)] && (
                  <button className="btn btn-sm btn-ghost" onClick={() => setRefundFor(o)} disabled={refundBusy === o._id}>
                    {refundBusy === o._id ? 'Requesting…' : 'Request refund'}
                  </button>
                )}
                {refundByOrder[String(o._id)] && (
                  <Badge tone={REFUND_TONE[refundByOrder[String(o._id)].status] || 'neutral'}>
                    Refund {refundByOrder[String(o._id)].status}
                  </Badge>
                )}
              </div>
              {canReview(o) && (
                <div className="row between mt">
                  {reviewedOrderIds.has(String(o._id))
                    ? <span className="pill">Reviewed</span>
                    : <button className="btn btn-sm btn-ghost" onClick={() => setReviewFor(o)}>Review this order</button>}
                </div>
              )}
            </Card>
          ))}
        </div>
      </AsyncBoundary>

      {payFor && <PaymentModal order={payFor} onClose={() => setPayFor(null)} onPaid={() => { setPayFor(null); reload(); loadRefunds(); }} />}
      {refundFor && (
        <RefundModal
          key={refundFor._id}
          order={refundFor}
          busy={refundBusy === refundFor._id}
          onClose={() => setRefundFor(null)}
          onSubmit={(reason) => requestRefund(refundFor, reason)}
        />
      )}
      {reviewFor && (
        <OrderReviewModal
          key={reviewFor._id}
          order={reviewFor}
          onClose={() => setReviewFor(null)}
          onDone={() => { setReviewFor(null); loadReviewed(); }}
        />
      )}
    </>
  );
}

function OrderReviewModal({ order, onClose, onDone }) {
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await reviewApi.create({ order: order._id, rating, comment });
      toast.success('Review submitted');
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title="Review your takeaway order"
      onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button><button className="btn" onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit'}</button></>}
    >
      <p className="text-sm muted">{order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p>
      <Field label="Rating">
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
        </select>
      </Field>
      <Field label="Comment">
        <textarea rows="4" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was your food?" maxLength={600} />
      </Field>
    </Modal>
  );
}

function RefundModal({ order, busy, onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  return (
    <Modal
      open
      title="Request a refund"
      onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button><button className="btn" onClick={() => onSubmit(reason.trim())} disabled={busy}>{busy ? 'Requesting…' : 'Request refund'}</button></>}
    >
      <p className="text-sm muted">A full simulated refund of {currency(order.subtotal)} (+VAT) will be requested for this paid order. An administrator reviews and processes it.</p>
      <Field label="Reason (optional)">
        <textarea rows="3" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tell us why you'd like a refund" maxLength={500} />
      </Field>
    </Modal>
  );
}

function PaymentModal({ order, onClose, onPaid }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [method, setMethod] = useState('bkash');
  const [redeem, setRedeem] = useState(0);
  const [simulate, setSimulate] = useState('success');
  const [busy, setBusy] = useState(false);
  const loyalty = useAsync(() => loyaltyApi.get(), []);

  const balance = loyalty.data?.data.balance || 0;
  const redeemValue = loyalty.data?.data.rules.redeemValue || 1;
  const discount = redeem * redeemValue;

  const pay = async () => {
    setBusy(true);
    try {
      const res = await paymentApi.pay({ order: order._id, method, redeemPoints: Number(redeem) || 0, simulate });
      toast.success(`Payment successful · earned ${res.data.loyalty.earned} points`);
      onPaid();
      navigate(`/invoices/${res.data.invoice._id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title="Complete payment"
      onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn" onClick={pay} disabled={busy}>{busy ? 'Processing…' : `Pay ${currency(Math.max(0, order.subtotal - discount))} +VAT`}</button></>}
    >
      <div className="row between"><span className="muted">Order subtotal</span><strong>{currency(order.subtotal)}</strong></div>
      <Field label="Payment method">
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="bkash">bKash</option>
          <option value="nagad">Nagad</option>
        </select>
      </Field>
      <Field label={`Redeem loyalty points (balance: ${balance}, 1pt = ${currency(redeemValue)})`}>
        <input type="number" min="0" max={balance} value={redeem} onChange={(e) => setRedeem(Math.min(balance, Math.max(0, Number(e.target.value))))} />
      </Field>
      {discount > 0 && <p className="text-sm muted">Discount applied: {currency(discount)}</p>}
      <Field label="Gateway simulation">
        <select value={simulate} onChange={(e) => setSimulate(e.target.value)}>
          <option value="success">Simulate success</option>
          <option value="fail">Simulate failure</option>
        </select>
      </Field>
      <p className="text-sm muted">Virtual payment for demonstration — no real credentials required.</p>
    </Modal>
  );
}
