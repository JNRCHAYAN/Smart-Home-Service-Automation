import { cn } from '../../utils/cn.js';

export default function Card({ children, className = '', padding = true, ...props }) {
  return (
    <div className={cn('card-surface', padding && 'p-5', className)} {...props}>
      {children}
    </div>
  );
}
