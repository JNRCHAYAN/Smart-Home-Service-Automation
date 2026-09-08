import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync.js';
import { servicesApi, requestApi, apiError } from '../../api/index.js';
import { URGENCY_LEVELS, URGENCY_BAR, TIME_WINDOWS, DHK_AREAS } from '../../constants/index.js';
import Icon from '../../components/common/Icon.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import { Input, Label, Select, Textarea } from '../../components/common/Field.jsx';
import { useAuth } from '../../store/authStore.js';
import { toast } from '../../store/toastStore.js';
import { formatDateInput } from '../../utils/format.js';

const STEPS = ['Service', 'Details', 'Schedule', 'Confirm'];

function today() {
  return formatDateInput(new Date());
}

export default function NewRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: services } = useAsync(() => servicesApi.list(), []);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    category: '',
    serviceType: '',
    area: 'Dhanmondi',
    problemDetails: '',
    date: today(),
    timeWindow: `09:00 – 12:00|09:00|12:00`,
    urgency: 'Normal',
    contactName: user?.name || '',
    contactPhone: user?.phone || ''
  });
  const [submitting, setSubmitting] = useState(false);

  const category = useMemo(() => (services || []).find((c) => c.key === form.category), [services, form.category]);
  const area = useMemo(() => DHK_AREAS.find((a) => a.label === form.area), [form.area]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const canNext =
    step === 0
      ? Boolean(form.serviceType)
      : step === 1
        ? Boolean(form.area)
        : step === 2
          ? Boolean(form.date)
          : Boolean(form.contactName && form.contactPhone);

  const submit = async () => {
    setSubmitting(true);
    const [winLabel, start, end] = form.timeWindow.split('|');
    const payload = {
      serviceType: form.serviceType,
      location: { address: `${form.area}, Dhaka`, lat: area.lat, lng: area.lng },
      preferredDate: form.date,
      preferredTimeWindow: { start, end },
      urgency: form.urgency,
      problemDetails: form.problemDetails,
      contact: { name: form.contactName, phone: form.contactPhone }
    };
    try {
      const res = await requestApi.create(payload);
      toast.success('Request created — finding your best providers');
      navigate(`/request/${res._id}/matches`);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">New service request</h1>
      <p className="mt-1 text-sm text-ink-400">Follow the steps to book a provider instantly.</p>

      {/* Progress */}
      <div className="mt-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                i < step
                  ? 'bg-brand-600 text-white'
                  : i === step
                    ? 'bg-brand-600 text-white pulse-dot'
                    : 'bg-ink-100 text-ink-400'
              }`}
            >
              {i < step ? <Icon name="check" size={16} /> : i + 1}
            </div>
            <span className={`hidden text-sm font-semibold sm:block ${i === step ? 'text-ink-900' : 'text-ink-400'}`}>
              {s}
            </span>
            {i < STEPS.length - 1 && <div className={`h-1 flex-1 rounded ${i < step ? 'bg-brand-500' : 'bg-ink-100'}`} />}
          </div>
        ))}
      </div>

      <Card className="mt-6">
        {step === 0 && (
          <div>
            <Label>Choose a category</Label>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(services || []).map((c) => (
                <button
                  key={c.key}
                  onClick={() => setForm({ ...form, category: c.key, serviceType: '' })}
                  className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all ${
                    form.category === c.key
                      ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600'
                      : 'border-ink-200 hover:border-brand-300'
                  }`}
                >
                  <Icon name={c.icon} size={20} />
                  <span className="text-xs font-semibold leading-tight">{c.label}</span>
                </button>
              ))}
            </div>
            <Label>Service</Label>
            {!category ? (
              <p className="text-sm text-ink-400">Select a category above to see services.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {category.services.map((s) => (
                  <button
                    key={s}
                    onClick={() => setForm({ ...form, serviceType: s })}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${
                      form.serviceType === s
                        ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600'
                        : 'border-ink-200 hover:border-brand-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Location area</Label>
              <Select value={form.area} onChange={set('area')} options={DHK_AREAS.map((a) => ({ value: a.label, label: a.label }))} />
            </div>
            <div>
              <Label>Describe the problem</Label>
              <Textarea
                rows={4}
                value={form.problemDetails}
                onChange={set('problemDetails')}
                placeholder="e.g. AC not cooling, making a loud noise from the outdoor unit…"
              />
            </div>
            <div className="rounded-xl bg-ink-50 px-4 py-3 text-xs text-ink-400">
              An optional image can be attached after request creation.
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Preferred date</Label>
              <Input type="date" min={today()} value={form.date} onChange={set('date')} />
            </div>
            <div>
              <Label>Time window</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TIME_WINDOWS.map((w) => {
                  const key = `${w.label}|${w.start}|${w.end}`;
                  return (
                    <button
                      key={key}
                      onClick={() => setForm({ ...form, timeWindow: key })}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${
                        form.timeWindow === key
                          ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600'
                          : 'border-ink-200 hover:border-brand-300'
                      }`}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Urgency</Label>
              <div className="flex gap-2">
                {URGENCY_LEVELS.map((u) => (
                  <button
                    key={u}
                    onClick={() => setForm({ ...form, urgency: u })}
                    className={`flex-1 rounded-xl border px-3 py-3 text-sm font-bold transition-all ring-1 ${
                      form.urgency === u
                        ? 'border-brand-600 ring-brand-600 text-ink-900'
                        : 'border-ink-200 ring-transparent text-ink-400'
                    }`}
                  >
                    <span className="mb-1 block h-1.5 rounded bg-gradient-to-r from-transparent to-transparent" />
                    <span className={`h-1.5 w-full rounded ${URGENCY_BAR[u]}`} />
                    {u}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-400">
                Emergency requests prioritise speed & closest provider over price.
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4">
              <SummaryRow label="Service" value={form.serviceType} />
              <SummaryRow label="Location" value={`${form.area}, Dhaka`} />
              <SummaryRow label="Date" value={form.date} />
              <SummaryRow label="Time" value={form.timeWindow.split('|')[0]} />
              <SummaryRow label="Urgency" value={form.urgency} />
              <SummaryRow label="Problem" value={form.problemDetails || '—'} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Contact name</Label>
                <Input value={form.contactName} onChange={set('contactName')} />
              </div>
              <div>
                <Label>Contact phone</Label>
                <Input value={form.contactPhone} onChange={set('contactPhone')} />
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-ink-100 pt-5">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} icon="chevronleft">
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext} icon="chevronright">
              Continue
            </Button>
          ) : (
            <Button onClick={submit} loading={submitting} icon="send">
              Find my providers
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="shrink-0 text-ink-400">{label}</span>
      <span className="text-right font-semibold text-ink-900">{value}</span>
    </div>
  );
}
