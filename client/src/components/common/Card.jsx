import { cn } from '../../utils/cn.js';

// Surface container that applies the shared `card-surface` chrome. Props: all
// standard div props; `padding` toggles the default p-5 inset (default true).
export default function Card({ children, className = '', padding = true, ...props }) {
  return (
    <div className={cn('card-surface', padding && 'p-5', className)} {...props}>
      {children}
    </div>
  );
}
