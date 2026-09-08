import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore.js';
import { apiError } from '../../api/index.js';
import { toast } from '../../store/toastStore.js';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import { Input, Label } from '../../components/common/Field.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ phone: '01700000000', password: 'pass1234' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form.phone, form.password);
      toast.success(`Welcome back, ${res.user.name.split(' ')[0]}!`);
      navigate(res.user.role === 'provider' ? '/provider' : res.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-ink-900">Welcome back</h1>
      <p className="mb-6 text-sm text-ink-400">Log in to manage your service requests</p>
      <Card className="w-full">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Phone number</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="01XXXXXXXXX"
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" full loading={loading}>
            Log in
          </Button>
        </form>
        <div className="mt-4 space-y-1 rounded-xl bg-brand-50 px-4 py-3 text-xs text-ink-600">
          <strong className="text-brand-700">Demo accounts</strong>
          <p>Customer — 01700000000 · pass1234</p>
          <p>Provider — 01800000001 · pass1234</p>
          <p>Admin — 01900000000 · admin1234</p>
        </div>
        <p className="mt-4 text-center text-sm text-ink-400">
          New here?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:underline">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
}
