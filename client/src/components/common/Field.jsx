import { cn } from '../../utils/cn.js';
import Icon from './Icon.jsx';

// Form primitives: Label, FieldError, Input, Select, Textarea. Inputs share one
// base style and derive an invalid state + focus ring from the `invalid` prop.

const fieldBase =
  'w-full rounded-lg border bg-surface px-3.5 text-sm text-fg placeholder:text-faint transition-shadow duration-150 disabled:cursor-not-allowed disabled:bg-inset disabled:text-faint';

const fieldInvalid = 'border-danger focus:border-danger';
const fieldOk = 'border-line hover:border-line2';

// Focus styling swaps the box shadow ring + border colour for the valid vs
// invalid case (brand glow vs danger soft halo).
function ringClass(invalid) {
  return invalid ? 'focus:shadow-[0_0_0_3px_var(--danger-soft)]' : 'focus:shadow-glow focus:border-brand';
}

export function Label({ children, htmlFor, required, hint, className = '' }) {
  return (
    <div className={cn('mb-1.5 flex items-baseline justify-between gap-2', className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-fg">
        {children}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {hint && <span className="text-xs text-faint">{hint}</span>}
    </div>
  );
}

export function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-text">
      <Icon name="alertcircle" size={13} aria-hidden="true" />
      {message}
    </p>
  );
}

export function Input({ invalid, className = '', ...props }) {
  const invalidFlag = Boolean(invalid);
  return (
    <input
      aria-invalid={invalidFlag || undefined}
      className={cn(
        fieldBase,
        'py-2.5',
        invalidFlag ? fieldInvalid : fieldOk,
        ringClass(invalidFlag),
        className
      )}
      {...props}
    />
  );
}

export function Select({ options, invalid, placeholder, className = '', ...props }) {
  const invalidFlag = Boolean(invalid);
  return (
    <div className={cn('relative', className)}>
      <select
        aria-invalid={invalidFlag || undefined}
        className={cn(
          fieldBase,
          'appearance-none py-2.5 pr-9',
          invalidFlag ? fieldInvalid : fieldOk,
          ringClass(invalidFlag)
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? o}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-faint"
        aria-hidden="true"
      >
        <Icon name="chevron-down" size={16} />
      </span>
    </div>
  );
}

export function Textarea({ invalid, className = '', ...props }) {
  const invalidFlag = Boolean(invalid);
  return (
    <textarea
      aria-invalid={invalidFlag || undefined}
      className={cn(
        fieldBase,
        'py-2.5',
        invalidFlag ? fieldInvalid : fieldOk,
        ringClass(invalidFlag),
        className
      )}
      {...props}
    />
  );
}
