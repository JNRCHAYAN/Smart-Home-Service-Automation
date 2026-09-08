import { Link } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync.js';
import { servicesApi } from '../../api/index.js';
import Icon from '../../components/common/Icon.jsx';
import Card from '../../components/common/Card.jsx';
import { CardSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../store/authStore.js';

const STEPS = [
  { icon: 'search', title: 'Select a service', desc: 'Pick from 8 home service categories in seconds.' },
  { icon: 'zap', title: 'Get matched', desc: 'Our engine ranks providers by expertise, availability & price.' },
  { icon: 'calendar', title: 'Confirm & track', desc: 'Book instantly and follow your job live.' }
];

export default function Landing() {
  const { data: services, loading } = useAsync(() => servicesApi.list(), []);
  const { token, user } = useAuth();

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="py-16 text-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700">
          <Icon name="zap" size={16} /> Smart Home Service Automation
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-5xl">
          Every home service,{' '}
          <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
            matched in seconds
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-ink-500">
          AC repair, plumbing, electrical, cleaning and more — requested, matched,
          scheduled and tracked automatically.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={token ? '/new-request' : '/login'}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700"
          >
            Book a service <Icon name="arrowright" size={18} />
          </Link>
          <Link
            to={token && user?.role === 'provider' ? '/provider' : '/register'}
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-6 py-3 text-base font-semibold text-ink-700 hover:bg-ink-50"
          >
            Become a provider
          </Link>
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
                <Card className="group h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <Icon name={cat.icon} size={22} />
                  </div>
                  <div className="font-bold text-ink-900">{cat.label}</div>
                  <div className="mt-1 text-xs text-ink-400">{cat.services.length} services</div>
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
            <Card key={s.title} className="relative">
              <span className="absolute right-5 top-4 text-4xl font-extrabold text-ink-100">
                {i + 1}
              </span>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Icon name={s.icon} size={22} />
              </div>
              <div className="font-bold text-ink-900">{s.title}</div>
              <p className="mt-1 text-sm text-ink-400">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
