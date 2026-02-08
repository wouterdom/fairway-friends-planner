import { ReactNode } from 'react';
import { Navigation } from './Navigation';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="md:ml-64 min-h-screen">
        {/* Mobile: Add padding for header (top) and bottom nav */}
        {/* Desktop: No extra padding needed */}
        <div className="pt-14 md:pt-0 pb-20 md:pb-0">
          {children}
        </div>
      </main>
    </div>
  );
}
