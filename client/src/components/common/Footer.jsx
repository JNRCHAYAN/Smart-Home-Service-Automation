import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-ink-100 bg-white">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Icon name="home" size={20} />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-ink-900">
              Servio<span className="text-brand-600">.</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-ink-400">
            Smart home service automation — request, match, schedule and track every home service in one
            place.
          </p>
        </div>
        <div>
          <div className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-400">Platform</div>
          <ul className="space-y-2 text-sm text-ink-500">
            <li>
              <Link to="/new-request" className="hover:text-brand-600">
                Book a service
              </Link>
            </li>
            <li>
              <Link to="/my-requests" className="hover:text-brand-600">
                My requests
              </Link>
            </li>
            <li>
              <Link to="/settings" className="hover:text-brand-600">
                Account settings
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-400">Services</div>
          <ul className="space-y-2 text-sm text-ink-500">
            <li>AC & Appliance Repair</li>
            <li>Plumbing & Electrical</li>
            <li>Cleaning & Pest Control</li>
            <li>Moving & Car Care</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-100 py-5">
        <div className="container-page flex flex-col items-center justify-between gap-2 text-xs text-ink-300 sm:flex-row">
          <span>© 2026 Servio — BAUST CSE FEST 2026 Hackathon</span>
          <span>Built on React, Express & the Smart Match Engine</span>
        </div>
      </div>
    </footer>
  );
}
