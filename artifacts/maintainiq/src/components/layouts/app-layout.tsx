import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation, Link } from 'wouter';
import { 
  LayoutDashboard, 
  Box, 
  AlertCircle, 
  Users, 
  Clock, 
  Bell, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useListNotifications } from '@workspace/api-client-react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setLocation('/login');
    }
  }, [user, setLocation]);

  const { data: notificationsData } = useListNotifications({
    query: {
      queryKey: ['notifications'],
      enabled: !!user,
      refetchInterval: 30000 // poll every 30s
    }
  });

  const unreadCount = notificationsData?.items.filter(n => !n.read).length || 0;

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Assets', icon: Box, href: '/assets' },
    { label: 'Issues', icon: AlertCircle, href: '/issues' },
    ...(isAdmin ? [
      { label: 'Technicians', icon: Users, href: '/technicians' },
      { label: 'History', icon: Clock, href: '/history' },
    ] : []),
  ];

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const NavLinks = () => (
    <>
      <div className="space-y-1 mt-6 px-3 flex-1">
        <p className="px-3 text-xs font-mono text-sidebar-foreground/50 uppercase mb-2">Main Menu</p>
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
              <span className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors border-l-2",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground border-primary" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground border-transparent"
              )}>
                <item.icon className="h-5 w-5" />
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      
      <div className="px-3 pb-6 space-y-1">
        <p className="px-3 text-xs font-mono text-sidebar-foreground/50 uppercase mb-2">Account</p>
        <Link href="/notifications" onClick={() => setIsMobileMenuOpen(false)}>
          <span className={cn(
            "flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-colors border-l-2",
            location === '/notifications'
              ? "bg-sidebar-accent text-sidebar-accent-foreground border-primary" 
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground border-transparent"
          )}>
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5" />
              Notifications
            </div>
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-mono px-1.5 py-0.5 min-w-[20px] text-center">
                {unreadCount}
              </span>
            )}
          </span>
        </Link>
        <Link href="/settings" onClick={() => setIsMobileMenuOpen(false)}>
          <span className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors border-l-2",
            location === '/settings'
              ? "bg-sidebar-accent text-sidebar-accent-foreground border-primary" 
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground border-transparent"
          )}>
            <Settings className="h-5 w-5" />
            Settings
          </span>
        </Link>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-sidebar-accent/50 transition-colors border-l-2 border-transparent"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-muted/30">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-sidebar text-sidebar-foreground border-b border-sidebar-border z-20">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tight text-primary">
          <div className="w-6 h-6 bg-primary text-primary-foreground flex items-center justify-center text-xs">M</div>
          MAINTAIN<span className="text-sidebar-foreground">IQ</span>
        </Link>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -mr-2 text-sidebar-foreground">
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[61px] bg-sidebar text-sidebar-foreground z-10 flex flex-col overflow-y-auto border-t border-sidebar-border">
          <NavLinks />
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-sidebar text-sidebar-foreground flex-col border-r border-sidebar-border">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
            <div className="w-7 h-7 bg-primary text-primary-foreground flex items-center justify-center text-sm">M</div>
            MAINTAIN<span className="text-sidebar-foreground">IQ</span>
          </Link>
        </div>
        
        <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
          <div className="w-10 h-10 bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground font-mono font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/60 font-mono truncate uppercase">{user.role}</p>
          </div>
        </div>

        <NavLinks />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-y-auto">
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}