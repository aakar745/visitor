import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner message="Loading..." size="lg" />
    </div>
  );
}

