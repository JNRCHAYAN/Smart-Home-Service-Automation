import { useCallback, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore.js';
import { useTheme } from '../store/themeStore.js';
import { useClickOutside } from '../hooks/useClickOutside.js';
import ToastHost from '../components/common/ToastHost.jsx';
import Icon from '../components/common/Icon.jsx';
import ChatWidget from '../components/chat/ChatWidget.jsx';
import NotificationBell from '../components/common/NotificationBell.jsx';
import Footer from '../components/common/Footer.jsx';
import { cn } from '../utils/cn.js';

const ROLE_NAV = {
  customer: [
    { to: '/', label: 'Home', icon: 'home', end: true },
    { to: '/new-request', label: 'Book service', icon: 'plus' },
    { to: '/my-requests', label: 'My requests', icon: 'list' },
    { to: '/settings', label: 'Settings', icon: 'settings' }
  ],
  provider: [
    { to: '/provider', label: 'Dashboard', icon: 'dashboard' },
    { to: '/provider/schedule', label: 'Schedule', icon: 'calendar' },
    { to: '/settings', label: 'Settings', icon: 'settings' }
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: 'dashboard', end: true },
    { to: '/admin/users', label: 'Users', icon: 'users' },
    { to: '/admin/providers', label: 'Providers', icon: 'building' },
    { to: '/admin/requests', label: 'Requests', icon: 'list' }
  ]
};

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-lg" aria-label="Servio home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-soft">
        <Icon name="home" size={18} aria-hidden="true" />
      </span>
      <span className="font-heading text-lg font-bold tracking-tight text-fg">
        Servio<span className="text-brand">.</span>
      </span>
    </Link>
  );
}

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('');

function ThemeMenu() {
  const { mode, theme, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickOutside(close);
  const options = [
    { mode: 'light', icon: 'sun', label: 'Light' },
    { mode: 'dark', icon: 'moon', label: 'Dark' },
    { mode: 'system', icon: 'monitor', label: 'System' }
  ];
  const currentIcon = options.find((o) => o.mode === theme)?.icon || 'sun';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Change colour theme"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-muted transition-colors hover:bg-inset hover:text-fg"
      >
        <Icon name={currentIcon} size={18} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Colour theme"
          className="absolute right-0 top-12 z-50 w-40 animate-pop-in overflow-hidden rounded-xl border border-line bg-elevated p-1 shadow-pop"
        >
          {options.map((o) => (
            <button
              key={o.mode}
              type="button"
              role="menuitemradio"
              aria-checked={mode === o.mode}
              onClick={() => {
                setMode(o.mode);
                close();
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors',
                mode === o.mode ? 'bg-brand-soft text-brand-text' : 'text-muted hover:bg-inset hover:text-fg'
              )}
            >
              <Icon name={o.icon} size={16} aria-hidden="true" />
              <span className="flex-1">{o.label}</span>
              {mode === o.mode && <Icon name="check" size={15} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu({ user }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickOutside(close);

  const onLogout = () => {
    logout();
    close();
    navigate('/');
  };

  return (
    <div className="relative hidden sm:block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg p-1 pr-1 transition-colors hover:bg-inset"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-text">
          {initials(user.name)}
        </span>
        <span className="hidden text-left md:block">
          <span className="block max-w-[8rem] truncate text-sm font-semibold leading-tight text-fg">
            {user.name}
          </span>
          <span className="block text-xs capitalize text-faint">{user.role}</span>
        </span>
        <Icon name="chevron-down" size={15} className="text-faint" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 top-12 z-50 w-56 animate-pop-in overflow-hidden rounded-xl border border-line bg-elevated p-1 shadow-pop"
        >
          <div className="border-b border-line px-3 py-2.5">
            <p className="truncate text-sm font-bold text-fg">{user.name}</p>
            <p className="text-xs text-faint">Signed in as {user.role}</p>
          </div>
          <div className="p-1">
            <MenuItem to="/settings" icon="settings" label="Settings" onSelect={close} />
            {user.role === 'provider' && (
              <MenuItem to="/provider" icon="dashboard" label="Provider dashboard" onSelect={close} />
            )}
            {user.role === 'admin' && (
              <MenuItem to="/admin" icon="shield" label="Admin console" onSelect={close} />
            )}
            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-danger-text transition-colors hover:bg-danger-soft"
            >
              <Icon name="logout" size={16} aria-hidden="true" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ to, icon, label, onSelect }) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onSelect}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-muted transition-colors hover:bg-inset hover:text-fg"
    >
      <Icon name={icon} size={16} aria-hidden="true" />
      {label}
    </Link>
  );
}

function MobileMenu({ user, nav }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const onLogout = () => {
    logout();
    close();
    navigate('/');
  };

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Open menu"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-muted transition-colors hover:bg-inset hover:text-fg"
      >
        <Icon name={open ? 'x' : 'menu'} size={18} aria-hidden="true" />
      </button>

      {open && (
        <div className="fixed inset-0 top-16 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="absolute inset-0 bg-[var(--scrim)] animate-fade-in"
            tabIndex={-1}
          />
          <nav
            aria-label="Mobile"
            className="absolute inset-x-0 top-0 animate-pop-in border-b border-line bg-surface p-3 shadow-pop"
          >
            {user && (
              <div className="mb-2 flex items-center gap-3 border-b border-line px-2 pb-3 pt-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand-text">
                  {initials(user.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-fg">{user.name}</p>
                  <p className="text-xs text-faint">{user.role}</p>
                </div>
              </div>
            )}
            <ul className="space-y-1">
              {nav.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={close}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
                        isActive
                          ? 'bg-brand-soft text-brand-text'
                          : 'text-muted hover:bg-inset hover:text-fg'
                      )
                    }
                  >
                    <Icon name={item.icon} size={18} aria-hidden="true" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-col gap-1 border-t border-line pt-2">
              {user ? (
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-danger-text hover:bg-danger-soft"
                >
                  <Icon name="logout" size={18} aria-hidden="true" />
                  Log out
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={close}
                    className="flex items-center justify-center rounded-lg border border-line2 px-3 py-2.5 text-sm font-semibold text-fg hover:bg-inset"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    onClick={close}
                    className="flex items-center justify-center rounded-lg bg-brand px-3 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}

export default function AppLayout() {
  const { user, token } = useAuth();

  const nav = user ? ROLE_NAV[user.role] || ROLE_NAV.customer : [];

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-muted">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-fg"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur supports-[backdrop-filter]:bg-canvas/80">
        <div className="container-page flex h-16 items-center justify-between gap-3">
          <Logo />

          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-brand-soft text-brand-text'
                      : 'text-muted hover:bg-inset hover:text-fg'
                  )
                }
              >
                <Icon name={item.icon} size={17} aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeMenu />
            {token && user && (
              <>
                <NotificationBell />
                <UserMenu user={user} />
              </>
            )}
            {!token && (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors hover:text-fg"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
                >
                  Get started
                </Link>
              </div>
            )}
            {!user && <div className="sm:hidden" />}
            <MobileMenu user={user} nav={nav} />
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <Footer />
      <ToastHost />
      {token && user && <ChatWidget />}
    </div>
  );
}
