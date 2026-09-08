import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore.js';
import { apiError } from '../../api/index.js';
import { toast } from '../../store/toastStore.js';
import Button from '../../components/common/Button.jsx';
import Icon from '../../components/common/Icon.jsx';
import { Input, Label, FieldError } from '../../components/common/Field.jsx';
import { cn } from '../../utils/cn.js';

// /register — account creation for customers or providers. Providers pick a
// role toggle that reveals the businessName field; that key is dropped from the
// payload unless the role is provider.
const ROLES = [
  { value: 'customer', label: 'I need services', icon: 'home' },
  { value: 'provider', label: 'I offer services', icon: 'wrench' }
];

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
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Please enter your full name';
    if (!/^01\d{9}$/.test(form.phone.trim())) next.phone = 'Enter an 11-digit number starting with 01';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (form.password.length < 4) next.password = 'Password must be at least 4 characters';
    if (role === 'provider' && form.businessName.trim().length < 2)
      next.businessName = 'Enter your business name';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
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
    <div className="container-page flex justify-center py-10 md:py-14">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-fg">Create account</h1>
          <p className="mt-1.5 text-sm text-muted">Join Servio as a customer or service provider</p>
        </div>

        <form onSubmit={submit} noValidate className="card-surface space-y-4 p-6 shadow-pop sm:p-7">
          <fieldset>
            <legend className="sr-only">Account type</legend>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Account type">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  aria-pressed={role === r.value}
                  onClick={() => setRole(r.value)}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors',
                    role === r.value
                      ? 'border-brand bg-brand-soft text-brand-text'
                      : 'border-line text-muted hover:border-line2 hover:bg-inset'
                  )}
                >
                  <Icon name={r.icon} size={16} aria-hidden="true" />
                  {r.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <Label htmlFor="reg-name" required>
              Full name
            </Label>
            <Input
              id="reg-name"
              autoComplete="name"
              value={form.name}
              invalid={!!errors.name}
              onChange={set('name')}
              placeholder="e.g. Aminul Rahman"
            />
            <FieldError message={errors.name} />
          </div>

          <div>
            <Label htmlFor="reg-phone" required>
              Phone
            </Label>
            <Input
              id="reg-phone"
              inputMode="numeric"
              autoComplete="tel"
              value={form.phone}
              invalid={!!errors.phone}
              onChange={set('phone')}
              placeholder="01XXXXXXXXX"
            />
            <FieldError message={errors.phone} />
          </div>

          <div>
            <Label htmlFor="reg-email" hint="Optional">
              Email
            </Label>
            <Input
              id="reg-email"
              type="email"
              autoComplete="email"
              value={form.email}
              invalid={!!errors.email}
              onChange={set('email')}
              placeholder="you@email.com"
            />
            <FieldError message={errors.email} />
          </div>

          <div>
            <Label htmlFor="reg-password" required>
              Password
            </Label>
            <Input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              invalid={!!errors.password}
              onChange={set('password')}
              placeholder="At least 4 characters"
            />
            <FieldError message={errors.password} />
          </div>

          {role === 'provider' && (
            <div className="animate-pop-in">
              <Label htmlFor="reg-business" required>
                Business name
              </Label>
              <Input
                id="reg-business"
                autoComplete="organization"
                value={form.businessName}
                invalid={!!errors.businessName}
                onChange={set('businessName')}
                placeholder="e.g. Rahim Electronics"
              />
              <FieldError message={errors.businessName} />
            </div>
          )}

          <Button type="submit" full loading={loading}>
            Create account
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-text hover:text-brand-text hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
