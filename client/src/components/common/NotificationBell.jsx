import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../../api/index.js';
import Icon from './Icon.jsx';
import { STATUS_COLORS } from '../../constants/index.js';
import { statusClass, timeAgo } from '../../utils/format.js';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    notificationApi
      .list()
      .then((d) => setItems(d))
      .catch(() => setItems([]));
  }, [open]);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const has = items.length > 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl border border-ink-200 p-2 text-ink-500 hover:bg-ink-50 hover:text-ink-700"
        title="Notifications"
      >
        <Icon name="bell" size={18} />
        {has && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {items.length > 9 ? '9+' : items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-lift fade-in">
          <div className="border-b border-ink-100 px-4 py-3 font-bold text-ink-900">Notifications</div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-10 text-center text-sm text-ink-400">No notifications yet</div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setOpen(false);
                    navigate(`/request/${n.requestId}/track`);
                  }}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-50"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Icon name="inbox" size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink-800">{n.serviceType}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-ink-400">
                      <span className={`rounded-full px-1.5 py-0.5 font-semibold ${statusClass(n.status)}`}>
                        {n.status}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-ink-300">{timeAgo(n.timestamp)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
