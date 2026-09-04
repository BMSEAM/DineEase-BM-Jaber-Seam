import { useEffect } from 'react';
import { tableApi } from '../../api/endpoints.js';
import { useAsync } from '../../hooks/useAsync.js';
import { AsyncBoundary } from '../../components/StateViews.jsx';
import { StatusBadge } from '../../components/ui.jsx';

/** F08 view — live table status board for staff. */
export default function StaffTables() {
  const { data, loading, error, reload } = useAsync(() => tableApi.list(), []);
  const tables = data?.data || [];

  // Keep the board current; interval cleaned up on unmount.
  useEffect(() => {
    const t = setInterval(reload, 15000);
    return () => clearInterval(t);
  }, [reload]);

  return (
    <>
      <div className="section-head">
        <div>
          <span className="eyebrow">Floor</span>
          <h2 style={{ margin: 0 }}>Table Status Board</h2>
        </div>
        <button className="btn btn-sm btn-ghost" onClick={reload}>Refresh</button>
      </div>
      <AsyncBoundary loading={loading} error={error} isEmpty={tables.length === 0} onRetry={reload} emptyProps={{ title: 'No tables' }}>
        <div className="grid grid-4 mt">
          {tables.map((t) => (
            <div key={t._id} className="card">
              <div className="card-body center">
                <h3>{t.tableNumber}</h3>
                <p className="text-sm muted">{t.capacity} seats · {t.seatingPreference}</p>
                <StatusBadge status={t.status} />
              </div>
            </div>
          ))}
        </div>
      </AsyncBoundary>
    </>
  );
}
