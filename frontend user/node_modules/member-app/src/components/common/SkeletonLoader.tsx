import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-blue-200/60', className)}
      aria-hidden="true"
    />
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
};
