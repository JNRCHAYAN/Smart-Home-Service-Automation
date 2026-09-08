import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync.js';
import { adminApi, apiError } from '../../api/index.js';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Icon from '../../components/common/Icon.jsx';
import Modal from '../../components/common/Modal.jsx';
import { Input, Select, Label } from '../../components/common/Field.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { toast } from '../../store/toastStore.js';
import { statusClass, formatDate, bdt } from '../../utils/format.js';
import { URGENCY_COLORS } from '../../constants/index.js';

const TABS = [
  { to: '/admin', label: 'Overview', icon: 'dashboard', end: true },
  { to: '/admin/users', label: 'Users', icon: 'user' },
  { to: '/admin/providers', label: 'Providers', icon: 'wrench' },
  { to: '/admin/requests', label: 'Requests', icon: 'list' }
];

export default function AdminDashboard() {
  const { pathname } = useLocation();
  const active = pathname.replace('/admin', '') || '/';

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-900 text-white">
          <Icon name="shield" size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">Admin Control Center</h1>
          <p className="text-sm text-ink-500">
            Manage customers, providers and requests across the platform.
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-ink-100 bg-white p-1.5 shadow-sm">
        {TABS.map((t) => {
          const isActive = t.end ? active === '/' : active.startsWith(t.to.replace('/admin', ''));
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-500 hover:bg-ink-50'
              }`}
            >
              <Icon name={t.icon} size={17} />
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="fade-in">
        {active === '/' && <Overview />}
        {active.startsWith('/users') && <Users />}
        {active.startsWith('/providers') && <Providers />}
        {active.startsWith('/requests') && <Requests />}
      </div>
    </div>
  );
}

function Overview() {
  const { data, loading } = useAsync(() => adminApi.stats(), []);
  if (loading || !data) return <div className="h-24 animate-pulse rounded-2xl bg-brand-100" />;
  const cards = [
    { label: 'Customers', value: data.customers, icon: 'user', color: 'bg-brand-50 text-brand-600' },
    { label: 'Providers', value: data.providers, icon: 'wrench', color: 'bg-accent-50 text-accent-600' },
    { label: 'Total requests', value: data.requests, icon: 'list', color: 'bg-violet-50 text-violet-600' },
    { label: 'Pending', value: data.pending, icon: 'clock', color: 'bg-sky-50 text-sky-600' },
    { label: 'In progress', value: data.active, icon: 'hammer', color: 'bg-orange-50 text-orange-600' },
    { label: 'Completed', value: data.completed, icon: 'check', color: 'bg-green-50 text-green-600' },
    { label: 'Revenue (BDT)', value: data.revenue, icon: 'dollar', color: 'bg-emerald-50 text-emerald-600' }
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label} className="flex items-center gap-3">
          <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.color}`}>
            <Icon name={c.icon} size={20} />
          </span>
          <div>
            <div className="text-2xl font-extrabold text-ink-900">
              {typeof c.value === 'number' ? c.value.toLocaleString() : c.value}
            </div>
            <div className="text-xs font-semibold text-ink-500">{c.label}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Users() {
  const { data, loading, run } = useAsync(() => adminApi.users(), []);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'customer' });
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(null);

  const openEdit = (u) => {
    setEdit(u);
    setForm({ name: u.name || '', email: u.email || '', phone: u.phone || '', role: u.role });
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.updateUser(edit._id, form);
      toast.success('User updated');
      setEdit(null);
      await run();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (u) => {
    if (!confirm(`Delete ${u.name} and their provider profile?`)) return;
    setBusy(u._id);
    try {
      await adminApi.deleteUser(u._id);
      toast.success('User deleted');
      await run();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <div className="h-24 animate-pulse rounded-2xl bg-brand-100" />;

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {(data || []).map((u) => (
              <tr key={u._id} className="hover:bg-ink-50/50">
                <td className="px-4 py-3 font-semibold text-ink-800">{u.name}</td>
                <td className="px-4 py-3 text-ink-500">{u.phone}</td>
                <td className="px-4 py-3 text-ink-500">{u.email || '—'}</td>
                <td className="px-4 py-3">
                  <Badge
                    className={
                      u.role === 'provider' ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'
                    }
                  >
                    {u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-ink-500">{u.provider?.businessName || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button size="sm" variant="secondary" icon="settings" onClick={() => openEdit(u)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      icon="ban"
                      loading={busy === u._id}
                      onClick={() => remove(u)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit user">
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label>Role</Label>
            <Select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              options={[
                { value: 'customer', label: 'Customer' },
                { value: 'provider', label: 'Provider' }
              ]}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving} icon="check">
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Providers() {
  const { data, loading, run } = useAsync(() => adminApi.providers(), []);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ businessName: '', rating: 0, isActive: true });
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(null);

  const openEdit = (p) => {
    setEdit(p);
    setForm({ businessName: p.businessName || '', rating: p.rating || 0, isActive: p.isActive !== false });
  };

  const toggle = async (p) => {
    setBusy(p._id);
    try {
      await adminApi.updateProvider(p._id, { isActive: p.isActive === false });
      toast.success(p.isActive === false ? 'Provider activated' : 'Provider deactivated');
      await run();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.updateProvider(edit._id, {
        businessName: form.businessName,
        rating: Number(form.rating),
        isActive: form.isActive
      });
      toast.success('Provider updated');
      setEdit(null);
      await run();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-24 animate-pulse rounded-2xl bg-brand-100" />;

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Services</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Load</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {(data || []).map((p) => (
              <tr key={p._id} className="hover:bg-ink-50/50">
                <td className="px-4 py-3 font-semibold text-ink-800">{p.businessName}</td>
                <td className="px-4 py-3 text-ink-500">
                  <span className="line-clamp-1 max-w-[180px]">{(p.serviceTypes || []).join(', ')}</span>
                </td>
                <td className="px-4 py-3 text-ink-600">{Number(p.rating || 0).toFixed(1)} ★</td>
                <td className="px-4 py-3 text-ink-500">{p.activeJobCount || 0}</td>
                <td className="px-4 py-3">
                  <Badge
                    className={
                      p.isActive === false ? 'bg-rose-100 text-rose-700' : 'bg-green-100 text-green-700'
                    }
                  >
                    {p.isActive === false ? 'Inactive' : 'Active'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button size="sm" variant="secondary" icon="settings" onClick={() => openEdit(p)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={p.isActive === false ? 'primary' : 'danger'}
                      icon="ban"
                      loading={busy === p._id}
                      onClick={() => toggle(p)}
                    >
                      {p.isActive === false ? 'Activate' : 'Deactivate'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit provider">
        <div className="space-y-3">
          <div>
            <Label>Business name</Label>
            <Input
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            />
          </div>
          <div>
            <Label>Rating (0–5)</Label>
            <Input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-ink-100 px-4 py-3">
            <span className="text-sm font-semibold text-ink-700">Active</span>
            <button
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.isActive ? 'bg-brand-600' : 'bg-ink-200'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.isActive ? 'left-5' : 'left-0.5'}`}
              />
            </button>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving} icon="check">
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Requests() {
  const { data, loading } = useAsync(() => adminApi.requests(), []);
  if (loading) return <div className="h-24 animate-pulse rounded-2xl bg-brand-100" />;
  if (!data || data.length === 0)
    return (
      <Card>
        <EmptyState
          icon="inbox"
          title="No requests yet"
          hint="Requests from all customers will appear here."
        />
      </Card>
    );

  return (
    <div className="space-y-3">
      {data.map((r) => (
        <Card key={r._id} className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-ink-900">{r.serviceType}</h3>
              <Badge className={URGENCY_COLORS[r.urgency]}>{r.urgency}</Badge>
              <Badge className={statusClass(r.status)}>{r.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-ink-500">
              {r.contact?.name} · {r.contact?.phone} · {r.category} · {formatDate(r.preferredDate)}
            </p>
          </div>
          <div className="shrink-0 text-right text-xs text-ink-400">
            <div>{formatDate(r.createdAt)}</div>
            <div className="mt-1 font-semibold text-ink-600">{r.location?.address || '—'}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
