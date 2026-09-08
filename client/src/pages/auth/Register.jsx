import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore.js';
import { apiError } from '../../api/index.js';
import { toast } from '../../store/toastStore.js';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import { Input, Label } from '../../components/common/Field.jsx';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [role, setRole] = useState('customer');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    businessName: ''
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, role };
      if (role !== 'provider') delete payload.businessName;
      const res = await register(payload);
      toast.success('Account created — welcome!');
      navigate(res.user.role === 'provider' ? '/provider' : '/');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-14">
      <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-ink-900">Create account</h1>
      <p className="mb-6 text-sm text-ink-400">Join Servio as a customer or service provider</p>

      <div className="mb-4 grid w-full grid-cols-2 gap-2 rounded-xl bg-ink-100 p-1">
        {['customer', 'provider'].map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`rounded-lg py-2 text-sm font-semibold capitalize transition-colors ${
              role === r ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-400'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <Card className="w-full">
        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <Label>Full name</Label>
            <Input value={form.name} onChange={set('name')} placeholder="Your full name" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={set('phone')} placeholder="01XXXXXXXXX" />
          </div>
          <div>
            <Label>Email (optional)</Label>
            <Input type="email" value={form.email} onChange={set('email')} placeholder="you@email.com" />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={form.password} onChange={set('password')} placeholder="min 4 characters" />
          </div>
          {role === 'provider' && (
            <div>
              <Label>Business name</Label>
              <Input value={form.businessName} onChange={set('businessName')} placeholder="e.g. Rahim Electronics" />
            </div>
          )}
          <Button type="submit" full loading={loading}>
            Create account
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
