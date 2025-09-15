import React, { Suspense } from 'react';
import { BookListSkeleton } from '@/components/BookListSkeleton';
import Header from '@/components/Header';

const BooksWithMapComponent = React.lazy(() => import('./BooksWithMap'));

const BooksWithMapLazy = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4"></div>
            <div className="h-4 w-96 bg-muted animate-pulse rounded mb-6"></div>
            <div className="flex gap-4">
              <div className="h-10 w-80 bg-muted animate-pulse rounded"></div>
              <div className="h-10 w-80 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
          <BookListSkeleton />
        </main>
      </div>
    }>
      <BooksWithMapComponent />
    </Suspense>
  );
};

export default BooksWithMapLazy;