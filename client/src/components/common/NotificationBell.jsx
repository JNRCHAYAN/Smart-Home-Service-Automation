import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../../api/index.js';
import Icon from './Icon.jsx';
import Badge from './Badge.jsx';
import { statusClass, timeAgo } from '../../utils/format.js';
import { useClickOutside } from '../../hooks/useClickOutside.js';

// Header bell + dropdown. The list is only fetched lazily each time the panel
// opens (fresh unread state on demand); clicking an item jumps to that
// request's tracking page. Dismiss via outside click or Escape.
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const close = () => setOpen(false);
  const ref = useClickOutside(close);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    notificationApi
      .list()
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open]);

  const unreadCount = items.length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={unreadCount ? `Notifications (${unreadCount} new)` : 'Notifications'}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-muted transition-colors hover:bg-inset hover:text-fg"
      >
        <Icon name="bell" size={18} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-12 z-50 w-[min(calc(100vw-2rem),22rem)] animate-pop-in overflow-hidden rounded-2xl border border-line bg-elevated shadow-pop"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h3 className="text-sm font-bold text-fg">Notifications</h3>
            {unreadCount > 0 && <Badge variant="neutral">{unreadCount} new</Badge>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton h-12 rounded-lg" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Icon name="inbox" size={22} className="text-faint" aria-hidden="true" />
                <p className="text-sm text-muted">No notifications yet</p>
              </div>
            ) : (
              <ul>
                {items.map((n) => (
                  <li key={n.id} className="border-b border-line/70 last:border-0">
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        navigate(`/request/${n.requestId}/track`);
                      }}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-inset"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
                        <Icon name="inbox" size={16} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-fg">{n.serviceType}</span>
                        <span className="mt-1 flex items-center gap-2 text-xs text-muted">
                          <Badge variant={statusClass(n.status)}>{n.status}</Badge>
                        </span>
                      </span>
                      <span className="shrink-0 pt-0.5 text-[11px] text-faint">{timeAgo(n.timestamp)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
