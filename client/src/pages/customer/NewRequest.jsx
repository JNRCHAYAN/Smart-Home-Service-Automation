import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync.js';
import { servicesApi, requestApi, apiError } from '../../api/index.js';
import { URGENCY_LEVELS, URGENCY_BAR, TIME_WINDOWS, DHK_AREAS } from '../../constants/index.js';
import Icon from '../../components/common/Icon.jsx';
import Button from '../../components/common/Button.jsx';
import { Input, Label, Select, Textarea } from '../../components/common/Field.jsx';
import { useAuth } from '../../store/authStore.js';
import { toast } from '../../store/toastStore.js';
import { formatDateInput, formatTime } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

// /new-request — the 4-step booking wizard (Service → Details → Schedule →
// Confirm). Each step gates "Continue" via canNext; submit builds the request
// payload and navigates to its match results.
const STEPS = ['Service', 'Details', 'Schedule', 'Confirm'];
const today = () => formatDateInput(new Date());

// "HH:MM" → minutes since midnight, used to compare windows against the clock.
const toMinutes = (time) => {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
};

// timeWindow is stored as a single string "label|start|end" — rebuild that key.
const toTimeKey = (w) => `${w.label}|${w.start}|${w.end}`;

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
    timeWindow: '09:00 – 12:00|09:00|12:00',
    urgency: 'Normal',
    imageUrl: '',
    contactName: user?.name || '',
    contactPhone: user?.phone || ''
  });
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const category = useMemo(
    () => (services || []).find((c) => c.key === form.category),
    [services, form.category]
  );
  const area = useMemo(() => DHK_AREAS.find((a) => a.label === form.area), [form.area]);

  // Same-day scheduling: once the clock passes a window's end time it can no
  // longer be booked today, so it is offered (dimmed + disabled) below. The
  // clock is read per render so disabled windows stay current.
  const now = new Date();
  const dateIsToday = form.date === formatDateInput(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const availableToday = TIME_WINDOWS.filter((w) => toMinutes(w.end) > nowMinutes);
  const windowIsPast = (end) => toMinutes(end) <= nowMinutes;

  // Keep the chosen window valid: when the date is today and the current
  // selection has already ended (or nothing is picked), fall back to the next
  // window that still has time — or clear it when the day is fully booked.
  useEffect(() => {
    const current = new Date();
    const onToday = form.date === formatDateInput(current);
    const minutesNow = current.getHours() * 60 + current.getMinutes();
    const end = form.timeWindow.split('|')[2];
    const chosenIsOpen = Boolean(end) && (!onToday || toMinutes(end) > minutesNow);
    if (chosenIsOpen) return;
    const pool = onToday ? TIME_WINDOWS.filter((w) => toMinutes(w.end) > minutesNow) : TIME_WINDOWS;
    const nextKey = pool[0] ? toTimeKey(pool[0]) : '';
    if (form.timeWindow === nextKey) return;
    setForm((f) => ({ ...f, timeWindow: nextKey }));
  }, [form.date, form.timeWindow]);

  const onImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image must be under 3MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, imageUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const canNext =
    step === 0
      ? Boolean(form.serviceType)
      : step === 1
        ? Boolean(form.area)
        : step === 2
          ? Boolean(form.date && form.timeWindow)
          : Boolean(form.contactName && form.contactPhone);

  const submit = async () => {
    setSubmitting(true);
    // timeWindow stores "label|start|end" as a single value; split it apart for
    // the API payload (label is only for display on the confirm step).
    const [winLabel, start, end] = form.timeWindow.split('|');
    const payload = {
      serviceType: form.serviceType,
      location: { address: `${form.area}, Dhaka`, lat: area?.lat, lng: area?.lng },
      preferredDate: form.date,
      preferredTimeWindow: { start, end },
      urgency: form.urgency,
      problemDetails: form.problemDetails,
      imageUrl: form.imageUrl,
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
    <div className="container-page page-shell max-w-3xl">
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-fg">New service request</h1>
        <p className="mt-1 text-sm text-muted">Follow the steps to book a provider instantly.</p>
      </header>

      {/* Progress */}
      <ol className="mb-6 flex items-center gap-0" aria-label="Booking progress">
        {STEPS.map((s, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={s} className="flex flex-1 items-center last:flex-none">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-colors',
                  done && 'border-brand bg-brand text-white',
                  current && 'border-brand bg-brand text-white shadow-glow',
                  !done && !current && 'border-line2 bg-surface text-faint'
                )}
                aria-current={current ? 'step' : undefined}
              >
                {done ? <Icon name="check" size={15} aria-hidden="true" /> : i + 1}
              </span>
              <span
                className={cn(
                  'ml-2 hidden text-sm font-semibold sm:block',
                  current ? 'text-fg' : done ? 'text-muted' : 'text-faint'
                )}
              >
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn('mx-3 h-0.5 flex-1 rounded sm:mx-2', done ? 'bg-brand' : 'bg-line2')}
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="card-surface p-6">
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <Label id="cat-label">Choose a category</Label>
              <div
                role="group"
                aria-labelledby="cat-label"
                className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
              >
                {(services || []).map((c) => {
                  const active = form.category === c.key;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setForm({ ...form, category: c.key, serviceType: '' })}
                      className={cn(
                        'flex flex-col items-start gap-2.5 rounded-xl border p-3.5 text-left transition-colors',
                        active
                          ? 'border-brand bg-brand-soft'
                          : 'border-line hover:border-line2 hover:bg-inset'
                      )}
                    >
                      <span className="flex w-full items-center justify-between">
                        <Icon
                          name={c.icon}
                          size={20}
                          className={active ? 'text-brand-text' : 'text-muted'}
                          aria-hidden="true"
                        />
                        {active && (
                          <Icon name="check" size={16} className="text-brand-text" aria-hidden="true" />
                        )}
                      </span>
                      <span
                        className={cn(
                          'text-xs font-semibold leading-tight',
                          active ? 'text-brand-text' : 'text-fg'
                        )}
                      >
                        {c.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>Service</Label>
              {!category ? (
                <p className="flex items-center gap-2 text-sm text-muted">
                  <Icon name="chevronleft" size={14} aria-hidden="true" />
                  Select a category to see its services.
                </p>
              ) : (
                <div role="group" aria-label="Service" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {category.services.map((s) => {
                    const active = form.serviceType === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setForm({ ...form, serviceType: s })}
                        className={cn(
                          'flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors',
                          active
                            ? 'border-brand bg-brand-soft text-brand-text'
                            : 'border-line text-muted hover:border-line2 hover:bg-inset'
                        )}
                      >
                        {s}
                        {active && <Icon name="check" size={15} aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <Label htmlFor="req-area">Location area</Label>
              <Select
                id="req-area"
                value={form.area}
                onChange={set('area')}
                options={DHK_AREAS.map((a) => ({ value: a.label, label: a.label }))}
              />
            </div>
            <div>
              <Label htmlFor="req-details" hint="Optional">
                Describe the problem
              </Label>
              <Textarea
                id="req-details"
                rows={4}
                value={form.problemDetails}
                onChange={set('problemDetails')}
                placeholder="e.g. AC not cooling, making a loud noise from the outdoor unit…"
              />
            </div>
            <div>
              <Label hint="Optional — max 3MB">Photo of the problem</Label>
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={onImage} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center gap-4 rounded-xl border border-dashed border-line2 bg-inset/50 px-4 py-4 text-left transition-colors hover:border-brand hover:bg-brand-soft/50"
              >
                {form.imageUrl ? (
                  <img
                    src={form.imageUrl}
                    alt="Attached preview of the issue"
                    className="h-16 w-16 rounded-lg object-cover ring-1 ring-line"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-faint ring-1 ring-line">
                    <Icon name="plus" size={20} aria-hidden="true" />
                  </span>
                )}
                <span className="text-sm font-medium text-muted">
                  {form.imageUrl ? 'Attached — click to replace' : 'Click to add a photo of the problem'}
                </span>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <Label htmlFor="req-date">Preferred date</Label>
              <Input id="req-date" type="date" min={today()} value={form.date} onChange={set('date')} />
            </div>
            <div>
              <Label hint={dateIsToday ? 'Real-time' : undefined}>Time window</Label>
              <div role="group" aria-label="Time window" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TIME_WINDOWS.map((w) => {
                  const key = toTimeKey(w);
                  const active = form.timeWindow === key;
                  // Windows that have already ended today are disabled.
                  const disabled = dateIsToday && windowIsPast(w.end);
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={active}
                      disabled={disabled}
                      title={disabled ? 'This time window has already passed today' : undefined}
                      onClick={() => setForm({ ...form, timeWindow: key })}
                      className={cn(
                        'rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors',
                        disabled
                          ? 'cursor-not-allowed border-line bg-inset text-faint/60 line-through'
                          : active
                            ? 'border-brand bg-brand-soft text-brand-text'
                            : 'border-line text-muted hover:border-line2 hover:bg-inset'
                      )}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
              {dateIsToday && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-muted">
                  <Icon name="clock" size={13} className="mt-0.5 shrink-0 text-faint" aria-hidden="true" />
                  <span>
                    {availableToday.length > 0
                      ? `It is ${formatTime(now)} — ${availableToday.length} of ${TIME_WINDOWS.length} windows still open today; passed windows are disabled.`
                      : `It is ${formatTime(now)} — no windows are left today. Please pick another date.`}
                  </span>
                </p>
              )}
            </div>
            <div>
              <Label>Urgency</Label>
              <div role="group" aria-label="Urgency" className="grid grid-cols-3 gap-2">
                {URGENCY_LEVELS.map((u) => {
                  const active = form.urgency === u;
                  return (
                    <button
                      key={u}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setForm({ ...form, urgency: u })}
                      className={cn(
                        'rounded-lg border px-3 py-3 text-center text-sm font-bold transition-colors',
                        active
                          ? 'border-brand bg-brand-soft text-brand-text'
                          : 'border-line text-muted hover:border-line2 hover:bg-inset'
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn('mx-auto mb-1.5 block h-1 w-8 rounded-full', URGENCY_BAR[u])}
                      />
                      {u}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted">
                {form.urgency === 'Emergency'
                  ? 'Emergency prioritises speed and the closest available provider over price.'
                  : form.urgency === 'Urgent'
                    ? 'Urgent requests favour quick arrival and availability.'
                    : 'Normal requests are balanced across matching, quality and price.'}
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="divide-y divide-line rounded-xl border border-line bg-inset/50 p-4 text-sm">
              <SummaryRow label="Service" value={form.serviceType} />
              <SummaryRow label="Location" value={`${form.area}, Dhaka`} />
              <SummaryRow label="Date" value={form.date} />
              <SummaryRow label="Time" value={form.timeWindow.split('|')[0]} />
              <SummaryRow label="Urgency" value={form.urgency} />
              <SummaryRow label="Problem" value={form.problemDetails || '—'} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="req-name" required>
                  Contact name
                </Label>
                <Input id="req-name" value={form.contactName} onChange={set('contactName')} />
              </div>
              <div>
                <Label htmlFor="req-contact" required>
                  Contact phone
                </Label>
                <Input id="req-contact" value={form.contactPhone} onChange={set('contactPhone')} />
              </div>
            </div>
          </div>
        )}

        <div className="mt-7 flex items-center justify-between gap-3 border-t border-line pt-5">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <Icon name="chevronleft" size={16} aria-hidden="true" />
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              Continue
              <Icon name="chevronright" size={16} aria-hidden="true" />
            </Button>
          ) : (
            <Button onClick={submit} loading={submitting}>
              Find my providers
              <Icon name="send" size={16} aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="text-right font-semibold text-fg">{value}</span>
    </div>
  );
}
