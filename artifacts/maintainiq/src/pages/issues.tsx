import { useState } from 'react';
import { useListIssues, IssueStatus, IssuePriority } from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, Filter, Search, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function IssuesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [priority, setPriority] = useState<string>('all');

  const { data: issues, isLoading } = useListIssues({
    search: search || undefined,
    status: status !== 'all' ? status : undefined,
    priority: priority !== 'all' ? priority : undefined,
  }, {
    query: {
      queryKey: ['issues', search, status, priority],
    }
  });

  const getPriorityInfo = (p: string) => {
    switch (p) {
      case 'critical': return { icon: ShieldAlert, color: 'text-destructive', bg: 'bg-destructive/10' };
      case 'high': return { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10' };
      case 'medium': return { icon: Clock, color: 'text-primary', bg: 'bg-primary/10' };
      case 'low': return { icon: CheckCircle2, color: 'text-muted-foreground', bg: 'bg-muted' };
      default: return { icon: AlertCircle, color: 'text-foreground', bg: 'bg-muted' };
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'resolved':
      case 'closed': return 'bg-success hover:bg-success text-success-foreground border-success';
      case 'reported': return 'bg-destructive hover:bg-destructive text-destructive-foreground border-destructive';
      case 'waiting_for_parts': return 'bg-warning hover:bg-warning text-warning-foreground border-warning';
      default: return 'bg-primary hover:bg-primary text-primary-foreground border-primary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance Issues</h1>
          <p className="text-muted-foreground font-mono mt-1">Track and resolve equipment problems.</p>
        </div>
      </div>

      <Card className="bg-card rounded-none">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by issue number, title, or asset..." 
                className="pl-9 h-12 bg-muted/50 rounded-none w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 flex-col sm:flex-row w-full lg:w-auto">
              <div className="w-full sm:w-auto flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full sm:w-[180px] h-12 bg-muted/50 rounded-none">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="all">ALL STATUSES</SelectItem>
                    {Object.values(IssueStatus).map(s => (
                      <SelectItem key={s} value={s} className="uppercase">{s.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full sm:w-[160px] h-12 bg-muted/50 rounded-none">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="all">ALL PRIORITIES</SelectItem>
                  {Object.values(IssuePriority).map(p => (
                    <SelectItem key={p} value={p} className="uppercase">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {isLoading ? (
          [1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full bg-muted/50 rounded-none" />)
        ) : issues?.items && issues.items.length > 0 ? (
          issues.items.map((issue) => {
            const priorityInfo = getPriorityInfo(issue.priority);
            const PriorityIcon = priorityInfo.icon;
            
            return (
              <Link key={issue.id} href={`/issues/${issue.id}`}>
                <div className="bg-card hover:bg-accent/5 transition-colors border border-border flex flex-col sm:flex-row sm:items-center p-4 gap-4 group cursor-pointer">
                  
                  {/* Left block: Priority & Number */}
                  <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:w-32 shrink-0">
                    <div className={cn("p-2 shrink-0", priorityInfo.bg, priorityInfo.color)}>
                      <PriorityIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-mono text-muted-foreground uppercase hidden sm:block">ID</div>
                      <div className="font-mono font-bold text-primary">{issue.issueNumber}</div>
                    </div>
                  </div>

                  {/* Middle block: Title & Asset */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                      {issue.title}
                    </h3>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2 truncate">
                      <span className="font-mono text-xs uppercase bg-muted px-1.5 py-0.5">{issue.assetCode}</span>
                      <span className="truncate">{issue.assetName}</span>
                    </div>
                  </div>

                  {/* Right block: Status & Meta */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:w-48 shrink-0">
                    <Badge className={cn("rounded-none font-mono text-[10px] uppercase", getStatusBadge(issue.status))}>
                      {issue.status.replace(/_/g, ' ')}
                    </Badge>
                    <div className="text-xs text-muted-foreground font-mono text-right">
                      {format(new Date(issue.createdAt), 'MMM d, yyyy')}
                    </div>
                  </div>

                </div>
              </Link>
            );
          })
        ) : (
          <div className="bg-card border p-12 text-center flex flex-col items-center">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
            <h3 className="text-xl font-bold">No issues found</h3>
            <p className="text-muted-foreground font-mono mt-1 text-sm">
              {search || status !== 'all' || priority !== 'all' 
                ? "Try clearing your filters." 
                : "The maintenance queue is empty. Good job!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}