import { cn } from '../../utils/cn.js';

export function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={cn('skeleton', className)} />;
}

export function CardSkeleton({ className = '' }) {
  return (
    <div className={cn('card-surface p-5', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}
