import { useEffect, useState } from 'react';
import { cleaningApi, tableApi } from '../../api/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { AsyncBoundary } from '../../components/StateViews.jsx';
import { Card, StatusBadge, Field, Modal, Badge } from '../../components/ui.jsx';

const AREAS = [
  { value: 'table', label: 'Table' },
  { value: 'floor', label: 'Floor' },
  { value: 'window', label: 'Window' },
  { value: 'restroom', label: 'Restroom' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'general', label: 'General' },
];
const areaLabel = (a) => AREAS.find((x) => x.value === a)?.label || 'Table';
const AREA_EMOJI = { table: '🍽️', floor: '🧹', window: '🪟', restroom: '🚻', kitchen: '🍳', general: '🧽' };

/** F15 Cleaning Workflow — cleaner queue with manual task creation. */
export default function CleaningTasks() {
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isCleaner = user?.role === 'cleaner';
  const { data, loading, error, reload } = useAsync(() => cleaningApi.tasks(), []);
  const tasks = data?.data || [];
  const [busyId, setBusyId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);

  // Poll for new tasks every 15s; cleaned up on unmount.
  useEffect(() => {
    const t = setInterval(reload, 15000);
    return () => clearInterval(t);
  }, [reload]);

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

  const visible = mineOnly ? tasks.filter((t) => t.status === 'in_progress') : tasks;

  return (
    <>
      <div className="section-head">
        <div>
          <span className="eyebrow">Housekeeping</span>
          <h2 style={{ margin: 0 }}>Cleaning Tasks</h2>
          <p>
            {isAdmin
              ? 'Assign cleaning work here. Tables also appear automatically after a waiter completes dining.'
              : 'Your cleaning queue. Tables appear after a waiter completes dining; the admin can also assign floor, window and other tasks.'}
          </p>
        </div>
        <div className="row" style={{ gap: '0.5rem' }}>
          <button className={`btn btn-sm ${mineOnly ? '' : 'btn-ghost'}`} onClick={() => setMineOnly((v) => !v)}>{mineOnly ? 'Showing in-progress' : 'Show all'}</button>
          <button className="btn btn-sm btn-ghost" onClick={reload}>Refresh</button>
          {isAdmin && <button className="btn btn-sm" onClick={() => setCreating(true)}>+ New task</button>}
        </div>
      </div>

      <AsyncBoundary loading={loading} error={error} isEmpty={visible.length === 0} onRetry={reload} emptyProps={{ title: 'No cleaning tasks', hint: 'Add one with “New task”, or wait for a waiter to complete dining.', emoji: '🧽' }}>
        <div className="grid grid-3">
          {visible.map((t) => (
            <Card
              key={t._id}
              title={<span>{AREA_EMOJI[t.area] || '🧽'} {t.area === 'table' ? `Table ${t.table?.tableNumber || ''}` : areaLabel(t.area)}</span>}
              actions={<StatusBadge status={t.status} />}
            >
              <div className="row" style={{ gap: '0.4rem', marginBottom: 4 }}>
                <Badge tone="info">{areaLabel(t.area)}</Badge>
                {t.reservation ? <Badge tone="neutral">from dining</Badge> : <Badge tone="neutral">manual</Badge>}
              </div>
              {t.location && <p className="text-sm">📍 {t.location}</p>}
              {t.description && <p className="text-sm muted">{t.description}</p>}
              <p className="text-sm muted">Raised by {t.raisedBy?.name || 'staff'}</p>
              {t.cleaner && <p className="text-sm muted">Cleaner: {t.cleaner.name}</p>}
              <p className="text-sm muted">{new Date(t.createdAt).toLocaleString()}</p>
              <div className="row mt">
                {isCleaner && t.status === 'pending' && (
                  <button className="btn btn-sm" disabled={busyId === t._id} onClick={() => act(cleaningApi.start, t._id, 'Cleaning started')}>Start cleaning</button>
                )}
                {isCleaner && t.status === 'in_progress' && (
                  <button className="btn btn-sm btn-success" disabled={busyId === t._id} onClick={() => act(cleaningApi.ready, t._id, 'Marked ready')}>Mark ready</button>
                )}
                {t.status === 'done' && <span className="pill">Completed</span>}
                {/* Admin has oversight only — the cleaning itself is the cleaner's job. */}
                {isAdmin && t.status !== 'done' && <span className="text-sm muted">Awaiting cleaner</span>}
              </div>
            </Card>
          ))}
        </div>
      </AsyncBoundary>

      {creating && <NewTaskModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); reload(); }} />}
    </>
  );
}

function NewTaskModal({ onClose, onCreated }) {
  const toast = useToast();
  const [area, setArea] = useState('floor');
  const [table, setTable] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [tables, setTables] = useState([]);

  useEffect(() => {
    tableApi.list().then((r) => setTables(r.data)).catch(() => {});
  }, []);

  const canSave = (area !== 'table' || table) && !busy;

  const submit = async () => {
    setBusy(true);
    try {
      await cleaningApi.create({
        area,
        table: area === 'table' ? table : undefined,
        location: location.trim(),
        description: description.trim(),
      });
      toast.success('Cleaning task created');
      onCreated();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title="New cleaning task"
      onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button><button className="btn" onClick={submit} disabled={!canSave}>{busy ? 'Creating…' : 'Create task'}</button></>}
    >
      <Field label="Area">
        <select value={area} onChange={(e) => setArea(e.target.value)}>
          {AREAS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </Field>
      {area === 'table' ? (
        <Field label="Table">
          <select value={table} onChange={(e) => setTable(e.target.value)}>
            <option value="">Select a table</option>
            {tables.map((t) => <option key={t._id} value={t._id}>Table {t.tableNumber} · {t.capacity}p</option>)}
          </select>
        </Field>
      ) : (
        <Field label="Location (optional)">
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Main hall floor, Front window" maxLength={120} />
        </Field>
      )}
      <Field label="Notes (optional)">
        <textarea rows="3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Anything the cleaner should know" maxLength={300} />
      </Field>
    </Modal>
  );
}
