import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, Field } from '../components/ui.jsx';

const DEMO = [
  ['Admin', 'admin@dineease.com'],
  ['Waiter', 'waiter@dineease.com'],
  ['Cleaner', 'cleaner@dineease.com'],
  ['Customer', 'customer@dineease.com'],
];

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(form);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <Card className="auth-card" title="🍽️ Sign in to DineEase">
        <form onSubmit={submit}>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </Field>
          <button className="btn btn-block" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="text-sm muted mt">
          No account? <Link to="/register" style={{ color: 'var(--brand)' }}>Register</Link>
          {' · '}
          <Link to="/menu" style={{ color: 'var(--brand)' }}>Browse the menu</Link>
        </p>
        <div className="mt">
          <p className="text-sm muted">Demo accounts (password: <code>password123</code>):</p>
          <div className="row">
            {DEMO.map(([label, email]) => (
              <button
                key={email}
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setForm({ email, password: 'password123' })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
