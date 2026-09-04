import { useState } from 'react';
import { adminApi } from '../../api/endpoints.js';
import { useAsync } from '../../hooks/useAsync.js';
import { AsyncBoundary } from '../../components/StateViews.jsx';
import { Card, currency } from '../../components/ui.jsx';

/** F19 Sales and Reservation Reports. */
export default function ReportsPage() {
  const [period, setPeriod] = useState('daily');
  const { data, loading, error, reload } = useAsync(() => adminApi.reports(period), [period]);
  const r = data?.data;

  return (
    <>
      <div className="row between">
        <h1>Reports</h1>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ width: 200 }}>
          <option value="daily">Daily (today)</option>
          <option value="weekly">Weekly (7 days)</option>
          <option value="monthly">Monthly (30 days)</option>
        </select>
      </div>

      <AsyncBoundary loading={loading} error={error} isEmpty={false} onRetry={reload}>
        {r && (
          <>
            <div className="grid grid-4 mt">
              <div className="stat"><div className="stat-value">{currency(r.revenue)}</div><div className="stat-label">Revenue</div></div>
              <div className="stat"><div className="stat-value">{r.reservationCount}</div><div className="stat-label">Reservations</div></div>
              <div className="stat"><div className="stat-value">{r.orderCount}</div><div className="stat-label">Orders</div></div>
              <div className="stat"><div className="stat-value">{r.paymentCount}</div><div className="stat-label">Payments</div></div>
            </div>

            <div className="grid grid-2 mt">
              <Card title="Most ordered foods">
                {r.mostOrderedFoods.length === 0 ? <p className="muted">No data for this period.</p> : (
                  <table>
                    <thead><tr><th>Food</th><th>Qty</th><th>Revenue</th></tr></thead>
                    <tbody>{r.mostOrderedFoods.map((f, i) => (
                      <tr key={i}><td>{f.name}</td><td>{f.quantity}</td><td>{currency(f.revenue)}</td></tr>
                    ))}</tbody>
                  </table>
                )}
              </Card>

              <Card title="Peak reservation hours">
                {r.peakHours.length === 0 ? <p className="muted">No data for this period.</p> : (
                  <table>
                    <thead><tr><th>Hour</th><th>Reservations</th></tr></thead>
                    <tbody>{r.peakHours.map((h, i) => (
                      <tr key={i}><td>{h.hour}</td><td>{h.reservations}</td></tr>
                    ))}</tbody>
                  </table>
                )}
              </Card>
            </div>

            <Card title="Payment-method usage" className="mt">
              {r.paymentMethods.length === 0 ? <p className="muted">No payments in this period.</p> : (
                <table>
                  <thead><tr><th>Method</th><th>Transactions</th><th>Total</th></tr></thead>
                  <tbody>{r.paymentMethods.map((m, i) => (
                    <tr key={i}><td style={{ textTransform: 'capitalize' }}>{m.method}</td><td>{m.count}</td><td>{currency(m.total)}</td></tr>
                  ))}</tbody>
                </table>
              )}
            </Card>
          </>
        )}
      </AsyncBoundary>
    </>
  );
}
