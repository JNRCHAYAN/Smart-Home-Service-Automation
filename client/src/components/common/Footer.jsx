import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

// Site footer: brand blurb + link groups. GROUPS entries with a `to` become
// router links; the marketing-style ones without a `to` render as plain rows.
const GROUPS = [
  {
    heading: 'Platform',
    links: [
      { to: '/new-request', label: 'Book a service', icon: 'plus' },
      { to: '/my-requests', label: 'My requests', icon: 'list' },
      { to: '/settings', label: 'Account settings', icon: 'settings' }
    ]
  },
  {
    heading: 'Services',
    links: [
      { label: 'AC & Appliance Repair', icon: 'wrench' },
      { label: 'Plumbing & Electrical', icon: 'droplet' },
      { label: 'Cleaning & Pest Control', icon: 'sparkles' },
      { label: 'Moving & Car Care', icon: 'truck' }
    ]
  }
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Servio home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-soft">
              <Icon name="home" size={18} aria-hidden="true" />
            </span>
            <span className="font-heading text-lg font-bold tracking-tight text-fg">
              Servio<span className="text-brand">.</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Smart home service automation — request, match, schedule and track every home service in one
            place.
          </p>
        </div>

        {GROUPS.map((group) => (
          <nav key={group.heading} aria-label={group.heading}>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-faint">{group.heading}</h3>
            <ul className="space-y-2.5 text-sm">
              {group.links.map((l) =>
                l.to ? (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="inline-flex items-center gap-2 text-muted transition-colors hover:text-brand-text"
                    >
                      <Icon name={l.icon} size={15} aria-hidden="true" />
                      {l.label}
                    </Link>
                  </li>
                ) : (
                  <li key={l.label} className="flex items-center gap-2 text-muted">
                    <Icon name={l.icon} size={15} aria-hidden="true" />
                    {l.label}
                  </li>
                )
              )}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line py-5">
        <div className="container-page flex flex-col items-center justify-between gap-2 text-xs text-faint sm:flex-row">
          <span>© 2026 Servio — BAUST CSE FEST 2026 Hackathon</span>
          <span>Built on React, Express & the Smart Match Engine</span>
        </div>
      </div>
    </footer>
  );
}
