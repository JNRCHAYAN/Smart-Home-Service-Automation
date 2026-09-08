import Icon from './Icon.jsx';
import { cn } from '../../utils/cn.js';

const VARIANTS = {
  primary: 'bg-brand text-white hover:bg-brand-hover shadow-soft',
  secondary: 'border border-line2 bg-surface text-fg hover:bg-inset',
  ghost: 'text-muted hover:bg-inset hover:text-fg',
  danger: 'bg-danger-action text-white hover:bg-danger-action-hover shadow-soft',
  outline: 'border border-brand-border bg-transparent text-brand-text hover:bg-brand-soft',
  soft: 'bg-brand-soft text-brand-text hover:brightness-95'
};

const SIZES = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base'
};

export function buttonClass({ variant = 'primary', size = 'md', full, className }) {
  return cn(
    'inline-flex select-none items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-55',
    VARIANTS[variant],
    SIZES[size],
    full && 'w-full',
    className
  );
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  full,
  className,
  type = 'button',
  ...props
}) {
  return (
    <button type={type} className={buttonClass({ variant, size, full, className })} {...props}>
      {loading ? (
        <Icon name="loader" className="animate-spin" size={18} aria-hidden="true" />
      ) : (
        icon && <Icon name={icon} size={18} aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
