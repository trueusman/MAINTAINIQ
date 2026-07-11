import { useState } from 'react';
import { useListHistory } from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Clock, Activity, Search, Box, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function HistoryPage() {
  const { user } = useAuth();
  
  const { data: history, isLoading } = useListHistory({}, {
    query: {
      queryKey: ['globalHistory'],
      enabled: user?.role === 'admin'
    }
  });

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center font-mono text-destructive">UNAUTHORIZED ACCESS</div>;
  }

  const getActionIcon = (action: string) => {
    if (action.includes('issue')) return <AlertCircle className="h-4 w-4 text-warning" />;
    if (action.includes('asset')) return <Box className="h-4 w-4 text-primary" />;
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Global Audit Trail</h1>
        <p className="text-muted-foreground font-mono mt-1">Immutable record of all system events.</p>
      </div>

      <Card className="rounded-none border-border">
        <CardHeader className="bg-muted/30 border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search audit trail... (coming soon)" 
              className="pl-9 h-10 bg-background rounded-none w-full max-w-md font-mono text-sm"
              disabled
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="p-4 flex gap-4">
                  <Skeleton className="h-10 w-10 shrink-0" />
                  <div className="space-y-2 flex-1"><Skeleton className="h-4 w-full max-w-[300px]" /><Skeleton className="h-3 w-32" /></div>
                </div>
              ))}
            </div>
          ) : history?.items && history.items.length > 0 ? (
            <div className="divide-y divide-border bg-card">
              {history.items.map(entry => (
                <div key={entry.id} className="p-4 flex gap-4 hover:bg-muted/30 transition-colors">
                  <div className="w-10 h-10 bg-muted flex items-center justify-center shrink-0 border border-border">
                    {getActionIcon(entry.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                      <div className="font-bold text-sm">
                        {entry.action === 'status_changed' ? (
                          <span className="flex items-center gap-2">
                            Status updated to <Badge className="rounded-none font-mono text-[10px] h-5">{entry.status?.replace(/_/g, ' ').toUpperCase()}</Badge>
                          </span>
                        ) : entry.action === 'technician_assigned' ? (
                          <span>Assigned to <span className="font-bold text-primary">{entry.notes?.split('to ')[1]}</span></span>
                        ) : entry.action === 'issue_reported' ? (
                          'New problem reported'
                        ) : entry.action === 'maintenance_logged' ? (
                          'Maintenance log submitted'
                        ) : (
                          entry.action.replace(/_/g, ' ').toUpperCase()
                        )}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {format(new Date(entry.createdAt), 'MMM d, yyyy HH:mm')}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 text-sm mt-2">
                      <span className="text-muted-foreground text-xs font-mono uppercase">Target:</span>
                      {entry.issueId ? (
                        <Link href={`/issues/${entry.issueId}`} className="font-mono text-primary font-bold hover:underline">
                          {entry.issueNumber}
                        </Link>
                      ) : (
                        <span className="font-mono font-bold text-muted-foreground">—</span>
                      )}
                      <span className="text-muted-foreground mx-1">|</span>
                      <Link href={`/assets/${entry.assetId}`} className="font-medium hover:underline flex items-center gap-1">
                        <Box className="h-3 w-3 text-muted-foreground" /> {entry.assetName}
                      </Link>
                    </div>

                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                      <div className="w-5 h-5 bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] uppercase">
                        {entry.userName.charAt(0)}
                      </div>
                      <span className="text-xs font-medium">{entry.userName}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground font-mono text-sm border-t border-border">
              NO AUDIT RECORDS FOUND
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}