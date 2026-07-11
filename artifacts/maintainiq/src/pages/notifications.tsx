import { useListNotifications, useMarkNotificationRead } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Bell, Check, Clock, ShieldAlert, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  
  const { data: notifications, isLoading } = useListNotifications({
    query: {
      queryKey: ['notifications'],
    }
  });

  const markRead = useMarkNotificationRead();

  const handleMarkRead = (id: number) => {
    markRead.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    });
  };

  const handleMarkAllRead = () => {
    const unread = notifications?.items.filter(n => !n.read) || [];
    unread.forEach(n => handleMarkRead(n.id));
  };

  const getIcon = (type: string) => {
    if (type === 'issue_assigned') return <Activity className="h-5 w-5 text-primary" />;
    if (type === 'issue_status') return <Clock className="h-5 w-5 text-warning" />;
    return <Bell className="h-5 w-5 text-muted-foreground" />;
  };

  const unreadCount = notifications?.items.filter(n => !n.read).length || 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Notifications</h1>
          <p className="text-muted-foreground font-mono mt-1">Alerts, assignments, and status updates.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" className="rounded-none font-bold text-xs h-9" onClick={handleMarkAllRead}>
            MARK ALL AS READ
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full bg-muted/50 rounded-none" />)
        ) : notifications?.items && notifications.items.length > 0 ? (
          notifications.items.map(notif => (
            <Card 
              key={notif.id} 
              className={cn(
                "rounded-none border-l-4 transition-colors",
                !notif.read ? "border-l-primary bg-card" : "border-l-transparent bg-muted/20 opacity-70"
              )}
            >
              <CardContent className="p-4 flex gap-4">
                <div className="mt-1 shrink-0">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className={cn("text-base font-bold", !notif.read && "text-primary")}>
                      {notif.title}
                    </h3>
                    <div className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {format(new Date(notif.createdAt), 'MMM d, HH:mm')}
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 mt-1">{notif.message}</p>
                </div>
                {!notif.read && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="shrink-0 h-8 w-8 text-muted-foreground hover:text-success hover:bg-success/10"
                    onClick={() => handleMarkRead(notif.id)}
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="p-12 text-center border border-dashed border-border bg-muted/10 flex flex-col items-center">
            <Bell className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
            <h3 className="text-xl font-bold">No notifications</h3>
            <p className="text-muted-foreground font-mono text-sm mt-1">You're all caught up.</p>
          </div>
        )}
      </div>
    </div>
  );
}