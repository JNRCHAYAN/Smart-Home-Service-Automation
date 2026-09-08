import { useEffect, useMemo, useState } from 'react';
import { useAsync } from '../hooks/useAsync.js';
import { authApi, servicesApi, profileApi, apiError } from '../api/index.js';
import { useAuth } from '../store/authStore.js';
import { toast } from '../store/toastStore.js';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import { Input, Select, Label } from '../components/common/Field.jsx';
import Icon from '../components/common/Icon.jsx';
import { DHK_AREAS } from '../constants/index.js';
import { formatDate } from '../utils/format.js';

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

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Icon name="user" size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">Profile & Settings</h1>
          <p className="text-sm text-ink-400">Manage your account and service preferences.</p>
        </div>
      </div>

      <div className="mb-6 flex w-full max-w-md gap-2 rounded-xl bg-ink-100 p-1">
        <button
          onClick={() => setTab('profile')}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
            tab === 'profile' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-400'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setTab('provider')}
          disabled={user?.role !== 'provider'}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
            user?.role !== 'provider'
              ? 'cursor-not-allowed opacity-40'
              : tab === 'provider'
                ? 'bg-white text-ink-900 shadow-sm'
                : 'text-ink-400'
          }`}
        >
          Provider
        </button>
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

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

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
          <Label>Full name</Label>
          <Input value={form.name} onChange={set('name')} />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={set('email')} placeholder="you@email.com" />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={me?.phone || ''} disabled className="bg-ink-50 text-ink-400" />
        </div>
        <div>
          <Label>Primary location</Label>
          <Select
            value={form.area}
            onChange={set('area')}
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
        <div className="h-24 animate-pulse rounded-xl bg-ink-100" />
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

  const setPrice = (svc, val) =>
    setForm({ ...form, pricePerService: { ...form.pricePerService, [svc]: Number(val) || 0 } });

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
      setForm({
        ...form,
        availability: [...form.availability, { ...win, date, isBooked: false }]
      });
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
      {/* Business info */}
      <Card>
        <h2 className="mb-3 flex items-center gap-2 font-bold text-ink-900">
          <Icon name="home" size={18} className="text-brand-600" /> Business
        </h2>
        <div className="space-y-4">
          <div>
            <Label>Business name</Label>
            <Input
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-ink-100 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-ink-800">Accepting new jobs</div>
              <div className="text-xs text-ink-400">Turn off to stop receiving matches</div>
            </div>
            <button
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.isActive ? 'bg-brand-600' : 'bg-ink-200'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  form.isActive ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Services */}
      <Card>
        <h2 className="mb-3 flex items-center gap-2 font-bold text-ink-900">
          <Icon name="wrench" size={18} className="text-brand-600" /> Services & pricing
        </h2>
        <div className="space-y-2">
          {form.serviceTypes.length === 0 && (
            <p className="text-sm text-ink-400">Add services you offer to receive matching requests.</p>
          )}
          {form.serviceTypes.map((svc) => (
            <div key={svc} className="flex items-center gap-2">
              <span className="flex-1 truncate text-sm font-medium text-ink-800">{svc}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-ink-400">৳</span>
                <Input
                  type="number"
                  value={form.pricePerService[svc] || ''}
                  onChange={(e) => setPrice(svc, e.target.value)}
                  className="w-20 py-1.5 text-right"
                />
              </div>
              <button
                onClick={() => removeService(svc)}
                className="rounded-lg p-1.5 text-ink-300 hover:bg-rose-50 hover:text-rose-500"
              >
                <Icon name="x" size={16} />
              </button>
            </div>
          ))}
          <div className="mt-3 flex gap-2 border-t border-ink-100 pt-3">
            <Select
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              placeholder="Add a service"
              options={[
                { value: '', label: 'Add a service…' },
                ...allServices.map((s) => ({ value: s, label: s }))
              ]}
            />
            <Input
              type="number"
              placeholder="৳ Price"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-28"
            />
            <Button variant="secondary" size="sm" onClick={addService} icon="plus">
              Add
            </Button>
          </div>
        </div>
      </Card>

      {/* Work schedule */}
      <Card className="lg:col-span-2">
        <div className="mb-1 flex items-center gap-2 font-bold text-ink-900">
          <Icon name="calendar" size={18} className="text-brand-600" /> Work schedule
        </div>
        <p className="mb-4 text-sm text-ink-400">
          Tap the next 7 days to open or close availability. Locked slots are already booked.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-separate" style={{ borderSpacing: '4px' }}>
            <thead>
              <tr>
                <th className="w-24" />
                {nextDays().map((d) => (
                  <th key={d} className="min-w-[26px] text-center text-[11px] font-semibold text-ink-400">
                    {
                      formatDate(d)
                        .replace(/ 2026$/, '')
                        .split(' ')[0]
                    }
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WINDOWS.map((win) => (
                <tr key={win.start}>
                  <td className="pr-2 text-right text-xs font-medium text-ink-500">
                    {win.start}–{win.end}
                  </td>
                  {nextDays().map((date) => {
                    const slot = form.availability.find(
                      (s) => s.date === date && s.startTime === win.start && s.endTime === win.end
                    );
                    const locked = slot?.isBooked;
                    const on = !!slot && !locked;
                    return (
                      <td key={date} className="text-center">
                        <button
                          onClick={() => toggleSlot(date, win)}
                          disabled={locked}
                          title={
                            locked ? 'Booked' : on ? 'Available — click to close' : 'Closed — click to open'
                          }
                          className={`h-8 w-full rounded-lg transition-colors ${
                            locked
                              ? 'cursor-not-allowed bg-ink-200 text-ink-300'
                              : on
                                ? 'bg-brand-500 text-white hover:bg-brand-600'
                                : 'bg-ink-100 text-ink-300 hover:bg-ink-200'
                          }`}
                        >
                          {locked ? '×' : on ? '✓' : ''}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={save} loading={saving} icon="check">
            Save settings
          </Button>
        </div>
      </Card>
    </div>
  );
}
