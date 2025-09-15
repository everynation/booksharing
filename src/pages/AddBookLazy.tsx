import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const AddBookComponent = React.lazy(() => import('./AddBook'));

const AddBookLazy = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-4">
              <Skeleton className="h-32 w-32 mx-auto" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    }>
      <AddBookComponent />
    </Suspense>
  );
};

export default AddBookLazy;