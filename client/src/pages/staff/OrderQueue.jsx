import { useEffect, useState } from 'react';
import { orderApi } from '../../api/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { AsyncBoundary } from '../../components/StateViews.jsx';
import { Card, StatusBadge, Badge, currency } from '../../components/ui.jsx';
import { ORDER_NEXT } from '../../constants.js';

/** F10 Order Status Tracking — kitchen/waiter queue with valid transitions. */
export default function OrderQueue() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => orderApi.list(), []);
  const orders = data?.data || [];
  const [busyId, setBusyId] = useState(null);

  // Near-real-time queue: poll every 15s; interval cleaned up on unmount.
  useEffect(() => {
    const t = setInterval(reload, 15000);
    return () => clearInterval(t);
  }, [reload]);

  const advance = async (order, status) => {
    if (status === 'cancelled' && !window.confirm('Cancel this order? This cannot be undone.')) return;
    setBusyId(order._id);
    try {
      await orderApi.updateStatus(order._id, status);
      toast.success(`Order marked ${status}`);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const active = orders.filter((o) => !['completed', 'cancelled'].includes(o.status));

  return (
    <>
      <div className="section-head">
        <div>
          <span className="eyebrow">Kitchen</span>
          <h2 style={{ margin: 0 }}>Order Queue</h2>
          <p>Live queue — updates automatically.</p>
        </div>
        <button className="btn btn-sm btn-ghost" onClick={reload}>Refresh</button>
      </div>

      <AsyncBoundary loading={loading} error={error} isEmpty={active.length === 0} onRetry={reload} emptyProps={{ title: 'No active orders', emoji: '🍳' }}>
        <div className="grid grid-2">
          {active.map((o) => (
            <Card
              key={o._id}
              title={<span className="row" style={{ gap: '0.5rem' }}>{o.customer?.name || 'Order'} <Badge tone={o.type === 'takeaway' ? 'info' : 'neutral'}>{o.type === 'takeaway' ? 'Takeaway' : 'Dine-in'}</Badge></span>}
              actions={<StatusBadge status={o.status} />}
            >
              <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {o.items.map((it, i) => (
                  <li key={i} className="row between text-sm"><span>{it.quantity}× {it.name}</span><span>{currency(it.lineTotal)}</span></li>
                ))}
              </ul>
              <div className="row between mt">
                <strong>{currency(o.subtotal)}</strong>
                <div className="row">
                  {(ORDER_NEXT[o.status] || []).map((next) => (
                    <button
                      key={next}
                      className={`btn btn-sm ${next === 'cancelled' ? 'btn-danger' : ''}`}
                      disabled={busyId === o._id}
                      onClick={() => advance(o, next)}
                    >
                      → {next}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </AsyncBoundary>
    </>
  );
}
