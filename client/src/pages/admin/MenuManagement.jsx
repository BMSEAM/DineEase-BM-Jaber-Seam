import { useState, useEffect } from 'react';
import { menuApi } from '../../api/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { AsyncBoundary } from '../../components/StateViews.jsx';
import { Card, Modal, Field, Badge, currency } from '../../components/ui.jsx';
import FoodImage from '../../components/FoodImage.jsx';

const EMPTY = { name: '', price: '', category: '', description: '', imageUrl: '', isAvailable: true };

// Client-side mirror of the server's http(s) URL rule for immediate feedback.
const isValidImageUrl = (url) => {
  if (!url || !url.trim()) return true; // optional
  try {
    const u = new URL(url.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

/** F12 Menu Management — CRUD items + categories, availability toggle. */
export default function MenuManagement() {
  const toast = useToast();
  const items = useAsync(() => menuApi.list({ limit: 100 }), []);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [newCat, setNewCat] = useState('');

  const loadCats = () => menuApi.categories().then((r) => setCategories(r.data)).catch(() => {});
  useEffect(() => { loadCats(); }, []);

  const save = async (form) => {
    try {
      const body = { ...form, price: Number(form.price) };
      if (form._id) await menuApi.update(form._id, body);
      else await menuApi.create(body);
      toast.success('Menu item saved');
      setEditing(null);
      items.reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggle = async (item) => {
    try {
      await menuApi.setAvailability(item._id, !item.isAvailable);
      items.reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try {
      await menuApi.remove(item._id);
      toast.info('Item deleted');
      items.reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const addCategory = async () => {
    if (!newCat.trim()) return;
    try {
      await menuApi.createCategory({ name: newCat.trim() });
      setNewCat('');
      loadCats();
      toast.success('Category added');
    } catch (err) {
      toast.error(err.message);
    }
  };

  // F12 — rename a category (returns a promise so the row can show a busy state).
  const renameCategory = async (id, name) => {
    await menuApi.updateCategory(id, { name });
    await loadCats();
    items.reload(); // dish rows show category name
    toast.success('Category renamed');
  };

  // F12 — remove a category. The backend returns 409 if any menu item still uses
  // it, so items are never silently orphaned.
  const removeCategory = async (cat) => {
    if (!window.confirm(`Remove category "${cat.name}"? This cannot be undone.`)) return;
    try {
      await menuApi.removeCategory(cat._id);
      await loadCats();
      toast.info('Category removed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const list = items.data?.data || [];

  return (
    <>
      <div className="row between">
        <h1>Menu Management</h1>
        <button className="btn" onClick={() => setEditing({ ...EMPTY })}>+ New item</button>
      </div>

      <Card title="Categories" className="mt">
        {categories.length === 0 && <p className="muted text-sm">No categories yet. Add one below.</p>}
        <div className="stack">
          {categories.map((c) => (
            <CategoryRow key={c._id} category={c} onRename={renameCategory} onRemove={removeCategory} />
          ))}
        </div>
        <div className="row mt">
          <input placeholder="New category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCategory()} style={{ maxWidth: 240 }} />
          <button className="btn btn-sm" onClick={addCategory}>Add category</button>
        </div>
      </Card>

      <AsyncBoundary loading={items.loading} error={items.error} isEmpty={list.length === 0} onRetry={items.reload} emptyProps={{ title: 'No menu items' }}>
        <div className="table-wrap mt">
          <table>
            <thead><tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {list.map((it) => (
                <tr key={it._id}>
                  <td style={{ width: 60 }}><div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden' }}><FoodImage src={it.imageUrl} alt={it.name} /></div></td>
                  <td>{it.name}</td>
                  <td>{it.category?.name}</td>
                  <td>{currency(it.price)}</td>
                  <td>{it.isAvailable ? <Badge tone="success">Available</Badge> : <Badge tone="neutral">Off</Badge>}</td>
                  <td className="row">
                    <button className="btn btn-sm btn-ghost" onClick={() => setEditing({ ...it, category: it.category?._id })}>Edit</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => toggle(it)}>{it.isAvailable ? 'Disable' : 'Enable'}</button>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(it)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AsyncBoundary>

      {editing && (
        <ItemModal item={editing} categories={categories} onClose={() => setEditing(null)} onSave={save} />
      )}
    </>
  );
}

/** A single category row with inline rename and a guarded remove action. */
function CategoryRow({ category, onRename, onRemove }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [busy, setBusy] = useState(false);

  const startEdit = () => { setName(category.name); setEditing(true); };
  const cancel = () => { setEditing(false); setName(category.name); };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return toast.error('Category name is required');
    if (trimmed === category.name) return setEditing(false);
    setBusy(true);
    try {
      await onRename(category._id, trimmed);
      setEditing(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="row between" style={{ gap: '0.5rem' }}>
      {editing ? (
        <>
          <input
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
            style={{ maxWidth: 240 }}
            aria-label={`Rename ${category.name}`}
          />
          <span className="row" style={{ gap: '0.35rem' }}>
            <button className="btn btn-sm" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
            <button className="btn btn-sm btn-ghost" onClick={cancel} disabled={busy}>Cancel</button>
          </span>
        </>
      ) : (
        <>
          <Badge tone="info">{category.name}</Badge>
          <span className="row" style={{ gap: '0.35rem' }}>
            <button className="btn btn-sm btn-ghost" onClick={startEdit} aria-label={`Rename ${category.name}`}>Rename</button>
            <button className="btn btn-sm btn-danger" onClick={() => onRemove(category)} aria-label={`Remove ${category.name}`}>Remove</button>
          </span>
        </>
      )}
    </div>
  );
}

function ItemModal({ item, categories, onClose, onSave }) {
  const [form, setForm] = useState(item);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const urlOk = isValidImageUrl(form.imageUrl);
  const canSave = form.name.trim() && form.category && form.price !== '' && urlOk && !busy;

  const submit = async () => {
    setBusy(true);
    try {
      await onSave(form);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title={form._id ? 'Edit item' : 'New menu item'}
      onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn" onClick={submit} disabled={!canSave}>{busy ? 'Saving…' : 'Save'}</button></>}
    >
      <Field label="Name"><input value={form.name} onChange={set('name')} /></Field>
      <Field label="Category">
        <select value={form.category || ''} onChange={set('category')}>
          <option value="">Select category</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Price"><input type="number" value={form.price} onChange={set('price')} /></Field>
      <Field label="Description"><textarea rows="3" value={form.description} onChange={set('description')} /></Field>
      <Field label="Image URL (http/https, optional)" error={urlOk ? undefined : 'Must be a valid http(s) URL'}>
        <input value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://…" />
      </Field>
      {/* Live preview — uses the same FoodImage fallback customers see. */}
      <div className="field">
        <span className="field-label">Preview</span>
        <div style={{ width: 160, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <FoodImage src={urlOk ? form.imageUrl : ''} alt={form.name || 'Preview'} />
        </div>
      </div>
      <label className="checkbox">
        <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} />
        Available
      </label>
    </Modal>
  );
}
