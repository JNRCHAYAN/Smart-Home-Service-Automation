import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync.js';
import { adminApi, apiError } from '../../api/index.js';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Icon from '../../components/common/Icon.jsx';
import Modal from '../../components/common/Modal.jsx';
import { Input, Select, Label } from '../../components/common/Field.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { toast } from '../../store/toastStore.js';
import { statusClass, formatDate, bdt } from '../../utils/format.js';
import { URGENCY_VARIANTS } from '../../constants/index.js';
import { cn } from '../../utils/cn.js';

// /admin/* — admin console shell. It derives the active section from the URL
// and swaps in Overview / Users / Providers / Requests sub-views (each in this
// file); CRUD runs through adminApi and re-runs the loader after mutations.
const TABS = [
  { to: '/admin', label: 'Overview', icon: 'dashboard', end: true },
  { to: '/admin/users', label: 'Users', icon: 'users' },
  { to: '/admin/providers', label: 'Providers', icon: 'building' },
  { to: '/admin/requests', label: 'Requests', icon: 'list' }
];

export default function AdminDashboard() {
  const { pathname } = useLocation();
  // Turn /admin/users into "/users" so the section tabs can match on prefixes.
  const active = pathname.replace('/admin', '') || '/';

  return (
    <div className="container-page page-shell">
      <header className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-inset text-fg">
          <Icon name="shield" size={22} aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-fg">Admin console</h1>
          <p className="text-sm text-muted">Manage customers, providers and requests across the platform.</p>
        </div>
      </header>

      <nav
        aria-label="Admin sections"
        className="mb-6 flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1.5"
      >
        {TABS.map((t) => {
          const isActive = t.end ? active === '/' : active.startsWith(t.to.replace('/admin', ''));
          return (
            <Link
              key={t.to}
              to={t.to}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors',
                isActive ? 'bg-brand text-white' : 'text-muted hover:bg-inset hover:text-fg'
              )}
            >
              <Icon name={t.icon} size={16} aria-hidden="true" />
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div key={active} className="animate-fade-in">
        {active === '/' && <Overview />}
        {active.startsWith('/users') && <Users />}
        {active.startsWith('/providers') && <Providers />}
        {active.startsWith('/requests') && <Requests />}
      </div>
    </div>
  );
}

const CARD_TONES = {
  brand: 'bg-brand-soft text-brand-text',
  info: 'bg-info-soft text-info-text',
  success: 'bg-success-soft text-success-text',
  warning: 'bg-warning-soft text-warning-text',
  danger: 'bg-danger-soft text-danger-text'
};

// Grid of the big-number stat tiles used by Overview.
function StatCards({ cards }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="card-surface flex items-center gap-3 p-4">
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              CARD_TONES[c.tone]
            )}
          >
            <Icon name={c.icon} size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="truncate font-heading text-2xl font-extrabold tabular-nums text-fg">
              {typeof c.value === 'number' ? c.value.toLocaleString() : c.value}
            </div>
            <div className="truncate text-xs font-semibold text-muted">{c.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="card-surface space-y-3 p-5">
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

// Sub-views mounted by AdminDashboard based on the URL segment.
function Overview() {
  // Platform-wide counters from /admin/stats.
  const { data, loading } = useAsync(() => adminApi.stats(), []);
  if (loading || !data)
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );

  const cards = [
    { label: 'Customers', value: data.customers, icon: 'users', tone: 'brand' },
    { label: 'Providers', value: data.providers, icon: 'building', tone: 'info' },
    { label: 'Total requests', value: data.requests, icon: 'list', tone: 'warning' },
    { label: 'Pending', value: data.pending, icon: 'clock', tone: 'info' },
    { label: 'In progress', value: data.active, icon: 'hammer', tone: 'warning' },
    { label: 'Completed', value: data.completed, icon: 'checkcircle', tone: 'success' },
    { label: 'Revenue', value: bdt(data.revenue), icon: 'dollar', tone: 'success' },
    { label: 'Cancelled / rejected', value: data.failed ?? 0, icon: 'ban', tone: 'danger' }
  ];
  return <StatCards cards={cards} />;
}

// Compact icon-only row action button (edit / delete / activate rows).
function IconAction({ label, onClick, tone = 'neutral', icon }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg border border-line transition-colors',
        tone === 'danger'
          ? 'text-danger-text hover:border-danger-border hover:bg-danger-soft'
          : tone === 'brand'
            ? 'text-brand-text hover:border-brand-border hover:bg-brand-soft'
            : 'text-muted hover:bg-inset hover:text-fg'
      )}
    >
      <Icon name={icon} size={16} aria-hidden="true" />
    </button>
  );
}

