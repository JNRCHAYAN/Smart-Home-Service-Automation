import { cn } from '../../utils/cn.js';

// Small pill label. The variant prop names here are exactly the strings that
// utils/format.js `statusClass()` (and constants like URGENCY_VARIANTS) return,
// so callers can map a status straight onto a Badge variant.
const VARIANTS = {
  neutral: 'bg-inset text-muted ring-line',
  brand: 'bg-brand-soft text-brand-text ring-brand-border',
  success: 'bg-success-soft text-success-text ring-success-border',
  warning: 'bg-warning-soft text-warning-text ring-warning-border',
  danger: 'bg-danger-soft text-danger-text ring-danger-border',
  info: 'bg-info-soft text-info-text ring-info-border'
};

export default function Badge({ children, variant = 'neutral', icon, className = '', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        VARIANTS[variant] || VARIANTS.neutral,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
