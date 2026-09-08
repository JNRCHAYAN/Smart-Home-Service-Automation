import { useEffect, useMemo, useState } from 'react';
import { useAsync } from '../hooks/useAsync.js';
import { authApi, servicesApi, profileApi, apiError } from '../api/index.js';
import { useAuth } from '../store/authStore.js';
import { toast } from '../store/toastStore.js';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Icon from '../components/common/Icon.jsx';
import { Input, Select, Label } from '../components/common/Field.jsx';
import { Skeleton } from '../components/common/Skeleton.jsx';
import { DHK_AREAS } from '../constants/index.js';
import { formatDate } from '../utils/format.js';
import { cn } from '../utils/cn.js';

const WINDOWS = [
  { start: '09:00', end: '12:00' },
  { start: '12:00', end: '15:00' },
  { start: '15:00', end: '18:00' }
];

function nextDays(n = 7) {
  const out = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const c = new Date(d);
    c.setDate(d.getDate() + i);
    out.push(c.toISOString().slice(0, 10));
  }
  return out;
}

export default function Settings() {
  const { user } = useAuth();
  const [tab, setTab] = useState(user?.role === 'provider' ? 'provider' : 'profile');
  const tabs = user?.role === 'provider' ? ['profile', 'provider'] : ['profile'];

  return (
    <div className="container-page page-shell">
      <header className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
          <Icon name="user" size={22} aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-fg">
            Profile & settings
          </h1>
          <p className="text-sm text-muted">Manage your account and service preferences.</p>
        </div>
      </header>

      <div className="mb-6 inline-flex w-full gap-1 rounded-xl border border-line bg-surface p-1 sm:w-auto">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 rounded-lg px-5 py-2 text-sm font-semibold capitalize transition-colors sm:flex-none',
              tab === t ? 'bg-brand text-white' : 'text-muted hover:bg-inset hover:text-fg'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'profile' ? <ProfileTab /> : <ProviderTab />}
    </div>
  );
}

function ProfileTab() {
  const { user } = useAuth();
  const { data, run } = useAsync(() => authApi.me(), []);
  const me = data?.user || user;
  const [form, setForm] = useState({ name: '', email: '', area: 'Dhanmondi' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (me) setForm((f) => ({ ...f, name: me.name || '', email: me.email || '' }));
  }, [me?._id]);

  const save = async () => {
    setSaving(true);
    const area = DHK_AREAS.find((a) => a.label === form.area);
    try {
      await profileApi.updateProfile({
        name: form.name,
        email: form.email,
        address: `${form.area}, Dhaka`,
        lat: area?.lat,
        lng: area?.lng
      });
      toast.success('Profile updated');
      await run();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="max-w-xl">
      <div className="space-y-4">
        <div>
          <Label htmlFor="pf-name">Full name</Label>
          <Input id="pf-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="pf-email" hint="Optional">
            Email
          </Label>
          <Input
            id="pf-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@email.com"
          />
        </div>
        <div>
          <Label htmlFor="pf-phone">Phone</Label>
          <Input id="pf-phone" value={me?.phone || ''} disabled />
        </div>
        <div>
          <Label htmlFor="pf-area">Primary location</Label>
          <Select
            id="pf-area"
            value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value })}
            options={DHK_AREAS.map((a) => ({ value: a.label, label: a.label }))}
          />
        </div>
        <Button onClick={save} loading={saving} icon="check">
          Save changes
        </Button>
      </div>
    </Card>
  );
}

