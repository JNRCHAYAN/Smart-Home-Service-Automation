import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';
import { cn } from '../../utils/cn.js';

export default function Modal({ open, onClose, title, children, wide, footer }) {
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.();
    };
    document.addEventListener('keydown', onKey);
    // Move focus inside and restore on close.
    const timer = setTimeout(() => closeRef.current?.focus(), 10);
    const prevActive = document.activeElement;
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
      clearTimeout(timer);
      prevActive?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-[var(--scrim)] animate-fade-in"
        tabIndex={-1}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative z-10 flex max-h-[92dvh] w-full animate-pop-in flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-pop sm:rounded-2xl',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-md'
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h3 className="truncate font-heading text-base font-bold text-fg">{title}</h3>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1.5 rounded-lg p-2 text-faint transition-colors hover:bg-inset hover:text-fg"
          >
            <Icon name="x" size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex shrink-0 justify-end gap-2 border-t border-line bg-surface px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
