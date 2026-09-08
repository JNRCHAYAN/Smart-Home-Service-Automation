import { Link } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync.js';
import { servicesApi } from '../../api/index.js';
import Icon from '../../components/common/Icon.jsx';
import Card from '../../components/common/Card.jsx';
import { CardSkeleton } from '../../components/common/Skeleton.jsx';
import { buttonClass } from '../../components/common/Button.jsx';
import { useAuth } from '../../store/authStore.js';
import { cn } from '../../utils/cn.js';

// Public landing page ("/"): hero, trust stats, service-category grid fetched
// from the API, how-it-works steps and a closing CTA. CTA destinations adapt to
// whether a user is signed in (and their role).
const STEPS = [
  {
    icon: 'search',
    title: 'Select a service',
    desc: 'Pick from 8 home-service categories and describe what you need in seconds.'
  },
  {
    icon: 'zap',
    title: 'Get matched',
    desc: 'Our engine ranks providers by expertise, availability, distance and price.'
  },
  {
    icon: 'calendar',
    title: 'Confirm & track',
    desc: 'Book instantly, follow your job live and pay only after the service.'
  }
];

const TRUST = ['Instant match', 'No double-booking', 'Live job tracking', 'Pay after service'];

const STATS = [
  { value: '8', label: 'Service categories' },
  { value: '20+', label: 'Verified providers' },
  { value: '4.7', label: 'Average rating', suffix: true }
];

export default function Landing() {
  const { data: services, loading } = useAsync(() => servicesApi.list(), []);
  const { token, user } = useAuth();
  const bookTo = token ? '/new-request' : '/login';
  const providerTo = token && user?.role === 'provider' ? '/provider' : '/register';

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-grid opacity-[0.5] [mask-image:radial-gradient(60%_60%_at_50%_0%,black,transparent)] dark:opacity-[0.15]"
        />
        <div className="container-page relative py-14 text-center md:py-20">
          <span className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold text-muted shadow-soft">
            <Icon name="shield" size={14} className="text-brand" aria-hidden="true" />
            Trusted home care — verified &amp; insured providers
          </span>

          <h1 className="mx-auto max-w-3xl text-balance font-heading text-4xl font-extrabold leading-[1.1] tracking-tight text-fg sm:text-6xl">
            Every home service,
            <br className="hidden sm:block" /> <span className="text-brand-text">matched in seconds</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-muted sm:text-lg">
            AC repair, plumbing, electrical, cleaning and more — requested, matched, scheduled and tracked
            automatically across Dhaka.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to={bookTo} className={cn(buttonClass({ size: 'lg' }), 'w-full sm:w-auto')}>
              Book a service
              <Icon name="arrowright" size={18} aria-hidden="true" />
            </Link>
            <Link
              to={providerTo}
              className={cn(
                buttonClass({ size: 'lg', variant: 'secondary' }),
                'w-full border-line2 sm:w-auto'
              )}
            >
              Become a provider
            </Link>
          </div>

          {/* Trust signals */}
          <dl className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4 rounded-2xl border border-line bg-surface p-5 shadow-soft sm:p-6">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col text-center">
                <dt className="order-2 mt-1 text-xs font-medium text-muted sm:text-sm">{s.label}</dt>
                <dd className="order-1 flex items-center justify-center gap-1 font-heading text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">
                  {s.value}
                  {s.suffix && (
                    <Icon
                      name="star"
                      size={18}
                      className="fill-amber-400 text-amber-400"
                      aria-hidden="true"
                    />
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <ul className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted">
            {TRUST.map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Icon name="checkcircle" size={14} className="text-brand" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-bold text-fg sm:text-2xl">
              What do you need help with?
            </h2>
            <p className="mt-1 text-sm text-muted">Choose a category to book a verified provider.</p>
          </div>
          <Link
            to={bookTo}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-text transition-colors hover:text-brand-text hover:underline"
          >
            Book a service
            <Icon name="arrowupright" size={16} aria-hidden="true" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(services || []).map((cat) => (
              <Link
                key={cat.key}
                to={bookTo}
                className="card-surface group p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-border hover:shadow-pop"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand-text transition-colors group-hover:bg-brand group-hover:text-white">
                    <Icon name={cat.icon} size={22} aria-hidden="true" />
                  </span>
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-faint opacity-0 transition-all group-hover:opacity-100">
                    <Icon name="arrowupright" size={16} aria-hidden="true" />
                  </span>
                </div>
                <h3 className="mt-4 font-heading text-[15px] font-bold leading-snug text-fg">{cat.label}</h3>
                <p className="mt-1 text-xs font-medium text-faint">
                  {cat.services.length} service{cat.services.length === 1 ? '' : 's'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-surface/60">
        <div className="container-page py-12">
          <div className="mx-auto mb-8 max-w-xl text-center">
            <h2 className="font-heading text-2xl font-bold text-fg">How Servio works</h2>
            <p className="mt-2 text-sm text-muted">From request to done in three simple steps.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="card-surface relative p-6">
                <span className="absolute right-5 top-5 font-heading text-sm font-bold text-faint">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white shadow-soft">
                  <Icon name={s.icon} size={22} aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-heading text-base font-bold text-fg">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="container-page py-12">
        <div className="relative overflow-hidden rounded-2xl bg-brand px-6 py-12 text-center text-white sm:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/[0.07]"
          />
          <div className="relative">
            <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
              Ready to book your first service?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-white/85 sm:text-base">
              Join customers across Dhaka getting their homes taken care of — matched to the right provider in
              seconds.
            </p>
            <Link
              to={bookTo}
              className={cn(
                'mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-7 text-base font-semibold text-brand transition-transform duration-150 hover:-translate-y-0.5',
                token && 'w-full sm:w-auto'
              )}
            >
              Get started free
              <Icon name="arrowright" size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