function ProviderTab() {
  const { data, run } = useAsync(() => authApi.me(), []);
  const provider = data?.provider;
  const { data: cats } = useAsync(() => servicesApi.list(), []);
  const [form, setForm] = useState(null);
  const [newService, setNewService] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const allServices = useMemo(() => (cats || []).flatMap((c) => c.services), [cats]);
  const days = useMemo(() => nextDays(), []);

  useEffect(() => {
    if (provider) {
      setForm({
        businessName: provider.businessName || '',
        isActive: provider.isActive !== false,
        serviceTypes: provider.serviceTypes || [],
        pricePerService: provider.pricePerService || {},
        availability: provider.availability || []
      });
    }
  }, [provider?._id]);

  if (!form)
    return (
      <Card className="max-w-2xl">
        <Skeleton className="h-40" />
      </Card>
    );

  const addService = () => {
    const svc = newService.trim();
    if (!svc) return;
    if (form.serviceTypes.includes(svc)) {
      toast.info('Service already added');
      return;
    }
    setForm({
      ...form,
      serviceTypes: [...form.serviceTypes, svc],
      pricePerService: { ...form.pricePerService, [svc]: Number(newPrice) || 0 }
    });
    setNewService('');
    setNewPrice('');
  };

  const removeService = (svc) => {
    const nt = form.serviceTypes.filter((s) => s !== svc);
    const pp = { ...form.pricePerService };
    delete pp[svc];
    setForm({ ...form, serviceTypes: nt, pricePerService: pp });
  };

  const toggleSlot = (date, win) => {
    const exists = form.availability.find(
      (s) => s.date === date && s.startTime === win.start && s.endTime === win.end
    );
    if (exists && exists.isBooked) return;
    if (exists) {
      const next = form.availability.filter(
        (s) => !(s.date === date && s.startTime === win.start && s.endTime === win.end)
      );
      setForm({ ...form, availability: next });
    } else {
      setForm({ ...form, availability: [...form.availability, { ...win, date, isBooked: false }] });
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await profileApi.updateProviderSettings({
        businessName: form.businessName,
        isActive: form.isActive,
        serviceTypes: form.serviceTypes,
        pricePerService: form.pricePerService,
        availability: form.availability.sort((a, b) =>
          a.date < b.date ? -1 : a.date > b.date ? 1 : a.startTime < b.startTime ? -1 : 1
        )
      });
      toast.success('Provider settings saved');
      await run();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid max-w-5xl gap-5 lg:grid-cols-2">
      <Card>
        <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-bold text-fg">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
            <Icon name="home" size={15} aria-hidden="true" />
          </span>
          Business
        </h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="biz-name">Business name</Label>
            <Input
              id="biz-name"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-fg">Accepting new jobs</div>
              <div className="text-xs text-muted">Turn off to stop receiving matches</div>
            </div>
            <Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="Accepting new jobs" />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-bold text-fg">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
            <Icon name="wrench" size={15} aria-hidden="true" />
          </span>
          Services & pricing
        </h2>
        {form.serviceTypes.length === 0 && (
          <p className="mb-3 rounded-lg bg-inset px-3 py-2 text-sm text-muted">
            Add services you offer to receive matching requests.
          </p>
        )}
        <ul className="space-y-2">
          {form.serviceTypes.map((svc) => (
            <li key={svc} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{svc}</span>
              <span className="flex items-center gap-1">
                <span className="text-xs text-faint">৳</span>
                <Input
                  type="number"
                  aria-label={`Price for ${svc}`}
                  value={form.pricePerService[svc] || ''}
                  onChange={(e) => setForm({ ...form, pricePerService: { ...form.pricePerService, [svc]: Number(e.target.value) || 0 } })}
                  className="w-20 py-1.5 text-right"
                />
              </span>
              <button
                type="button"
                aria-label={`Remove ${svc}`}
                onClick={() => removeService(svc)}
                className="rounded-lg p-1.5 text-faint transition-colors hover:bg-danger-soft hover:text-danger-text"
              >
                <Icon name="trash" size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
          <div className="min-w-[10rem] flex-1">
            <Label htmlFor="add-svc">Service</Label>
            <Select
              id="add-svc"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              placeholder="Choose a service…"
              options={allServices.map((s) => ({ value: s, label: s }))}
            />
          </div>
          <div className="w-28">
            <Label htmlFor="add-price">Price (৳)</Label>
            <Input
              id="add-price"
              type="number"
              placeholder="0"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
          </div>
          <Button variant="secondary" onClick={addService} icon="plus">
            Add
          </Button>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-fg">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
            <Icon name="calendar" size={15} aria-hidden="true" />
          </span>
          Work schedule
        </h2>
        <p className="mb-4 mt-1.5 text-sm text-muted">
          Select slots over the next 7 days. Booked slots are locked.
        </p>

        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full border-separate text-center" style={{ borderSpacing: '3px' }}>
            <thead>
              <tr>
                <th className="w-28" aria-hidden="true" />
                {days.map((d) => (
                  <th key={d} className="min-w-[2rem] pb-1 text-[11px] font-semibold text-muted">
                    {formatDate(d)
                      .replace(/ \d{4}$/, '')
                      .split(' ')
                      .slice(0, 2)
                      .join(' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WINDOWS.map((win) => (
                <tr key={win.start}>
                  <td className="pr-2 text-right text-xs font-medium tabular-nums text-muted">
                    {win.start}–{win.end}
                  </td>
                  {days.map((date) => {
                    const slot = form.availability.find(
                      (s) => s.date === date && s.startTime === win.start && s.endTime === win.end
                    );
                    const locked = slot?.isBooked;
                    const on = !!slot && !locked;
                    return (
                      <td key={date}>
                        <button
                          type="button"
                          aria-pressed={on}
                          disabled={locked}
                          aria-label={`${formatDate(date)} ${win.start}–${win.end}: ${
                            locked ? 'booked' : on ? 'available — remove' : 'closed — add'
                          }`}
                          onClick={() => toggleSlot(date, win)}
                          className={cn(
                            'h-9 w-full rounded-lg border text-faint transition-colors',
                            locked
                              ? 'cursor-not-allowed border-line bg-inset/60 text-faint/60'
                              : on
                                ? 'border-brand bg-brand text-white hover:bg-brand-hover'
                                : 'border-line hover:border-line2 hover:bg-inset'
                          )}
                        >
                          {locked ? (
                            <Icon name="ban" size={14} aria-hidden="true" />
                          ) : on ? (
                            <Icon name="check" size={15} aria-hidden="true" />
                          ) : null}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={save} loading={saving} icon="check">
            Save settings
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        checked ? 'bg-brand' : 'bg-line2'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
          checked ? 'left-[1.375rem]' : 'left-0.5'
        )}
      />
    </button>
  );
}
