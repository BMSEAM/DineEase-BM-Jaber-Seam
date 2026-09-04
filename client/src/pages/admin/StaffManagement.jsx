import { useState } from 'react';
import { staffApi } from '../../api/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { AsyncBoundary } from '../../components/StateViews.jsx';
import { Modal, Field, Badge } from '../../components/ui.jsx';

const EMPTY = { name: '', email: '', password: '', phone: '', role: 'waiter' };

/** F14 Staff Management — create/update/disable staff, assign roles. */
export default function StaffManagement() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => staffApi.list(), []);
  const [creating, setCreating] = useState(false);
  const staff = data?.data || [];

  const create = async (form) => {
    try {
      await staffApi.create(form);
      toast.success('Staff account created');
      setCreating(false);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const changeRole = async (u, role) => {
    try {
      await staffApi.update(u._id, { role });
      toast.success('Role updated');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggle = async (u) => {
    try {
      if (u.isActive) await staffApi.disable(u._id);
      else await staffApi.enable(u._id);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div className="row between">
        <h1>Staff Management</h1>
        <button className="btn" onClick={() => setCreating(true)}>+ New staff</button>
      </div>

      <AsyncBoundary loading={loading} error={error} isEmpty={staff.length === 0} onRetry={reload} emptyProps={{ title: 'No staff accounts' }}>
        <div className="table-wrap mt">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {staff.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    {u.role === 'admin' ? <Badge tone="danger">admin</Badge> : (
                      <select value={u.role} onChange={(e) => changeRole(u, e.target.value)} style={{ width: 120 }}>
                        <option value="waiter">waiter</option>
                        <option value="cleaner">cleaner</option>
                      </select>
                    )}
                  </td>
                  <td>{u.isActive ? <Badge tone="success">active</Badge> : <Badge tone="neutral">disabled</Badge>}</td>
                  <td>
                    {u.role !== 'admin' && (
                      <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => toggle(u)}>
                        {u.isActive ? 'Disable' : 'Enable'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AsyncBoundary>

      {creating && <StaffModal onClose={() => setCreating(false)} onSave={create} />}
    </>
  );
}

function StaffModal({ onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <Modal
      open
      title="New staff account"
      onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn" onClick={() => onSave(form)}>Create</button></>}
    >
      <Field label="Name"><input value={form.name} onChange={set('name')} /></Field>
      <Field label="Email"><input type="email" value={form.email} onChange={set('email')} /></Field>
      <Field label="Temporary password"><input value={form.password} onChange={set('password')} /></Field>
      <Field label="Phone"><input value={form.phone} onChange={set('phone')} /></Field>
      <Field label="Role">
        <select value={form.role} onChange={set('role')}>
          <option value="waiter">Waiter</option>
          <option value="cleaner">Cleaner</option>
          <option value="admin">Admin</option>
        </select>
      </Field>
    </Modal>
  );
}
