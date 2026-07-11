import { ReactNode } from 'react';
import { Link } from 'wouter';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
            <div className="w-7 h-7 bg-primary text-primary-foreground flex items-center justify-center text-sm">M</div>
            MAINTAIN<span className="text-foreground">IQ</span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-mono">
            <span className="hidden sm:inline-block text-muted-foreground uppercase">Public Portal</span>
            <Link href="/login" className="hover:text-primary transition-colors border border-transparent hover:border-primary px-3 py-1">
              LOGIN
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      
      <footer className="border-t py-8 bg-card text-center">
        <div className="container mx-auto px-4">
          <p className="text-sm text-muted-foreground font-mono">
            POWERED BY <span className="text-foreground font-bold">MAINTAINIQ</span> © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}