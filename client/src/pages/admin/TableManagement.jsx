import { useState } from 'react';
import { tableApi } from '../../api/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { AsyncBoundary } from '../../components/StateViews.jsx';
import { Modal, Field, StatusBadge } from '../../components/ui.jsx';
import { SEATING } from '../../constants.js';

const EMPTY = { tableNumber: '', capacity: 2, seatingPreference: 'any' };

/** F13 Table Management. */
export default function TableManagement() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => tableApi.list(), []);
  const [editing, setEditing] = useState(null);
  const tables = data?.data || [];

  const save = async (form) => {
    try {
      if (form._id) await tableApi.update(form._id, { tableNumber: form.tableNumber, capacity: Number(form.capacity), seatingPreference: form.seatingPreference });
      else await tableApi.create({ ...form, capacity: Number(form.capacity) });
      toast.success('Table saved');
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggle = async (t) => {
    try {
      if (t.isActive) await tableApi.disable(t._id);
      else await tableApi.enable(t._id);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div className="row between">
        <h1>Table Management</h1>
        <button className="btn" onClick={() => setEditing({ ...EMPTY })}>+ New table</button>
      </div>

      <AsyncBoundary loading={loading} error={error} isEmpty={tables.length === 0} onRetry={reload} emptyProps={{ title: 'No tables yet' }}>
        <div className="grid grid-4 mt">
          {tables.map((t) => (
            <div key={t._id} className="card">
              <div className="card-body">
                <div className="row between">
                  <strong>{t.tableNumber}</strong>
                  <StatusBadge status={t.status} />
                </div>
                <p className="text-sm muted">{t.capacity} seats · {t.seatingPreference}</p>
                <div className="row mt">
                  <button className="btn btn-sm btn-ghost" onClick={() => setEditing(t)}>Edit</button>
                  <button className={`btn btn-sm ${t.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => toggle(t)}>
                    {t.isActive ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AsyncBoundary>

      {editing && <TableModal table={editing} onClose={() => setEditing(null)} onSave={save} />}
    </>
  );
}

function TableModal({ table, onClose, onSave }) {
  const [form, setForm] = useState(table);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <Modal
      open
      title={form._id ? 'Edit table' : 'New table'}
      onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn" onClick={() => onSave(form)}>Save</button></>}
    >
      <Field label="Table number"><input value={form.tableNumber} onChange={set('tableNumber')} /></Field>
      <Field label="Capacity"><input type="number" min="1" max="20" value={form.capacity} onChange={set('capacity')} /></Field>
      <Field label="Seating preference">
        <select value={form.seatingPreference} onChange={set('seatingPreference')}>
          {SEATING.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
    </Modal>
  );
}
