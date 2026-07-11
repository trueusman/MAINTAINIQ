import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation, Link } from 'wouter';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  if (user) return null;

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl tracking-tight text-primary">
              <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center text-lg">M</div>
              MAINTAIN<span className="text-foreground">IQ</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
      <div className="hidden md:flex flex-1 bg-secondary text-secondary-foreground flex-col justify-between p-12">
        <div>
          <h2 className="text-4xl font-sans font-bold leading-tight mb-4">
            Industrial-grade equipment tracking & issue resolution.
          </h2>
          <p className="text-muted-foreground text-lg font-mono">
            SYS_STATUS: OPERATIONAL
          </p>
        </div>
        <div className="space-y-4 font-mono text-sm opacity-50">
          <p>» Fast, zero-friction reporting</p>
          <p>» Precise technician routing</p>
          <p>» Complete audit trails</p>
        </div>
      </div>
    </div>
  );
}