import { Link } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync.js';
import { servicesApi } from '../../api/index.js';
import Icon from '../../components/common/Icon.jsx';
import Card from '../../components/common/Card.jsx';
import { CardSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../store/authStore.js';

const STEPS = [
  { icon: 'search', title: 'Select a service', desc: 'Pick from 8 home service categories in seconds.' },
  {
    icon: 'zap',
    title: 'Get matched',
    desc: 'Our engine ranks providers by expertise, availability & price.'
  },
  { icon: 'calendar', title: 'Confirm & track', desc: 'Book instantly and follow your job live.' }
];

export default function Landing() {
  const { data: services, loading } = useAsync(() => servicesApi.list(), []);
  const { token, user } = useAuth();

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero — Trust & Authority + Conversion */}
      <section className="pb-6 pt-16 text-center">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-1.5 text-sm font-semibold text-brand-700 shadow-sm">
          <Icon name="shield" size={15} className="text-brand-600" />
          Trusted home care · Verified & insured providers
        </div>
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-ink-900 sm:text-6xl">
          Every home service,{' '}
          <span className="bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
            matched in seconds
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-600">
          AC repair, plumbing, electrical, cleaning and more — requested, matched, scheduled and tracked
          automatically.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={token ? '/new-request' : '/login'}
            className="inline-flex items-center gap-2 rounded-xl bg-accent-600 px-7 py-3.5 text-base font-semibold text-white shadow-hero transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-700"
          >
            Book a service <Icon name="arrowright" size={18} />
          </Link>
          <Link
            to={token && user?.role === 'provider' ? '/provider' : '/register'}
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-7 py-3.5 text-base font-semibold text-ink-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-ink-50"
          >
            Become a provider
          </Link>
        </div>

        {/* Proof / trust signals */}
        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-4 rounded-2xl border border-brand-100 bg-white/80 p-6 shadow-card backdrop-blur">
          {[
            ['8', 'Service categories', 'wrench'],
            ['20+', 'Verified providers', 'shield'],
            ['4.7★', 'Average rating', 'star']
          ].map(([num, label, icon]) => (
            <div key={label} className="text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon name={icon} size={20} />
              </div>
              <div className="text-2xl font-extrabold text-ink-900 sm:text-3xl">{num}</div>
              <div className="mt-1 text-xs font-medium text-ink-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Reassurance row */}
        <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-ink-500">
          <span className="flex items-center gap-1.5">
            <Icon name="check" size={14} className="text-brand-600" /> Instant match
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="check" size={14} className="text-brand-600" /> No double-booking
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="check" size={14} className="text-brand-600" /> Live job tracking
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="check" size={14} className="text-brand-600" /> Pay after service
          </span>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8">
        <h2 className="mb-5 text-xl font-extrabold text-ink-900">What do you need help with?</h2>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(services || []).map((cat) => (
              <Link key={cat.key} to={token ? '/new-request' : '/login'}>
                <Card className="group h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-lift">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <Icon name={cat.icon} size={24} />
                  </div>
                  <div className="font-bold leading-snug text-ink-900">{cat.label}</div>
                  <div className="mt-1 flex items-center gap-1 text-xs font-medium text-ink-400">
                    {cat.services.length} services
                    <span className="opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-brand-600">
                      →
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="py-12">
        <h2 className="mb-5 text-xl font-extrabold text-ink-900">How Servio works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Card key={s.title} className="relative overflow-hidden">
              <span className="absolute -right-2 -top-5 text-7xl font-extrabold text-ink-50">{i + 1}</span>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Icon name={s.icon} size={22} />
              </div>
              <div className="font-bold text-ink-900">{s.title}</div>
              <p className="mt-1 text-sm text-ink-400">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="py-12">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-emerald-500 px-6 py-12 text-center text-white shadow-hero sm:px-12">
          <h2 className="text-3xl font-extrabold tracking-tight">Ready to book your first service?</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/80">
            Join thousands of customers getting their homes taken care of — matched to the right provider in
            seconds.
          </p>
          <Link
            to={token ? '/new-request' : '/login'}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-brand-700 transition-all hover:-translate-y-0.5"
          >
            Get started free <Icon name="arrowright" size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