// All users with edit (name/email/phone/role) and delete actions.
function Users() {
  const { data, loading, run } = useAsync(() => adminApi.users(), []);
  const [edit, setEdit] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'customer' });
  const [saving, setSaving] = useState(false);

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

  const remove = async () => {
    setDeleting(true);
    try {
      await adminApi.deleteUser(deleteTarget._id);
      toast.success('User deleted');
      setDeleteTarget(null);
      await run();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="card-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-5 py-3">
                User
              </th>
              <th scope="col" className="px-5 py-3">
                Phone
              </th>
              <th scope="col" className="px-5 py-3">
                Email
              </th>
              <th scope="col" className="px-5 py-3">
                Role
              </th>
              <th scope="col" className="px-5 py-3">
                Business
              </th>
              <th scope="col" className="px-5 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(data || []).map((u) => (
              <tr key={u._id} className="transition-colors hover:bg-inset/50">
                <td className="px-5 py-3 font-semibold text-fg">{u.name}</td>
                <td className="px-5 py-3 tabular-nums text-muted">{u.phone}</td>
                <td className="px-5 py-3 text-muted">{u.email || '—'}</td>
                <td className="px-5 py-3">
                  <Badge variant={u.role === 'provider' ? 'brand' : 'neutral'}>{u.role}</Badge>
                </td>
                <td className="px-5 py-3 text-muted">{u.provider?.businessName || '—'}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1.5">
                    <IconAction label="Edit user" icon="edit" tone="brand" onClick={() => openEdit(u)} />
                    <IconAction
                      label="Delete user"
                      icon="trash"
                      tone="danger"
                      onClick={() => setDeleteTarget(u)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title="Edit user"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving} icon="check">
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="au-name">Name</Label>
            <Input
              id="au-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="au-phone">Phone</Label>
            <Input
              id="au-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="au-email">Email</Label>
            <Input
              id="au-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="au-role">Role</Label>
            <Select
              id="au-role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              options={[
                { value: 'customer', label: 'Customer' },
                { value: 'provider', label: 'Provider' }
              ]}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete user?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} icon="trash" onClick={remove}>
              Delete user
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger-text">
            <Icon name="alert" size={20} aria-hidden="true" />
          </span>
          <p className="text-sm leading-relaxed text-muted">
            <strong className="text-fg">{deleteTarget?.name}</strong> and their provider profile will be
            permanently removed. This cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
}

// Provider rows with activate/deactivate toggle and editable business profile.
function Providers() {
  const { data, loading, run } = useAsync(() => adminApi.providers(), []);
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(null);
  const [form, setForm] = useState({ businessName: '', rating: 0, isActive: true });
  const [saving, setSaving] = useState(false);

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

  if (loading) return <TableSkeleton />;

  return (
    <div className="card-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-5 py-3">
                Business
              </th>
              <th scope="col" className="px-5 py-3">
                Services
              </th>
              <th scope="col" className="px-5 py-3">
                Rating
              </th>
              <th scope="col" className="px-5 py-3">
                Load
              </th>
              <th scope="col" className="px-5 py-3">
                Status
              </th>
              <th scope="col" className="px-5 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(data || []).map((p) => {
              const inactive = p.isActive === false;
              return (
                <tr key={p._id} className="transition-colors hover:bg-inset/50">
                  <td className="px-5 py-3 font-semibold text-fg">{p.businessName}</td>
                  <td className="max-w-[16rem] truncate px-5 py-3 text-muted">
                    {(p.serviceTypes || []).join(', ') || '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1 font-medium text-fg">
                      <Icon
                        name="star"
                        size={13}
                        className="fill-amber-400 text-amber-400"
                        aria-hidden="true"
                      />
                      {Number(p.rating || 0).toFixed(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3 tabular-nums text-muted">{p.activeJobCount || 0}</td>
                  <td className="px-5 py-3">
                    <Badge variant={inactive ? 'danger' : 'success'}>
                      {inactive ? 'Inactive' : 'Active'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1.5">
                      <IconAction
                        label="Edit provider"
                        icon="edit"
                        tone="brand"
                        onClick={() => openEdit(p)}
                      />
                      <Button
                        size="sm"
                        variant={inactive ? 'primary' : 'secondary'}
                        loading={busy === p._id}
                        onClick={() => toggle(p)}
                      >
                        {inactive ? 'Activate' : 'Deactivate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title="Edit provider"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving} icon="check">
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="ap-name">Business name</Label>
            <Input
              id="ap-name"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ap-rating">Rating (0–5)</Label>
            <Input
              id="ap-rating"
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-fg">Active</div>
              <div className="text-xs text-muted">Receives new matches</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.isActive}
              aria-label="Provider active"
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                form.isActive ? 'bg-brand' : 'bg-line2'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
                  form.isActive ? 'left-[1.375rem]' : 'left-0.5'
                )}
              />
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Read-only feed of every request across the platform.
function Requests() {
  const { data, loading } = useAsync(() => adminApi.requests(), []);
  if (loading) return <TableSkeleton />;
  if (!data || data.length === 0)
    return (
      <div className="card-surface">
        <EmptyState
          icon="inbox"
          title="No requests yet"
          hint="Requests from all customers will appear here."
        />
      </div>
    );

  return (
    <ul className="space-y-3">
      {data.map((r) => (
        <li
          key={r._id}
          className="card-surface flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-[15px] font-bold text-fg">{r.serviceType}</h3>
              <Badge variant={URGENCY_VARIANTS[r.urgency] || 'neutral'}>{r.urgency}</Badge>
              <Badge variant={statusClass(r.status)}>{r.status}</Badge>
            </div>
            <p className="mt-1.5 text-sm text-muted">
              {r.contact?.name} · {r.contact?.phone} · {r.category} · {formatDate(r.preferredDate)}
            </p>
          </div>
          <div className="shrink-0 text-left text-xs text-muted sm:text-right">
            <div>{formatDate(r.createdAt)}</div>
            <div className="mt-1 inline-flex items-center gap-1 font-semibold text-fg">
              <Icon name="mappin" size={12} aria-hidden="true" />
              {r.location?.address || '—'}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
