import { adminApi } from '../../api/endpoints.js';
import { useAsync } from '../../hooks/useAsync.js';
import { AsyncBoundary } from '../../components/StateViews.jsx';
import { Card, currency } from '../../components/ui.jsx';

/** F18 Admin Dashboard — operational snapshot. */
export default function AdminDashboard() {
  const { data, loading, error, reload } = useAsync(() => adminApi.dashboard(), []);
  const d = data?.data;

  const Stat = ({ value, label }) => (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );

  return (
    <>
      <div className="row between">
        <h1>Admin Dashboard</h1>
        <button className="btn btn-sm btn-ghost" onClick={reload}>Refresh</button>
      </div>

      <AsyncBoundary loading={loading} error={error} isEmpty={false} onRetry={reload}>
        {d && (
          <>
            <h3 className="mt">Reservations</h3>
            <div className="grid grid-4">
              <Stat value={d.reservations.today} label="Today's reservations" />
              <Stat value={d.reservations.pending} label="Pending approval" />
              <Stat value={d.reservations.approved} label="Approved" />
            </div>

            <h3 className="mt">Tables & Orders</h3>
            <div className="grid grid-4">
              <Stat value={d.tables.available} label="Available tables" />
              <Stat value={d.tables.occupied} label="Occupied tables" />
              <Stat value={d.tables.cleaning} label="Being cleaned" />
              <Stat value={d.ordersInProgress} label="Orders in progress" />
            </div>

            <h3 className="mt">Business</h3>
            <div className="grid grid-4">
              <Stat value={currency(d.revenueToday)} label="Revenue today" />
              <Stat value={d.customerCount} label="Customers" />
              <Stat value={d.staffCount} label="Staff" />
            </div>

            <Card className="mt">
              <p className="muted text-sm">
                Live snapshot aggregated from reservations, tables, orders and payments.
                Use the Reports page for daily/weekly/monthly breakdowns.
              </p>
            </Card>
          </>
        )}
      </AsyncBoundary>
    </>
  );
}
