import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore.js';
import ToastHost from '../components/common/ToastHost.jsx';
import Icon from '../components/common/Icon.jsx';

export default function AppLayout() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navForUser = user ? (user.role === 'provider' ? providerNav : customerNav) : [];

  return (
    <div className="bg-page min-h-screen">
      <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Icon name="home" size={20} />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-ink-900">
              Servio<span className="text-brand-600">.</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navForUser.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900'
                  }`
                }
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {token && user ? (
              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <div className="text-sm font-bold leading-tight text-ink-900">{user.name}</div>
                  <div className="text-xs capitalize text-ink-400">{user.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-ink-200 p-2 text-ink-500 hover:bg-ink-50 hover:text-ink-700"
                  title="Log out"
                >
                  <Icon name="logout" size={18} />
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-500 hover:text-ink-900">
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <ToastHost />
    </div>
  );
}

const customerNav = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/new-request', label: 'Request', icon: 'plus' },
  { to: '/my-requests', label: 'My Requests', icon: 'list' }
];

const providerNav = [
  { to: '/provider', label: 'Dashboard', icon: 'dashboard' },
  { to: '/provider/schedule', label: 'Schedule', icon: 'calendar' }
];
