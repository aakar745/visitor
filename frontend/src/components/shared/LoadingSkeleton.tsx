/**
 * Loading Skeleton Components
 * Show placeholder UI while content is loading
 * Improves perceived performance on slow devices
 */

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      {/* Header skeleton */}
      <div className="animate-pulse mb-8">
        <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-lg w-full mb-4"></div>
      </div>
      
      {/* Content skeleton */}
      <div className="animate-pulse max-w-4xl mx-auto">
        {/* Hero section */}
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg mb-6"></div>
        
        {/* Text lines */}
        <div className="space-y-3 mb-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
        </div>
        
        {/* Buttons */}
        <div className="flex gap-4">
          <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg w-32"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg w-32"></div>
        </div>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="animate-pulse space-y-4 max-w-2xl mx-auto p-6">
      {/* Form title */}
      <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-6"></div>
      
      {/* Form fields */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      ))}
      
      {/* Submit button */}
      <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded w-full mt-6"></div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-6 space-y-4">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mt-4"></div>
      </div>
    </div>
  );
}

export function OTPLoginSkeleton() {
  return (
    <div className="animate-pulse max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 space-y-6">
        {/* Logo/Title */}
        <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-lg w-20 mx-auto"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mx-auto"></div>
        
        {/* Phone input */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32"></div>
          <div className="h-14 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
        
        {/* Button */}
        <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded"></div>
      </div>
    </div>
  );
}

