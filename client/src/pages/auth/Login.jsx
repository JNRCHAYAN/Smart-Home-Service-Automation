import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore.js';
import { apiError } from '../../api/index.js';
import { toast } from '../../store/toastStore.js';
import Button from '../../components/common/Button.jsx';
import { Input, Label, FieldError } from '../../components/common/Field.jsx';

// /login — phone + password form for existing users. Renders one-click demo
// accounts and redirects by role after a successful login.
const DEMO = [
  { role: 'Customer', phone: '01700000000', pass: 'pass1234' },
  { role: 'Provider', phone: '01800000001', pass: 'pass1234' },
  { role: 'Admin', phone: '01900000000', pass: 'admin1234' }
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const next = {};
    if (!/^01\d{9}$/.test(form.phone.trim())) next.phone = 'Enter an 11-digit number starting with 01';
    if (form.password.length < 4) next.password = 'Password must be at least 4 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await login(form.phone.trim(), form.password);
      toast.success(`Welcome back, ${res.user.name.split(' ')[0]}!`);
      navigate(res.user.role === 'provider' ? '/provider' : res.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page flex justify-center py-10 md:py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-fg">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted">Log in to manage your service requests</p>
        </div>

        <form onSubmit={submit} noValidate className="card-surface space-y-4 p-6 shadow-pop sm:p-7">
          <div>
            <Label htmlFor="login-phone" required>
              Phone number
            </Label>
            <Input
              id="login-phone"
              inputMode="numeric"
              autoComplete="tel"
              value={form.phone}
              invalid={!!errors.phone}
              onChange={set('phone')}
              placeholder="01XXXXXXXXX"
              required
            />
            <FieldError id="login-phone-error" message={errors.phone} />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password" required>
                Password
              </Label>
            </div>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              invalid={!!errors.password}
              onChange={set('password')}
              placeholder="At least 4 characters"
              required
            />
            <FieldError id="login-password-error" message={errors.password} />
          </div>

          <Button type="submit" full loading={loading}>
            Log in
          </Button>

          <div className="rounded-xl border border-line bg-inset/60 p-3.5 text-xs leading-relaxed text-muted">
            <p className="mb-1.5 font-semibold text-fg">Demo accounts</p>
            <div className="grid gap-1">
              {DEMO.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => {
                    setForm({ phone: d.phone, password: d.pass });
                    setErrors({});
                  }}
                  className="flex items-center justify-between gap-2 rounded-md px-1.5 py-0.5 text-left transition-colors hover:bg-surface"
                >
                  <span className="font-medium text-muted">{d.role}</span>
                  <span className="tabular-nums text-faint">
                    {d.phone} · {d.pass}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          New here?{' '}
          <Link
            to="/register"
            className="font-semibold text-brand-text hover:text-brand-text hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
