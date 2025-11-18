import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
          <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className={buttonVariants({ variant: 'outline' })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Link>
          <Link href="/" className={buttonVariants()}>
            <Home className="mr-2 h-4 w-4" />
            Home
          </Link>
        </div>
      </Card>
    </div>
  );
}

